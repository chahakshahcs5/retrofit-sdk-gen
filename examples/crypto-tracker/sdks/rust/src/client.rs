use reqwest::header::HeaderMap;
use std::time::Duration;

#[derive(Clone, Debug)]
pub struct Client {
    pub base_url: String,
    pub http_client: reqwest::Client,
    pub headers: HeaderMap,
}

impl Client {
    pub fn new(base_url: Option<&str>) -> Self {
        let mut headers = HeaderMap::new();
        headers.insert(reqwest::header::CONTENT_TYPE, "application/json".parse().unwrap());
        if let Ok(val) = "".parse() { headers.insert("Cookie", val); }
        if let Ok(val) = "".parse() { headers.insert("Transfer-Encoding", val); }
        if let Ok(val) = "Mozilla/5.0 (Android; Mobile)".parse() { headers.insert("User-Agent", val); }

        let http_client = reqwest::Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .unwrap_or_default();

        Self {
            base_url: base_url.unwrap_or("https://api.coingecko.com/api/v3").trim_end_matches('/').to_string(),
            http_client,
            headers,
        }
    }

    pub fn with_token(mut self, token: &str) -> Self {
        let auth_val = if token.starts_with("Bearer ") || token.starts_with("bearer ") {
            token.to_string()
        } else {
            format!("Bearer {}", token)
        };
        if let Ok(val) = auth_val.parse() {
            self.headers.insert(reqwest::header::AUTHORIZATION, val);
        }
        self
    }

    pub async fn send_request(
        &self,
        method: reqwest::Method,
        endpoint: &str,
        path_params: Option<&std::collections::HashMap<&str, &str>>,
        query_params: Option<&std::collections::HashMap<&str, &str>>,
        custom_headers: Option<&HeaderMap>,
        payload: Option<&serde_json::Value>,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let mut path = endpoint.to_string();
        if let Some(params) = path_params {
            for (k, v) in params {
                path = path.replace(&format!("{{{}}}", k), v);
            }
        }

        let url = format!("{}/{}", self.base_url, path.trim_start_matches('/'));
        let mut req = self.http_client.request(method, &url);

        let mut all_headers = self.headers.clone();
        if let Some(h) = custom_headers {
            for (k, v) in h.iter() {
                all_headers.insert(k.clone(), v.clone());
            }
        }
        req = req.headers(all_headers);

        if let Some(q) = query_params {
            req = req.query(q);
        }

        if let Some(body) = payload {
            req = req.json(body);
        }

        req.send().await
    }
}

impl Default for Client {
    fn default() -> Self {
        Self::new(None)
    }
}
