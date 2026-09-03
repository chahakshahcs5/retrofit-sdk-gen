package com.app.sdk;

import java.util.HashMap;
import java.util.Map;

public final class Services {
    private Services() {}

    public static class DummyJsonService {
        private final Client client;

        public DummyJsonService(Client client) {
            this.client = client != null ? client : new Client();
        }

        public DummyJsonService() {
            this(new Client());
        }

        /** GET products/categories */
        public ApiResponse<String> getCategories() {
            Map<String, String> pathParams = null;
            return this.client.send("GET", "products/categories", pathParams, null, null, null);
        }

        /** GET products/category-list */
        public ApiResponse<String> getCategoryList() {
            Map<String, String> pathParams = null;
            return this.client.send("GET", "products/category-list", pathParams, null, null, null);
        }

        /** GET auth/me */
        public ApiResponse<String> getCurrentUser() {
            Map<String, String> pathParams = null;
            return this.client.send("GET", "auth/me", pathParams, null, null, null);
        }

        /** GET products/{id} */
        public ApiResponse<String> getProductById(String id) {
            Map<String, String> pathParams = new HashMap<>();
            pathParams.put("id", id);
            return this.client.send("GET", "products/{id}", pathParams, null, null, null);
        }

        /** GET products */
        public ApiResponse<String> getProducts(Map<String, Object> queryParams) {
            Map<String, String> pathParams = null;
            return this.client.send("GET", "products", pathParams, queryParams, null, null);
        }

        /** GET products/category/{category} */
        public ApiResponse<String> getProductsByCategory(String category, Map<String, Object> queryParams) {
            Map<String, String> pathParams = new HashMap<>();
            pathParams.put("category", category);
            return this.client.send("GET", "products/category/{category}", pathParams, queryParams, null, null);
        }

        /** POST auth/login */
        public ApiResponse<String> login(String payload) {
            Map<String, String> pathParams = null;
            return this.client.send("POST", "auth/login", pathParams, null, null, payload);
        }

        /** GET products/search */
        public ApiResponse<String> searchProducts(Map<String, Object> queryParams) {
            Map<String, String> pathParams = null;
            return this.client.send("GET", "products/search", pathParams, queryParams, null, null);
        }

    }

}