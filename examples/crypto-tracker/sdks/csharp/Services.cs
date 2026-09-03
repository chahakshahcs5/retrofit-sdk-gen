using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using App.Sdk.Models;

namespace App.Sdk
{
    public class CoinGeckoService
    {
        private readonly HttpClientWrapper _client;

        public CoinGeckoService(HttpClientWrapper? client = null)
        {
            _client = client ?? GlobalSdk.DefaultClient;
        }

        /// <summary>GET coins/{id}</summary>
        public async Task<ApiResponse<T>> GetCoinDetailAsync<T>(string id, Dictionary<string, object>? queryParams = null, CancellationToken cancellationToken = default)
        {
            var pathParams = new Dictionary<string, string>
            {
                ["id"] = id,
            };
            return await _client.SendAsync<T>(HttpMethod.Get, "coins/{id}", pathParams, queryParams, null, null, cancellationToken);
        }

        /// <summary>GET global</summary>
        public async Task<ApiResponse<T>> GetGlobalDataAsync<T>(CancellationToken cancellationToken = default)
        {
            Dictionary<string, string>? pathParams = null;
            return await _client.SendAsync<T>(HttpMethod.Get, "global", pathParams, null, null, null, cancellationToken);
        }

        /// <summary>GET coins/{id}/market_chart</summary>
        public async Task<ApiResponse<T>> GetMarketChartAsync<T>(string id, Dictionary<string, object>? queryParams = null, CancellationToken cancellationToken = default)
        {
            var pathParams = new Dictionary<string, string>
            {
                ["id"] = id,
            };
            return await _client.SendAsync<T>(HttpMethod.Get, "coins/{id}/market_chart", pathParams, queryParams, null, null, cancellationToken);
        }

        /// <summary>GET coins/markets</summary>
        public async Task<ApiResponse<T>> GetTopCoinsAsync<T>(Dictionary<string, object>? queryParams = null, CancellationToken cancellationToken = default)
        {
            Dictionary<string, string>? pathParams = null;
            return await _client.SendAsync<T>(HttpMethod.Get, "coins/markets", pathParams, queryParams, null, null, cancellationToken);
        }

        /// <summary>GET search/trending</summary>
        public async Task<ApiResponse<T>> GetTrendingCoinsAsync<T>(CancellationToken cancellationToken = default)
        {
            Dictionary<string, string>? pathParams = null;
            return await _client.SendAsync<T>(HttpMethod.Get, "search/trending", pathParams, null, null, null, cancellationToken);
        }

        /// <summary>GET search</summary>
        public async Task<ApiResponse<T>> SearchCoinsAsync<T>(Dictionary<string, object>? queryParams = null, CancellationToken cancellationToken = default)
        {
            Dictionary<string, string>? pathParams = null;
            return await _client.SendAsync<T>(HttpMethod.Get, "search", pathParams, queryParams, null, null, cancellationToken);
        }

    }

}