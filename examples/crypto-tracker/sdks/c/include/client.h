#ifndef APP_CLIENT_H
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
