use crate::client::Client;
use reqwest::header::HeaderMap;
use std::collections::HashMap;

/// Service for GitHubApiService containing 11 endpoints
pub struct GitHubApiService;

impl GitHubApiService {
    /// GET repos/{owner}/{repo}
    pub async fn get_repository(
        client: &Client,
        owner: &str,
        repo: &str,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let mut path_params = HashMap::new();
        path_params.insert("owner", owner);
        path_params.insert("repo", repo);
        let pp_arg = Some(&path_params);
        client.send_request(
            reqwest::Method::GET,
            "repos/{owner}/{repo}",
            pp_arg,
            None,
            None,
            None,
        ).await
    }

    /// GET repos/{owner}/{repo}/commits
    pub async fn get_repository_commits(
        client: &Client,
        owner: &str,
        repo: &str,
        query_params: Option<&HashMap<&str, &str>>,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let mut path_params = HashMap::new();
        path_params.insert("owner", owner);
        path_params.insert("repo", repo);
        let pp_arg = Some(&path_params);
        client.send_request(
            reqwest::Method::GET,
            "repos/{owner}/{repo}/commits",
            pp_arg,
            query_params,
            None,
            None,
        ).await
    }

    /// GET repos/{owner}/{repo}/contributors
    pub async fn get_repository_contributors(
        client: &Client,
        owner: &str,
        repo: &str,
        query_params: Option<&HashMap<&str, &str>>,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let mut path_params = HashMap::new();
        path_params.insert("owner", owner);
        path_params.insert("repo", repo);
        let pp_arg = Some(&path_params);
        client.send_request(
            reqwest::Method::GET,
            "repos/{owner}/{repo}/contributors",
            pp_arg,
            query_params,
            None,
            None,
        ).await
    }

    /// GET repos/{owner}/{repo}/issues
    pub async fn get_repository_issues(
        client: &Client,
        owner: &str,
        repo: &str,
        query_params: Option<&HashMap<&str, &str>>,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let mut path_params = HashMap::new();
        path_params.insert("owner", owner);
        path_params.insert("repo", repo);
        let pp_arg = Some(&path_params);
        client.send_request(
            reqwest::Method::GET,
            "repos/{owner}/{repo}/issues",
            pp_arg,
            query_params,
            None,
            None,
        ).await
    }

    /// GET repos/{owner}/{repo}/readme
    pub async fn get_repository_readme(
        client: &Client,
        owner: &str,
        repo: &str,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let mut path_params = HashMap::new();
        path_params.insert("owner", owner);
        path_params.insert("repo", repo);
        let pp_arg = Some(&path_params);
        client.send_request(
            reqwest::Method::GET,
            "repos/{owner}/{repo}/readme",
            pp_arg,
            None,
            None,
            None,
        ).await
    }

    /// GET users/{username}
    pub async fn get_user(
        client: &Client,
        username: &str,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let mut path_params = HashMap::new();
        path_params.insert("username", username);
        let pp_arg = Some(&path_params);
        client.send_request(
            reqwest::Method::GET,
            "users/{username}",
            pp_arg,
            None,
            None,
            None,
        ).await
    }

    /// GET users/{username}/repos
    pub async fn get_user_repositories(
        client: &Client,
        username: &str,
        query_params: Option<&HashMap<&str, &str>>,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let mut path_params = HashMap::new();
        path_params.insert("username", username);
        let pp_arg = Some(&path_params);
        client.send_request(
            reqwest::Method::GET,
            "users/{username}/repos",
            pp_arg,
            query_params,
            None,
            None,
        ).await
    }

    /// GET users/{username}/starred
    pub async fn get_user_starred_repositories(
        client: &Client,
        username: &str,
        query_params: Option<&HashMap<&str, &str>>,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let mut path_params = HashMap::new();
        path_params.insert("username", username);
        let pp_arg = Some(&path_params);
        client.send_request(
            reqwest::Method::GET,
            "users/{username}/starred",
            pp_arg,
            query_params,
            None,
            None,
        ).await
    }

    /// GET search/code
    pub async fn search_code(
        client: &Client,
        query_params: Option<&HashMap<&str, &str>>,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let pp_arg = None;
        client.send_request(
            reqwest::Method::GET,
            "search/code",
            pp_arg,
            query_params,
            None,
            None,
        ).await
    }

    /// GET search/repositories
    pub async fn search_repositories(
        client: &Client,
        query_params: Option<&HashMap<&str, &str>>,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let pp_arg = None;
        client.send_request(
            reqwest::Method::GET,
            "search/repositories",
            pp_arg,
            query_params,
            None,
            None,
        ).await
    }

    /// GET search/users
    pub async fn search_users(
        client: &Client,
        query_params: Option<&HashMap<&str, &str>>,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let pp_arg = None;
        client.send_request(
            reqwest::Method::GET,
            "search/users",
            pp_arg,
            query_params,
            None,
            None,
        ).await
    }

}
