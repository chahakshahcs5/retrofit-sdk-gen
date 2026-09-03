from typing import Optional, Dict, Any, List
from .client import HttpClient, ApiResponse, default_client
from . import models

class GitHubApiService:
    """Auto-generated API service with 11 endpoints."""

    @staticmethod
    def get_repository(
        owner: Any,
        repo: Any,
        client: Optional[HttpClient] = None,
    ) -> ApiResponse[Any]:
        """GET repos/{owner}/{repo}"""
        http = client or default_client
        path_params = {
            "owner": owner,
            "repo": repo,
        }
        query_params = None
        return http.request(
            method="GET",
            endpoint="repos/{owner}/{repo}",
            path_params=path_params,
            query_params=query_params,
            headers=None,
            payload=None,
        )

    @staticmethod
    def get_repository_commits(
        owner: Any,
        repo: Any,
        per_page: Optional[Any] = None,
        client: Optional[HttpClient] = None,
    ) -> ApiResponse[Any]:
        """GET repos/{owner}/{repo}/commits"""
        http = client or default_client
        path_params = {
            "owner": owner,
            "repo": repo,
        }
        query_params = {
            "per_page": per_page,
        }
        return http.request(
            method="GET",
            endpoint="repos/{owner}/{repo}/commits",
            path_params=path_params,
            query_params=query_params,
            headers=None,
            payload=None,
        )

    @staticmethod
    def get_repository_contributors(
        owner: Any,
        repo: Any,
        per_page: Optional[Any] = None,
        client: Optional[HttpClient] = None,
    ) -> ApiResponse[Any]:
        """GET repos/{owner}/{repo}/contributors"""
        http = client or default_client
        path_params = {
            "owner": owner,
            "repo": repo,
        }
        query_params = {
            "per_page": per_page,
        }
        return http.request(
            method="GET",
            endpoint="repos/{owner}/{repo}/contributors",
            path_params=path_params,
            query_params=query_params,
            headers=None,
            payload=None,
        )

    @staticmethod
    def get_repository_issues(
        owner: Any,
        repo: Any,
        state: Optional[Any] = None,
        per_page: Optional[Any] = None,
        client: Optional[HttpClient] = None,
    ) -> ApiResponse[Any]:
        """GET repos/{owner}/{repo}/issues"""
        http = client or default_client
        path_params = {
            "owner": owner,
            "repo": repo,
        }
        query_params = {
            "state": state,
            "per_page": per_page,
        }
        return http.request(
            method="GET",
            endpoint="repos/{owner}/{repo}/issues",
            path_params=path_params,
            query_params=query_params,
            headers=None,
            payload=None,
        )

    @staticmethod
    def get_repository_readme(
        owner: Any,
        repo: Any,
        client: Optional[HttpClient] = None,
    ) -> ApiResponse[Any]:
        """GET repos/{owner}/{repo}/readme"""
        http = client or default_client
        path_params = {
            "owner": owner,
            "repo": repo,
        }
        query_params = None
        return http.request(
            method="GET",
            endpoint="repos/{owner}/{repo}/readme",
            path_params=path_params,
            query_params=query_params,
            headers=None,
            payload=None,
        )

    @staticmethod
    def get_user(
        username: Any,
        client: Optional[HttpClient] = None,
    ) -> ApiResponse[Any]:
        """GET users/{username}"""
        http = client or default_client
        path_params = {
            "username": username,
        }
        query_params = None
        return http.request(
            method="GET",
            endpoint="users/{username}",
            path_params=path_params,
            query_params=query_params,
            headers=None,
            payload=None,
        )

    @staticmethod
    def get_user_repositories(
        username: Any,
        sort: Optional[Any] = None,
        per_page: Optional[Any] = None,
        client: Optional[HttpClient] = None,
    ) -> ApiResponse[Any]:
        """GET users/{username}/repos"""
        http = client or default_client
        path_params = {
            "username": username,
        }
        query_params = {
            "sort": sort,
            "per_page": per_page,
        }
        return http.request(
            method="GET",
            endpoint="users/{username}/repos",
            path_params=path_params,
            query_params=query_params,
            headers=None,
            payload=None,
        )

    @staticmethod
    def get_user_starred_repositories(
        username: Any,
        per_page: Optional[Any] = None,
        client: Optional[HttpClient] = None,
    ) -> ApiResponse[Any]:
        """GET users/{username}/starred"""
        http = client or default_client
        path_params = {
            "username": username,
        }
        query_params = {
            "per_page": per_page,
        }
        return http.request(
            method="GET",
            endpoint="users/{username}/starred",
            path_params=path_params,
            query_params=query_params,
            headers=None,
            payload=None,
        )

    @staticmethod
    def search_code(
        q: Optional[Any] = None,
        sort: Optional[Any] = None,
        order: Optional[Any] = None,
        page: Optional[Any] = None,
        per_page: Optional[Any] = None,
        client: Optional[HttpClient] = None,
    ) -> ApiResponse[Any]:
        """GET search/code"""
        http = client or default_client
        path_params = None
        query_params = {
            "q": q,
            "sort": sort,
            "order": order,
            "page": page,
            "per_page": per_page,
        }
        return http.request(
            method="GET",
            endpoint="search/code",
            path_params=path_params,
            query_params=query_params,
            headers=None,
            payload=None,
        )

    @staticmethod
    def search_repositories(
        q: Optional[Any] = None,
        sort: Optional[Any] = None,
        order: Optional[Any] = None,
        page: Optional[Any] = None,
        per_page: Optional[Any] = None,
        client: Optional[HttpClient] = None,
    ) -> ApiResponse[Any]:
        """GET search/repositories"""
        http = client or default_client
        path_params = None
        query_params = {
            "q": q,
            "sort": sort,
            "order": order,
            "page": page,
            "per_page": per_page,
        }
        return http.request(
            method="GET",
            endpoint="search/repositories",
            path_params=path_params,
            query_params=query_params,
            headers=None,
            payload=None,
        )

    @staticmethod
    def search_users(
        q: Optional[Any] = None,
        sort: Optional[Any] = None,
        order: Optional[Any] = None,
        page: Optional[Any] = None,
        per_page: Optional[Any] = None,
        client: Optional[HttpClient] = None,
    ) -> ApiResponse[Any]:
        """GET search/users"""
        http = client or default_client
        path_params = None
        query_params = {
            "q": q,
            "sort": sort,
            "order": order,
            "page": page,
            "per_page": per_page,
        }
        return http.request(
            method="GET",
            endpoint="search/users",
            path_params=path_params,
            query_params=query_params,
            headers=None,
            payload=None,
        )
