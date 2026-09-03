#pragma once

#include "client.hpp"
#include "models.hpp"
#include <string>
#include <unordered_map>

namespace app {

class CoinGeckoService {
private:
    const Client& client_;
public:
    explicit CoinGeckoService(const Client& client = Client::get_default())
        : client_(client) {}

    /// GET coins/{id}
    ApiResponse get_coin_detail(const std::string& id, const std::unordered_map<std::string, std::string>& query_params = {}) const {
        RequestOptions opts;
        opts.method = "GET";
        opts.endpoint = "coins/{id}";
        opts.path_params["id"] = id;
        opts.query_params = query_params;
        return client_.request(opts);
    }

    /// GET global
    ApiResponse get_global_data() const {
        RequestOptions opts;
        opts.method = "GET";
        opts.endpoint = "global";
        return client_.request(opts);
    }

    /// GET coins/{id}/market_chart
    ApiResponse get_market_chart(const std::string& id, const std::unordered_map<std::string, std::string>& query_params = {}) const {
        RequestOptions opts;
        opts.method = "GET";
        opts.endpoint = "coins/{id}/market_chart";
        opts.path_params["id"] = id;
        opts.query_params = query_params;
        return client_.request(opts);
    }

    /// GET coins/markets
    ApiResponse get_top_coins(const std::unordered_map<std::string, std::string>& query_params = {}) const {
        RequestOptions opts;
        opts.method = "GET";
        opts.endpoint = "coins/markets";
        opts.query_params = query_params;
        return client_.request(opts);
    }

    /// GET search/trending
    ApiResponse get_trending_coins() const {
        RequestOptions opts;
        opts.method = "GET";
        opts.endpoint = "search/trending";
        return client_.request(opts);
    }

    /// GET search
    ApiResponse search_coins(const std::unordered_map<std::string, std::string>& query_params = {}) const {
        RequestOptions opts;
        opts.method = "GET";
        opts.endpoint = "search";
        opts.query_params = query_params;
        return client_.request(opts);
    }

};

} // namespace app