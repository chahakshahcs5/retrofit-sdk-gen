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

export function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9_]+/g, "_")
    .toLowerCase();
}

const RUST_KEYWORDS = new Set([
  "as", "break", "const", "continue", "crate", "else", "enum", "extern",
  "false", "fn", "for", "if", "impl", "in", "let", "loop", "match", "mod",
  "move", "mut", "pub", "ref", "return", "self", "Self", "static", "struct",
  "super", "trait", "true", "type", "unsafe", "use", "where", "while",
  "async", "await", "dyn", "abstract", "become", "box", "do", "final", "macro",
  "override", "priv", "typeof", "unsized", "virtual", "yield", "try",
]);

export function javaToRustType(javaType: string | null | undefined, knownModels?: Set<string>): string {
  if (!javaType) return "serde_json::Value";
  let t = javaType.trim();

  // Strip annotations & modifiers
  t = t.replace(/@[A-Za-z0-9_.]+(?:\([^)]*\))?\s*/g, "").trim();
  t = t.replace(/\b(public|protected|private|static|final|transient|volatile)\b/g, "").trim();
  t = t.replace(/\?\s+extends\s+/g, "").replace(/\?\s+super\s+/g, "");

  // Single-letter generic type variables
  if (/^[A-Za-z]$/.test(t)) {
    return "serde_json::Value";
  }

  if (t.endsWith("[]")) {
    const inner = javaToRustType(t.slice(0, -2).trim(), knownModels);
    return `Vec<${inner}>`;
  }

  const lower = t.toLowerCase();
  if (["string", "charsequence", "char"].includes(lower)) return "String";
  if (["int", "integer", "short", "byte"].includes(lower)) return "i32";
  if (["long"].includes(lower)) return "i64";
  if (["double"].includes(lower)) return "f64";
  if (["float", "number", "bigdecimal"].includes(lower)) return "f32";
  if (["boolean", "bool"].includes(lower)) return "bool";
  if (["void", "unit"].includes(lower)) return "()";
  if (["jsonobject", "object", "any"].includes(lower)) return "serde_json::Value";
  if (["list", "arraylist", "collection", "set"].includes(lower)) return "Vec<serde_json::Value>";
  if (["map", "hashmap"].includes(lower)) return "std::collections::HashMap<String, serde_json::Value>";
  if (["throwable", "exception", "error", "stacktraceelement"].includes(lower)) return "serde_json::Value";

  // Generic wrappers
  const wrapperMatch = t.match(/^(?:Lazy|Response|Observable|Single|Flowable|Flow|Deferred)<(.+)>$/i);
  if (wrapperMatch) {
    return javaToRustType(wrapperMatch[1].trim(), knownModels);
  }

  // Lists
  const listMatch = t.match(/^(?:List|ArrayList|Set|Collection)<(.+)>$/);
  if (listMatch) {
    const inner = javaToRustType(listMatch[1].trim(), knownModels);
    return `Vec<${inner}>`;
  }

  // Maps
  const mapMatch = t.match(/^(?:Map|HashMap|LinkedHashMap)<(.+),\s*(.+)>$/);
  if (mapMatch) {
    const val = javaToRustType(mapMatch[2].trim(), knownModels);
    return `std::collections::HashMap<String, ${val}>`;
  }

  const safe = toPascalCase(sanitizeTypeName(t));
  if (knownModels && knownModels.has(safe)) {
    return safe;
  }
  return "serde_json::Value";
}

export function generateRustModels(dtoResult: DtoExtractionResult, outputPath: string): { totalModels: number } {
  // Only register models that will actually be emitted
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
    "// Auto-generated Rust Data Models",
    "use serde::{Serialize, Deserialize};",
    "",
  ];

  let count = 0;
  for (const [modelName, parsed] of dtoResult.models.entries()) {
    const safeStructName = toPascalCase(sanitizeTypeName(modelName));
    if (parsed.isEnum && parsed.enumConstants && parsed.enumConstants.length > 0) {
      lines.push("#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]");
      lines.push(`pub enum ${safeStructName} {`);
      const usedVariants = new Set<string>();
      for (const c of parsed.enumConstants) {
        let variant = toPascalCase(c);
        let counter = 1;
        while (usedVariants.has(variant)) {
          variant = `${toPascalCase(c)}_${counter++}`;
        }
        usedVariants.add(variant);
        lines.push(`    #[serde(rename = "${c}")]`);
        lines.push(`    ${variant},`);
      }
      lines.push("}");
      lines.push("");
      count++;
    } else if (parsed.fields && parsed.fields.length > 0) {
      lines.push("#[derive(Debug, Clone, Serialize, Deserialize, Default)]");
      lines.push(`pub struct ${safeStructName} {`);
      const usedFields = new Set<string>();

      for (const f of parsed.fields) {
        const rType = javaToRustType(f.rawType, emittedModels);
        let fieldName = toSnakeCase(f.name);
        if (/^[0-9]/.test(fieldName) || !fieldName) fieldName = `field_${fieldName}`;
        if (RUST_KEYWORDS.has(fieldName)) {
          fieldName = `r#${fieldName}`;
        }
        let counter = 1;
        while (usedFields.has(fieldName)) {
          fieldName = `${toSnakeCase(f.name)}_${counter++}`;
        }
        usedFields.add(fieldName);

        lines.push(`    #[serde(rename = "${f.name}", skip_serializing_if = "Option::is_none")]`);
        // Wrap referenced struct models in Box to prevent infinite recursive size in Rust
        if (emittedModels.has(rType)) {
          lines.push(`    pub ${fieldName}: Option<Box<${rType}>>,`);
        } else {
          lines.push(`    pub ${fieldName}: Option<${rType}>,`);
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
