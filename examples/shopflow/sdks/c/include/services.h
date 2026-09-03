#ifndef APP_SERVICES_H
#define APP_SERVICES_H

#include "client.h"
#include "models.h"

#ifdef __cplusplus
extern "C" {
#endif

/** GET products/categories */
app_response_t* app_dummy_json_get_categories(app_client_t* client, const app_request_opts_t* opts);

/** GET products/category-list */
app_response_t* app_dummy_json_get_category_list(app_client_t* client, const app_request_opts_t* opts);

/** GET auth/me */
app_response_t* app_dummy_json_get_current_user(app_client_t* client, const app_request_opts_t* opts);

/** GET products/{id} */
app_response_t* app_dummy_json_get_product_by_id(app_client_t* client, const app_request_opts_t* opts);

/** GET products */
app_response_t* app_dummy_json_get_products(app_client_t* client, const app_request_opts_t* opts);

/** GET products/category/{category} */
app_response_t* app_dummy_json_get_products_by_category(app_client_t* client, const app_request_opts_t* opts);

/** POST auth/login */
app_response_t* app_dummy_json_login(app_client_t* client, const app_request_opts_t* opts);

/** GET products/search */
app_response_t* app_dummy_json_search_products(app_client_t* client, const app_request_opts_t* opts);

#ifdef __cplusplus
}
#endif

#endif // APP_SERVICES_H