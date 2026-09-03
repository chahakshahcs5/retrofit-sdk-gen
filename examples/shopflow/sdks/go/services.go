package sdk

import (
    "context"
)

// DummyJsonService provides access to 8 API endpoints.
type DummyJsonService struct {
    Client *Client
}

// NewDummyJsonService initializes a new DummyJsonService
func NewDummyJsonService(client *Client) *DummyJsonService {
    return &DummyJsonService{Client: client}
}

// GetCategories: GET products/categories
func (s *DummyJsonService) GetCategories(ctx context.Context) (*ApiResponse, error) {
    var pathParams map[string]string = nil
    return s.Client.DoRequest(ctx, "GET", "products/categories", pathParams, nil, nil, nil)
}

// GetCategoryList: GET products/category-list
func (s *DummyJsonService) GetCategoryList(ctx context.Context) (*ApiResponse, error) {
    var pathParams map[string]string = nil
    return s.Client.DoRequest(ctx, "GET", "products/category-list", pathParams, nil, nil, nil)
}

// GetCurrentUser: GET auth/me
func (s *DummyJsonService) GetCurrentUser(ctx context.Context) (*ApiResponse, error) {
    var pathParams map[string]string = nil
    return s.Client.DoRequest(ctx, "GET", "auth/me", pathParams, nil, nil, nil)
}

// GetProductById: GET products/{id}
func (s *DummyJsonService) GetProductById(ctx context.Context, id string) (*ApiResponse, error) {
    pathParams := map[string]string{
        "id": id,
    }
    return s.Client.DoRequest(ctx, "GET", "products/{id}", pathParams, nil, nil, nil)
}

// GetProducts: GET products
func (s *DummyJsonService) GetProducts(ctx context.Context, queryParams map[string]interface{}) (*ApiResponse, error) {
    var pathParams map[string]string = nil
    return s.Client.DoRequest(ctx, "GET", "products", pathParams, queryParams, nil, nil)
}

// GetProductsByCategory: GET products/category/{category}
func (s *DummyJsonService) GetProductsByCategory(ctx context.Context, category string, queryParams map[string]interface{}) (*ApiResponse, error) {
    pathParams := map[string]string{
        "category": category,
    }
    return s.Client.DoRequest(ctx, "GET", "products/category/{category}", pathParams, queryParams, nil, nil)
}

// Login: POST auth/login
func (s *DummyJsonService) Login(ctx context.Context, payload interface{}) (*ApiResponse, error) {
    var pathParams map[string]string = nil
    return s.Client.DoRequest(ctx, "POST", "auth/login", pathParams, nil, nil, payload)
}

// SearchProducts: GET products/search
func (s *DummyJsonService) SearchProducts(ctx context.Context, queryParams map[string]interface{}) (*ApiResponse, error) {
    var pathParams map[string]string = nil
    return s.Client.DoRequest(ctx, "GET", "products/search", pathParams, queryParams, nil, nil)
}
