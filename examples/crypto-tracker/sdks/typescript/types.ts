/**
 * Auto-generated TypeScript Interfaces for API Payloads and Responses
 * Extracted from decompiled Retrofit Java interfaces and Moshi/Gson data models
 * Total models: 12
 */

// ============================================================================
// COMMON MODULE MODELS (6)
// ============================================================================

/**
 * Model: CoinDescriptionDto
 * Nested child model / DTO
 */
export interface CoinDescriptionDto {
  en?: string;
}

/**
 * Model: CoinImageDto
 * Nested child model / DTO
 */
export interface CoinImageDto {
  thumb?: string;
  small?: string;
  large?: string;
}

/**
 * Model: MarketDataDto
 * Nested child model / DTO
 */
export interface MarketDataDto {
  map?: Record<string, number>;
  map2?: Record<string, number>;
  map3?: Record<string, number>;
  map4?: Record<string, number>;
  map5?: Record<string, number>;
  priceChange24h?: number;
  priceChangePercentage24h?: number;
  priceChangePercentage7d?: number;
  priceChangePercentage30d?: number;
  priceChangePercentage1y?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  maxSupply?: number;
  map6?: Record<string, number>;
  map7?: Record<string, number>;
  sparkline7d?: SparklineDto;
}

/**
 * Model: GlobalDataDto
 * Nested child model / DTO
 */
export interface GlobalDataDto {
  activeCryptos?: number;
  map?: Record<string, number>;
  map2?: Record<string, number>;
  map3?: Record<string, number>;
  marketCapChange24hUsd?: number;
}

/**
 * Model: TrendingCoinItemDto
 * Nested child model / DTO
 */
export interface TrendingCoinItemDto {
  item?: TrendingCoinDto;
}

/**
 * Model: SearchCoinDto
 * Nested child model / DTO
 */
export interface SearchCoinDto {
  id?: string;
  name?: string;
  symbol?: string;
  marketCapRank?: number;
  thumb?: string;
  large?: string;
}

// ============================================================================
// DATA MODULE MODELS (6)
// ============================================================================

/**
 * Model: CoinDetailDto
 * @response For:
 *   - GET coins/{id}
 */
export interface CoinDetailDto {
  id?: string;
  symbol?: string;
  name?: string;
  description?: CoinDescriptionDto;
  image?: CoinImageDto;
  marketCapRank?: number;
  marketData?: MarketDataDto;
}

/**
 * Model: GlobalDataResponse
 * @response For:
 *   - GET global
 */
export interface GlobalDataResponse {
  data?: GlobalDataDto;
}

/**
 * Model: MarketChartDto
 * @response For:
 *   - GET coins/{id}/market_chart
 */
export interface MarketChartDto {
  list?: number[][];
}

/**
 * Model: List_CoinMarketDto
 * @response For:
 *   - GET coins/markets
 */
export interface List_CoinMarketDto {
  [key: string]: any;
}

/**
 * Model: TrendingResponse
 * @response For:
 *   - GET search/trending
 */
export interface TrendingResponse {
  list?: TrendingCoinItemDto[];
}

/**
 * Model: SearchResponse
 * @response For:
 *   - GET search
 */
export interface SearchResponse {
  list?: SearchCoinDto[];
}

// ============================================================================
// REFERENCED AUXILIARY MODELS (2)
// ============================================================================

export interface SparklineDto {
  list?: any;
}

export interface TrendingCoinDto {
  id?: any;
  coinId?: any;
  name?: any;
  symbol?: any;
  marketCapRank?: any;
  thumb?: any;
  small?: any;
  large?: any;
  score?: any;
  data?: any;
}
