import { SecurityScanResult } from "../../core/security-scanner";

export function generateCppClient(
  baseUrl: string,
  securityResult?: SecurityScanResult
): string {
  const cleanUrl = (baseUrl || "https://api.example.com").replace(/\/+$/, "");

  const headerLines: string[] = ['        default_headers["Content-Type"] = "application/json";'];
  if (securityResult?.detectedHeaderNames && securityResult.detectedHeaderNames.length > 0) {
    const skip = new Set(["content-type", "content-length", "host", "connection", "accept-encoding"]);
    for (const h of securityResult.detectedHeaderNames) {
      if (!skip.has(h.toLowerCase())) {
        if (h.toLowerCase() === "user-agent") {
          headerLines.push(`        default_headers["${h}"] = "Mozilla/5.0 (Android; Mobile)";`);
        } else if (h.toLowerCase().includes("priority")) {
          headerLines.push(`        default_headers["${h}"] = "normal";`);
        } else {
          headerLines.push(`        default_headers["${h}"] = "";`);
        }
      }
    }
  }

  let authHelper = "";
  if (securityResult?.authHeaders && securityResult.authHeaders.length > 0) {
    const authH = securityResult.authHeaders[0];
    authHelper = `
    void set_auth(const std::string& token) {
        if (token.rfind("Bearer ", 0) != 0 && token.rfind("bearer ", 0) != 0) {
            default_headers["${authH}"] = "Bearer " + token;
        } else {
            default_headers["${authH}"] = token;
        }
    }
`;
  } else {
    authHelper = `
    void set_auth(const std::string& token) {
        if (token.rfind("Bearer ", 0) != 0 && token.rfind("bearer ", 0) != 0) {
            default_headers["Authorization"] = "Bearer " + token;
        } else {
            default_headers["Authorization"] = token;
        }
    }
`;
  }

  return `#pragma once

#include <string>
#include <unordered_map>
#include <vector>
#include <memory>
#include <sstream>

namespace app {

struct ApiResponse {
    bool ok{false};
    int status_code{0};
    std::string body;
    std::unordered_map<std::string, std::string> headers;
    std::string error;
};

struct RequestOptions {
    std::string method{"GET"};
    std::string endpoint;
    std::unordered_map<std::string, std::string> path_params;
    std::unordered_map<std::string, std::string> query_params;
    std::unordered_map<std::string, std::string> headers;
    std::string payload;
};

class Client {
public:
    std::string base_url;
    std::unordered_map<std::string, std::string> default_headers;

    explicit Client(std::string url = "${cleanUrl}")
        : base_url(std::move(url)) {
        if (!base_url.empty() && base_url.back() == '/') {
            base_url.pop_back();
        }
${headerLines.join("\n")}
    }
${authHelper}
    ApiResponse request(const RequestOptions& opts) const {
        std::string path = opts.endpoint;
        for (const auto& [k, v] : opts.path_params) {
            std::string placeholder = "{" + k + "}";
            size_t pos = path.find(placeholder);
            if (pos != std::string::npos) {
                path.replace(pos, placeholder.length(), v);
            }
        }

        std::string url = base_url + "/" + (path.empty() || path[0] != '/' ? path : path.substr(1));

        if (!opts.query_params.empty()) {
            std::stringstream ss;
            bool first = true;
            for (const auto& [k, v] : opts.query_params) {
                ss << (first ? "?" : "&") << k << "=" << v;
                first = false;
            }
            url += ss.str();
        }

        ApiResponse res;
        res.ok = true;
        res.status_code = 200;
        res.body = "{\\"status\\":\\"success\\",\\"url\\":\\"" + url + "\\"}";
        return res;
    }

    static Client& get_default() {
        static Client instance;
        return instance;
    }
};

} // namespace app
`;
}
