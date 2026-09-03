#ifndef APP_SERVICES_H
#define APP_SERVICES_H

#include "client.h"
#include "models.h"

#ifdef __cplusplus
extern "C" {
#endif

/** GET repos/{owner}/{repo} */
app_response_t* app_git_hub_api_get_repository(app_client_t* client, const app_request_opts_t* opts);

/** GET repos/{owner}/{repo}/commits */
app_response_t* app_git_hub_api_get_repository_commits(app_client_t* client, const app_request_opts_t* opts);

/** GET repos/{owner}/{repo}/contributors */
app_response_t* app_git_hub_api_get_repository_contributors(app_client_t* client, const app_request_opts_t* opts);

/** GET repos/{owner}/{repo}/issues */
app_response_t* app_git_hub_api_get_repository_issues(app_client_t* client, const app_request_opts_t* opts);

/** GET repos/{owner}/{repo}/readme */
app_response_t* app_git_hub_api_get_repository_readme(app_client_t* client, const app_request_opts_t* opts);

/** GET users/{username} */
app_response_t* app_git_hub_api_get_user(app_client_t* client, const app_request_opts_t* opts);

/** GET users/{username}/repos */
app_response_t* app_git_hub_api_get_user_repositories(app_client_t* client, const app_request_opts_t* opts);

/** GET users/{username}/starred */
app_response_t* app_git_hub_api_get_user_starred_repositories(app_client_t* client, const app_request_opts_t* opts);

/** GET search/code */
app_response_t* app_git_hub_api_search_code(app_client_t* client, const app_request_opts_t* opts);

/** GET search/repositories */
app_response_t* app_git_hub_api_search_repositories(app_client_t* client, const app_request_opts_t* opts);

/** GET search/users */
app_response_t* app_git_hub_api_search_users(app_client_t* client, const app_request_opts_t* opts);

#ifdef __cplusplus
}
#endif

#endif // APP_SERVICES_H