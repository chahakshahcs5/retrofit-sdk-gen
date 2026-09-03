package com.app.sdk;

import java.util.HashMap;
import java.util.Map;

public final class Services {
    private Services() {}

    public static class CoinGeckoService {
        private final Client client;

        public CoinGeckoService(Client client) {
            this.client = client != null ? client : new Client();
        }

        public CoinGeckoService() {
            this(new Client());
        }

        /** GET coins/{id} */
        public ApiResponse<String> getCoinDetail(String id, Map<String, Object> queryParams) {
            Map<String, String> pathParams = new HashMap<>();
            pathParams.put("id", id);
            return this.client.send("GET", "coins/{id}", pathParams, queryParams, null, null);
        }

        /** GET global */
        public ApiResponse<String> getGlobalData() {
            Map<String, String> pathParams = null;
            return this.client.send("GET", "global", pathParams, null, null, null);
        }

        /** GET coins/{id}/market_chart */
        public ApiResponse<String> getMarketChart(String id, Map<String, Object> queryParams) {
            Map<String, String> pathParams = new HashMap<>();
            pathParams.put("id", id);
            return this.client.send("GET", "coins/{id}/market_chart", pathParams, queryParams, null, null);
        }

        /** GET coins/markets */
        public ApiResponse<String> getTopCoins(Map<String, Object> queryParams) {
            Map<String, String> pathParams = null;
            return this.client.send("GET", "coins/markets", pathParams, queryParams, null, null);
        }

        /** GET search/trending */
        public ApiResponse<String> getTrendingCoins() {
            Map<String, String> pathParams = null;
            return this.client.send("GET", "search/trending", pathParams, null, null, null);
        }

        /** GET search */
        public ApiResponse<String> searchCoins(Map<String, Object> queryParams) {
            Map<String, String> pathParams = null;
            return this.client.send("GET", "search", pathParams, queryParams, null, null);
        }

    }

}