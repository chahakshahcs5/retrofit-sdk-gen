import { ScannedEndpoint } from "../core/scanner";

export interface PostmanOptions {
  name?: string;
  baseUrl?: string;
  description?: string;
}

export interface PostmanCollection {
  info: {
    name: string;
    _postman_id?: string;
    description: string;
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json";
  };
  variable: { key: string; value: string; type: string }[];
  item: PostmanFolder[];
}

export interface PostmanFolder {
  name: string;
  item: PostmanItem[];
}

export interface PostmanItem {
  name: string;
  request: {
    method: string;
    header: { key: string; value: string; type?: string; description?: string }[];
    body?: {
      mode: "raw" | "urlencoded" | "formdata";
      raw?: string;
      options?: { raw?: { language?: string } };
      urlencoded?: { key: string; value: string; type: string }[];
      formdata?: { key: string; value: string; type: string }[];
    };
    url: {
      raw: string;
      host: string[];
      path: string[];
      query?: { key: string; value: string; description?: string }[];
      variable?: { key: string; value: string; description?: string }[];
    };
    description?: string;
  };
}

/**
 * Generates a Postman Collection v2.1 from scanned Retrofit endpoints
 */
export function generatePostmanCollection(
  endpoints: ScannedEndpoint[],
  options: PostmanOptions = {}
): PostmanCollection {
  const collectionName = options.name || "App API Endpoints (Generated from Retrofit)";
  const baseUrl = options.baseUrl || "https://api.example.com";

  // Group endpoints by service interface
  const serviceGroups: Record<string, ScannedEndpoint[]> = {};
  for (const ep of endpoints) {
    const serviceName = ep.interface || "CommonService";
    if (!serviceGroups[serviceName]) serviceGroups[serviceName] = [];
    serviceGroups[serviceName].push(ep);
  }

  const folders: PostmanFolder[] = [];

  for (const [serviceName, eps] of Object.entries(serviceGroups).sort(([a], [b]) => a.localeCompare(b))) {
    const items: PostmanItem[] = [];

    for (const ep of eps) {
      const cleanEndpoint = ep.endpoint.replace(/^\//, "");
      const pathSegments = cleanEndpoint.split("/").map((seg) => {
        // Convert {param} to :param for Postman path variables
        return seg.startsWith("{") && seg.endsWith("}") ? `:${seg.slice(1, -1)}` : seg;
      });

      const rawUrl = `{{baseUrl}}/${pathSegments.join("/")}`;

      // Headers
      const headers: { key: string; value: string; type?: string; description?: string }[] = [];
      if (ep.staticHeaders) {
        for (const [k, v] of Object.entries(ep.staticHeaders)) {
          headers.push({ key: k, value: v, type: "text", description: "Static Header" });
        }
      }
      if (ep.headers) {
        for (const h of ep.headers) {
          headers.push({ key: h, value: `{{${h}}}`, type: "text", description: "Dynamic Header" });
        }
      }

      // Query params
      const queryList: { key: string; value: string; description?: string }[] = [];
      if (ep.queryParams) {
        if (Array.isArray(ep.queryParams)) {
          for (const q of ep.queryParams) {
            queryList.push({ key: q, value: "", description: "Query Parameter" });
          }
        } else {
          for (const [q, t] of Object.entries(ep.queryParams)) {
            queryList.push({ key: q, value: "", description: `Type: ${t}` });
          }
        }
      }

      // Path variables
      const pathVars: { key: string; value: string; description?: string }[] = [];
      if (ep.pathParams) {
        for (const p of ep.pathParams) {
          pathVars.push({ key: p, value: `1`, description: "Path Parameter" });
        }
      }

      // Body
      let body: PostmanItem["request"]["body"] = undefined;
      if (ep.requestBodyType === "FormUrlEncoded") {
        const urlencoded: { key: string; value: string; type: string }[] = [];
        if (ep.fields) {
          for (const f of Object.keys(ep.fields)) {
            urlencoded.push({ key: f, value: "", type: "text" });
          }
        }
        body = { mode: "urlencoded", urlencoded };
        headers.push({ key: "Content-Type", value: "application/x-www-form-urlencoded" });
      } else if (ep.requestBodyType === "Multipart") {
        const formdata: { key: string; value: string; type: string }[] = [];
        if (ep.parts) {
          for (const [p, t] of Object.entries(ep.parts)) {
            formdata.push({ key: p, value: "", type: t.includes("File") ? "file" : "text" });
          }
        }
        body = { mode: "formdata", formdata };
      } else if (ep.requestBodyType) {
        headers.push({ key: "Content-Type", value: "application/json" });
        body = {
          mode: "raw",
          raw: JSON.stringify({ message: "sample payload", type: ep.requestBodyType }, null, 2),
          options: { raw: { language: "json" } },
        };
      }

      items.push({
        name: `${ep.method} ${ep.endpoint}`,
        request: {
          method: ep.method.toUpperCase(),
          header: headers,
          body,
          url: {
            raw: rawUrl,
            host: ["{{baseUrl}}"],
            path: pathSegments,
            query: queryList.length > 0 ? queryList : undefined,
            variable: pathVars.length > 0 ? pathVars : undefined,
          },
          description: `Retrofit Interface: ${ep.interface}\nFunction: ${ep.function || ""}\nSource: ${ep.file}`,
        },
      });
    }

    folders.push({
      name: serviceName,
      item: items,
    });
  }

  return {
    info: {
      name: collectionName,
      description:
        options.description ||
        `Auto-generated Postman Collection from Android Retrofit decompiled interfaces (${endpoints.length} endpoints).`,
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    variable: [
      {
        key: "baseUrl",
        value: baseUrl,
        type: "string",
      },
    ],
    item: folders,
  };
}
