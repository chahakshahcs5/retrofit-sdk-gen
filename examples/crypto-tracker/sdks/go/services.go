package sdk

import (
    "context"
)

// CoinGeckoService provides access to 6 API endpoints.
type CoinGeckoService struct {
    Client *Client
}

// NewCoinGeckoService initializes a new CoinGeckoService
func NewCoinGeckoService(client *Client) *CoinGeckoService {
    return &CoinGeckoService{Client: client}
}

// GetCoinDetail: GET coins/{id}
func (s *CoinGeckoService) GetCoinDetail(ctx context.Context, id string, queryParams map[string]interface{}) (*ApiResponse, error) {
    pathParams := map[string]string{
        "id": id,
    }
    return s.Client.DoRequest(ctx, "GET", "coins/{id}", pathParams, queryParams, nil, nil)
}

// GetGlobalData: GET global
func (s *CoinGeckoService) GetGlobalData(ctx context.Context) (*ApiResponse, error) {
    var pathParams map[string]string = nil
    return s.Client.DoRequest(ctx, "GET", "global", pathParams, nil, nil, nil)
}

// GetMarketChart: GET coins/{id}/market_chart
func (s *CoinGeckoService) GetMarketChart(ctx context.Context, id string, queryParams map[string]interface{}) (*ApiResponse, error) {
    pathParams := map[string]string{
        "id": id,
    }
    return s.Client.DoRequest(ctx, "GET", "coins/{id}/market_chart", pathParams, queryParams, nil, nil)
}

// GetTopCoins: GET coins/markets
func (s *CoinGeckoService) GetTopCoins(ctx context.Context, queryParams map[string]interface{}) (*ApiResponse, error) {
    var pathParams map[string]string = nil
    return s.Client.DoRequest(ctx, "GET", "coins/markets", pathParams, queryParams, nil, nil)
}

// GetTrendingCoins: GET search/trending
func (s *CoinGeckoService) GetTrendingCoins(ctx context.Context) (*ApiResponse, error) {
    var pathParams map[string]string = nil
    return s.Client.DoRequest(ctx, "GET", "search/trending", pathParams, nil, nil, nil)
}

// SearchCoins: GET search
func (s *CoinGeckoService) SearchCoins(ctx context.Context, queryParams map[string]interface{}) (*ApiResponse, error) {
    var pathParams map[string]string = nil
    return s.Client.DoRequest(ctx, "GET", "search", pathParams, queryParams, nil, nil)
}
