import { SecurityScanResult } from "../../core/security-scanner";

export function generateRustClient(
  baseUrl: string,
  securityResult?: SecurityScanResult
): string {
  const cleanUrl = (baseUrl || "https://api.example.com").replace(/\/+$/, "");

  const headerLines: string[] = ['        headers.insert(reqwest::header::CONTENT_TYPE, "application/json".parse().unwrap());'];
  if (securityResult?.detectedHeaderNames && securityResult.detectedHeaderNames.length > 0) {
    const skip = new Set(["content-type", "content-length", "host", "connection", "accept-encoding"]);
    for (const h of securityResult.detectedHeaderNames) {
      if (!skip.has(h.toLowerCase())) {
        if (h.toLowerCase() === "user-agent") {
          headerLines.push(`        if let Ok(val) = "Mozilla/5.0 (Android; Mobile)".parse() { headers.insert("${h}", val); }`);
        } else if (h.toLowerCase().includes("priority")) {
          headerLines.push(`        if let Ok(val) = "normal".parse() { headers.insert("${h}", val); }`);
        } else {
          headerLines.push(`        if let Ok(val) = "".parse() { headers.insert("${h}", val); }`);
        }
      }
    }
  }

  let authHelper = "";
  if (securityResult?.authHeaders && securityResult.authHeaders.length > 0) {
    const authH = securityResult.authHeaders[0];
    authHelper = `
    pub fn with_token(mut self, token: &str) -> Self {
        let auth_val = if token.starts_with("Bearer ") || token.starts_with("bearer ") {
            token.to_string()
        } else {
            format!("Bearer {}", token)
        };
        if let Ok(val) = auth_val.parse() {
            self.headers.insert("${authH}", val);
        }
        self
    }
`;
  } else {
    authHelper = `
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
`;
  }

  return `use reqwest::header::HeaderMap;
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
${headerLines.join("\n")}

        let http_client = reqwest::Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .unwrap_or_default();

        Self {
            base_url: base_url.unwrap_or("${cleanUrl}").trim_end_matches('/').to_string(),
            http_client,
            headers,
        }
    }
${authHelper}
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
`;
}
