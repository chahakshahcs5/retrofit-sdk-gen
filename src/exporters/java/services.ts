import { ScannedEndpoint } from "../../core/scanner";
import { toPascalCase } from "./models";

const JAVA_KEYWORDS = new Set([
  "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char",
  "class", "const", "continue", "default", "do", "double", "else", "enum",
  "extends", "final", "finally", "float", "for", "goto", "if", "implements",
  "import", "instanceof", "int", "interface", "long", "native", "new",
  "package", "private", "protected", "public", "return", "short", "static",
  "strictfp", "super", "switch", "synchronized", "this", "throw", "throws",
  "transient", "try", "void", "volatile", "while", "true", "false", "null",
]);

export function toSafeJavaVar(str: string): string {
  let name = str.replace(/[^a-zA-Z0-9_]/g, "_");
  if (/^[0-9]/.test(name)) name = `_${name}`;
  if (JAVA_KEYWORDS.has(name) || !name) name = `${name}Val`;
  return name;
}

export function generateJavaServices(endpoints: ScannedEndpoint[]): string {
  const serviceGroups = new Map<string, ScannedEndpoint[]>();

  for (const ep of endpoints) {
    const groupName = ep.interface || ep.module || "General";
    const cleanGroup = groupName
      .replace(/[^a-zA-Z0-9_]/g, "")
      .replace(/(?:Service|Api|Interface)$/i, "");
    const className = cleanGroup ? `${cleanGroup}Service` : "GeneralService";

    if (!serviceGroups.has(className)) {
      serviceGroups.set(className, []);
    }
    serviceGroups.get(className)!.push(ep);
  }

  const lines: string[] = [
    "package com.app.sdk;",
    "",
    "import java.util.HashMap;",
    "import java.util.Map;",
    "",
    "public final class Services {",
    "    private Services() {}",
    "",
  ];

  for (const [className, eps] of serviceGroups.entries()) {
    lines.push(`    public static class ${className} {`);
    lines.push("        private final Client client;");
    lines.push("");
    lines.push(`        public ${className}(Client client) {`);
    lines.push("            this.client = client != null ? client : new Client();");
    lines.push("        }");
    lines.push("");
    lines.push(`        public ${className}() {`);
    lines.push("            this(new Client());");
    lines.push("        }");
    lines.push("");

    const usedNames = new Set<string>();

    for (const ep of eps) {
      let baseMethodName = ep.function || "request";
      if (!baseMethodName) baseMethodName = "callApi";

      let methodName = baseMethodName;
      let counter = 1;
      while (usedNames.has(methodName)) {
        methodName = `${baseMethodName}${counter++}`;
      }
      usedNames.add(methodName);

      const pathParamNames = ep.pathParams || [];
      const queryParamNames = ep.queryParams
        ? Array.isArray(ep.queryParams)
          ? ep.queryParams
          : Object.keys(ep.queryParams)
        : [];
      const httpMethod = (ep.method || "GET").toUpperCase();
      const hasPayload = ["POST", "PUT", "PATCH"].includes(httpMethod);
      const hasCustomHeaders = (ep.headers && ep.headers.length > 0) || ep.hasHeaderMap;

      const params: string[] = [];
      for (const p of pathParamNames) {
        params.push(`String ${toSafeJavaVar(p)}`);
      }
      if (hasPayload) {
        params.push("String payload");
      }
      if (queryParamNames.length > 0) {
        params.push("Map<String, Object> queryParams");
      }
      if (hasCustomHeaders) {
        params.push("Map<String, String> headers");
      }

      lines.push(`        /** ${httpMethod} ${ep.endpoint} */`);
      lines.push(`        public ApiResponse<String> ${methodName}(${params.join(", ")}) {`);

      if (pathParamNames.length > 0) {
        lines.push("            Map<String, String> pathParams = new HashMap<>();");
        for (const p of pathParamNames) {
          lines.push(`            pathParams.put("${p}", ${toSafeJavaVar(p)});`);
        }
      } else {
        lines.push("            Map<String, String> pathParams = null;");
      }

      const qpArg = queryParamNames.length > 0 ? "queryParams" : "null";
      const hdArg = hasCustomHeaders ? "headers" : "null";
      const pyArg = hasPayload ? "payload" : "null";

      lines.push(`            return this.client.send("${httpMethod}", "${ep.endpoint}", pathParams, ${qpArg}, ${hdArg}, ${pyArg});`);
      lines.push("        }");
      lines.push("");
    }

    lines.push("    }");
    lines.push("");
  }

  lines.push("}");
  return lines.join("\n");
}
