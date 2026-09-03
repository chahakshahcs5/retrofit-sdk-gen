using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using App.Sdk.Models;

namespace App.Sdk
{
    public class DummyJsonService
    {
        private readonly HttpClientWrapper _client;

        public DummyJsonService(HttpClientWrapper? client = null)
        {
            _client = client ?? GlobalSdk.DefaultClient;
        }

        /// <summary>GET products/categories</summary>
        public async Task<ApiResponse<T>> GetCategoriesAsync<T>(CancellationToken cancellationToken = default)
        {
            Dictionary<string, string>? pathParams = null;
            return await _client.SendAsync<T>(HttpMethod.Get, "products/categories", pathParams, null, null, null, cancellationToken);
        }

        /// <summary>GET products/category-list</summary>
        public async Task<ApiResponse<T>> GetCategoryListAsync<T>(CancellationToken cancellationToken = default)
        {
            Dictionary<string, string>? pathParams = null;
            return await _client.SendAsync<T>(HttpMethod.Get, "products/category-list", pathParams, null, null, null, cancellationToken);
        }

        /// <summary>GET auth/me</summary>
        public async Task<ApiResponse<T>> GetCurrentUserAsync<T>(CancellationToken cancellationToken = default)
        {
            Dictionary<string, string>? pathParams = null;
            return await _client.SendAsync<T>(HttpMethod.Get, "auth/me", pathParams, null, null, null, cancellationToken);
        }

        /// <summary>GET products/{id}</summary>
        public async Task<ApiResponse<T>> GetProductByIdAsync<T>(string id, CancellationToken cancellationToken = default)
        {
            var pathParams = new Dictionary<string, string>
            {
                ["id"] = id,
            };
            return await _client.SendAsync<T>(HttpMethod.Get, "products/{id}", pathParams, null, null, null, cancellationToken);
        }

        /// <summary>GET products</summary>
        public async Task<ApiResponse<T>> GetProductsAsync<T>(Dictionary<string, object>? queryParams = null, CancellationToken cancellationToken = default)
        {
            Dictionary<string, string>? pathParams = null;
            return await _client.SendAsync<T>(HttpMethod.Get, "products", pathParams, queryParams, null, null, cancellationToken);
        }

        /// <summary>GET products/category/{category}</summary>
        public async Task<ApiResponse<T>> GetProductsByCategoryAsync<T>(string category, Dictionary<string, object>? queryParams = null, CancellationToken cancellationToken = default)
        {
            var pathParams = new Dictionary<string, string>
            {
                ["category"] = category,
            };
            return await _client.SendAsync<T>(HttpMethod.Get, "products/category/{category}", pathParams, queryParams, null, null, cancellationToken);
        }

        /// <summary>POST auth/login</summary>
        public async Task<ApiResponse<T>> LoginAsync<T>(object? payload = null, CancellationToken cancellationToken = default)
        {
            Dictionary<string, string>? pathParams = null;
            return await _client.SendAsync<T>(HttpMethod.Post, "auth/login", pathParams, null, null, payload, cancellationToken);
        }

        /// <summary>GET products/search</summary>
        public async Task<ApiResponse<T>> SearchProductsAsync<T>(Dictionary<string, object>? queryParams = null, CancellationToken cancellationToken = default)
        {
            Dictionary<string, string>? pathParams = null;
            return await _client.SendAsync<T>(HttpMethod.Get, "products/search", pathParams, queryParams, null, null, cancellationToken);
        }

    }

}