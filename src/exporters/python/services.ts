import { ScannedEndpoint } from "../../core/scanner";
import { toSafePythonName } from "./models";

export function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9_]+/g, "_")
    .toLowerCase();
}

export function generatePythonServices(endpoints: ScannedEndpoint[]): string {
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
    "from typing import Optional, Dict, Any, List",
    "from .client import HttpClient, ApiResponse, default_client",
    "from . import models",
    "",
  ];

  for (const [className, eps] of serviceGroups.entries()) {
    lines.push(`class ${className}:`);
    lines.push(`    """Auto-generated API service with ${eps.length} endpoints."""`);
    lines.push("");

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

      const args: string[] = [];
      for (const p of pathParamNames) {
        args.push(`${toSafePythonName(p)}: Any`);
      }
      if (hasPayload) {
        args.push("payload: Optional[Any] = None");
      }
      if (queryParamNames.length > 0) {
        for (const q of queryParamNames) {
          args.push(`${toSafePythonName(q)}: Optional[Any] = None`);
        }
      }
      if (hasCustomHeaders) {
        args.push("headers: Optional[Dict[str, str]] = None");
      }
      args.push("client: Optional[HttpClient] = None");

      lines.push(`    @staticmethod`);
      lines.push(`    def ${methodName}(`);
      for (const a of args) {
        lines.push(`        ${a},`);
      }
      lines.push(`    ) -> ApiResponse[Any]:`);

      lines.push(`        """${httpMethod} ${ep.endpoint}"""`);
      lines.push(`        http = client or default_client`);

      if (pathParamNames.length > 0) {
        lines.push("        path_params = {");
        for (const p of pathParamNames) {
          lines.push(`            "${p}": ${toSafePythonName(p)},`);
        }
        lines.push("        }");
      } else {
        lines.push("        path_params = None");
      }

      if (queryParamNames.length > 0) {
        lines.push("        query_params = {");
        for (const q of queryParamNames) {
          lines.push(`            "${q}": ${toSafePythonName(q)},`);
        }
        lines.push("        }");
      } else {
        lines.push("        query_params = None");
      }

      lines.push("        return http.request(");
      lines.push(`            method="${httpMethod}",`);
      lines.push(`            endpoint="${ep.endpoint}",`);
      lines.push("            path_params=path_params,");
      lines.push("            query_params=query_params,");
      lines.push(`            headers=${hasCustomHeaders ? "headers" : "None"},`);
      lines.push(`            payload=${hasPayload ? "payload" : "None"},`);
      lines.push("        )");
      lines.push("");
    }
  }

  return lines.join("\n");
}
