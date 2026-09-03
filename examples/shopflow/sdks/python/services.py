from typing import Optional, Dict, Any, List
from .client import HttpClient, ApiResponse, default_client
from . import models

class DummyJsonService:
    """Auto-generated API service with 8 endpoints."""

    @staticmethod
    def get_categories(
        client: Optional[HttpClient] = None,
    ) -> ApiResponse[Any]:
        """GET products/categories"""
        http = client or default_client
        path_params = None
        query_params = None
        return http.request(
            method="GET",
            endpoint="products/categories",
            path_params=path_params,
            query_params=query_params,
            headers=None,
            payload=None,
        )

    @staticmethod
    def get_category_list(
        client: Optional[HttpClient] = None,
    ) -> ApiResponse[Any]:
        """GET products/category-list"""
        http = client or default_client
        path_params = None
        query_params = None
        return http.request(
            method="GET",
            endpoint="products/category-list",
            path_params=path_params,
            query_params=query_params,
            headers=None,
            payload=None,
        )

    @staticmethod
    def get_current_user(
        client: Optional[HttpClient] = None,
    ) -> ApiResponse[Any]:
        """GET auth/me"""
        http = client or default_client
        path_params = None
        query_params = None
        return http.request(
            method="GET",
            endpoint="auth/me",
            path_params=path_params,
            query_params=query_params,
            headers=None,
            payload=None,
        )

    @staticmethod
    def get_product_by_id(
        id: Any,
        client: Optional[HttpClient] = None,
    ) -> ApiResponse[Any]:
        """GET products/{id}"""
        http = client or default_client
        path_params = {
            "id": id,
        }
        query_params = None
        return http.request(
            method="GET",
            endpoint="products/{id}",
            path_params=path_params,
            query_params=query_params,
            headers=None,
            payload=None,
        )

    @staticmethod
    def get_products(
        limit: Optional[Any] = None,
        skip: Optional[Any] = None,
        sortBy: Optional[Any] = None,
        order: Optional[Any] = None,
        client: Optional[HttpClient] = None,
    ) -> ApiResponse[Any]:
        """GET products"""
        http = client or default_client
        path_params = None
        query_params = {
            "limit": limit,
            "skip": skip,
            "sortBy": sortBy,
            "order": order,
        }
        return http.request(
            method="GET",
            endpoint="products",
            path_params=path_params,
            query_params=query_params,
            headers=None,
            payload=None,
        )

    @staticmethod
    def get_products_by_category(
        category: Any,
        limit: Optional[Any] = None,
        skip: Optional[Any] = None,
        sortBy: Optional[Any] = None,
        order: Optional[Any] = None,
        client: Optional[HttpClient] = None,
    ) -> ApiResponse[Any]:
        """GET products/category/{category}"""
        http = client or default_client
        path_params = {
            "category": category,
        }
        query_params = {
            "limit": limit,
            "skip": skip,
            "sortBy": sortBy,
            "order": order,
        }
        return http.request(
            method="GET",
            endpoint="products/category/{category}",
            path_params=path_params,
            query_params=query_params,
            headers=None,
            payload=None,
        )

    @staticmethod
    def login(
        payload: Optional[Any] = None,
        client: Optional[HttpClient] = None,
    ) -> ApiResponse[Any]:
        """POST auth/login"""
        http = client or default_client
        path_params = None
        query_params = None
        return http.request(
            method="POST",
            endpoint="auth/login",
            path_params=path_params,
            query_params=query_params,
            headers=None,
            payload=payload,
        )

    @staticmethod
    def search_products(
        q: Optional[Any] = None,
        limit: Optional[Any] = None,
        skip: Optional[Any] = None,
        sortBy: Optional[Any] = None,
        order: Optional[Any] = None,
        client: Optional[HttpClient] = None,
    ) -> ApiResponse[Any]:
        """GET products/search"""
        http = client or default_client
        path_params = None
        query_params = {
            "q": q,
            "limit": limit,
            "skip": skip,
            "sortBy": sortBy,
            "order": order,
        }
        return http.request(
            method="GET",
            endpoint="products/search",
            path_params=path_params,
            query_params=query_params,
            headers=None,
            payload=None,
        )
