#include "services.h"
#include <stdlib.h>
#include <string.h>

app_response_t* app_git_hub_api_get_repository(app_client_t* client, const app_request_opts_t* opts) {
    app_request_opts_t local_opts = {0};
    if (opts) local_opts = *opts;
    local_opts.method = "GET";
    local_opts.endpoint = "repos/{owner}/{repo}";
    return app_client_request(client, &local_opts);
}

app_response_t* app_git_hub_api_get_repository_commits(app_client_t* client, const app_request_opts_t* opts) {
    app_request_opts_t local_opts = {0};
    if (opts) local_opts = *opts;
    local_opts.method = "GET";
    local_opts.endpoint = "repos/{owner}/{repo}/commits";
    return app_client_request(client, &local_opts);
}

app_response_t* app_git_hub_api_get_repository_contributors(app_client_t* client, const app_request_opts_t* opts) {
    app_request_opts_t local_opts = {0};
    if (opts) local_opts = *opts;
    local_opts.method = "GET";
    local_opts.endpoint = "repos/{owner}/{repo}/contributors";
    return app_client_request(client, &local_opts);
}

app_response_t* app_git_hub_api_get_repository_issues(app_client_t* client, const app_request_opts_t* opts) {
    app_request_opts_t local_opts = {0};
    if (opts) local_opts = *opts;
    local_opts.method = "GET";
    local_opts.endpoint = "repos/{owner}/{repo}/issues";
    return app_client_request(client, &local_opts);
}

app_response_t* app_git_hub_api_get_repository_readme(app_client_t* client, const app_request_opts_t* opts) {
    app_request_opts_t local_opts = {0};
    if (opts) local_opts = *opts;
    local_opts.method = "GET";
    local_opts.endpoint = "repos/{owner}/{repo}/readme";
    return app_client_request(client, &local_opts);
}

app_response_t* app_git_hub_api_get_user(app_client_t* client, const app_request_opts_t* opts) {
    app_request_opts_t local_opts = {0};
    if (opts) local_opts = *opts;
    local_opts.method = "GET";
    local_opts.endpoint = "users/{username}";
    return app_client_request(client, &local_opts);
}

app_response_t* app_git_hub_api_get_user_repositories(app_client_t* client, const app_request_opts_t* opts) {
    app_request_opts_t local_opts = {0};
    if (opts) local_opts = *opts;
    local_opts.method = "GET";
    local_opts.endpoint = "users/{username}/repos";
    return app_client_request(client, &local_opts);
}

app_response_t* app_git_hub_api_get_user_starred_repositories(app_client_t* client, const app_request_opts_t* opts) {
    app_request_opts_t local_opts = {0};
    if (opts) local_opts = *opts;
    local_opts.method = "GET";
    local_opts.endpoint = "users/{username}/starred";
    return app_client_request(client, &local_opts);
}

app_response_t* app_git_hub_api_search_code(app_client_t* client, const app_request_opts_t* opts) {
    app_request_opts_t local_opts = {0};
    if (opts) local_opts = *opts;
    local_opts.method = "GET";
    local_opts.endpoint = "search/code";
    return app_client_request(client, &local_opts);
}

app_response_t* app_git_hub_api_search_repositories(app_client_t* client, const app_request_opts_t* opts) {
    app_request_opts_t local_opts = {0};
    if (opts) local_opts = *opts;
    local_opts.method = "GET";
    local_opts.endpoint = "search/repositories";
    return app_client_request(client, &local_opts);
}

app_response_t* app_git_hub_api_search_users(app_client_t* client, const app_request_opts_t* opts) {
    app_request_opts_t local_opts = {0};
    if (opts) local_opts = *opts;
    local_opts.method = "GET";
    local_opts.endpoint = "search/users";
    return app_client_request(client, &local_opts);
}
