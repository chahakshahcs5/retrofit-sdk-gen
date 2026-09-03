#pragma once

#include "client.hpp"
#include "models.hpp"
#include <string>
#include <unordered_map>

namespace app {

class DummyJsonService {
private:
    const Client& client_;
public:
    explicit DummyJsonService(const Client& client = Client::get_default())
        : client_(client) {}

    /// GET products/categories
    ApiResponse get_categories() const {
        RequestOptions opts;
        opts.method = "GET";
        opts.endpoint = "products/categories";
        return client_.request(opts);
    }

    /// GET products/category-list
    ApiResponse get_category_list() const {
        RequestOptions opts;
        opts.method = "GET";
        opts.endpoint = "products/category-list";
        return client_.request(opts);
    }

    /// GET auth/me
    ApiResponse get_current_user() const {
        RequestOptions opts;
        opts.method = "GET";
        opts.endpoint = "auth/me";
        return client_.request(opts);
    }

    /// GET products/{id}
    ApiResponse get_product_by_id(const std::string& id) const {
        RequestOptions opts;
        opts.method = "GET";
        opts.endpoint = "products/{id}";
        opts.path_params["id"] = id;
        return client_.request(opts);
    }

    /// GET products
    ApiResponse get_products(const std::unordered_map<std::string, std::string>& query_params = {}) const {
        RequestOptions opts;
        opts.method = "GET";
        opts.endpoint = "products";
        opts.query_params = query_params;
        return client_.request(opts);
    }

    /// GET products/category/{category}
    ApiResponse get_products_by_category(const std::string& category, const std::unordered_map<std::string, std::string>& query_params = {}) const {
        RequestOptions opts;
        opts.method = "GET";
        opts.endpoint = "products/category/{category}";
        opts.path_params["category"] = category;
        opts.query_params = query_params;
        return client_.request(opts);
    }

    /// POST auth/login
    ApiResponse login(const std::string& payload = "") const {
        RequestOptions opts;
        opts.method = "POST";
        opts.endpoint = "auth/login";
        opts.payload = payload;
        return client_.request(opts);
    }

    /// GET products/search
    ApiResponse search_products(const std::unordered_map<std::string, std::string>& query_params = {}) const {
        RequestOptions opts;
        opts.method = "GET";
        opts.endpoint = "products/search";
        opts.query_params = query_params;
        return client_.request(opts);
    }

};

} // namespace app