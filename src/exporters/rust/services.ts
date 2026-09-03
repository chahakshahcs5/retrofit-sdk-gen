import { ScannedEndpoint } from "../../core/scanner";
import { toPascalCase, toSnakeCase } from "./models";

const RUST_KEYWORDS = new Set([
  "as", "break", "const", "continue", "crate", "else", "enum", "extern",
  "false", "fn", "for", "if", "impl", "in", "let", "loop", "match", "mod",
  "move", "mut", "pub", "ref", "return", "self", "Self", "static", "struct",
  "super", "trait", "true", "type", "unsafe", "use", "where", "while",
  "async", "await", "dyn", "abstract", "become", "box", "do", "final", "macro",
  "override", "priv", "typeof", "unsized", "virtual", "yield", "try",
]);

export function toSafeRustVar(str: string): string {
  let name = toSnakeCase(str);
  if (/^[0-9]/.test(name)) name = `_${name}`;
  if (RUST_KEYWORDS.has(name) || !name) name = `r#${name}`;
  return name;
}

export function generateRustServices(endpoints: ScannedEndpoint[]): string {
  const serviceGroups = new Map<string, ScannedEndpoint[]>();

  for (const ep of endpoints) {
    const groupName = ep.interface || ep.module || "General";
    const cleanGroup = groupName
      .replace(/[^a-zA-Z0-9_]/g, "")
      .replace(/(?:Service|Api|Interface)$/i, "");
    const structName = cleanGroup ? `${cleanGroup}Service` : "GeneralService";

    if (!serviceGroups.has(structName)) {
      serviceGroups.set(structName, []);
    }
    serviceGroups.get(structName)!.push(ep);
  }

  const lines: string[] = [
    "use crate::client::Client;",
    "use reqwest::header::HeaderMap;",
    "use std::collections::HashMap;",
    "",
  ];

  for (const [structName, eps] of serviceGroups.entries()) {
    lines.push(`/// Service for ${structName} containing ${eps.length} endpoints`);
    lines.push(`pub struct ${structName};`);
    lines.push("");
    lines.push(`impl ${structName} {`);

    const usedNames = new Set<string>();

    for (const ep of eps) {
      let baseMethodName = toSnakeCase(ep.function || "request");
      if (!baseMethodName || baseMethodName === "_") baseMethodName = "call_api";

      let methodName = baseMethodName;
      let counter = 1;
      while (usedNames.has(methodName)) {
        methodName = `${baseMethodName}_${counter++}`;
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

      const params: string[] = ["client: &Client"];
      for (const p of pathParamNames) {
        params.push(`${toSafeRustVar(p)}: &str`);
      }
      if (hasPayload) {
        params.push("payload: Option<&serde_json::Value>");
      }
      if (queryParamNames.length > 0) {
        params.push("query_params: Option<&HashMap<&str, &str>>");
      }
      if (hasCustomHeaders) {
        params.push("custom_headers: Option<&HeaderMap>");
      }

      lines.push(`    /// ${httpMethod} ${ep.endpoint}`);
      lines.push(`    pub async fn ${methodName}(`);
      for (const p of params) {
        lines.push(`        ${p},`);
      }
      lines.push("    ) -> Result<reqwest::Response, reqwest::Error> {");

      if (pathParamNames.length > 0) {
        lines.push("        let mut path_params = HashMap::new();");
        for (const p of pathParamNames) {
          lines.push(`        path_params.insert("${p}", ${toSafeRustVar(p)});`);
        }
        lines.push("        let pp_arg = Some(&path_params);");
      } else {
        lines.push("        let pp_arg = None;");
      }

      const qpArg = queryParamNames.length > 0 ? "query_params" : "None";
      const hdArg = hasCustomHeaders ? "custom_headers" : "None";
      const pyArg = hasPayload ? "payload" : "None";

      lines.push(`        client.send_request(`);
      lines.push(`            reqwest::Method::${httpMethod},`);
      lines.push(`            "${ep.endpoint}",`);
      lines.push(`            pp_arg,`);
      lines.push(`            ${qpArg},`);
      lines.push(`            ${hdArg},`);
      lines.push(`            ${pyArg},`);
      lines.push("        ).await");
      lines.push("    }");
      lines.push("");
    }

    lines.push("}");
    lines.push("");
  }

  return lines.join("\n");
}
