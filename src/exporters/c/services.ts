import { ScannedEndpoint } from "../../core/scanner";
import { toSnakeCase } from "./models";

export function generateCServicesHeader(endpoints: ScannedEndpoint[]): string {
  const lines: string[] = [
    "#ifndef APP_SERVICES_H",
    "#define APP_SERVICES_H",
    "",
    '#include "client.h"',
    '#include "models.h"',
    "",
    "#ifdef __cplusplus",
    'extern "C" {',
    "#endif",
    "",
  ];

  const usedNames = new Set<string>();

  for (const ep of endpoints) {
    const groupName = ep.interface || ep.module || "general";
    const cleanGroup = toSnakeCase(groupName.replace(/(?:Service|Api|Interface)$/i, ""));
    const baseMethod = toSnakeCase(ep.function || "request");

    let fnName = `app_${cleanGroup}_${baseMethod}`;
    let counter = 1;
    while (usedNames.has(fnName)) {
      fnName = `app_${cleanGroup}_${baseMethod}_${counter++}`;
    }
    usedNames.add(fnName);

    const httpMethod = (ep.method || "GET").toUpperCase();
    lines.push(`/** ${httpMethod} ${ep.endpoint} */`);
    lines.push(`app_response_t* ${fnName}(app_client_t* client, const app_request_opts_t* opts);`);
    lines.push("");
  }

  lines.push("#ifdef __cplusplus");
  lines.push("}");
  lines.push("#endif");
  lines.push("");
  lines.push("#endif // APP_SERVICES_H");
  return lines.join("\n");
}

export function generateCServicesSource(endpoints: ScannedEndpoint[]): string {
  const lines: string[] = [
    '#include "services.h"',
    "#include <stdlib.h>",
    "#include <string.h>",
    "",
  ];

  const usedNames = new Set<string>();

  for (const ep of endpoints) {
    const groupName = ep.interface || ep.module || "general";
    const cleanGroup = toSnakeCase(groupName.replace(/(?:Service|Api|Interface)$/i, ""));
    const baseMethod = toSnakeCase(ep.function || "request");

    let fnName = `app_${cleanGroup}_${baseMethod}`;
    let counter = 1;
    while (usedNames.has(fnName)) {
      fnName = `app_${cleanGroup}_${baseMethod}_${counter++}`;
    }
    usedNames.add(fnName);

    const httpMethod = (ep.method || "GET").toUpperCase();
    lines.push(`app_response_t* ${fnName}(app_client_t* client, const app_request_opts_t* opts) {`);
    lines.push("    app_request_opts_t local_opts = {0};");
    lines.push("    if (opts) local_opts = *opts;");
    lines.push(`    local_opts.method = "${httpMethod}";`);
    lines.push(`    local_opts.endpoint = "${ep.endpoint}";`);
    lines.push("    return app_client_request(client, &local_opts);");
    lines.push("}");
    lines.push("");
  }

  return lines.join("\n");
}
