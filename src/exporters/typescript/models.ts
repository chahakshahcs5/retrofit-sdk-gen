import * as fs from "fs";
import * as path from "path";
import { resolveSourcesDir, ScannedEndpoint } from "../../core/scanner";

export interface JavaField {
  name: string;
  rawType: string;
  isOptional: boolean;
}

export interface ParsedJavaClass {
  isEnum: boolean;
  className: string;
  enumConstants?: string[];
  fields?: JavaField[];
  referencedTypes: Set<string>;
}

export interface ModelUsage {
  rawName: string;
  usedAsReq: string[];
  usedAsResp: string[];
  module: string;
}

export interface GenerateModelsOptions {
  endpoints?: ScannedEndpoint[];
  endpointsPath?: string;
  sourcesDir?: string;
  outputPath?: string;
  verbose?: boolean;
}

export interface GenerateModelsResult {
  totalModels: number;
  outputPath: string;
  moduleCount: Record<string, number>;
}

// Clean type name
export function sanitizeTypeName(t: string): string {
  return t.replace(/[^A-Za-z0-9_]/g, "_").replace(/^_+|_+$/g, "");
}

// Map Java types to TypeScript
export function javaToTsType(javaType: string | null | undefined, contextClass?: string): string {
  if (!javaType) return "any";
  let t = javaType.trim();

  // Clean annotations
  t = t.replace(/@[A-Za-z0-9_.]+(?:\([^)]*\))?\s*/g, "").trim();

  // Strip Java modifiers
  t = t.replace(/\b(public|protected|private|static|final|transient|volatile|abstract|native)\b/g, "").trim();

  // Clean wildcards: ? extends T -> T, ? super T -> T, ? -> any
  t = t.replace(/\?\s+extends\s+/g, "");
  t = t.replace(/\?\s+super\s+/g, "");
  t = t.replace(/<\s*\?\s*>/g, "<any>");

  // Arrays
  if (t.endsWith("[]")) {
    const inner = t.slice(0, -2).trim();
    return `${javaToTsType(inner, contextClass)}[]`;
  }

  // Raw collections without generics
  if (t === "List" || t === "ArrayList" || t === "Collection" || t === "Set") {
    return "any[]";
  }
  if (t === "Map" || t === "HashMap" || t === "LinkedHashMap") {
    return "Record<string, any>";
  }

  // Generics
  const genericMatch = t.match(/^([A-Za-z0-9_.$]+)<\s*(.+)\s*>$/s);
  if (genericMatch) {
    const outer = genericMatch[1].split(".").pop();
    const innerStr = genericMatch[2].trim();

    if (["List", "ArrayList", "Set", "HashSet", "Collection"].includes(outer || "")) {
      const innerTs = javaToTsType(innerStr, contextClass);
      return innerTs.includes(" ") || innerTs.includes("|") ? `(${innerTs})[]` : `${innerTs}[]`;
    }
    if (["Map", "HashMap", "LinkedHashMap"].includes(outer || "")) {
      let depth = 0;
      let commaIdx = -1;
      for (let i = 0; i < innerStr.length; i++) {
        if (innerStr[i] === "<") depth++;
        else if (innerStr[i] === ">") depth--;
        else if (innerStr[i] === "," && depth === 0) {
          commaIdx = i;
          break;
        }
      }
      if (commaIdx !== -1) {
        const key = innerStr.slice(0, commaIdx).trim();
        const val = innerStr.slice(commaIdx + 1).trim();
        const keyTs = javaToTsType(key, contextClass);
        const valTs = javaToTsType(val, contextClass);
        const finalKey = keyTs === "string" || keyTs === "number" ? keyTs : "string";
        return `Record<${finalKey}, ${valTs}>`;
      }
      return "Record<string, any>";
    }
    if (["Response", "Call", "Single", "Observable", "Flowable"].includes(outer || "")) {
      return javaToTsType(innerStr, contextClass);
    }
  }

  // Inner class notation like Foo.Bar or Foo$Bar
  if (t.includes(".") || t.includes("$")) {
    const parts = t.split(/[\.\$]/);
    return parts.join("_");
  }

  const simple = t.trim();
  switch (simple) {
    case "String":
    case "CharSequence":
      return "string";
    case "int":
    case "Integer":
    case "long":
    case "Long":
    case "float":
    case "Float":
    case "double":
    case "Double":
    case "short":
    case "Short":
    case "byte":
    case "Byte":
    case "Number":
      return "number";
    case "boolean":
    case "Boolean":
      return "boolean";
    case "void":
    case "Void":
    case "Unit":
      return "void";
    case "Object":
    case "Any":
      return "any";
    case "JSONObject":
    case "h":
    case "JsonElement":
    case "JsonObject":
      return "Record<string, any>";
    default:
      return sanitizeTypeName(simple);
  }
}

/**
 * Parse Java file to extract fields, enum values, and referenced classes
 */
export function parseJavaFile(filePath: string, classFileIndex: Map<string, string>): ParsedJavaClass | null {
  if (!filePath || !fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf8");
  const className = path.basename(filePath, ".java");

  // Check if enum
  const enumMatch = content.match(/public\s+enum\s+([A-Za-z0-9_]+)\s*\{([^}]*)\}/);
  if (enumMatch) {
    const rawValues = enumMatch[2].split(";")[0].trim();
    const enumConstants = rawValues
      .split(",")
      .map((v: string) => v.trim().split("(")[0].trim())
      .filter((v: string) => /^[A-Za-z0-9_]+$/.test(v));
    if (enumConstants.length > 0) {
      return {
        isEnum: true,
        className,
        enumConstants,
        referencedTypes: new Set<string>()
      };
    }
  }

  const fields: JavaField[] = [];
  const referencedTypes = new Set<string>();

  // Find constructor
  const searchPattern = `public ${className}(`;
  const idx = content.indexOf(searchPattern);
  if (idx !== -1) {
    let start = idx + searchPattern.length;
    let depth = 1;
    let end = start;
    while (end < content.length && depth > 0) {
      if (content[end] === "(") depth++;
      else if (content[end] === ")") depth--;
      end++;
    }
    const rawParams = content.substring(start, end - 1).trim();

    if (rawParams) {
      const params: string[] = [];
      let current = "";
      let angleDepth = 0;
      let parenDepth = 0;
      for (let i = 0; i < rawParams.length; i++) {
        const ch = rawParams[i];
        if (ch === "<") angleDepth++;
        else if (ch === ">") angleDepth--;
        else if (ch === "(") parenDepth++;
        else if (ch === ")") parenDepth--;
        else if (ch === "," && angleDepth === 0 && parenDepth === 0) {
          params.push(current.trim());
          current = "";
          continue;
        }
        current += ch;
      }
      if (current.trim()) params.push(current.trim());

      for (const p of params) {
        let jsonName: string | null = null;
        const pMatch = p.match(/@(?:[a-zA-Z0-9_.]+\.)?(?:p|SerializedName|JsonProperty)\s*\(\s*(?:name\s*=\s*|value\s*=\s*)?"([^"]+)"\s*\)/);
        if (pMatch) {
          jsonName = pMatch[1];
        }
        const cleaned = p.replace(/@[A-Za-z0-9_.]+(?:\([^)]*\))?\s*/g, "").replace(/\s+/g, " ").trim();
        const parts = cleaned.split(/\s+/);
        const paramName = parts.pop();
        const rawType = parts.join(" ");

        const typeTokens = rawType.match(/[A-Za-z0-9_$]+/g) || [];
        for (const token of typeTokens) {
          if (classFileIndex.has(token) && token !== className) {
            referencedTypes.add(token);
          }
        }

        const isOptional = true;
        const fieldName = jsonName || paramName;
        if (fieldName && fieldName !== "int" && fieldName !== "defaultConstructorMarker") {
          fields.push({
            name: fieldName,
            rawType: rawType || "Object",
            isOptional
          });
        }
      }
    }
  }

  // Fallback: public fields
  if (fields.length === 0) {
    const fieldMatches = [...content.matchAll(/public\s+(?:final\s+)?([A-Za-z0-9_<>, \$\.\[\]]+?)\s+([a-zA-Z0-9_$]+)\s*;/g)];
    for (const fm of fieldMatches) {
      const rawType = fm[1].trim();
      const name = fm[2].trim();
      if (!name.startsWith("f") || !/^\d+$/.test(name.slice(1))) {
        const typeTokens = rawType.match(/[A-Za-z0-9_$]+/g) || [];
        for (const token of typeTokens) {
          if (classFileIndex.has(token) && token !== className) {
            referencedTypes.add(token);
          }
        }
        fields.push({
          name,
          rawType,
          isOptional: true
        });
      }
    }
  }

  return {
    isEnum: false,
    className,
    fields,
    referencedTypes
  };
}

/**
 * Main generator function for TypeScript API models
 */
export function generateTypeScriptModels(options: GenerateModelsOptions = {}): GenerateModelsResult {
  const endpointsPath = options.endpointsPath || path.resolve(__dirname, "all_extracted_endpoints.json");
  const endpoints: ScannedEndpoint[] = options.endpoints || (
    fs.existsSync(endpointsPath) ? JSON.parse(fs.readFileSync(endpointsPath, "utf8")) : []
  );
  const sourcesDir = resolveSourcesDir(options.sourcesDir);
  const outputPath = options.outputPath || path.resolve(__dirname, "../types.ts");

  // 1. Index all Java files in sources directory
  const classFileIndex = new Map<string, string>();
  function indexSources(dir: string): void {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        indexSources(fullPath);
      } else if (entry.name.endsWith(".java")) {
        const className = entry.name.replace(".java", "");
        if (!classFileIndex.has(className)) {
          classFileIndex.set(className, fullPath);
        }
      }
    }
  }

  indexSources(sourcesDir);
  if (options.verbose) {
    console.log(`Total Java files indexed from ${sourcesDir}: ${classFileIndex.size}`);
  }

  // 2. Collect all root models needed by endpoints
  const modelUsage = new Map<string, ModelUsage>();

  endpoints.forEach((ep) => {
    const ignoredTypes = new Set(["any", "void", "string", "number", "boolean", "object", "unknown", "never", "record", "array"]);

    if (
      ep.requestBodyType &&
      !ep.requestBodyType.startsWith("FormUrl") &&
      !ep.requestBodyType.startsWith("Multipart") &&
      !ep.requestBodyType.startsWith("Map<") &&
      !ep.requestBodyType.startsWith("List<") &&
      ep.requestBodyType !== "JsonObject (Gson)" &&
      ep.requestBodyType !== "String"
    ) {
      const name = sanitizeTypeName(ep.requestBodyType);
      if (name && !ignoredTypes.has(name.toLowerCase())) {
        if (!modelUsage.has(name)) {
          modelUsage.set(name, { rawName: ep.requestBodyType, usedAsReq: [], usedAsResp: [], module: ep.module || "other" });
        }
        modelUsage.get(name)!.usedAsReq.push(`${ep.method} ${ep.endpoint}`);
      }
    }

    let resp = ep.responseType;
    if (
      resp &&
      !["Void", "Void (Completable)", "Void (Unit)", "String", "Boolean", "JSONObject", "JsonObject (Gson)", "Object"].includes(resp) &&
      !resp.startsWith("Map<") &&
      !resp.startsWith("List<String>")
    ) {
      if (resp.startsWith("List<") && resp.endsWith(">")) {
        resp = resp.slice(5, -1).trim();
      }
      const name = sanitizeTypeName(resp);
      if (name && !ignoredTypes.has(name.toLowerCase())) {
        if (!modelUsage.has(name)) {
          modelUsage.set(name, { rawName: resp, usedAsReq: [], usedAsResp: [], module: ep.module || "other" });
        }
        modelUsage.get(name)!.usedAsResp.push(`${ep.method} ${ep.endpoint}`);
      }
    }
  });

  // 3. BFS Queue to discover all child/referenced classes
  const modelsToGenerate = new Map<string, ParsedJavaClass>();
  const queue = Array.from(modelUsage.keys());
  const visited = new Set<string>(queue);

  let depth = 0;
  while (queue.length > 0 && depth < 2) {
    const currentBatch = [...queue];
    queue.length = 0;
    depth++;

    for (const modelName of currentBatch) {
      const rawName = modelUsage.has(modelName) ? modelUsage.get(modelName)!.rawName : modelName;
      const cleanLookup = rawName.replace(/_/g, "$");
      const filePath = classFileIndex.get(cleanLookup) || classFileIndex.get(modelName);

      if (filePath) {
        const parsed = parseJavaFile(filePath, classFileIndex);
        if (parsed) {
          modelsToGenerate.set(modelName, parsed);
          for (const ref of parsed.referencedTypes) {
            const sanitizedRef = sanitizeTypeName(ref);
            if (!visited.has(sanitizedRef)) {
              visited.add(sanitizedRef);
              queue.push(sanitizedRef);
            }
          }
        }
      } else {
        // Fallback interface with open record
        modelsToGenerate.set(modelName, {
          isEnum: false,
          className: modelName,
          fields: [],
          referencedTypes: new Set<string>()
        });
      }
    }
  }

  // 4. Generate the TypeScript code
  let ts = `/**\n`;
  ts += ` * Auto-generated TypeScript Interfaces for API Payloads and Responses\n`;
  ts += ` * Extracted from decompiled Retrofit Java interfaces and Moshi/Gson data models\n`;
  ts += ` * Total models: ${modelsToGenerate.size}\n`;
  ts += ` */\n\n`;

  // Group models by category/module
  const moduleGroups: Record<string, Array<{ name: string; model: ParsedJavaClass }>> = {};
  for (const [name, model] of modelsToGenerate.entries()) {
    let mod = "common";
    if (modelUsage.has(name)) {
      mod = modelUsage.get(name)!.module;
    }
    if (!moduleGroups[mod]) moduleGroups[mod] = [];
    moduleGroups[mod].push({ name, model });
  }

  const generatedNames = new Set<string>();
  const moduleCount: Record<string, number> = {};

  for (const mod of Object.keys(moduleGroups).sort()) {
    ts += `// ============================================================================\n`;
    ts += `// ${mod.toUpperCase()} MODULE MODELS (${moduleGroups[mod].length})\n`;
    ts += `// ============================================================================\n\n`;
    moduleCount[mod] = moduleGroups[mod].length;

    for (const { name, model } of moduleGroups[mod]) {
      if (generatedNames.has(name)) continue;
      if (["any", "void", "string", "number", "boolean", "object"].includes(name.toLowerCase())) continue;
      generatedNames.add(name);

      const usage = modelUsage.get(name);
      ts += `/**\n`;
      ts += ` * Model: ${name}\n`;
      if (usage) {
        if (usage.usedAsReq.length > 0) {
          ts += ` * @requestBody For:\n`;
          usage.usedAsReq.slice(0, 5).forEach((ep) => (ts += ` *   - ${ep}\n`));
          if (usage.usedAsReq.length > 5) ts += ` *   - ... and ${usage.usedAsReq.length - 5} more\n`;
        }
        if (usage.usedAsResp.length > 0) {
          ts += ` * @response For:\n`;
          usage.usedAsResp.slice(0, 5).forEach((ep) => (ts += ` *   - ${ep}\n`));
          if (usage.usedAsResp.length > 5) ts += ` *   - ... and ${usage.usedAsResp.length - 5} more\n`;
        }
      } else {
        ts += ` * Nested child model / DTO\n`;
      }
      ts += ` */\n`;

      if (model.isEnum && model.enumConstants) {
        const union = model.enumConstants.map((c) => `"${c}"`).join(" | ");
        ts += `export type ${name} = ${union} | string;\n\n`;
      } else {
        ts += `export interface ${name} {\n`;
        if (model.fields && model.fields.length > 0) {
          const seenFields = new Set<string>();
          for (const f of model.fields) {
            const cleanFname = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(f.name) ? f.name : `"${f.name}"`;
            if (seenFields.has(cleanFname)) continue;
            seenFields.add(cleanFname);

            const tsType = javaToTsType(f.rawType, name);
            ts += `  ${cleanFname}?: ${tsType};\n`;
          }
        } else {
          ts += `  [key: string]: any;\n`;
        }
        ts += `}\n\n`;
      }
    }
  }

  // Find all types referenced in ts content that are not defined or primitive
  const primitives = new Set([
    "string", "number", "boolean", "void", "any", "Record", "Array",
    "Date", "Promise", "Error", "Set", "Map", "Object", "Function", "Symbol"
  ]);
  const referencedTokens = new Set<string>();

  for (const m of ts.matchAll(/\?:\s*([A-Za-z0-9_]+)(?:\[\])?\s*;/g)) {
    const token = m[1];
    if (!primitives.has(token) && !generatedNames.has(token)) {
      referencedTokens.add(token);
    }
  }
  for (const m of ts.matchAll(/Record<[^,>]+,\s*([A-Za-z0-9_]+)(?:\[\])?\s*>/g)) {
    const token = m[1];
    if (!primitives.has(token) && !generatedNames.has(token)) {
      referencedTokens.add(token);
    }
  }

  if (referencedTokens.size > 0) {
    ts += `// ============================================================================\n`;
    ts += `// REFERENCED AUXILIARY MODELS (${referencedTokens.size})\n`;
    ts += `// ============================================================================\n\n`;
    for (const token of Array.from(referencedTokens).sort()) {
      if (generatedNames.has(token)) continue;
      generatedNames.add(token);

      const cleanLookup = token.replace(/_/g, "$");
      const filePath = classFileIndex.get(cleanLookup) || classFileIndex.get(token);
      if (filePath) {
        const parsed = parseJavaFile(filePath, classFileIndex);
        if (parsed && !parsed.isEnum && parsed.fields && parsed.fields.length > 0) {
          ts += `export interface ${token} {\n`;
          const seen = new Set<string>();
          for (const f of parsed.fields) {
            const cleanFname = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(f.name) ? f.name : `"${f.name}"`;
            if (seen.has(cleanFname)) continue;
            seen.add(cleanFname);
            ts += `  ${cleanFname}?: any;\n`;
          }
          ts += `}\n\n`;
          continue;
        }
      }
      ts += `export interface ${token} {\n  [key: string]: any;\n}\n\n`;
    }
  }

  fs.writeFileSync(outputPath, ts);

  return {
    totalModels: generatedNames.size,
    outputPath,
    moduleCount
  };
}

// Direct execution CLI runner
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  console.log("==> Generating TypeScript Models in sdk folder...");
  const result = generateTypeScriptModels({ verbose: true });
  console.log(`Successfully generated ${result.outputPath} with ${result.totalModels} interfaces!`);
  console.log("\nModels per module:");
  Object.keys(result.moduleCount)
    .sort()
    .forEach((mod) => {
      console.log(`  - ${mod}: ${result.moduleCount[mod]} models`);
    });
}
