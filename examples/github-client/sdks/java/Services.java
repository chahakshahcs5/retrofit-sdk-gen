package com.app.sdk;

import java.util.HashMap;
import java.util.Map;

public final class Services {
    private Services() {}

    public static class GitHubApiService {
        private final Client client;

        public GitHubApiService(Client client) {
            this.client = client != null ? client : new Client();
        }

        public GitHubApiService() {
            this(new Client());
        }

        /** GET repos/{owner}/{repo} */
        public ApiResponse<String> getRepository(String owner, String repo) {
            Map<String, String> pathParams = new HashMap<>();
            pathParams.put("owner", owner);
            pathParams.put("repo", repo);
            return this.client.send("GET", "repos/{owner}/{repo}", pathParams, null, null, null);
        }

        /** GET repos/{owner}/{repo}/commits */
        public ApiResponse<String> getRepositoryCommits(String owner, String repo, Map<String, Object> queryParams) {
            Map<String, String> pathParams = new HashMap<>();
            pathParams.put("owner", owner);
            pathParams.put("repo", repo);
            return this.client.send("GET", "repos/{owner}/{repo}/commits", pathParams, queryParams, null, null);
        }

        /** GET repos/{owner}/{repo}/contributors */
        public ApiResponse<String> getRepositoryContributors(String owner, String repo, Map<String, Object> queryParams) {
            Map<String, String> pathParams = new HashMap<>();
            pathParams.put("owner", owner);
            pathParams.put("repo", repo);
            return this.client.send("GET", "repos/{owner}/{repo}/contributors", pathParams, queryParams, null, null);
        }

        /** GET repos/{owner}/{repo}/issues */
        public ApiResponse<String> getRepositoryIssues(String owner, String repo, Map<String, Object> queryParams) {
            Map<String, String> pathParams = new HashMap<>();
            pathParams.put("owner", owner);
            pathParams.put("repo", repo);
            return this.client.send("GET", "repos/{owner}/{repo}/issues", pathParams, queryParams, null, null);
        }

        /** GET repos/{owner}/{repo}/readme */
        public ApiResponse<String> getRepositoryReadme(String owner, String repo) {
            Map<String, String> pathParams = new HashMap<>();
            pathParams.put("owner", owner);
            pathParams.put("repo", repo);
            return this.client.send("GET", "repos/{owner}/{repo}/readme", pathParams, null, null, null);
        }

        /** GET users/{username} */
        public ApiResponse<String> getUser(String username) {
            Map<String, String> pathParams = new HashMap<>();
            pathParams.put("username", username);
            return this.client.send("GET", "users/{username}", pathParams, null, null, null);
        }

        /** GET users/{username}/repos */
        public ApiResponse<String> getUserRepositories(String username, Map<String, Object> queryParams) {
            Map<String, String> pathParams = new HashMap<>();
            pathParams.put("username", username);
            return this.client.send("GET", "users/{username}/repos", pathParams, queryParams, null, null);
        }

        /** GET users/{username}/starred */
        public ApiResponse<String> getUserStarredRepositories(String username, Map<String, Object> queryParams) {
            Map<String, String> pathParams = new HashMap<>();
            pathParams.put("username", username);
            return this.client.send("GET", "users/{username}/starred", pathParams, queryParams, null, null);
        }

        /** GET search/code */
        public ApiResponse<String> searchCode(Map<String, Object> queryParams) {
            Map<String, String> pathParams = null;
            return this.client.send("GET", "search/code", pathParams, queryParams, null, null);
        }

        /** GET search/repositories */
        public ApiResponse<String> searchRepositories(Map<String, Object> queryParams) {
            Map<String, String> pathParams = null;
            return this.client.send("GET", "search/repositories", pathParams, queryParams, null, null);
        }

        /** GET search/users */
        public ApiResponse<String> searchUsers(Map<String, Object> queryParams) {
            Map<String, String> pathParams = null;
            return this.client.send("GET", "search/users", pathParams, queryParams, null, null);
        }

    }

}