import { ScannedEndpoint } from "../../core/scanner";
import { toPascalCase } from "./models";

const CSHARP_KEYWORDS = new Set([
  "abstract", "as", "base", "bool", "break", "byte", "case", "catch", "char",
  "checked", "class", "const", "continue", "decimal", "default", "delegate",
  "do", "double", "else", "enum", "event", "explicit", "extern", "false",
  "finally", "fixed", "float", "for", "foreach", "goto", "if", "implicit",
  "in", "int", "interface", "internal", "is", "lock", "long", "namespace",
  "new", "null", "object", "operator", "out", "override", "params", "private",
  "protected", "public", "readonly", "ref", "return", "sbyte", "sealed",
  "short", "sizeof", "stackalloc", "static", "string", "struct", "switch",
  "this", "throw", "true", "try", "typeof", "uint", "ulong", "unchecked",
  "unsafe", "ushort", "using", "virtual", "void", "volatile", "while",
]);

export function toSafeCSharpVar(str: string): string {
  let name = str.replace(/[^a-zA-Z0-9_]/g, "_");
  if (/^[0-9]/.test(name)) name = `_${name}`;
  if (CSHARP_KEYWORDS.has(name) || !name) name = `@${name}`;
  return name;
}

export function generateCSharpServices(endpoints: ScannedEndpoint[]): string {
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
    "using System;",
    "using System.Collections.Generic;",
    "using System.Net.Http;",
    "using System.Threading;",
    "using System.Threading.Tasks;",
    "using App.Sdk.Models;",
    "",
    "namespace App.Sdk",
    "{",
  ];

  for (const [className, eps] of serviceGroups.entries()) {
    lines.push(`    public class ${className}`);
    lines.push("    {");
    lines.push("        private readonly HttpClientWrapper _client;");
    lines.push("");
    lines.push(`        public ${className}(HttpClientWrapper? client = null)`);
    lines.push("        {");
    lines.push("            _client = client ?? GlobalSdk.DefaultClient;");
    lines.push("        }");
    lines.push("");

    const usedNames = new Set<string>();

    for (const ep of eps) {
      let baseMethodName = toPascalCase(ep.function || "Request");
      if (!baseMethodName) baseMethodName = "CallApi";

      let methodName = `${baseMethodName}Async`;
      let counter = 1;
      while (usedNames.has(methodName)) {
        methodName = `${baseMethodName}${counter++}Async`;
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
        params.push(`string ${toSafeCSharpVar(p)}`);
      }
      if (hasPayload) {
        params.push("object? payload = null");
      }
      if (queryParamNames.length > 0) {
        params.push("Dictionary<string, object>? queryParams = null");
      }
      if (hasCustomHeaders) {
        params.push("Dictionary<string, string>? headers = null");
      }
      params.push("CancellationToken cancellationToken = default");

      lines.push(`        /// <summary>${httpMethod} ${ep.endpoint}</summary>`);
      lines.push(`        public async Task<ApiResponse<T>> ${methodName}<T>(${params.join(", ")})`);
      lines.push("        {");

      if (pathParamNames.length > 0) {
        lines.push("            var pathParams = new Dictionary<string, string>");
        lines.push("            {");
        for (const p of pathParamNames) {
          lines.push(`                ["${p}"] = ${toSafeCSharpVar(p)},`);
        }
        lines.push("            };");
      } else {
        lines.push("            Dictionary<string, string>? pathParams = null;");
      }

      const qpArg = queryParamNames.length > 0 ? "queryParams" : "null";
      const hdArg = hasCustomHeaders ? "headers" : "null";
      const pyArg = hasPayload ? "payload" : "null";

      const csMethod = httpMethod.charAt(0) + httpMethod.slice(1).toLowerCase();
      lines.push(`            return await _client.SendAsync<T>(HttpMethod.${csMethod}, "${ep.endpoint}", pathParams, ${qpArg}, ${hdArg}, ${pyArg}, cancellationToken);`);
      lines.push("        }");
      lines.push("");
    }

    lines.push("    }");
    lines.push("");
  }

  lines.push("}");
  return lines.join("\n");
}
