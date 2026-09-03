#pragma once

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

    explicit Client(std::string url = "https://api.github.com")
        : base_url(std::move(url)) {
        if (!base_url.empty() && base_url.back() == '/') {
            base_url.pop_back();
        }
        default_headers["Content-Type"] = "application/json";
        default_headers["Accept"] = "";
        default_headers["Authorization"] = "";
        default_headers["Cookie"] = "";
        default_headers["Transfer-Encoding"] = "";
        default_headers["User-Agent"] = "Mozilla/5.0 (Android; Mobile)";
        default_headers["X-GitHub-Api-Version"] = "";
    }

    void set_auth(const std::string& token) {
        if (token.rfind("Bearer ", 0) != 0 && token.rfind("bearer ", 0) != 0) {
            default_headers["Authorization"] = "Bearer " + token;
        } else {
            default_headers["Authorization"] = token;
        }
    }

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
        res.body = "{\"status\":\"success\",\"url\":\"" + url + "\"}";
        return res;
    }

    static Client& get_default() {
        static Client instance;
        return instance;
    }
};

} // namespace app
