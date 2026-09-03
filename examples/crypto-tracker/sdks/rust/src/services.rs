use crate::client::Client;
use reqwest::header::HeaderMap;
use std::collections::HashMap;

/// Service for CoinGeckoService containing 6 endpoints
pub struct CoinGeckoService;

impl CoinGeckoService {
    /// GET coins/{id}
    pub async fn get_coin_detail(
        client: &Client,
        id: &str,
        query_params: Option<&HashMap<&str, &str>>,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let mut path_params = HashMap::new();
        path_params.insert("id", id);
        let pp_arg = Some(&path_params);
        client.send_request(
            reqwest::Method::GET,
            "coins/{id}",
            pp_arg,
            query_params,
            None,
            None,
        ).await
    }

    /// GET global
    pub async fn get_global_data(
        client: &Client,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let pp_arg = None;
        client.send_request(
            reqwest::Method::GET,
            "global",
            pp_arg,
            None,
            None,
            None,
        ).await
    }

    /// GET coins/{id}/market_chart
    pub async fn get_market_chart(
        client: &Client,
        id: &str,
        query_params: Option<&HashMap<&str, &str>>,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let mut path_params = HashMap::new();
        path_params.insert("id", id);
        let pp_arg = Some(&path_params);
        client.send_request(
            reqwest::Method::GET,
            "coins/{id}/market_chart",
            pp_arg,
            query_params,
            None,
            None,
        ).await
    }

    /// GET coins/markets
    pub async fn get_top_coins(
        client: &Client,
        query_params: Option<&HashMap<&str, &str>>,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let pp_arg = None;
        client.send_request(
            reqwest::Method::GET,
            "coins/markets",
            pp_arg,
            query_params,
            None,
            None,
        ).await
    }

    /// GET search/trending
    pub async fn get_trending_coins(
        client: &Client,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let pp_arg = None;
        client.send_request(
            reqwest::Method::GET,
            "search/trending",
            pp_arg,
            None,
            None,
            None,
        ).await
    }

    /// GET search
    pub async fn search_coins(
        client: &Client,
        query_params: Option<&HashMap<&str, &str>>,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let pp_arg = None;
        client.send_request(
            reqwest::Method::GET,
            "search",
            pp_arg,
            query_params,
            None,
            None,
        ).await
    }

}
