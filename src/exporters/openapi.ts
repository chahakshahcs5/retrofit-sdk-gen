import * as fs from "fs";
import * as path from "path";
import { ScannedEndpoint } from "../core/scanner";

export interface OpenApiOptions {
  title?: string;
  version?: string;
  description?: string;
  baseUrl?: string;
  typesFilePath?: string;
}

export interface OpenApiSpec {
  openapi: "3.0.3";
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: { url: string; description?: string }[];
  paths: Record<string, Record<string, any>>;
  components: {
    schemas: Record<string, any>;
  };
}

/**
 * Parses a types.ts file to extract interface definitions into JSON Schema objects
 */
export function extractSchemasFromTypes(typesContent: string): Record<string, any> {
  const schemas: Record<string, any> = {};
  const interfaceRegex = /export\s+interface\s+([A-Za-z0-9_$]+)\s*\{([^}]*)\}/g;

  for (const match of typesContent.matchAll(interfaceRegex)) {
    const interfaceName = match[1];
    const body = match[2];
    const properties: Record<string, any> = {};
    const required: string[] = [];

    const propLines = body.split(";").map((l) => l.trim()).filter(Boolean);
    for (const line of propLines) {
      const propMatch = line.match(/^([A-Za-z0-9_$]+)(\?)?:\s*(.+)$/);
      if (propMatch) {
        const propName = propMatch[1];
        const isOptional = Boolean(propMatch[2]);
        const propType = propMatch[3].trim();

        if (!isOptional) required.push(propName);

        if (propType === "string") {
          properties[propName] = { type: "string" };
        } else if (propType === "number") {
          properties[propName] = { type: "number" };
        } else if (propType === "boolean") {
          properties[propName] = { type: "boolean" };
        } else if (propType.endsWith("[]")) {
          const itemType = propType.slice(0, -2).trim();
          properties[propName] = {
            type: "array",
            items: itemType === "string" || itemType === "number" || itemType === "boolean"
              ? { type: itemType }
              : { $ref: `#/components/schemas/${itemType}` },
          };
        } else if (propType.startsWith("Record<")) {
          properties[propName] = { type: "object" };
        } else if (propType === "any" || propType === "unknown") {
          properties[propName] = { type: "object" };
        } else {
          properties[propName] = { $ref: `#/components/schemas/${propType}` };
        }
      }
    }

    schemas[interfaceName] = {
      type: "object",
      properties,
      ...(required.length > 0 ? { required } : {}),
    };
  }

  return schemas;
}

/**
 * Generates an OpenAPI 3.0.3 specification from scanned endpoints and DTO models
 */
export function generateOpenApi(
  endpoints: ScannedEndpoint[],
  options: OpenApiOptions = {}
): OpenApiSpec {
  let schemas: Record<string, any> = {};
  if (options.typesFilePath && fs.existsSync(options.typesFilePath)) {
    const typesContent = fs.readFileSync(options.typesFilePath, "utf8");
    schemas = extractSchemasFromTypes(typesContent);
  }

  const paths: Record<string, Record<string, any>> = {};

  for (const ep of endpoints) {
    let cleanPath = ep.endpoint.startsWith("/") ? ep.endpoint : `/${ep.endpoint}`;
    // Normalize path variables
    cleanPath = cleanPath.replace(/\{([^}]+)\}/g, "{$1}");

    if (!paths[cleanPath]) {
      paths[cleanPath] = {};
    }

    const httpMethod = ep.method.toLowerCase();
    const parameters: any[] = [];

    // Path parameters
    if (ep.pathParams) {
      for (const p of ep.pathParams) {
        parameters.push({
          name: p,
          in: "path",
          required: true,
          schema: { type: "string" },
        });
      }
    }

    // Query parameters
    if (ep.queryParams) {
      if (Array.isArray(ep.queryParams)) {
        for (const q of ep.queryParams) {
          parameters.push({
            name: q,
            in: "query",
            required: false,
            schema: { type: "string" },
          });
        }
      } else {
        for (const [q, t] of Object.entries(ep.queryParams)) {
          parameters.push({
            name: q,
            in: "query",
            required: false,
            schema: { type: t === "number" ? "number" : t === "boolean" ? "boolean" : "string" },
          });
        }
      }
    }

    // Header parameters
    if (ep.headers) {
      for (const h of ep.headers) {
        parameters.push({
          name: h,
          in: "header",
          required: false,
          schema: { type: "string" },
        });
      }
    }

    // Request Body
    let requestBody: any = undefined;
    if (ep.requestBodyType === "FormUrlEncoded") {
      const formProperties: Record<string, any> = {};
      if (ep.fields) {
        for (const [fName, fType] of Object.entries(ep.fields)) {
          formProperties[fName] = { type: fType === "number" ? "number" : "string" };
        }
      }
      requestBody = {
        required: true,
        content: {
          "application/x-www-form-urlencoded": {
            schema: {
              type: "object",
              properties: formProperties,
            },
          },
        },
      };
    } else if (ep.requestBodyType === "Multipart") {
      const partProperties: Record<string, any> = {};
      if (ep.parts) {
        for (const [pName, pType] of Object.entries(ep.parts)) {
          partProperties[pName] = pType.includes("File")
            ? { type: "string", format: "binary" }
            : { type: "string" };
        }
      }
      requestBody = {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: partProperties,
            },
          },
        },
      };
    } else if (ep.requestBodyType) {
      const cleanType = ep.requestBodyType.replace(/^Types\./, "");
      requestBody = {
        required: true,
        content: {
          "application/json": {
            schema: schemas[cleanType]
              ? { $ref: `#/components/schemas/${cleanType}` }
              : { type: "object" },
          },
        },
      };
    }

    // Response Schema
    const cleanResp = (ep.responseType || "any").replace(/^Types\./, "");
    const responseSchema = schemas[cleanResp]
      ? { $ref: `#/components/schemas/${cleanResp}` }
      : cleanResp === "string"
      ? { type: "string" }
      : cleanResp === "number"
      ? { type: "number" }
      : cleanResp === "boolean"
      ? { type: "boolean" }
      : { type: "object" };

    const operation: any = {
      summary: `${ep.interface}.${ep.function || "callApi"}`,
      operationId: `${ep.interface}_${ep.function || "callApi"}`,
      tags: [ep.interface],
      parameters: parameters.length > 0 ? parameters : undefined,
      requestBody,
      responses: {
        "200": {
          description: "Successful response",
          content: {
            "application/json": {
              schema: responseSchema,
            },
          },
        },
      },
    };

    paths[cleanPath][httpMethod] = operation;
  }

  return {
    openapi: "3.0.3",
    info: {
      title: options.title || "Generated Retrofit API Specification",
      version: options.version || "1.0.0",
      description:
        options.description ||
        `OpenAPI 3.0 specification automatically generated from Android Retrofit decompiled interfaces (${endpoints.length} endpoints).`,
    },
    servers: [
      {
        url: options.baseUrl || "https://api.example.com",
        description: "API Server",
      },
    ],
    paths,
    components: {
      schemas,
    },
  };
}
