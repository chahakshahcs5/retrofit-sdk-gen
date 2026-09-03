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

const CPP_KEYWORDS = new Set([
  "alignas", "alignof", "and", "and_eq", "asm", "auto", "bitand", "bitor", "bool", "break", "case", "catch",
  "char", "class", "compl", "const", "constexpr", "const_cast", "continue", "decltype", "default", "delete", "do",
  "double", "dynamic_cast", "else", "enum", "explicit", "export", "extern", "false", "float", "for", "friend", "goto",
  "if", "inline", "int", "long", "mutable", "namespace", "new", "noexcept", "not", "not_eq", "nullptr", "operator",
  "or", "or_eq", "private", "protected", "public", "register", "reinterpret_cast", "return", "short", "signed",
  "sizeof", "static", "static_assert", "static_cast", "struct", "switch", "template", "this", "thread_local", "throw",
  "true", "try", "typedef", "typeid", "typename", "union", "unsigned", "using", "virtual", "void", "volatile",
  "while", "xor", "xor_eq",
]);

export function javaToCppType(javaType: string | null | undefined, knownModels?: Set<string>): string {
  if (!javaType) return "std::string";
  let t = javaType.trim();

  // Strip annotations & modifiers
  t = t.replace(/@[A-Za-z0-9_.]+(?:\([^)]*\))?\s*/g, "").trim();
  t = t.replace(/\b(public|protected|private|static|final|transient|volatile)\b/g, "").trim();
  t = t.replace(/\?\s+extends\s+/g, "").replace(/\?\s+super\s+/g, "");

  // Single-letter generic type variables
  if (/^[A-Za-z]$/.test(t)) {
    return "std::string";
  }

  if (t.endsWith("[]")) {
    const inner = t.slice(0, -2).trim();
    return `std::vector<${javaToCppType(inner, knownModels)}>`;
  }

  const lower = t.toLowerCase();
  if (["string", "charsequence", "char"].includes(lower)) return "std::string";
  if (["int", "integer", "short", "byte"].includes(lower)) return "int";
  if (["long"].includes(lower)) return "int64_t";
  if (["double"].includes(lower)) return "double";
  if (["float", "number", "bigdecimal"].includes(lower)) return "float";
  if (["boolean", "bool"].includes(lower)) return "bool";
  if (["void", "unit"].includes(lower)) return "void";
  if (["jsonobject", "object", "any"].includes(lower)) return "std::string";
  if (["list", "arraylist", "collection", "set"].includes(lower)) return "std::vector<std::string>";
  if (["map", "hashmap"].includes(lower)) return "std::unordered_map<std::string, std::string>";
  if (["throwable", "exception", "error", "stacktraceelement"].includes(lower)) return "std::string";

  // Generic wrappers
  const wrapperMatch = t.match(/^(?:Lazy|Response|Observable|Single|Flowable|Flow|Deferred)<(.+)>$/i);
  if (wrapperMatch) {
    return javaToCppType(wrapperMatch[1].trim(), knownModels);
  }

  // Lists
  const listMatch = t.match(/^(?:List|ArrayList|Set|Collection)<(.+)>$/);
  if (listMatch) {
    return `std::vector<${javaToCppType(listMatch[1].trim(), knownModels)}>`;
  }

  // Maps
  const mapMatch = t.match(/^(?:Map|HashMap|LinkedHashMap)<(.+),\s*(.+)>$/);
  if (mapMatch) {
    return `std::unordered_map<std::string, ${javaToCppType(mapMatch[2].trim(), knownModels)}>`;
  }

  const safe = toPascalCase(sanitizeTypeName(t));
  if (knownModels && knownModels.has(safe)) {
    return safe;
  }
  return "std::string";
}

export function generateCppModels(dtoResult: DtoExtractionResult, outputPath: string): { totalModels: number } {
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
    "#pragma once",
    "",
    "// Auto-generated C++17 Data Models",
    "#include <string>",
    "#include <vector>",
    "#include <optional>",
    "#include <memory>",
    "#include <unordered_map>",
    "#include <cstdint>",
    "",
    "namespace app {",
    "namespace models {",
    "",
  ];

  // Forward declarations
  for (const modelName of emittedModels) {
    lines.push(`struct ${modelName};`);
  }
  lines.push("");

  let count = 0;
  for (const [modelName, parsed] of dtoResult.models.entries()) {
    const safeStructName = toPascalCase(sanitizeTypeName(modelName));
    if (parsed.isEnum && parsed.enumConstants && parsed.enumConstants.length > 0) {
      lines.push(`enum class ${safeStructName} {`);
      const usedConstants = new Set<string>();
      for (const c of parsed.enumConstants) {
        let constName = toPascalCase(c);
        let counter = 1;
        while (usedConstants.has(constName)) {
          constName = `${toPascalCase(c)}_${counter++}`;
        }
        usedConstants.add(constName);
        lines.push(`    ${constName},`);
      }
      lines.push("};");
      lines.push("");
      count++;
    } else if (parsed.fields && parsed.fields.length > 0) {
      lines.push(`struct ${safeStructName} {`);
      const usedFields = new Set<string>();

      for (const f of parsed.fields) {
        const cppType = javaToCppType(f.rawType, emittedModels);
        let fieldName = toSnakeCase(f.name);
        if (/^[0-9]/.test(fieldName) || !fieldName) fieldName = `f_${fieldName}`;
        if (CPP_KEYWORDS.has(fieldName)) {
          fieldName = `${fieldName}_val`;
        }
        let counter = 1;
        while (usedFields.has(fieldName)) {
          fieldName = `${toSnakeCase(f.name)}_${counter++}`;
        }
        usedFields.add(fieldName);

        if (cppType === "void") {
          continue;
        }

        // Use std::shared_ptr for forward-declared structs, std::optional for value types
        if (emittedModels.has(cppType)) {
          lines.push(`    std::shared_ptr<${cppType}> ${fieldName};`);
        } else {
          lines.push(`    std::optional<${cppType}> ${fieldName};`);
        }
      }
      lines.push("};");
      lines.push("");
      count++;
    }
  }

  lines.push("} // namespace models");
  lines.push("} // namespace app");
  fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
  return { totalModels: count };
}
