import * as fs from "fs";
import * as path from "path";
import { resolveSourcesDir, ScannedEndpoint } from "./scanner";

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
  packageName?: string;
}

export interface ModelUsage {
  rawName: string;
  usedAsReq: string[];
  usedAsResp: string[];
  module: string;
}

export interface DtoExtractionResult {
  classIndex: Map<string, string>;
  modelUsage: Map<string, ModelUsage>;
  models: Map<string, ParsedJavaClass>;
}

// Clean type name
export function sanitizeTypeName(t: string): string {
  return t.replace(/[^A-Za-z0-9_]/g, "_").replace(/^_+|_+$/g, "");
}

/**
 * Parses a single Java source file into ParsedJavaClass
 */
export function parseJavaFile(filePath: string, classFileIndex: Map<string, string>): ParsedJavaClass | null {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf8");
  const fileName = path.basename(filePath, ".java");

  // Extract package name
  const pkgMatch = content.match(/package\s+([a-zA-Z0-9_.]+)\s*;/);
  const packageName = pkgMatch ? pkgMatch[1] : undefined;

  // Check if enum
  const enumMatch = content.match(/public\s+enum\s+([A-Za-z0-9_$]+)/);
  if (enumMatch) {
    const enumConstants: string[] = [];
    const bodyMatch = content.match(/public\s+enum\s+[A-Za-z0-9_$]+\s*\{([^;]+);/s);
    if (bodyMatch) {
      const constantsRaw = bodyMatch[1];
      const lines = constantsRaw.split(",");
      for (const line of lines) {
        const clean = line.replace(/\([^)]*\)/g, "").trim();
        const ident = clean.split(/\s+/)[0];
        if (ident && /^[A-Za-z0-9_$]+$/.test(ident)) {
          enumConstants.push(ident);
        }
      }
    }
    return {
      isEnum: true,
      className: enumMatch[1],
      enumConstants,
      referencedTypes: new Set(),
      packageName,
    };
  }

  // Parse class fields
  const classMatch = content.match(/public\s+(?:final\s+)?class\s+([A-Za-z0-9_$]+)/);
  const className = classMatch ? classMatch[1] : fileName;

  const fields: JavaField[] = [];
  const referencedTypes = new Set<string>();

  // Extract @SerializedName fields
  const serializedMatches = [
    ...content.matchAll(
      /@SerializedName\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["'](?:\s*,\s*alternate\s*=\s*\{[^}]*\})?\s*\)\s*(?:@[A-Za-z0-9_.]+(?:\([^)]*\))?\s*)*(?:private|protected|public)?\s+(?:final\s+)?([A-Za-z0-9_<>, \$\.\[\]]+?)\s+([a-zA-Z0-9_$]+)\s*;/g
    ),
  ];

  for (const m of serializedMatches) {
    const jsonKey = m[1].trim();
    const rawType = m[2].trim();

    const typeTokens = rawType.match(/[A-Za-z0-9_$]+/g) || [];
    for (const token of typeTokens) {
      if (classFileIndex.has(token) && token !== className) {
        referencedTypes.add(token);
      }
    }

    fields.push({
      name: jsonKey,
      rawType,
      isOptional: true,
    });
  }

  // Fallback: public fields
  if (fields.length === 0) {
    const fieldMatches = [
      ...content.matchAll(/public\s+(?:final\s+)?([A-Za-z0-9_<>, \$\.\[\]]+?)\s+([a-zA-Z0-9_$]+)\s*;/g),
    ];
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
          isOptional: true,
        });
      }
    }
  }

  return {
    isEnum: false,
    className,
    fields,
    referencedTypes,
    packageName,
  };
}

/**
 * Universal AST scanner to index Java sources and extract DTO models needed by Retrofit endpoints
 */
export function extractDtoModels(
  endpoints: ScannedEndpoint[],
  sourcesDir: string,
  options: { verbose?: boolean; maxDepth?: number } = {}
): DtoExtractionResult {
  const resolvedSources = resolveSourcesDir(sourcesDir);
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

  indexSources(resolvedSources);
  if (options.verbose) {
    console.log(`[DTO-EXTRACTOR] Total Java files indexed: ${classFileIndex.size}`);
  }

  const modelUsage = new Map<string, ModelUsage>();
  const ignoredTypes = new Set([
    "any", "void", "string", "number", "boolean", "object", "unknown", "never", "record", "array",
  ]);

  endpoints.forEach((ep) => {
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

  const modelsToGenerate = new Map<string, ParsedJavaClass>();
  const queue = Array.from(modelUsage.keys());
  const visited = new Set<string>(queue);

  let depth = 0;
  const maxDepth = options.maxDepth !== undefined ? options.maxDepth : 2;

  while (queue.length > 0 && depth < maxDepth) {
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
      }
    }
  }

  return {
    classIndex: classFileIndex,
    modelUsage,
    models: modelsToGenerate,
  };
}
