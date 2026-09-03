import * as fs from "fs";
import * as path from "path";

export interface ScannedEndpoint {
  endpoint: string;
  method: string;
  module: string;
  interface: string;
  function?: string;
  requestBodyType?: string | null;
  responseType?: string | null;
  file: string;
  signature: string;
  pathParams?: string[];
  queryParams?: Record<string, string> | string[];
  hasQueryMap?: boolean;
  headers?: string[];
  hasHeaderMap?: boolean;
  staticHeaders?: Record<string, string>;
  fields?: Record<string, string>;
  hasFieldMap?: boolean;
  parts?: Record<string, string>;
  hasPartMap?: boolean;
}

export interface ScanOptions {
  sourcesDir?: string;
  outputJsonPath?: string;
  verbose?: boolean;
}

export interface ScanResult {
  totalCount: number;
  apis: ScannedEndpoint[];
  moduleBreakdown: Record<string, number>;
  outputPath?: string;
  detectedBaseUrl?: string;
}

/**
 * Recursively walk directory to find all Java/Kotlin source files
 */
export function walkDir(dir: string, callback: (filePath: string) => void): void {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, callback);
    } else if (entry.name.endsWith(".java") || entry.name.endsWith(".kt")) {
      callback(fullPath);
    }
  }
}

/**
 * Dynamically resolves the decompiled sources directory across any app structure
 */
export function resolveSourcesDir(customDir?: string): string {
  if (customDir && fs.existsSync(customDir)) {
    return customDir;
  }
  if (process.env.SOURCES_DIR && fs.existsSync(process.env.SOURCES_DIR)) {
    return process.env.SOURCES_DIR;
  }

  // Direct candidate paths
  const candidateDirs = [
    path.resolve(process.cwd(), "sources"),
    path.resolve(process.cwd(), "../sources"),
    path.resolve(process.cwd(), "../../sources")
  ];
  for (const c of candidateDirs) {
    if (fs.existsSync(c)) return c;
  }

  // Search current directory, parent directory, and grandparent directory for subfolders containing 'sources'
  const searchRoots = [process.cwd(), path.resolve(process.cwd(), ".."), path.resolve(__dirname, "../..")];
  for (const root of searchRoots) {
    if (fs.existsSync(root)) {
      try {
        const items = fs.readdirSync(root, { withFileTypes: true });
        for (const item of items) {
          if (item.isDirectory() && !item.name.startsWith(".") && !["node_modules", "sdk", "dist"].includes(item.name)) {
            const subSources = path.join(root, item.name, "sources");
            if (fs.existsSync(subSources)) return subSources;
          }
        }
      } catch {}
    }
  }

  return candidateDirs[0];
}

/**
 * Resolves Java constant references (e.g. LogCategory.CONTEXT, PaymentConstants.ORDER_ID)
 * across decompiled classes into their authentic literal values.
 */
export class JavaConstantResolver {
  private fileIndex: Map<string, string[]> = new Map();
  private cache: Map<string, string> = new Map();

  constructor(sourcesDir: string) {
    if (fs.existsSync(sourcesDir)) {
      walkDir(sourcesDir, (file) => {
        const basename = path.basename(file, path.extname(file));
        const list = this.fileIndex.get(basename) || [];
        list.push(file);
        this.fileIndex.set(basename, list);
      });
    }
  }

  /**
   * Resolves a raw expression from a Retrofit annotation into a clean string.
   * Handles:
   * - "literal" -> literal
   * - ClassName.FIELD -> resolved value
   * - ClassName.Inner.FIELD -> resolved value
   * - LOCAL_FIELD -> resolved value in current file
   */
  resolve(expr: string, currentFileContent?: string): string {
    const raw = expr.trim().replace(/^value\s*=\s*/, "").trim();
    if (!raw) return "";

    // 1. Literal string in quotes: "foo"
    const quoteMatch = raw.match(/^"([^"]+)"$/);
    if (quoteMatch) {
      return quoteMatch[1];
    }

    // Check cache
    if (this.cache.has(raw)) {
      return this.cache.get(raw)!;
    }

    // 2. Class.FIELD expression
    const parts = raw.split(".");
    const fieldName = parts[parts.length - 1].trim();
    const className = parts[0].trim();

    // Check if defined in current file
    if (currentFileContent) {
      const localMatch = currentFileContent.match(
        new RegExp(`(?:String|CharSequence)[^=;]*?\\b${fieldName}\\s*=\\s*"([^"]+)"`)
      );
      if (localMatch) {
        this.cache.set(raw, localMatch[1]);
        return localMatch[1];
      }
    }

    // Look up in class files matching className
    const candidateFiles = this.fileIndex.get(className) || [];
    for (const file of candidateFiles) {
      try {
        const content = fs.readFileSync(file, "utf8");
        const match =
          content.match(new RegExp(`(?:String|CharSequence)[^=;]*?\\b${fieldName}\\s*=\\s*"([^"]+)"`)) ||
          content.match(new RegExp(`\\b${fieldName}\\s*=\\s*"([^"]+)"`));
        if (match) {
          this.cache.set(raw, match[1]);
          return match[1];
        }
      } catch {}
    }

    // Fallback: lowercase field name or sanitized raw
    const fallback = fieldName ? fieldName.toLowerCase() : raw.replace(/[^a-zA-Z0-9_$]/g, "");
    this.cache.set(raw, fallback);
    return fallback;
  }
}

/**
 * Scans Android decompiled sources for Retrofit interface annotations and extracts endpoints with types
 */
export function scanApis(options: ScanOptions = {}): ScanResult {
  const sourcesDir = resolveSourcesDir(options.sourcesDir);
  const apis: ScannedEndpoint[] = [];
  const baseUrlCandidates: Record<string, number> = {};

  if (fs.existsSync(sourcesDir)) {
    const constantResolver = new JavaConstantResolver(sourcesDir);

    walkDir(sourcesDir, (file: string) => {
      const content = fs.readFileSync(file, "utf8");

      // Auto-detect base URL patterns from BuildConfig, NetworkModule, or Retrofit builder
      const baseUrlMatches = content.matchAll(/(?:baseUrl|BASE_URL|API_URL)\s*(?:=|:|\()\s*"([^"]+)"/gi);
      for (const bMatch of baseUrlMatches) {
        const val = bMatch[1].trim();
        if (val.startsWith("http://") || val.startsWith("https://")) {
          baseUrlCandidates[val] = (baseUrlCandidates[val] || 0) + 1;
        }
      }

      if (
        !content.includes("retrofit2.http") &&
        !content.includes("@POST") &&
        !content.includes("@GET") &&
        !content.includes("@PUT") &&
        !content.includes("@DELETE") &&
        !content.includes("@PATCH") &&
        !content.includes("@HTTP")
      ) {
        return;
      }

      const lines = content.split("\n");
      const normalizedPath = file.replace(/\\/g, "/");
      const relPath = path.relative(sourcesDir, file).replace(/\\/g, "/");
      const interfaceName = path.basename(file, path.extname(file));

      // Extract module from Java/Kotlin package path (e.g. com/company/<module>/...)
      const pathParts = normalizedPath.split("/");
      const rootIdx = pathParts.findIndex((p) =>
        ["com", "org", "io", "in", "net", "co", "app"].includes(p)
      );
      let moduleName = "common";
      if (rootIdx !== -1 && rootIdx + 2 < pathParts.length) {
        moduleName = pathParts[rootIdx + 2];
      } else if (pathParts.length >= 2) {
        moduleName = pathParts[pathParts.length - 2];
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const match = line.match(/@(GET|POST|PUT|DELETE|PATCH|HTTP|HEAD|OPTIONS)\s*\((.*?)\)/);
        if (match) {
          let httpMethod = match[1];
          const rawArg = match[2];
          let endpoint = rawArg;

          if (httpMethod === "HTTP") {
            const methodMatch = rawArg.match(/method\s*=\s*("?[^",)]+"?)/);
            if (methodMatch) httpMethod = constantResolver.resolve(methodMatch[1], content);
            const pathMatch = rawArg.match(/path\s*=\s*("?[^",)]+"?)/);
            if (pathMatch) endpoint = constantResolver.resolve(pathMatch[1], content);
          } else {
            const cleanArg = rawArg.replace(/^\s*(?:value\s*=\s*)?/, "").replace(/,\s*.*$/, "").trim();
            endpoint = constantResolver.resolve(cleanArg, content);
          }

          // Check preceding annotations for @FormUrlEncoded, @Multipart, or @Headers
          let isFormUrlEncoded = false;
          let isMultipart = false;
          const staticHeaders: Record<string, string> = {};

          for (let b = Math.max(0, i - 4); b < i; b++) {
            if (lines[b].includes("@FormUrlEncoded")) isFormUrlEncoded = true;
            if (lines[b].includes("@Multipart")) isMultipart = true;
            if (lines[b].includes("@Headers")) {
              for (const headerMatch of lines[b].matchAll(/"([^"]+)"/g)) {
                const [hKey, ...hValParts] = headerMatch[1].split(":");
                if (hKey && hValParts.length > 0) {
                  staticHeaders[hKey.trim()] = hValParts.join(":").trim();
                }
              }
            }
          }

          // Look ahead for full method signature
          let signature = "";
          for (let j = i + 1; j < Math.min(i + 12, lines.length); j++) {
            const nextLine = lines[j].trim();
            if (
              nextLine.startsWith("@") &&
              !nextLine.startsWith("@Body") &&
              !nextLine.startsWith("@Path") &&
              !nextLine.startsWith("@Query") &&
              !nextLine.startsWith("@Header") &&
              !nextLine.startsWith("@Field") &&
              !nextLine.startsWith("@Part") &&
              !nextLine.startsWith("@retrofit2")
            ) {
              if (nextLine.startsWith("@Headers")) {
                for (const headerMatch of nextLine.matchAll(/"([^"]+)"/g)) {
                  const [hKey, ...hValParts] = headerMatch[1].split(":");
                  if (hKey && hValParts.length > 0) {
                    staticHeaders[hKey.trim()] = hValParts.join(":").trim();
                  }
                }
              }
              continue;
            }
            signature += " " + nextLine;
            if (nextLine.includes(";")) break;
          }

          const cleanSignature = signature.trim();

          // Extract function name and responseType
          let fnName = "";
          let rawReturnType = "";
          let responseType: string | null = null;

          const parenIdx = cleanSignature.indexOf("(");
          if (parenIdx !== -1) {
            const beforeParen = cleanSignature.slice(0, parenIdx).trim();
            const partsBefore = beforeParen.split(/\s+/);
            fnName = partsBefore.pop() || "";
            rawReturnType = partsBefore.join(" ").replace(/@[A-Za-z0-9_.]+(?:\([^)]*\))?\s*/g, "").trim();

            if (rawReturnType === "Object" || rawReturnType.includes("Object")) {
              const contMatch = cleanSignature.match(/(?:c|Continuation)<\s*\?\s*super\s+([A-Za-z0-9_<>$,\s\[\]]+?)\s*>/);
              if (contMatch) {
                responseType = contMatch[1].trim();
              } else {
                responseType = "any";
              }
            } else if (rawReturnType.includes("<")) {
              const genericMatch = rawReturnType.match(/<(.+)>/);
              if (genericMatch) {
                responseType = genericMatch[1].trim();
              }
            } else if (rawReturnType) {
              responseType = rawReturnType;
            }

            // Unwrap Retrofit Response<T> or retrofit2.Response<T> wrapper
            if (responseType) {
              const respUnwrap = responseType.match(/^(?:[a-zA-Z0-9_.]+\.)?Response<\s*(.+)\s*>$/);
              if (respUnwrap) {
                responseType = respUnwrap[1].trim();
              }
            }
          }

          // Extract requestBodyType
          let requestBodyType: string | null = null;
          if (!isMultipart && /@(?:[a-zA-Z0-9_.]+\.)?Part\b/.test(cleanSignature)) isMultipart = true;
          if (!isFormUrlEncoded && /@(?:[a-zA-Z0-9_.]+\.)?Field\b/.test(cleanSignature)) isFormUrlEncoded = true;

          if (isFormUrlEncoded) {
            requestBodyType = "FormUrlEncoded";
          } else if (isMultipart) {
            requestBodyType = "Multipart";
          } else {
            const bodyMatch = cleanSignature.match(
              /@(?:[a-zA-Z0-9_.]+\.)?Body\s+(?:@[A-Za-z0-9_.]+(?:\([^)]*\))?\s+)*([A-Za-z0-9_<>$,\s\[\]]+?)\s+([a-zA-Z0-9_$]+)\s*[,)]/
            );
            if (bodyMatch) {
              requestBodyType = bodyMatch[1].replace(/@[A-Za-z0-9_.]+(?:\([^)]*\))?\s*/g, "").trim();
            }
          }

          // Extract path parameters from endpoint template and @Path annotations
          const pathParamsSet = new Set<string>();
          for (const m of endpoint.matchAll(/\{([^}]+)\}/g)) {
            pathParamsSet.add(m[1]);
          }
          for (const m of cleanSignature.matchAll(/@(?:[a-zA-Z0-9_.]+\.)?Path\s*\(\s*([^)]+)\s*\)/g)) {
            const resolvedPath = constantResolver.resolve(m[1], content);
            if (resolvedPath) pathParamsSet.add(resolvedPath);
          }

          // Extract query parameters with types
          const queryParams: Record<string, string> = {};
          const queryRegex = /@(?:[a-zA-Z0-9_.]+\.)?Query\s*\(\s*([^)]+?)\s*\)(?:\s*@[A-Za-z0-9_.]+(?:\([^)]*\))?)*\s+([A-Za-z0-9_<>]+)/g;
          for (const m of cleanSignature.matchAll(queryRegex)) {
            const paramName = constantResolver.resolve(m[1], content);
            const rawJavaType = m[2];
            let tsType = "string | number | boolean";
            if (/^(?:int|Integer|long|Long|double|Double|float|Float|short|Short|byte|Byte)$/i.test(rawJavaType)) {
              tsType = "number";
            } else if (/^(?:boolean|Boolean)$/i.test(rawJavaType)) {
              tsType = "boolean";
            } else if (/^(?:String|CharSequence)$/i.test(rawJavaType)) {
              tsType = "string";
            }
            if (paramName) queryParams[paramName] = tsType;
          }

          // Fallback for any @Query that didn't match the type pattern
          for (const m of cleanSignature.matchAll(/@(?:[a-zA-Z0-9_.]+\.)?Query\s*\(\s*([^)]+)\s*\)/g)) {
            const paramName = constantResolver.resolve(m[1], content);
            if (paramName && !queryParams[paramName]) {
              queryParams[paramName] = "string | number | boolean";
            }
          }

          const hasQueryMap = /@(?:[a-zA-Z0-9_.]+\.)?QueryMap\b/.test(cleanSignature);

          // Extract headers
          const headers: string[] = [];
          for (const m of cleanSignature.matchAll(/@(?:[a-zA-Z0-9_.]+\.)?Header\s*\(\s*([^)]+)\s*\)/g)) {
            const resolvedHeader = constantResolver.resolve(m[1], content);
            if (resolvedHeader) headers.push(resolvedHeader);
          }

          const hasHeaderMap = /@(?:[a-zA-Z0-9_.]+\.)?HeaderMap\b/.test(cleanSignature);

          // Extract fields for @FormUrlEncoded
          const fields: Record<string, string> = {};
          const fieldRegex = /@(?:[a-zA-Z0-9_.]+\.)?Field\s*\(\s*([^)]+?)\s*\)(?:\s*@[A-Za-z0-9_.]+(?:\([^)]*\))?)*\s+([A-Za-z0-9_<>]+)/g;
          for (const m of cleanSignature.matchAll(fieldRegex)) {
            const fieldName = constantResolver.resolve(m[1], content);
            const rawJavaType = m[2];
            let tsType = "string | number | boolean";
            if (/^(?:int|Integer|long|Long|double|Double|float|Float|short|Short|byte|Byte)$/i.test(rawJavaType)) {
              tsType = "number";
            } else if (/^(?:boolean|Boolean)$/i.test(rawJavaType)) {
              tsType = "boolean";
            } else if (/^(?:String|CharSequence)$/i.test(rawJavaType)) {
              tsType = "string";
            }
            if (fieldName) fields[fieldName] = tsType;
          }
          for (const m of cleanSignature.matchAll(/@(?:[a-zA-Z0-9_.]+\.)?Field\s*\(\s*([^)]+)\s*\)/g)) {
            const fieldName = constantResolver.resolve(m[1], content);
            if (fieldName && !fields[fieldName]) {
              fields[fieldName] = "string | number | boolean";
            }
          }
          const hasFieldMap = /@(?:[a-zA-Z0-9_.]+\.)?FieldMap\b/.test(cleanSignature);

          // Extract parts for @Multipart
          const parts: Record<string, string> = {};
          const partRegex = /@(?:[a-zA-Z0-9_.]+\.)?Part\s*\(\s*([^)]+?)\s*\)(?:\s*@[A-Za-z0-9_.]+(?:\([^)]*\))?)*\s+([A-Za-z0-9_<>]+)/g;
          for (const m of cleanSignature.matchAll(partRegex)) {
            const partName = constantResolver.resolve(m[1], content);
            const rawJavaType = m[2];
            let tsType = "any";
            if (/^(?:int|Integer|long|Long|double|Double|float|Float)$/i.test(rawJavaType)) {
              tsType = "number";
            } else if (/^(?:boolean|Boolean)$/i.test(rawJavaType)) {
              tsType = "boolean";
            } else if (/^(?:String|CharSequence)$/i.test(rawJavaType)) {
              tsType = "string";
            } else if (rawJavaType.includes("Part")) {
              tsType = "File | Blob | any";
            }
            if (partName) parts[partName] = tsType;
          }
          for (const m of cleanSignature.matchAll(/@(?:[a-zA-Z0-9_.]+\.)?Part\s*\(\s*([^)]+)\s*\)/g)) {
            const partName = constantResolver.resolve(m[1], content);
            if (partName && !parts[partName]) {
              parts[partName] = "any";
            }
          }
          const hasPartMap = /@(?:[a-zA-Z0-9_.]+\.)?PartMap\b/.test(cleanSignature);

          apis.push({
            endpoint,
            method: httpMethod,
            module: moduleName,
            interface: interfaceName,
            function: fnName,
            requestBodyType,
            responseType,
            file: relPath,
            signature: cleanSignature,
            pathParams: Array.from(pathParamsSet),
            queryParams,
            hasQueryMap,
            headers,
            hasHeaderMap,
            staticHeaders: Object.keys(staticHeaders).length > 0 ? staticHeaders : undefined,
            fields: Object.keys(fields).length > 0 ? fields : undefined,
            hasFieldMap,
            parts: Object.keys(parts).length > 0 ? parts : undefined,
            hasPartMap,
          });
        }
      }
    });
  }

  // Group by module
  const grouped: Record<string, number> = {};
  for (const api of apis) {
    const mod = api.module || "common";
    grouped[mod] = (grouped[mod] || 0) + 1;
  }

  // Determine top detected base URL
  let detectedBaseUrl: string | undefined = undefined;
  const sortedUrls = Object.entries(baseUrlCandidates).sort((a, b) => b[1] - a[1]);
  if (sortedUrls.length > 0) {
    detectedBaseUrl = sortedUrls[0][0];
  }

  if (options.outputJsonPath) {
    fs.writeFileSync(options.outputJsonPath, JSON.stringify(apis, null, 2));
  }

  return {
    totalCount: apis.length,
    apis,
    moduleBreakdown: grouped,
    outputPath: options.outputJsonPath,
    detectedBaseUrl
  };
}
