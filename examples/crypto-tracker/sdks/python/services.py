from typing import Optional, Dict, Any, List
from .client import HttpClient, ApiResponse, default_client
from . import models

class CoinGeckoService:
    """Auto-generated API service with 6 endpoints."""

    @staticmethod
    def get_coin_detail(
        id: Any,
        localization: Optional[Any] = None,
        tickers: Optional[Any] = None,
        market_data: Optional[Any] = None,
        community_data: Optional[Any] = None,
        developer_data: Optional[Any] = None,
        sparkline: Optional[Any] = None,
        client: Optional[HttpClient] = None,
    ) -> ApiResponse[Any]:
        """GET coins/{id}"""
        http = client or default_client
        path_params = {
            "id": id,
        }
        query_params = {
            "localization": localization,
            "tickers": tickers,
            "market_data": market_data,
            "community_data": community_data,
            "developer_data": developer_data,
            "sparkline": sparkline,
        }
        return http.request(
            method="GET",
            endpoint="coins/{id}",
            path_params=path_params,
            query_params=query_params,
            headers=None,
            payload=None,
        )

    @staticmethod
    def get_global_data(
        client: Optional[HttpClient] = None,
    ) -> ApiResponse[Any]:
        """GET global"""
        http = client or default_client
        path_params = None
        query_params = None
        return http.request(
            method="GET",
            endpoint="global",
            path_params=path_params,
            query_params=query_params,
            headers=None,
            payload=None,
        )

    @staticmethod
    def get_market_chart(
        id: Any,
        vs_currency: Optional[Any] = None,
        days: Optional[Any] = None,
        client: Optional[HttpClient] = None,
    ) -> ApiResponse[Any]:
        """GET coins/{id}/market_chart"""
        http = client or default_client
        path_params = {
            "id": id,
        }
        query_params = {
            "vs_currency": vs_currency,
            "days": days,
        }
        return http.request(
            method="GET",
            endpoint="coins/{id}/market_chart",
            path_params=path_params,
            query_params=query_params,
            headers=None,
            payload=None,
        )

    @staticmethod
    def get_top_coins(
        vs_currency: Optional[Any] = None,
        order: Optional[Any] = None,
        per_page: Optional[Any] = None,
        page: Optional[Any] = None,
        sparkline: Optional[Any] = None,
        price_change_percentage: Optional[Any] = None,
        client: Optional[HttpClient] = None,
    ) -> ApiResponse[Any]:
        """GET coins/markets"""
        http = client or default_client
        path_params = None
        query_params = {
            "vs_currency": vs_currency,
            "order": order,
            "per_page": per_page,
            "page": page,
            "sparkline": sparkline,
            "price_change_percentage": price_change_percentage,
        }
        return http.request(
            method="GET",
            endpoint="coins/markets",
            path_params=path_params,
            query_params=query_params,
            headers=None,
            payload=None,
        )

    @staticmethod
    def get_trending_coins(
        client: Optional[HttpClient] = None,
    ) -> ApiResponse[Any]:
        """GET search/trending"""
        http = client or default_client
        path_params = None
        query_params = None
        return http.request(
            method="GET",
            endpoint="search/trending",
            path_params=path_params,
            query_params=query_params,
            headers=None,
            payload=None,
        )

    @staticmethod
    def search_coins(
        query: Optional[Any] = None,
        client: Optional[HttpClient] = None,
    ) -> ApiResponse[Any]:
        """GET search"""
        http = client or default_client
        path_params = None
        query_params = {
            "query": query,
        }
        return http.request(
            method="GET",
            endpoint="search",
            path_params=path_params,
            query_params=query_params,
            headers=None,
            payload=None,
        )
