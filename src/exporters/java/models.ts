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

export function cleanJavaType(javaType: string | null | undefined, knownModels?: Set<string>): string {
  if (!javaType) return "Object";
  let t = javaType.trim();

  // Strip annotations & modifiers
  t = t.replace(/@[A-Za-z0-9_.]+(?:\([^)]*\))?\s*/g, "").trim();
  t = t.replace(/\b(public|protected|private|static|final|transient|volatile)\b/g, "").trim();
  t = t.replace(/\?\s+extends\s+/g, "").replace(/\?\s+super\s+/g, "");

  // Single-letter generic type variables
  if (/^[A-Za-z]$/.test(t)) {
    return "Object";
  }

  if (t.endsWith("[]")) {
    const inner = t.slice(0, -2).trim();
    return `List<${cleanJavaType(inner, knownModels)}>`;
  }

  const lower = t.toLowerCase();
  if (["string", "charsequence", "char"].includes(lower)) return "String";
  if (["int", "integer", "short", "byte"].includes(lower)) return "Integer";
  if (["long"].includes(lower)) return "Long";
  if (["double"].includes(lower)) return "Double";
  if (["float", "number", "bigdecimal"].includes(lower)) return "Float";
  if (["boolean", "bool"].includes(lower)) return "Boolean";
  if (["void", "unit"].includes(lower)) return "Void";
  if (["jsonobject", "object", "any"].includes(lower)) return "Map<String, Object>";
  if (["list", "arraylist", "collection", "set"].includes(lower)) return "List<Object>";
  if (["map", "hashmap"].includes(lower)) return "Map<String, Object>";
  if (["throwable", "exception", "error", "stacktraceelement"].includes(lower)) return "Object";

  // Generic wrappers
  const wrapperMatch = t.match(/^(?:Lazy|Response|Observable|Single|Flowable|Flow|Deferred)<(.+)>$/i);
  if (wrapperMatch) {
    return cleanJavaType(wrapperMatch[1].trim(), knownModels);
  }

  // Collections
  const listMatch = t.match(/^(?:List|ArrayList|Set|Collection)<(.+)>$/);
  if (listMatch) {
    return `List<${cleanJavaType(listMatch[1].trim(), knownModels)}>`;
  }

  const mapMatch = t.match(/^(?:Map|HashMap|LinkedHashMap)<(.+),\s*(.+)>$/);
  if (mapMatch) {
    return `Map<String, ${cleanJavaType(mapMatch[2].trim(), knownModels)}>`;
  }

  const safe = toPascalCase(sanitizeTypeName(t));
  if (knownModels && knownModels.has(safe)) {
    return safe;
  }
  return "Object";
}

export function generateJavaModels(dtoResult: DtoExtractionResult, outputPath: string): { totalModels: number } {
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
    "package com.app.sdk;",
    "",
    "import java.util.List;",
    "import java.util.Map;",
    "",
    "// Auto-generated Java Data Models",
    "public final class Models {",
    "    private Models() {}",
    "",
  ];

  let count = 0;
  for (const [modelName, parsed] of dtoResult.models.entries()) {
    const safeClassName = toPascalCase(sanitizeTypeName(modelName));
    if (parsed.isEnum && parsed.enumConstants && parsed.enumConstants.length > 0) {
      lines.push(`    public enum ${safeClassName} {`);
      const safeConstants: string[] = [];
      const usedConstants = new Set<string>();
      for (const c of parsed.enumConstants) {
        let constName = c.replace(/[^A-Za-z0-9_]/g, "_");
        if (/^[0-9]/.test(constName) || !constName) constName = `VAL_${constName}`;
        let counter = 1;
        while (usedConstants.has(constName)) {
          constName = `${constName}_${counter++}`;
        }
        usedConstants.add(constName);
        safeConstants.push(constName);
      }
      lines.push(`        ${safeConstants.join(", ")};`);
      lines.push("    }");
      lines.push("");
      count++;
    } else if (parsed.fields && parsed.fields.length > 0) {
      lines.push(`    public static class ${safeClassName} {`);
      const usedFields = new Set<string>();
      const usedGetters = new Set<string>();
      const usedSetters = new Set<string>();

      for (const f of parsed.fields) {
        const jType = cleanJavaType(f.rawType, emittedModels);
        let fieldName = f.name.replace(/[^A-Za-z0-9_]/g, "_");
        if (/^[0-9]/.test(fieldName) || !fieldName) fieldName = `field_${fieldName}`;
        let counter = 1;
        while (usedFields.has(fieldName)) {
          fieldName = `${f.name.replace(/[^A-Za-z0-9_]/g, "_")}_${counter++}`;
        }
        usedFields.add(fieldName);

        const capName = toPascalCase(fieldName);
        let getterName = `get${capName}`;
        let setterName = `set${capName}`;
        counter = 1;
        while (usedGetters.has(getterName)) {
          getterName = `get${capName}_${counter++}`;
        }
        usedGetters.add(getterName);
        counter = 1;
        while (usedSetters.has(setterName)) {
          setterName = `set${capName}_${counter++}`;
        }
        usedSetters.add(setterName);

        lines.push(`        private ${jType} ${fieldName};`);
        lines.push(`        public ${jType} ${getterName}() { return this.${fieldName}; }`);
        lines.push(`        public void ${setterName}(${jType} ${fieldName}) { this.${fieldName} = ${fieldName}; }`);
      }
      lines.push("    }");
      lines.push("");
      count++;
    }
  }

  lines.push("}");
  fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
  return { totalModels: count };
}
