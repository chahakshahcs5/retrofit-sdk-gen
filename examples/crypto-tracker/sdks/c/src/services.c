#include "services.h"
#include <stdlib.h>
#include <string.h>

app_response_t* app_coin_gecko_get_coin_detail(app_client_t* client, const app_request_opts_t* opts) {
    app_request_opts_t local_opts = {0};
    if (opts) local_opts = *opts;
    local_opts.method = "GET";
    local_opts.endpoint = "coins/{id}";
    return app_client_request(client, &local_opts);
}

app_response_t* app_coin_gecko_get_global_data(app_client_t* client, const app_request_opts_t* opts) {
    app_request_opts_t local_opts = {0};
    if (opts) local_opts = *opts;
    local_opts.method = "GET";
    local_opts.endpoint = "global";
    return app_client_request(client, &local_opts);
}

app_response_t* app_coin_gecko_get_market_chart(app_client_t* client, const app_request_opts_t* opts) {
    app_request_opts_t local_opts = {0};
    if (opts) local_opts = *opts;
    local_opts.method = "GET";
    local_opts.endpoint = "coins/{id}/market_chart";
    return app_client_request(client, &local_opts);
}

app_response_t* app_coin_gecko_get_top_coins(app_client_t* client, const app_request_opts_t* opts) {
    app_request_opts_t local_opts = {0};
    if (opts) local_opts = *opts;
    local_opts.method = "GET";
    local_opts.endpoint = "coins/markets";
    return app_client_request(client, &local_opts);
}

app_response_t* app_coin_gecko_get_trending_coins(app_client_t* client, const app_request_opts_t* opts) {
    app_request_opts_t local_opts = {0};
    if (opts) local_opts = *opts;
    local_opts.method = "GET";
    local_opts.endpoint = "search/trending";
    return app_client_request(client, &local_opts);
}

app_response_t* app_coin_gecko_search_coins(app_client_t* client, const app_request_opts_t* opts) {
    app_request_opts_t local_opts = {0};
    if (opts) local_opts = *opts;
    local_opts.method = "GET";
    local_opts.endpoint = "search";
    return app_client_request(client, &local_opts);
}
