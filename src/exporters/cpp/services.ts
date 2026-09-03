import { ScannedEndpoint } from "../../core/scanner";
import { toSnakeCase } from "./models";

export function generateCppServices(endpoints: ScannedEndpoint[]): string {
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
    "#pragma once",
    "",
    '#include "client.hpp"',
    '#include "models.hpp"',
    "#include <string>",
    "#include <unordered_map>",
    "",
    "namespace app {",
    "",
  ];

  for (const [className, eps] of serviceGroups.entries()) {
    lines.push(`class ${className} {`);
    lines.push("private:");
    lines.push("    const Client& client_;");
    lines.push("public:");
    lines.push(`    explicit ${className}(const Client& client = Client::get_default())`);
    lines.push("        : client_(client) {}");
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

      const params: string[] = [];
      for (const p of pathParamNames) {
        params.push(`const std::string& ${toSnakeCase(p)}`);
      }
      if (hasPayload) {
        params.push("const std::string& payload = \"\"");
      }
      if (queryParamNames.length > 0) {
        params.push("const std::unordered_map<std::string, std::string>& query_params = {}");
      }
      if (hasCustomHeaders) {
        params.push("const std::unordered_map<std::string, std::string>& headers = {}");
      }

      lines.push(`    /// ${httpMethod} ${ep.endpoint}`);
      lines.push(`    ApiResponse ${methodName}(${params.join(", ")}) const {`);
      lines.push("        RequestOptions opts;");
      lines.push(`        opts.method = "${httpMethod}";`);
      lines.push(`        opts.endpoint = "${ep.endpoint}";`);

      for (const p of pathParamNames) {
        lines.push(`        opts.path_params["${p}"] = ${toSnakeCase(p)};`);
      }
      if (queryParamNames.length > 0) {
        lines.push("        opts.query_params = query_params;");
      }
      if (hasCustomHeaders) {
        lines.push("        opts.headers = headers;");
      }
      if (hasPayload) {
        lines.push("        opts.payload = payload;");
      }

      lines.push("        return client_.request(opts);");
      lines.push("    }");
      lines.push("");
    }

    lines.push("};");
    lines.push("");
  }

  lines.push("} // namespace app");
  return lines.join("\n");
}
