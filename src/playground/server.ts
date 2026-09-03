import * as http from "http";
import * as url from "url";
import { ScannedEndpoint } from "../core/scanner";
import { OpenApiSpec } from "../exporters/openapi";

export interface PlaygroundServerOptions {
  port?: number;
  apis: ScannedEndpoint[];
  openapiSpec: OpenApiSpec;
  baseUrl?: string;
  verbose?: boolean;
}

/**
 * Generates realistic synthetic mock JSON data from an OpenAPI Schema
 */
export function generateMockFromSchema(
  schema: any,
  components: any,
  depth = 0
): any {
  if (!schema || depth > 5) return {};

  if (schema.$ref) {
    const refKey = schema.$ref.replace("#/components/schemas/", "");
    const target = components?.schemas?.[refKey];
    if (target) {
      return generateMockFromSchema(target, components, depth + 1);
    }
    return {};
  }

  if (schema.type === "string") {
    if (schema.format === "date-time") return new Date().toISOString();
    if (schema.format === "email") return "user@example.com";
    if (schema.format === "uri") return "https://example.com/asset.png";
    return schema.example || schema.title || "sample_string";
  }

  if (schema.type === "number" || schema.type === "integer") {
    return schema.example !== undefined ? schema.example : 100;
  }

  if (schema.type === "boolean") {
    return schema.example !== undefined ? schema.example : true;
  }

  if (schema.type === "array") {
    const itemSchema = schema.items || {};
    return [generateMockFromSchema(itemSchema, components, depth + 1)];
  }

  if (schema.type === "object" || schema.properties) {
    const obj: Record<string, any> = {};
    const props = schema.properties || {};
    for (const [propName, propSchema] of Object.entries<any>(props)) {
      obj[propName] = generateMockFromSchema(propSchema, components, depth + 1);
    }
    return obj;
  }

  return {};
}

/**
 * Finds the corresponding OpenAPI operation for an incoming path & method
 */
function findOperation(
  spec: OpenApiSpec,
  reqPath: string,
  reqMethod: string
): { operation?: any; pathPattern?: string } {
  const cleanPath = reqPath.replace(/^\/mock/, "").replace(/^\/+/, "/");
  const normMethod = reqMethod.toLowerCase();

  // 1. Direct path match
  for (const [pattern, methods] of Object.entries<any>(spec.paths || {})) {
    // Convert {param} to regex pattern
    const regexPattern = new RegExp(
      "^" + pattern.replace(/\{[^}]+\}/g, "([^/]+)") + "$"
    );
    if (regexPattern.test(cleanPath)) {
      if (methods[normMethod]) {
        return { operation: methods[normMethod], pathPattern: pattern };
      }
    }
  }

  return {};
}

/**
 * Creates and starts the local zero-dependency API Playground & Mock Server
 */
export function startPlaygroundServer(options: PlaygroundServerOptions): Promise<{
  server: http.Server;
  url: string;
  port: number;
  close: () => Promise<void>;
}> {
  const port = options.port || 3000;
  const spec = options.openapiSpec;

  // Create a copy of the spec configured with local mock server
  const mockSpec = JSON.parse(JSON.stringify(spec));
  mockSpec.servers = [
    {
      url: `http://localhost:${port}/mock`,
      description: "Local Mock API Server (Simulated Live Responses)",
    },
    ...(spec.servers || []),
  ];

  const htmlContent = `<!doctype html>
<html lang="en">
  <head>
    <title>Retrofit API Playground | ${mockSpec.info?.title || "Android SDK"}</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body {
        margin: 0;
        padding: 0;
        background: #0f172a;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      }
      .badge-bar {
        background: #1e293b;
        color: #94a3b8;
        padding: 8px 16px;
        font-size: 13px;
        border-bottom: 1px solid #334155;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .badge-bar strong {
        color: #38bdf8;
      }
      .mock-tag {
        background: #059669;
        color: #ecfdf5;
        padding: 2px 8px;
        border-radius: 9999px;
        font-size: 11px;
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    <div class="badge-bar">
      <div>
        <strong>⚡ Retrofit SDK Playground</strong> &bull; ${options.apis.length} Endpoints &bull; <span class="mock-tag">MOCK ENGINE ACTIVE</span>
      </div>
      <div>
        Local Server: <code>http://localhost:${port}</code>
      </div>
    </div>
    <script
      id="api-reference"
      data-url="/openapi.json"
      data-configuration='{"theme": "deepSpace", "showSidebar": true, "darkMode": true}'
    ></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url || "/", true);
      const pathname = parsedUrl.pathname || "/";
      const method = (req.method || "GET").toUpperCase();

      // Enable CORS for all requests
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD");
      res.setHeader("Access-Control-Allow-Headers", "*");

      if (method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      // Route 1: Serve UI
      if (pathname === "/" || pathname === "/index.html") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(htmlContent);
        return;
      }

      // Route 2: Serve OpenAPI 3.0.3 Spec
      if (pathname === "/openapi.json") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(mockSpec, null, 2));
        return;
      }

      // Route 3: Mock API Engine (/mock/* or fallback matching endpoint routes)
      const { operation, pathPattern } = findOperation(spec, pathname, method);

      if (operation) {
        // Extract 200 response schema
        const successResp =
          operation.responses?.["200"] ||
          operation.responses?.["201"] ||
          operation.responses?.default;

        let mockData: any = { message: "Success", ok: true };
        const contentJson = successResp?.content?.["application/json"];

        if (contentJson?.schema) {
          mockData = generateMockFromSchema(contentJson.schema, spec.components);
        }

        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(mockData, null, 2));
        return;
      }

      // 404 Fallback
      res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
      res.end(
        JSON.stringify({
          error: "Endpoint not found in scanned Retrofit specification",
          path: pathname,
          method,
          suggestion: "Visit http://localhost:" + port + " to explore all available endpoints in the interactive playground.",
        })
      );
    });

    server.listen(port, () => {
      const serverUrl = `http://localhost:${port}`;
      resolve({
        server,
        url: serverUrl,
        port,
        close: () =>
          new Promise((resClose) => {
            server.close(() => resClose());
          }),
      });
    });

    server.on("error", (err) => {
      reject(err);
    });
  });
}
