import { ScannedEndpoint } from "../../core/scanner";
import { toPascalCase } from "./models";

const GO_KEYWORDS = new Set([
  "break", "default", "func", "interface", "select",
  "case", "defer", "go", "map", "struct",
  "chan", "else", "goto", "package", "switch",
  "const", "fallthrough", "if", "range", "type",
  "continue", "for", "import", "return", "var",
]);

export function toSafeGoVar(str: string): string {
  let name = str.replace(/[^a-zA-Z0-9_]/g, "_");
  if (/^[0-9]/.test(name)) name = `_${name}`;
  if (GO_KEYWORDS.has(name) || !name) name = `${name}Val`;
  return name;
}

export function generateGoServices(endpoints: ScannedEndpoint[]): string {
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
    "package sdk",
    "",
    "import (",
    '    "context"',
    ")",
    "",
  ];

  for (const [structName, eps] of serviceGroups.entries()) {
    lines.push(`// ${structName} provides access to ${eps.length} API endpoints.`);
    lines.push(`type ${structName} struct {`);
    lines.push("    Client *Client");
    lines.push("}");
    lines.push("");
    lines.push(`// New${structName} initializes a new ${structName}`);
    lines.push(`func New${structName}(client *Client) *${structName} {`);
    lines.push(`    return &${structName}{Client: client}`);
    lines.push("}");
    lines.push("");

    const usedNames = new Set<string>();

    for (const ep of eps) {
      let baseMethodName = toPascalCase(ep.function || "Request");
      if (!baseMethodName) baseMethodName = "CallApi";

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

      const params: string[] = ["ctx context.Context"];
      for (const p of pathParamNames) {
        params.push(`${toSafeGoVar(p)} string`);
      }
      if (hasPayload) {
        params.push("payload interface{}");
      }
      if (queryParamNames.length > 0) {
        params.push("queryParams map[string]interface{}");
      }
      if (hasCustomHeaders) {
        params.push("headers map[string]string");
      }

      lines.push(`// ${methodName}: ${httpMethod} ${ep.endpoint}`);
      lines.push(`func (s *${structName}) ${methodName}(${params.join(", ")}) (*ApiResponse, error) {`);

      if (pathParamNames.length > 0) {
        lines.push("    pathParams := map[string]string{");
        for (const p of pathParamNames) {
          lines.push(`        "${p}": ${toSafeGoVar(p)},`);
        }
        lines.push("    }");
      } else {
        lines.push("    var pathParams map[string]string = nil");
      }

      const qpArg = queryParamNames.length > 0 ? "queryParams" : "nil";
      const hdArg = hasCustomHeaders ? "headers" : "nil";
      const pyArg = hasPayload ? "payload" : "nil";

      lines.push(`    return s.Client.DoRequest(ctx, "${httpMethod}", "${ep.endpoint}", pathParams, ${qpArg}, ${hdArg}, ${pyArg})`);
      lines.push("}");
      lines.push("");
    }
  }

  return lines.join("\n");
}
