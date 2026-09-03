package sdk

import (
    "bytes"
    "context"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "net/url"
    "strings"
    "time"
)

// ApiResponse represents standard API response
type ApiResponse struct {
    Ok         bool
    StatusCode int
    Body       []byte
    Headers    http.Header
}

// Client represents API HTTP Client
type Client struct {
    BaseURL    string
    HTTPClient *http.Client
    Headers    map[string]string
}

// NewClient creates a new Client instance
func NewClient(baseURL string) *Client {
    if baseURL == "" {
        baseURL = "https://api.coingecko.com/api/v3"
    }
    return &Client{
        BaseURL: strings.TrimRight(baseURL, "/"),
        HTTPClient: &http.Client{
            Timeout: 30 * time.Second,
        },
        Headers: map[string]string{
        "Content-Type": "application/json",
        "Cookie": "",
        "Transfer-Encoding": "",
        "User-Agent": "Mozilla/5.0 (Android; Mobile)",
        },
    }
}

// SetAuth sets standard Authorization header
func (c *Client) SetAuth(token string) {
    if !strings.HasPrefix(token, "Bearer ") {
        token = "Bearer " + token
    }
    c.Headers["Authorization"] = token
}

// DoRequest executes an HTTP request
func (c *Client) DoRequest(
    ctx context.Context,
    method string,
    endpoint string,
    pathParams map[string]string,
    queryParams map[string]interface{},
    headers map[string]string,
    payload interface{},
) (*ApiResponse, error) {
    reqPath := endpoint
    if pathParams != nil {
        for k, v := range pathParams {
            reqPath = strings.ReplaceAll(reqPath, "{" + k + "}", url.PathEscape(v))
        }
    }

    fullURL := fmt.Sprintf("%s/%s", c.BaseURL, strings.TrimLeft(reqPath, "/"))

    if queryParams != nil && len(queryParams) > 0 {
        q := url.Values{}
        for k, v := range queryParams {
            if v != nil {
                q.Add(k, fmt.Sprintf("%v", v))
            }
        }
        encoded := q.Encode()
        if encoded != "" {
            fullURL = fmt.Sprintf("%s?%s", fullURL, encoded)
        }
    }

    var bodyReader io.Reader
    if payload != nil {
        b, err := json.Marshal(payload)
        if err != nil {
            return nil, err
        }
        bodyReader = bytes.NewReader(b)
    }

    req, err := http.NewRequestWithContext(ctx, method, fullURL, bodyReader)
    if err != nil {
        return nil, err
    }

    for k, v := range c.Headers {
        req.Header.Set(k, v)
    }
    for k, v := range headers {
        req.Header.Set(k, v)
    }
    if payload != nil && req.Header.Get("Content-Type") == "" {
        req.Header.Set("Content-Type", "application/json")
    }

    resp, err := c.HTTPClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    respBytes, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }

    return &ApiResponse{
        Ok:         resp.StatusCode >= 200 && resp.StatusCode < 300,
        StatusCode: resp.StatusCode,
        Body:       respBytes,
        Headers:    resp.Header,
    }, nil
}
