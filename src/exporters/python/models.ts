import * as fs from "fs";
import * as path from "path";
import { DtoExtractionResult, sanitizeTypeName } from "../../core/dto-extractor";

export function javaToPythonType(javaType: string | null | undefined): string {
  if (!javaType) return "Any";
  let t = javaType.trim();

  // Strip annotations and modifiers
  t = t.replace(/@[A-Za-z0-9_.]+(?:\([^)]*\))?\s*/g, "").trim();
  t = t.replace(/\b(public|protected|private|static|final|transient|volatile)\b/g, "").trim();
  t = t.replace(/\?\s+extends\s+/g, "").replace(/\?\s+super\s+/g, "");

  if (t.endsWith("[]")) {
    const inner = t.slice(0, -2).trim();
    return `List[${javaToPythonType(inner)}]`;
  }

  // Primitives and standard Java types
  const lower = t.toLowerCase();
  if (["string", "charsequence", "char"].includes(lower)) return "str";
  if (["int", "integer", "long", "short", "byte"].includes(lower)) return "int";
  if (["double", "float", "number", "bigdecimal"].includes(lower)) return "float";
  if (["boolean", "bool"].includes(lower)) return "bool";
  if (["void", "unit"].includes(lower)) return "None";
  if (["jsonobject", "jsonobject (gson)", "object", "any"].includes(lower)) return "Dict[str, Any]";

  // Collections
  const listMatch = t.match(/^(?:List|ArrayList|Set|Collection)<(.+)>$/);
  if (listMatch) {
    return `List[${javaToPythonType(listMatch[1].trim())}]`;
  }

  const mapMatch = t.match(/^(?:Map|HashMap|LinkedHashMap)<(.+),\s*(.+)>$/);
  if (mapMatch) {
    return `Dict[${javaToPythonType(mapMatch[1].trim())}, ${javaToPythonType(mapMatch[2].trim())}]`;
  }

  return sanitizeTypeName(t);
}

const PYTHON_KEYWORDS = new Set([
  "False", "None", "True", "and", "as", "assert", "async", "await", "break",
  "class", "continue", "def", "del", "elif", "else", "except", "finally",
  "for", "from", "global", "if", "import", "in", "is", "lambda", "nonlocal",
  "not", "or", "pass", "raise", "return", "try", "while", "with", "yield"
]);

export function toSafePythonName(name: string): string {
  let clean = name.replace(/[^a-zA-Z0-9_]/g, "_");
  if (/^[0-9]/.test(clean)) {
    clean = `_${clean}`;
  }
  if (PYTHON_KEYWORDS.has(clean) || clean === "") {
    return `${clean}_val`;
  }
  return clean;
}

export function generatePythonModels(dtoResult: DtoExtractionResult, outputPath: string): { totalModels: number } {
  const lines: string[] = [
    "# Auto-generated Python Data Models",
    "from typing import Optional, List, Dict, Any",
    "from dataclasses import dataclass, field",
    "",
  ];

  let count = 0;
  for (const [modelName, parsed] of dtoResult.models.entries()) {
    const safeName = sanitizeTypeName(modelName);
    if (parsed.isEnum && parsed.enumConstants && parsed.enumConstants.length > 0) {
      lines.push("@dataclass");
      lines.push(`class ${safeName}:`);
      for (const c of parsed.enumConstants) {
        const safeConst = toSafePythonName(c);
        lines.push(`    ${safeConst}: str = "${c}"`);
      }
      lines.push("");
      count++;
    } else if (parsed.fields && parsed.fields.length > 0) {
      lines.push("@dataclass");
      lines.push(`class ${safeName}:`);
      for (const f of parsed.fields) {
        const pyType = javaToPythonType(f.rawType);
        const safeFieldName = toSafePythonName(f.name);
        lines.push(`    ${safeFieldName}: Optional[${pyType}] = None`);
      }
      lines.push("");
      count++;
    }
  }

  const content = lines.join("\n");
  fs.writeFileSync(outputPath, content, "utf8");
  return { totalModels: count };
}
