using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using App.Sdk.Models;

namespace App.Sdk
{
    public class GitHubApiService
    {
        private readonly HttpClientWrapper _client;

        public GitHubApiService(HttpClientWrapper? client = null)
        {
            _client = client ?? GlobalSdk.DefaultClient;
        }

        /// <summary>GET repos/{owner}/{repo}</summary>
        public async Task<ApiResponse<T>> GetRepositoryAsync<T>(string owner, string repo, CancellationToken cancellationToken = default)
        {
            var pathParams = new Dictionary<string, string>
            {
                ["owner"] = owner,
                ["repo"] = repo,
            };
            return await _client.SendAsync<T>(HttpMethod.Get, "repos/{owner}/{repo}", pathParams, null, null, null, cancellationToken);
        }

        /// <summary>GET repos/{owner}/{repo}/commits</summary>
        public async Task<ApiResponse<T>> GetRepositoryCommitsAsync<T>(string owner, string repo, Dictionary<string, object>? queryParams = null, CancellationToken cancellationToken = default)
        {
            var pathParams = new Dictionary<string, string>
            {
                ["owner"] = owner,
                ["repo"] = repo,
            };
            return await _client.SendAsync<T>(HttpMethod.Get, "repos/{owner}/{repo}/commits", pathParams, queryParams, null, null, cancellationToken);
        }

        /// <summary>GET repos/{owner}/{repo}/contributors</summary>
        public async Task<ApiResponse<T>> GetRepositoryContributorsAsync<T>(string owner, string repo, Dictionary<string, object>? queryParams = null, CancellationToken cancellationToken = default)
        {
            var pathParams = new Dictionary<string, string>
            {
                ["owner"] = owner,
                ["repo"] = repo,
            };
            return await _client.SendAsync<T>(HttpMethod.Get, "repos/{owner}/{repo}/contributors", pathParams, queryParams, null, null, cancellationToken);
        }

        /// <summary>GET repos/{owner}/{repo}/issues</summary>
        public async Task<ApiResponse<T>> GetRepositoryIssuesAsync<T>(string owner, string repo, Dictionary<string, object>? queryParams = null, CancellationToken cancellationToken = default)
        {
            var pathParams = new Dictionary<string, string>
            {
                ["owner"] = owner,
                ["repo"] = repo,
            };
            return await _client.SendAsync<T>(HttpMethod.Get, "repos/{owner}/{repo}/issues", pathParams, queryParams, null, null, cancellationToken);
        }

        /// <summary>GET repos/{owner}/{repo}/readme</summary>
        public async Task<ApiResponse<T>> GetRepositoryReadmeAsync<T>(string owner, string repo, CancellationToken cancellationToken = default)
        {
            var pathParams = new Dictionary<string, string>
            {
                ["owner"] = owner,
                ["repo"] = repo,
            };
            return await _client.SendAsync<T>(HttpMethod.Get, "repos/{owner}/{repo}/readme", pathParams, null, null, null, cancellationToken);
        }

        /// <summary>GET users/{username}</summary>
        public async Task<ApiResponse<T>> GetUserAsync<T>(string username, CancellationToken cancellationToken = default)
        {
            var pathParams = new Dictionary<string, string>
            {
                ["username"] = username,
            };
            return await _client.SendAsync<T>(HttpMethod.Get, "users/{username}", pathParams, null, null, null, cancellationToken);
        }

        /// <summary>GET users/{username}/repos</summary>
        public async Task<ApiResponse<T>> GetUserRepositoriesAsync<T>(string username, Dictionary<string, object>? queryParams = null, CancellationToken cancellationToken = default)
        {
            var pathParams = new Dictionary<string, string>
            {
                ["username"] = username,
            };
            return await _client.SendAsync<T>(HttpMethod.Get, "users/{username}/repos", pathParams, queryParams, null, null, cancellationToken);
        }

        /// <summary>GET users/{username}/starred</summary>
        public async Task<ApiResponse<T>> GetUserStarredRepositoriesAsync<T>(string username, Dictionary<string, object>? queryParams = null, CancellationToken cancellationToken = default)
        {
            var pathParams = new Dictionary<string, string>
            {
                ["username"] = username,
            };
            return await _client.SendAsync<T>(HttpMethod.Get, "users/{username}/starred", pathParams, queryParams, null, null, cancellationToken);
        }

        /// <summary>GET search/code</summary>
        public async Task<ApiResponse<T>> SearchCodeAsync<T>(Dictionary<string, object>? queryParams = null, CancellationToken cancellationToken = default)
        {
            Dictionary<string, string>? pathParams = null;
            return await _client.SendAsync<T>(HttpMethod.Get, "search/code", pathParams, queryParams, null, null, cancellationToken);
        }

        /// <summary>GET search/repositories</summary>
        public async Task<ApiResponse<T>> SearchRepositoriesAsync<T>(Dictionary<string, object>? queryParams = null, CancellationToken cancellationToken = default)
        {
            Dictionary<string, string>? pathParams = null;
            return await _client.SendAsync<T>(HttpMethod.Get, "search/repositories", pathParams, queryParams, null, null, cancellationToken);
        }

        /// <summary>GET search/users</summary>
        public async Task<ApiResponse<T>> SearchUsersAsync<T>(Dictionary<string, object>? queryParams = null, CancellationToken cancellationToken = default)
        {
            Dictionary<string, string>? pathParams = null;
            return await _client.SendAsync<T>(HttpMethod.Get, "search/users", pathParams, queryParams, null, null, cancellationToken);
        }

    }

}