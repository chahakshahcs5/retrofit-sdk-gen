import * as fs from "fs";
import * as path from "path";
import { ScannedEndpoint } from "../../core/scanner";
import { javaToTsType, sanitizeTypeName } from "./models";

export interface GenerateServicesOptions {
  endpoints?: ScannedEndpoint[];
  endpointsPath?: string;
  modelsPath?: string;
  outputPath?: string;
  verbose?: boolean;
}
export type GenerateSdkOptions = GenerateServicesOptions;

export interface GenerateServicesResult {
  totalMethods: number;
  totalServices: number;
  outputPath: string;
}
export type GenerateSdkResult = GenerateServicesResult;

/**
 * Generalized recursive type resolver:
 * Converts Java types/generics (List, Map, etc.) to TypeScript, prefixing known DTO models with Types.
 */
export function resolveType(rawType: string | null | undefined, definedModels: Set<string>, isPayload = false): string | null {
  if (!rawType) return isPayload ? null : "void";
  const t = rawType.trim();
  if (t === "void" || t === "Void" || t.startsWith("Void")) return isPayload ? null : "void";
  if (t === "FormUrlEncoded") return "Record<string, any>";
  if (t === "Multipart") return "FormData | Record<string, any>";

  // Unwrap Retrofit Response<T>, Call<T>, RxJava Single/Observable/Maybe
  const wrapperMatch = t.match(/^(?:[a-zA-Z0-9_.]+\.)?(?:Response|Call|Single|Observable|Maybe)<\s*(.+)\s*>$/);
  if (wrapperMatch) {
    return resolveType(wrapperMatch[1], definedModels, isPayload);
  }

  // Generic List<T> -> (T)[]
  const listMatch = t.match(/^(?:List|ArrayList|Set|Collection)<\s*(.+)\s*>$/);
  if (listMatch) {
    const inner = resolveType(listMatch[1], definedModels);
    return inner && (inner.includes(" ") || inner.includes("|")) ? `(${inner})[]` : `${inner}[]`;
  }

  // Generic Map<K, V> -> Record<K, V>
  const mapMatch = t.match(/^(?:Map|HashMap|LinkedHashMap)<\s*([^,]+)\s*,\s*(.+)\s*>$/);
  if (mapMatch) {
    const key = resolveType(mapMatch[1], definedModels);
    const val = resolveType(mapMatch[2], definedModels);
    const validKey = key === "string" || key === "number" ? key : "string";
    return `Record<${validKey}, ${val || "any"}>`;
  }

  // Delegate to Java-to-TS type mapper
  const baseTs = javaToTsType(t);
  if (["string", "number", "boolean", "void", "any", "Record<string, any>"].includes(baseTs)) {
    return baseTs;
  }

  const clean = sanitizeTypeName(baseTs);
  if (definedModels.has(clean)) {
    return `Types.${clean}`;
  }

  return baseTs.includes("Record<") || baseTs.endsWith("[]") ? baseTs : "any";
}

/**
 * Main Service Generator function:
 * Produces direct Service.method() syntax organized 1:1 by authentic Retrofit Service interfaces.
 */
export function generateServices(options: GenerateServicesOptions = {}): GenerateServicesResult {
  const endpointsPath = options.endpointsPath || path.resolve(__dirname, "all_extracted_endpoints.json");
  const endpoints: ScannedEndpoint[] = options.endpoints || (
    fs.existsSync(endpointsPath) ? JSON.parse(fs.readFileSync(endpointsPath, "utf8")) : []
  );
  const modelsPath = options.modelsPath || path.resolve(__dirname, "../types.ts");

  const apiModelsContent = fs.existsSync(modelsPath) ? fs.readFileSync(modelsPath, "utf8") : "";
  const definedModels = new Set<string>();
  for (const m of apiModelsContent.matchAll(/export\s+(?:interface|type)\s+([A-Za-z0-9_]+)/g)) {
    definedModels.add(m[1]);
  }

  const outputPath = options.outputPath || path.resolve(__dirname, "../index.ts");

  // Group endpoints by actual Java/Kotlin Retrofit service interface
  const serviceGroups: Record<string, ScannedEndpoint[]> = {};
  for (const ep of endpoints) {
    const serviceName = ep.interface || "CommonService";
    if (!serviceGroups[serviceName]) serviceGroups[serviceName] = [];
    serviceGroups[serviceName].push(ep);
  }

  let code = `/**\n`;
  code += ` * Complete Typed API SDK\n`;
  code += ` * Lists fully-typed methods for all ${endpoints.length} Retrofit API endpoints\n`;
  code += ` * Organized 1:1 by authentic Retrofit Service Interfaces from the decompiled Android App.\n`;
  code += ` * Direct static usage: ServiceName.methodName(params?, payload?, options?, client?)\n`;
  code += ` */\n\n`;

  code += `import * as Types from "./types";\n`;
  code += `import { HttpClient, ApiResponse, RequestOptions, defaultClient } from "./client";\n\n`;
  code += `export { HttpClient, ApiResponse, RequestOptions, defaultClient };\n`;
  code += `export * as Types from "./types";\n\n`;

  let totalMethods = 0;

  for (const serviceName of Object.keys(serviceGroups).sort()) {
    const eps = serviceGroups[serviceName];

    code += `// ============================================================================\n`;
    code += `// ${serviceName.toUpperCase()} (${eps.length} Endpoints)\n`;
    code += `// Source: ${eps[0].file}\n`;
    code += `// ============================================================================\n\n`;

    code += `export class ${serviceName} {\n`;

    const usedNames = new Map<string, number>();

    for (const ep of eps) {
      let fnName = ep.function || "callApi";
      if (usedNames.has(fnName)) {
        const count = usedNames.get(fnName)! + 1;
        usedNames.set(fnName, count);
        fnName = `${fnName}_v${count}`;
      } else {
        usedNames.set(fnName, 1);
      }

      let payloadType = resolveType(ep.requestBodyType, definedModels, true);

      // Phase 2: Enhanced FormUrlEncoded typing from @Field
      if (ep.requestBodyType === "FormUrlEncoded" && ep.fields && Object.keys(ep.fields).length > 0) {
        const fieldEntries = Object.entries(ep.fields)
          .map(([k, t]) => {
            const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `"${k}"`;
            return `${key}: ${t}`;
          })
          .join("; ");
        payloadType = ep.hasFieldMap ? `{ ${fieldEntries} } & Record<string, any>` : `{ ${fieldEntries} }`;
      }

      // Phase 2: Enhanced Multipart typing from @Part
      if (ep.requestBodyType === "Multipart" && ep.parts && Object.keys(ep.parts).length > 0) {
        const partEntries = Object.entries(ep.parts)
          .map(([k, t]) => {
            const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `"${k}"`;
            return `${key}?: ${t}`;
          })
          .join("; ");
        payloadType = ep.hasPartMap
          ? `FormData | ({ ${partEntries} } & Record<string, any>)`
          : `FormData | { ${partEntries} }`;
      }

      const responseType = resolveType(ep.responseType, definedModels, false) || "any";
      const hasPathParams = ep.pathParams && ep.pathParams.length > 0;
      const hasBody = payloadType !== null;

      // Method parameters
      const paramDefs: string[] = [];
      if (hasPathParams) {
        const pathParamFields = ep.pathParams!.map((p) => `"${p}": string | number`).join("; ");
        paramDefs.push(`params: { ${pathParamFields} }`);
      }
      if (hasBody) {
        paramDefs.push(`payload: ${payloadType}`);
      }

      // 3. Query params
      const queryParamFields: string[] = [];
      const hasQueryMap = Boolean(ep.hasQueryMap);

      if (ep.queryParams) {
        if (Array.isArray(ep.queryParams)) {
          for (const q of ep.queryParams) {
            const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(q) ? q : `"${q}"`;
            queryParamFields.push(`${key}?: string | number | boolean`);
          }
        } else {
          for (const [q, t] of Object.entries(ep.queryParams)) {
            const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(q) ? q : `"${q}"`;
            queryParamFields.push(`${key}?: ${t}`);
          }
        }
      }

      let queryParamsType: string | null = null;
      if (queryParamFields.length > 0) {
        queryParamsType = hasQueryMap
          ? `{ ${queryParamFields.join("; ")} } & Record<string, any>`
          : `{ ${queryParamFields.join("; ")} }`;
      } else if (hasQueryMap) {
        queryParamsType = `Record<string, any>`;
      }

      // 4. Headers (Option 1: strongly-typed header keys)
      const explicitHeaders = ep.headers || [];
      const hasHeaderMap = Boolean(ep.hasHeaderMap);
      const hasExplicitHeaders = explicitHeaders.length > 0;

      let headersType: string | null = null;
      if (hasExplicitHeaders) {
        const headerFields = explicitHeaders.map((h) => {
          const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(h) ? h : `"${h}"`;
          return `${key}?: string`;
        }).join("; ");
        headersType = `{ ${headerFields} } & Record<string, string>`;
      } else if (hasHeaderMap) {
        headersType = `Record<string, string>`;
      }

      const hasStaticHeaders = ep.staticHeaders && Object.keys(ep.staticHeaders).length > 0;

      // JSDoc: rich metadata with @path, @payload, @query, @header, @response
      code += `  /**\n`;
      code += `   * ${ep.method} ${ep.endpoint}\n`;
      code += `   * @interface ${ep.interface}\n`;
      code += `   * @source ${ep.file}\n`;
      code += `   * @signature ${ep.signature}\n`;
      if (hasPathParams) {
        code += `   * @path ${ep.pathParams!.map((p) => `{${p}}`).join(", ")}\n`;
      }
      if (hasBody) {
        code += `   * @payload ${payloadType}\n`;
      }
      if (queryParamFields.length > 0 || hasQueryMap) {
        const qDoc: string[] = [];
        if (queryParamFields.length > 0) {
          qDoc.push(...queryParamFields);
        }
        if (hasQueryMap) {
          qDoc.push("[key: string]: any (QueryMap)");
        }
        code += `   * @query ${qDoc.join(", ")}\n`;
      }
      if (hasExplicitHeaders || hasHeaderMap || hasStaticHeaders) {
        const hDoc: string[] = [];
        if (hasExplicitHeaders) {
          hDoc.push(...explicitHeaders);
        }
        if (hasHeaderMap) {
          hDoc.push("[key: string]: string (HeaderMap)");
        }
        if (hasStaticHeaders) {
          hDoc.push(`Static: ${JSON.stringify(ep.staticHeaders)}`);
        }
        code += `   * @header ${hDoc.join(", ")}\n`;
      }
      code += `   * @response ${responseType}\n`;
      code += `   */\n`;

      // 5. Options parameter (strictly include only declared options)
      const optionFields: string[] = [];
      if (queryParamsType) {
        optionFields.push(`queryParams?: ${queryParamsType}`);
      }
      if (headersType) {
        optionFields.push(`headers?: ${headersType}`);
      }

      const hasOptions = optionFields.length > 0;
      if (hasOptions) {
        paramDefs.push(`options?: {\n    ${optionFields.join(";\n    ")};\n  }`);
      }
      paramDefs.push(`client: HttpClient = defaultClient`);

      code += `  static async ${fnName}(\n    ${paramDefs.join(",\n    ")}\n  ): Promise<ApiResponse<${responseType}>> {\n`;

      // Build client.request options payload
      const reqOptionProps: string[] = [];
      if (hasPathParams) reqOptionProps.push(`pathParams: params`);
      if (hasBody) reqOptionProps.push(`payload`);
      if (queryParamsType) reqOptionProps.push(`queryParams: options?.queryParams`);

      // Option 2: Static @Headers injection + dynamic headers
      if (hasStaticHeaders && headersType) {
        const staticEntries = Object.entries(ep.staticHeaders!)
          .map(([k, v]) => `"${k}": ${JSON.stringify(v)}`)
          .join(", ");
        reqOptionProps.push(`headers: { ${staticEntries}, ...options?.headers }`);
      } else if (hasStaticHeaders) {
        const staticEntries = Object.entries(ep.staticHeaders!)
          .map(([k, v]) => `"${k}": ${JSON.stringify(v)}`)
          .join(", ");
        reqOptionProps.push(`headers: { ${staticEntries} }`);
      } else if (headersType) {
        reqOptionProps.push(`headers: options?.headers`);
      }

      code += `    return client.request<${responseType}>(\n`;
      code += `      ${JSON.stringify(ep.method)},\n`;
      code += `      ${JSON.stringify(ep.endpoint)}`;

      if (reqOptionProps.length > 0) {
        code += `,\n      {\n`;
        for (const prop of reqOptionProps) {
          code += `        ${prop},\n`;
        }
        code += `      }\n`;
      } else {
        code += `\n`;
      }
      code += `    );\n`;
      code += `  }\n\n`;

      totalMethods++;
    }

    code += `}\n\n`;
  }

  // Master SDK Aggregator Object
  code += `// ============================================================================\n`;
  code += `// MASTER API SDK OBJECT (${Object.keys(serviceGroups).length} Services)\n`;
  code += `// ============================================================================\n\n`;

  code += `export const sdk = {\n`;
  code += `  client: defaultClient,\n`;
  for (const serviceName of Object.keys(serviceGroups).sort()) {
    code += `  ${serviceName},\n`;
  }
  code += `};\n\n`;

  code += `// Universal SDK export\n`;
  code += `export const apiSdk = sdk;\n`;
  code += `export default sdk;\n`;

  fs.writeFileSync(outputPath, code);

  return {
    totalMethods,
    totalServices: Object.keys(serviceGroups).length,
    outputPath
  };
}

// Aliases
export { generateServices as generateSdk };

// Direct execution CLI runner
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  console.log("==> Generating API Services in sdk folder...");
  const result = generateServices({ verbose: true });
  console.log(`Successfully generated ${result.outputPath} with ${result.totalMethods} typed methods across ${result.totalServices} services!`);
}
