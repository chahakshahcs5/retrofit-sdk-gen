import * as fs from "fs";
import { DtoExtractionResult, sanitizeTypeName } from "../../core/dto-extractor";

export function toPascalCase(str: string): string {
  let res = str
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .split("_")
    .map((s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : ""))
    .join("");
  if (/^[0-9]/.test(res)) {
    res = `Field${res}`;
  }
  return res || "Field";
}

export function javaToGoType(javaType: string | null | undefined, knownModels?: Set<string>): string {
  if (!javaType) return "interface{}";
  let t = javaType.trim();

  // Clean annotations & modifiers
  t = t.replace(/@[A-Za-z0-9_.]+(?:\([^)]*\))?\s*/g, "").trim();
  t = t.replace(/\b(public|protected|private|static|final|transient|volatile)\b/g, "").trim();
  t = t.replace(/\?\s+extends\s+/g, "").replace(/\?\s+super\s+/g, "");

  // Single-letter generic type variables (T, D, E, K, V, B, R, A, S)
  if (/^[A-Za-z]$/.test(t)) {
    return "interface{}";
  }

  // Arrays
  if (t.endsWith("[]")) {
    const inner = t.slice(0, -2).trim();
    return `[]${javaToGoType(inner, knownModels)}`;
  }

  const lower = t.toLowerCase();
  if (["string", "charsequence", "char"].includes(lower)) return "string";
  if (["int", "integer", "short", "byte"].includes(lower)) return "int";
  if (["long"].includes(lower)) return "int64";
  if (["double"].includes(lower)) return "float64";
  if (["float", "number", "bigdecimal"].includes(lower)) return "float32";
  if (["boolean", "bool"].includes(lower)) return "bool";
  if (["void", "unit"].includes(lower)) return "interface{}";
  if (["jsonobject", "object", "any", "map"].includes(lower)) return "map[string]interface{}";
  if (["list", "arraylist", "collection", "set"].includes(lower)) return "[]interface{}";
  if (["throwable", "exception", "error", "stacktraceelement"].includes(lower)) return "interface{}";

  // Generic wrappers like Lazy<X>, Response<X>, Observable<X>, Single<X>, Flow<X>
  const wrapperMatch = t.match(/^(?:Lazy|Response|Observable|Single|Flowable|Flow|Deferred)<(.+)>$/i);
  if (wrapperMatch) {
    return javaToGoType(wrapperMatch[1].trim(), knownModels);
  }

  // Lists
  const listMatch = t.match(/^(?:List|ArrayList|Set|Collection)<(.+)>$/);
  if (listMatch) {
    return `[]${javaToGoType(listMatch[1].trim(), knownModels)}`;
  }

  // Maps
  const mapMatch = t.match(/^(?:Map|HashMap|LinkedHashMap)<(.+),\s*(.+)>$/);
  if (mapMatch) {
    return `map[string]${javaToGoType(mapMatch[2].trim(), knownModels)}`;
  }

  const safe = toPascalCase(sanitizeTypeName(t));
  if (knownModels && knownModels.has(safe)) {
    return safe;
  }
  return "interface{}";
}

export function generateGoModels(dtoResult: DtoExtractionResult, outputPath: string): { totalModels: number } {
  // Only include models that will ACTUALLY be emitted into the file
  const emittedModels = new Set<string>();
  for (const [modelName, parsed] of dtoResult.models.entries()) {
    if (
      (parsed.isEnum && parsed.enumConstants && parsed.enumConstants.length > 0) ||
      (parsed.fields && parsed.fields.length > 0)
    ) {
      emittedModels.add(toPascalCase(sanitizeTypeName(modelName)));
    }
  }

  const lines: string[] = [
    "package sdk",
    "",
    "// Auto-generated Go Data Models",
    "",
  ];

  let count = 0;
  for (const [modelName, parsed] of dtoResult.models.entries()) {
    const safeStructName = toPascalCase(sanitizeTypeName(modelName));
    if (parsed.isEnum && parsed.enumConstants && parsed.enumConstants.length > 0) {
      lines.push(`type ${safeStructName} string`);
      lines.push("const (");
      for (const c of parsed.enumConstants) {
        lines.push(`    ${safeStructName}_${toPascalCase(c)} ${safeStructName} = "${c}"`);
      }
      lines.push(")");
      lines.push("");
      count++;
    } else if (parsed.fields && parsed.fields.length > 0) {
      lines.push(`type ${safeStructName} struct {`);
      const usedFieldNames = new Set<string>();
      const usedJsonTags = new Set<string>();

      for (const f of parsed.fields) {
        const goType = javaToGoType(f.rawType, emittedModels);
        let fieldName = toPascalCase(f.name);
        if (fieldName === safeStructName) {
          fieldName = `${fieldName}Value`;
        }
        let counter = 1;
        while (usedFieldNames.has(fieldName)) {
          fieldName = `${toPascalCase(f.name)}${counter++}`;
        }
        usedFieldNames.add(fieldName);

        let jsonTag = f.name;
        if (usedJsonTags.has(jsonTag)) {
          jsonTag = `${jsonTag}_dup${counter}`;
        }
        usedJsonTags.add(jsonTag);

        if (goType.startsWith("[]") || goType.startsWith("map[") || goType === "interface{}") {
          lines.push(`    ${fieldName} ${goType} \`json:"${jsonTag},omitempty"\``);
        } else {
          lines.push(`    ${fieldName} *${goType} \`json:"${jsonTag},omitempty"\``);
        }
      }
      lines.push("}");
      lines.push("");
      count++;
    }
  }

  fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
  return { totalModels: count };
}
