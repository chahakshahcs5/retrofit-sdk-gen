import * as fs from "fs";
import { DtoExtractionResult, sanitizeTypeName } from "../../core/dto-extractor";

export function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9_]+/g, "_")
    .toLowerCase();
}

export function javaToCType(javaType: string | null | undefined): string {
  if (!javaType) return "char*";
  let t = javaType.trim();

  // Strip annotations & modifiers
  t = t.replace(/@[A-Za-z0-9_.]+(?:\([^)]*\))?\s*/g, "").trim();
  t = t.replace(/\b(public|protected|private|static|final|transient|volatile)\b/g, "").trim();
  t = t.replace(/\?\s+extends\s+/g, "").replace(/\?\s+super\s+/g, "");

  const lower = t.toLowerCase();
  if (["string", "charsequence", "char"].includes(lower)) return "char*";
  if (["int", "integer", "short", "byte"].includes(lower)) return "int";
  if (["long"].includes(lower)) return "int64_t";
  if (["double"].includes(lower)) return "double";
  if (["float", "number", "bigdecimal"].includes(lower)) return "float";
  if (["boolean", "bool"].includes(lower)) return "bool";
  if (["void", "unit"].includes(lower)) return "void";

  if (t.endsWith("[]") || t.startsWith("List<") || t.startsWith("Map<")) {
    return "void*";
  }

  return `app_${toSnakeCase(sanitizeTypeName(t))}_t*`;
}

export function generateCModels(dtoResult: DtoExtractionResult, outputPath: string): { totalModels: number } {
  const lines: string[] = [
    "#ifndef APP_MODELS_H",
    "#define APP_MODELS_H",
    "",
    "// Auto-generated ANSI C99 Data Models",
    "#include <stdbool.h>",
    "#include <stdint.h>",
    "#include <stddef.h>",
    "",
  ];

  let count = 0;
  for (const [modelName, parsed] of dtoResult.models.entries()) {
    const safeTypeName = `app_${toSnakeCase(sanitizeTypeName(modelName))}_t`;
    if (parsed.isEnum && parsed.enumConstants && parsed.enumConstants.length > 0) {
      lines.push(`typedef enum {`);
      for (const c of parsed.enumConstants) {
        lines.push(`    APP_${toSnakeCase(c).toUpperCase()},`);
      }
      lines.push(`} ${safeTypeName};`);
      lines.push("");
      count++;
    } else if (parsed.fields && parsed.fields.length > 0) {
      lines.push(`typedef struct {`);
      for (const f of parsed.fields) {
        const cType = javaToCType(f.rawType);
        const fieldName = toSnakeCase(f.name);
        lines.push(`    ${cType} ${fieldName};`);
      }
      lines.push(`} ${safeTypeName};`);
      lines.push("");
      count++;
    }
  }

  lines.push("#endif // APP_MODELS_H");
  fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
  return { totalModels: count };
}
