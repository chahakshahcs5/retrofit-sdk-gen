#pragma once

#include "client.hpp"
#include "models.hpp"
#include <string>
#include <unordered_map>

namespace app {

class GitHubApiService {
private:
    const Client& client_;
public:
    explicit GitHubApiService(const Client& client = Client::get_default())
        : client_(client) {}

    /// GET repos/{owner}/{repo}
    ApiResponse get_repository(const std::string& owner, const std::string& repo) const {
        RequestOptions opts;
        opts.method = "GET";
        opts.endpoint = "repos/{owner}/{repo}";
        opts.path_params["owner"] = owner;
        opts.path_params["repo"] = repo;
        return client_.request(opts);
    }

    /// GET repos/{owner}/{repo}/commits
    ApiResponse get_repository_commits(const std::string& owner, const std::string& repo, const std::unordered_map<std::string, std::string>& query_params = {}) const {
        RequestOptions opts;
        opts.method = "GET";
        opts.endpoint = "repos/{owner}/{repo}/commits";
        opts.path_params["owner"] = owner;
        opts.path_params["repo"] = repo;
        opts.query_params = query_params;
        return client_.request(opts);
    }

    /// GET repos/{owner}/{repo}/contributors
    ApiResponse get_repository_contributors(const std::string& owner, const std::string& repo, const std::unordered_map<std::string, std::string>& query_params = {}) const {
        RequestOptions opts;
        opts.method = "GET";
        opts.endpoint = "repos/{owner}/{repo}/contributors";
        opts.path_params["owner"] = owner;
        opts.path_params["repo"] = repo;
        opts.query_params = query_params;
        return client_.request(opts);
    }

    /// GET repos/{owner}/{repo}/issues
    ApiResponse get_repository_issues(const std::string& owner, const std::string& repo, const std::unordered_map<std::string, std::string>& query_params = {}) const {
        RequestOptions opts;
        opts.method = "GET";
        opts.endpoint = "repos/{owner}/{repo}/issues";
        opts.path_params["owner"] = owner;
        opts.path_params["repo"] = repo;
        opts.query_params = query_params;
        return client_.request(opts);
    }

    /// GET repos/{owner}/{repo}/readme
    ApiResponse get_repository_readme(const std::string& owner, const std::string& repo) const {
        RequestOptions opts;
        opts.method = "GET";
        opts.endpoint = "repos/{owner}/{repo}/readme";
        opts.path_params["owner"] = owner;
        opts.path_params["repo"] = repo;
        return client_.request(opts);
    }

    /// GET users/{username}
    ApiResponse get_user(const std::string& username) const {
        RequestOptions opts;
        opts.method = "GET";
        opts.endpoint = "users/{username}";
        opts.path_params["username"] = username;
        return client_.request(opts);
    }

    /// GET users/{username}/repos
    ApiResponse get_user_repositories(const std::string& username, const std::unordered_map<std::string, std::string>& query_params = {}) const {
        RequestOptions opts;
        opts.method = "GET";
        opts.endpoint = "users/{username}/repos";
        opts.path_params["username"] = username;
        opts.query_params = query_params;
        return client_.request(opts);
    }

    /// GET users/{username}/starred
    ApiResponse get_user_starred_repositories(const std::string& username, const std::unordered_map<std::string, std::string>& query_params = {}) const {
        RequestOptions opts;
        opts.method = "GET";
        opts.endpoint = "users/{username}/starred";
        opts.path_params["username"] = username;
        opts.query_params = query_params;
        return client_.request(opts);
    }

    /// GET search/code
    ApiResponse search_code(const std::unordered_map<std::string, std::string>& query_params = {}) const {
        RequestOptions opts;
        opts.method = "GET";
        opts.endpoint = "search/code";
        opts.query_params = query_params;
        return client_.request(opts);
    }

    /// GET search/repositories
    ApiResponse search_repositories(const std::unordered_map<std::string, std::string>& query_params = {}) const {
        RequestOptions opts;
        opts.method = "GET";
        opts.endpoint = "search/repositories";
        opts.query_params = query_params;
        return client_.request(opts);
    }

    /// GET search/users
    ApiResponse search_users(const std::unordered_map<std::string, std::string>& query_params = {}) const {
        RequestOptions opts;
        opts.method = "GET";
        opts.endpoint = "search/users";
        opts.query_params = query_params;
        return client_.request(opts);
    }

};

} // namespace app