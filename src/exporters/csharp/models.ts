import * as fs from "fs";
import { DtoExtractionResult, sanitizeTypeName } from "../../core/dto-extractor";

export function toPascalCase(str: string): string {
  let res = str
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .split("_")
    .map((s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : ""))
    .join("");
  if (/^[0-9]/.test(res)) {
    res = `Prop${res}`;
  }
  return res || "Prop";
}

export function javaToCSharpType(javaType: string | null | undefined, knownModels?: Set<string>): string {
  if (!javaType) return "object";
  let t = javaType.trim();

  // Strip annotations & modifiers
  t = t.replace(/@[A-Za-z0-9_.]+(?:\([^)]*\))?\s*/g, "").trim();
  t = t.replace(/\b(public|protected|private|static|final|transient|volatile)\b/g, "").trim();
  t = t.replace(/\?\s+extends\s+/g, "").replace(/\?\s+super\s+/g, "");

  // Single-letter generic type variables
  if (/^[A-Za-z]$/.test(t)) {
    return "object";
  }

  if (t.endsWith("[]")) {
    const inner = t.slice(0, -2).trim();
    return `List<${javaToCSharpType(inner, knownModels)}>`;
  }

  const lower = t.toLowerCase();
  if (["string", "charsequence", "char"].includes(lower)) return "string";
  if (["int", "integer", "short", "byte"].includes(lower)) return "int";
  if (["long"].includes(lower)) return "long";
  if (["double"].includes(lower)) return "double";
  if (["float", "number", "bigdecimal"].includes(lower)) return "float";
  if (["boolean", "bool"].includes(lower)) return "bool";
  if (["void", "unit"].includes(lower)) return "object";
  if (["jsonobject", "object", "any"].includes(lower)) return "Dictionary<string, object>";
  if (["list", "arraylist", "collection", "set"].includes(lower)) return "List<object>";
  if (["map", "hashmap"].includes(lower)) return "Dictionary<string, object>";
  if (["throwable", "exception", "error", "stacktraceelement"].includes(lower)) return "object";

  // Generic wrappers
  const wrapperMatch = t.match(/^(?:Lazy|Response|Observable|Single|Flowable|Flow|Deferred)<(.+)>$/i);
  if (wrapperMatch) {
    return javaToCSharpType(wrapperMatch[1].trim(), knownModels);
  }

  // Lists
  const listMatch = t.match(/^(?:List|ArrayList|Set|Collection)<(.+)>$/);
  if (listMatch) {
    return `List<${javaToCSharpType(listMatch[1].trim(), knownModels)}>`;
  }

  // Maps
  const mapMatch = t.match(/^(?:Map|HashMap|LinkedHashMap)<(.+),\s*(.+)>$/);
  if (mapMatch) {
    return `Dictionary<string, ${javaToCSharpType(mapMatch[2].trim(), knownModels)}>`;
  }

  const safe = toPascalCase(sanitizeTypeName(t));
  if (knownModels && knownModels.has(safe)) {
    return safe;
  }
  return "object";
}

export function generateCSharpModels(dtoResult: DtoExtractionResult, outputPath: string): { totalModels: number } {
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
    "// Auto-generated C# Data Models",
    "using System;",
    "using System.Collections.Generic;",
    "using System.Text.Json.Serialization;",
    "",
    "namespace App.Sdk.Models",
    "{",
  ];

  let count = 0;
  for (const [modelName, parsed] of dtoResult.models.entries()) {
    const safeRecordName = toPascalCase(sanitizeTypeName(modelName));
    if (parsed.isEnum && parsed.enumConstants && parsed.enumConstants.length > 0) {
      lines.push(`    public enum ${safeRecordName}`);
      lines.push("    {");
      const usedConstants = new Set<string>();
      for (const c of parsed.enumConstants) {
        let constName = toPascalCase(c);
        let counter = 1;
        while (usedConstants.has(constName)) {
          constName = `${toPascalCase(c)}${counter++}`;
        }
        usedConstants.add(constName);
        lines.push(`        [JsonPropertyName("${c}")]`);
        lines.push(`        ${constName},`);
      }
      lines.push("    }");
      lines.push("");
      count++;
    } else if (parsed.fields && parsed.fields.length > 0) {
      lines.push(`    public class ${safeRecordName}`);
      lines.push("    {");
      const usedProps = new Set<string>();
      for (const f of parsed.fields) {
        const csType = javaToCSharpType(f.rawType, emittedModels);
        let propName = toPascalCase(f.name);
        if (propName === safeRecordName) {
          propName = `${propName}Value`;
        }
        let counter = 1;
        while (usedProps.has(propName)) {
          propName = `${toPascalCase(f.name)}${counter++}`;
        }
        usedProps.add(propName);

        lines.push(`        [JsonPropertyName("${f.name}")]`);
        lines.push(`        public ${csType}? ${propName} { get; set; }`);
        lines.push("");
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
