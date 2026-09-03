use crate::client::Client;
use reqwest::header::HeaderMap;
use std::collections::HashMap;

/// Service for DummyJsonService containing 8 endpoints
pub struct DummyJsonService;

impl DummyJsonService {
    /// GET products/categories
    pub async fn get_categories(
        client: &Client,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let pp_arg = None;
        client.send_request(
            reqwest::Method::GET,
            "products/categories",
            pp_arg,
            None,
            None,
            None,
        ).await
    }

    /// GET products/category-list
    pub async fn get_category_list(
        client: &Client,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let pp_arg = None;
        client.send_request(
            reqwest::Method::GET,
            "products/category-list",
            pp_arg,
            None,
            None,
            None,
        ).await
    }

    /// GET auth/me
    pub async fn get_current_user(
        client: &Client,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let pp_arg = None;
        client.send_request(
            reqwest::Method::GET,
            "auth/me",
            pp_arg,
            None,
            None,
            None,
        ).await
    }

    /// GET products/{id}
    pub async fn get_product_by_id(
        client: &Client,
        id: &str,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let mut path_params = HashMap::new();
        path_params.insert("id", id);
        let pp_arg = Some(&path_params);
        client.send_request(
            reqwest::Method::GET,
            "products/{id}",
            pp_arg,
            None,
            None,
            None,
        ).await
    }

    /// GET products
    pub async fn get_products(
        client: &Client,
        query_params: Option<&HashMap<&str, &str>>,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let pp_arg = None;
        client.send_request(
            reqwest::Method::GET,
            "products",
            pp_arg,
            query_params,
            None,
            None,
        ).await
    }

    /// GET products/category/{category}
    pub async fn get_products_by_category(
        client: &Client,
        category: &str,
        query_params: Option<&HashMap<&str, &str>>,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let mut path_params = HashMap::new();
        path_params.insert("category", category);
        let pp_arg = Some(&path_params);
        client.send_request(
            reqwest::Method::GET,
            "products/category/{category}",
            pp_arg,
            query_params,
            None,
            None,
        ).await
    }

    /// POST auth/login
    pub async fn login(
        client: &Client,
        payload: Option<&serde_json::Value>,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let pp_arg = None;
        client.send_request(
            reqwest::Method::POST,
            "auth/login",
            pp_arg,
            None,
            None,
            payload,
        ).await
    }

    /// GET products/search
    pub async fn search_products(
        client: &Client,
        query_params: Option<&HashMap<&str, &str>>,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let pp_arg = None;
        client.send_request(
            reqwest::Method::GET,
            "products/search",
            pp_arg,
            query_params,
            None,
            None,
        ).await
    }

}
