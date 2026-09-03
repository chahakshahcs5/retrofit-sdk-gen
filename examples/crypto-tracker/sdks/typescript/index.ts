/**
 * Complete Typed API SDK
 * Lists fully-typed methods for all 6 Retrofit API endpoints
 * Organized 1:1 by authentic Retrofit Service Interfaces from the decompiled Android App.
 * Direct static usage: ServiceName.methodName(params?, payload?, options?, client?)
 */

import * as Types from "./types";
import { HttpClient, ApiResponse, RequestOptions, defaultClient } from "./client";

export { HttpClient, ApiResponse, RequestOptions, defaultClient };
export * as Types from "./types";

// ============================================================================
// COINGECKOAPI (6 Endpoints)
// Source: com/example/data/api/CoinGeckoApi.java
// ============================================================================

export class CoinGeckoApi {
  /**
   * GET coins/{id}
   * @interface CoinGeckoApi
   * @source com/example/data/api/CoinGeckoApi.java
   * @signature Object getCoinDetail(@Path("id") String str, @Query("localization") boolean z, @Query("tickers") boolean z2, @Query("market_data") boolean z3, @Query("community_data") boolean z4, @Query("developer_data") boolean z5, @Query("sparkline") boolean z6, Continuation<? super CoinDetailDto> continuation);
   * @path {id}
   * @query localization?: boolean, tickers?: boolean, market_data?: boolean, community_data?: boolean, developer_data?: boolean, sparkline?: boolean
   * @response Types.CoinDetailDto
   */
  static async getCoinDetail(
    params: { id: string | number },
    options?: {
      queryParams?: {
        localization?: boolean;
        tickers?: boolean;
        market_data?: boolean;
        community_data?: boolean;
        developer_data?: boolean;
        sparkline?: boolean;
      };
    },
    client: HttpClient = defaultClient,
  ): Promise<ApiResponse<Types.CoinDetailDto>> {
    return client.request<Types.CoinDetailDto>("GET", "coins/{id}", {
      pathParams: params,
      queryParams: options?.queryParams,
    });
  }

  /**
   * GET global
   * @interface CoinGeckoApi
   * @source com/example/data/api/CoinGeckoApi.java
   * @signature Object getGlobalData(Continuation<? super GlobalDataResponse> continuation);
   * @response Types.GlobalDataResponse
   */
  static async getGlobalData(
    client: HttpClient = defaultClient,
  ): Promise<ApiResponse<Types.GlobalDataResponse>> {
    return client.request<Types.GlobalDataResponse>("GET", "global");
  }

  /**
   * GET coins/{id}/market_chart
   * @interface CoinGeckoApi
   * @source com/example/data/api/CoinGeckoApi.java
   * @signature Object getMarketChart(@Path("id") String str, @Query("vs_currency") String str2, @Query("days") String str3, Continuation<? super MarketChartDto> continuation);
   * @path {id}
   * @query vs_currency?: string, days?: string
   * @response Types.MarketChartDto
   */
  static async getMarketChart(
    params: { id: string | number },
    options?: {
      queryParams?: { vs_currency?: string; days?: string };
    },
    client: HttpClient = defaultClient,
  ): Promise<ApiResponse<Types.MarketChartDto>> {
    return client.request<Types.MarketChartDto>("GET", "coins/{id}/market_chart", {
      pathParams: params,
      queryParams: options?.queryParams,
    });
  }

  /**
   * GET coins/markets
   * @interface CoinGeckoApi
   * @source com/example/data/api/CoinGeckoApi.java
   * @signature Object getTopCoins(@Query("vs_currency") String str, @Query("order") String str2, @Query("per_page") int i, @Query("page") int i2, @Query("sparkline") boolean z, @Query("price_change_percentage") String str3, Continuation<? super List<CoinMarketDto>> continuation);
   * @query vs_currency?: string, order?: string, per_page?: number, page?: number, sparkline?: boolean, price_change_percentage?: string
   * @response Types.List_CoinMarketDto
   */
  static async getTopCoins(
    options?: {
      queryParams?: {
        vs_currency?: string;
        order?: string;
        per_page?: number;
        page?: number;
        sparkline?: boolean;
        price_change_percentage?: string;
      };
    },
    client: HttpClient = defaultClient,
  ): Promise<ApiResponse<Types.List_CoinMarketDto>> {
    return client.request<Types.List_CoinMarketDto>("GET", "coins/markets", {
      queryParams: options?.queryParams,
    });
  }

  /**
   * GET search/trending
   * @interface CoinGeckoApi
   * @source com/example/data/api/CoinGeckoApi.java
   * @signature Object getTrendingCoins(Continuation<? super TrendingResponse> continuation);
   * @response Types.TrendingResponse
   */
  static async getTrendingCoins(
    client: HttpClient = defaultClient,
  ): Promise<ApiResponse<Types.TrendingResponse>> {
    return client.request<Types.TrendingResponse>("GET", "search/trending");
  }

  /**
   * GET search
   * @interface CoinGeckoApi
   * @source com/example/data/api/CoinGeckoApi.java
   * @signature Object searchCoins(@Query("query") String str, Continuation<? super SearchResponse> continuation);
   * @query query?: string
   * @response Types.SearchResponse
   */
  static async searchCoins(
    options?: {
      queryParams?: { query?: string };
    },
    client: HttpClient = defaultClient,
  ): Promise<ApiResponse<Types.SearchResponse>> {
    return client.request<Types.SearchResponse>("GET", "search", {
      queryParams: options?.queryParams,
    });
  }
}

// ============================================================================
// MASTER API SDK OBJECT (1 Services)
// ============================================================================

export const sdk = {
  client: defaultClient,
  CoinGeckoApi,
};

// Universal SDK export
export const apiSdk = sdk;
export default sdk;
