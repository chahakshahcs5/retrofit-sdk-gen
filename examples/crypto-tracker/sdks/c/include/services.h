#ifndef APP_SERVICES_H
#define APP_SERVICES_H

#include "client.h"
#include "models.h"

#ifdef __cplusplus
extern "C" {
#endif

/** GET coins/{id} */
app_response_t* app_coin_gecko_get_coin_detail(app_client_t* client, const app_request_opts_t* opts);

/** GET global */
app_response_t* app_coin_gecko_get_global_data(app_client_t* client, const app_request_opts_t* opts);

/** GET coins/{id}/market_chart */
app_response_t* app_coin_gecko_get_market_chart(app_client_t* client, const app_request_opts_t* opts);

/** GET coins/markets */
app_response_t* app_coin_gecko_get_top_coins(app_client_t* client, const app_request_opts_t* opts);

/** GET search/trending */
app_response_t* app_coin_gecko_get_trending_coins(app_client_t* client, const app_request_opts_t* opts);

/** GET search */
app_response_t* app_coin_gecko_search_coins(app_client_t* client, const app_request_opts_t* opts);

#ifdef __cplusplus
}
#endif

#endif // APP_SERVICES_H