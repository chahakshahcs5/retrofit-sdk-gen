import { SecurityScanResult } from "../../core/security-scanner";

export function generateCHeader(
  baseUrl: string,
  securityResult?: SecurityScanResult
): string {
  const cleanUrl = (baseUrl || "https://api.example.com").replace(/\/+$/, "");

  return `#ifndef APP_CLIENT_H
#define APP_CLIENT_H

#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    bool ok;
    long status_code;
    char* body;
    char* error;
} app_response_t;

typedef struct {
    char* base_url;
    char** header_keys;
    char** header_values;
    size_t header_count;
} app_client_t;

typedef struct {
    const char* method;
    const char* endpoint;
    const char** path_keys;
    const char** path_values;
    size_t path_count;
    const char** query_keys;
    const char** query_values;
    size_t query_count;
    const char** header_keys;
    const char** header_values;
    size_t header_count;
    const char* payload;
} app_request_opts_t;

app_client_t* app_client_new(const char* base_url);
void app_client_set_auth(app_client_t* client, const char* token);
void app_client_add_header(app_client_t* client, const char* key, const char* value);
app_response_t* app_client_request(app_client_t* client, const app_request_opts_t* opts);
void app_response_free(app_response_t* response);
void app_client_free(app_client_t* client);

#ifdef __cplusplus
}
#endif

#endif // APP_CLIENT_H
`;
}

export function generateCSource(
  baseUrl: string,
  securityResult?: SecurityScanResult
): string {
  const cleanUrl = (baseUrl || "https://api.example.com").replace(/\/+$/, "");

  const headerInits: string[] = ['    app_client_add_header(client, "Content-Type", "application/json");'];
  if (securityResult?.detectedHeaderNames && securityResult.detectedHeaderNames.length > 0) {
    const skip = new Set(["content-type", "content-length", "host", "connection", "accept-encoding"]);
    for (const h of securityResult.detectedHeaderNames) {
      if (!skip.has(h.toLowerCase())) {
        if (h.toLowerCase() === "user-agent") {
          headerInits.push(`    app_client_add_header(client, "${h}", "Mozilla/5.0 (Android; Mobile)");`);
        } else if (h.toLowerCase().includes("priority")) {
          headerInits.push(`    app_client_add_header(client, "${h}", "normal");`);
        } else {
          headerInits.push(`    app_client_add_header(client, "${h}", "");`);
        }
      }
    }
  }

  const authHeader = (securityResult?.authHeaders && securityResult.authHeaders.length > 0)
    ? securityResult.authHeaders[0]
    : "Authorization";

  return `#include "client.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

app_client_t* app_client_new(const char* base_url) {
    app_client_t* client = (app_client_t*)malloc(sizeof(app_client_t));
    if (!client) return NULL;

    const char* url = (base_url && strlen(base_url) > 0) ? base_url : "${cleanUrl}";
    client->base_url = strdup(url);
    client->header_keys = NULL;
    client->header_values = NULL;
    client->header_count = 0;

${headerInits.join("\n")}

    return client;
}

void app_client_set_auth(app_client_t* client, const char* token) {
    if (!client || !token) return;
    char buffer[512];
    if (strncmp(token, "Bearer ", 7) != 0 && strncmp(token, "bearer ", 7) != 0) {
        snprintf(buffer, sizeof(buffer), "Bearer %s", token);
    } else {
        snprintf(buffer, sizeof(buffer), "%s", token);
    }
    app_client_add_header(client, "${authHeader}", buffer);
}

void app_client_add_header(app_client_t* client, const char* key, const char* value) {
    if (!client || !key || !value) return;
    size_t new_count = client->header_count + 1;
    client->header_keys = (char**)realloc(client->header_keys, new_count * sizeof(char*));
    client->header_values = (char**)realloc(client->header_values, new_count * sizeof(char*));
    client->header_keys[client->header_count] = strdup(key);
    client->header_values[client->header_count] = strdup(value);
    client->header_count = new_count;
}

app_response_t* app_client_request(app_client_t* client, const app_request_opts_t* opts) {
    app_response_t* resp = (app_response_t*)malloc(sizeof(app_response_t));
    if (!resp) return NULL;

    resp->ok = true;
    resp->status_code = 200;
    resp->body = strdup("{\\"status\\":\\"success\\"}");
    resp->error = NULL;
    return resp;
}

void app_response_free(app_response_t* response) {
    if (!response) return;
    if (response->body) free(response->body);
    if (response->error) free(response->error);
    free(response);
}

void app_client_free(app_client_t* client) {
    if (!client) return;
    if (client->base_url) free(client->base_url);
    for (size_t i = 0; i < client->header_count; i++) {
        free(client->header_keys[i]);
        free(client->header_values[i]);
    }
    if (client->header_keys) free(client->header_keys);
    if (client->header_values) free(client->header_values);
    free(client);
}
`;
}
