#include "services.h"
#include <stdlib.h>
#include <string.h>

app_response_t* app_dummy_json_get_categories(app_client_t* client, const app_request_opts_t* opts) {
    app_request_opts_t local_opts = {0};
    if (opts) local_opts = *opts;
    local_opts.method = "GET";
    local_opts.endpoint = "products/categories";
    return app_client_request(client, &local_opts);
}

app_response_t* app_dummy_json_get_category_list(app_client_t* client, const app_request_opts_t* opts) {
    app_request_opts_t local_opts = {0};
    if (opts) local_opts = *opts;
    local_opts.method = "GET";
    local_opts.endpoint = "products/category-list";
    return app_client_request(client, &local_opts);
}

app_response_t* app_dummy_json_get_current_user(app_client_t* client, const app_request_opts_t* opts) {
    app_request_opts_t local_opts = {0};
    if (opts) local_opts = *opts;
    local_opts.method = "GET";
    local_opts.endpoint = "auth/me";
    return app_client_request(client, &local_opts);
}

app_response_t* app_dummy_json_get_product_by_id(app_client_t* client, const app_request_opts_t* opts) {
    app_request_opts_t local_opts = {0};
    if (opts) local_opts = *opts;
    local_opts.method = "GET";
    local_opts.endpoint = "products/{id}";
    return app_client_request(client, &local_opts);
}

app_response_t* app_dummy_json_get_products(app_client_t* client, const app_request_opts_t* opts) {
    app_request_opts_t local_opts = {0};
    if (opts) local_opts = *opts;
    local_opts.method = "GET";
    local_opts.endpoint = "products";
    return app_client_request(client, &local_opts);
}

app_response_t* app_dummy_json_get_products_by_category(app_client_t* client, const app_request_opts_t* opts) {
    app_request_opts_t local_opts = {0};
    if (opts) local_opts = *opts;
    local_opts.method = "GET";
    local_opts.endpoint = "products/category/{category}";
    return app_client_request(client, &local_opts);
}

app_response_t* app_dummy_json_login(app_client_t* client, const app_request_opts_t* opts) {
    app_request_opts_t local_opts = {0};
    if (opts) local_opts = *opts;
    local_opts.method = "POST";
    local_opts.endpoint = "auth/login";
    return app_client_request(client, &local_opts);
}

app_response_t* app_dummy_json_search_products(app_client_t* client, const app_request_opts_t* opts) {
    app_request_opts_t local_opts = {0};
    if (opts) local_opts = *opts;
    local_opts.method = "GET";
    local_opts.endpoint = "products/search";
    return app_client_request(client, &local_opts);
}
