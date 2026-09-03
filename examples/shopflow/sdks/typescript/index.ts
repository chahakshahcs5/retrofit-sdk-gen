/**
 * Complete Typed API SDK
 * Lists fully-typed methods for all 8 Retrofit API endpoints
 * Organized 1:1 by authentic Retrofit Service Interfaces from the decompiled Android App.
 * Direct static usage: ServiceName.methodName(params?, payload?, options?, client?)
 */

import * as Types from "./types";
import { HttpClient, ApiResponse, RequestOptions, defaultClient } from "./client";

export { HttpClient, ApiResponse, RequestOptions, defaultClient };
export * as Types from "./types";

// ============================================================================
// DUMMYJSONAPI (8 Endpoints)
// Source: com/example/data/api/DummyJsonApi.java
// ============================================================================

export class DummyJsonApi {
  /**
   * GET products/categories
   * @interface DummyJsonApi
   * @source com/example/data/api/DummyJsonApi.java
   * @signature Object getCategories(Continuation<? super List<CategoryItem>> continuation);
   * @response Types.List_CategoryItem
   */
  static async getCategories(
    client: HttpClient = defaultClient,
  ): Promise<ApiResponse<Types.List_CategoryItem>> {
    return client.request<Types.List_CategoryItem>("GET", "products/categories");
  }

  /**
   * GET products/category-list
   * @interface DummyJsonApi
   * @source com/example/data/api/DummyJsonApi.java
   * @signature Object getCategoryList(Continuation<? super List<String>> continuation);
   * @response Types.List_String
   */
  static async getCategoryList(
    client: HttpClient = defaultClient,
  ): Promise<ApiResponse<Types.List_String>> {
    return client.request<Types.List_String>("GET", "products/category-list");
  }

  /**
   * GET auth/me
   * @interface DummyJsonApi
   * @source com/example/data/api/DummyJsonApi.java
   * @signature Object getCurrentUser(Continuation<? super LoginResponse> continuation);
   * @response Types.LoginResponse
   */
  static async getCurrentUser(
    client: HttpClient = defaultClient,
  ): Promise<ApiResponse<Types.LoginResponse>> {
    return client.request<Types.LoginResponse>("GET", "auth/me");
  }

  /**
   * GET products/{id}
   * @interface DummyJsonApi
   * @source com/example/data/api/DummyJsonApi.java
   * @signature Object getProductById(@Path("id") int i, Continuation<? super Product> continuation);
   * @path {id}
   * @response Types.Product
   */
  static async getProductById(
    params: { id: string | number },
    client: HttpClient = defaultClient,
  ): Promise<ApiResponse<Types.Product>> {
    return client.request<Types.Product>("GET", "products/{id}", {
      pathParams: params,
    });
  }

  /**
   * GET products
   * @interface DummyJsonApi
   * @source com/example/data/api/DummyJsonApi.java
   * @signature Object getProducts(@Query("limit") int i, @Query("skip") int i2, @Query("sortBy") String str, @Query("order") String str2, Continuation<? super ProductsResponse> continuation);
   * @query limit?: number, skip?: number, sortBy?: string, order?: string
   * @response Types.ProductsResponse
   */
  static async getProducts(
    options?: {
      queryParams?: { limit?: number; skip?: number; sortBy?: string; order?: string };
    },
    client: HttpClient = defaultClient,
  ): Promise<ApiResponse<Types.ProductsResponse>> {
    return client.request<Types.ProductsResponse>("GET", "products", {
      queryParams: options?.queryParams,
    });
  }

  /**
   * GET products/category/{category}
   * @interface DummyJsonApi
   * @source com/example/data/api/DummyJsonApi.java
   * @signature Object getProductsByCategory(@Path("category") String str, @Query("limit") int i, @Query("skip") int i2, @Query("sortBy") String str2, @Query("order") String str3, Continuation<? super ProductsResponse> continuation);
   * @path {category}
   * @query limit?: number, skip?: number, sortBy?: string, order?: string
   * @response Types.ProductsResponse
   */
  static async getProductsByCategory(
    params: { category: string | number },
    options?: {
      queryParams?: { limit?: number; skip?: number; sortBy?: string; order?: string };
    },
    client: HttpClient = defaultClient,
  ): Promise<ApiResponse<Types.ProductsResponse>> {
    return client.request<Types.ProductsResponse>("GET", "products/category/{category}", {
      pathParams: params,
      queryParams: options?.queryParams,
    });
  }

  /**
   * POST auth/login
   * @interface DummyJsonApi
   * @source com/example/data/api/DummyJsonApi.java
   * @signature Object login(@Body LoginRequest loginRequest, Continuation<? super LoginResponse> continuation);
   * @payload Types.LoginRequest
   * @response Types.LoginResponse
   */
  static async login(
    payload: Types.LoginRequest,
    client: HttpClient = defaultClient,
  ): Promise<ApiResponse<Types.LoginResponse>> {
    return client.request<Types.LoginResponse>("POST", "auth/login", {
      payload,
    });
  }

  /**
   * GET products/search
   * @interface DummyJsonApi
   * @source com/example/data/api/DummyJsonApi.java
   * @signature Object searchProducts(@Query("q") String str, @Query("limit") int i, @Query("skip") int i2, @Query("sortBy") String str2, @Query("order") String str3, Continuation<? super ProductsResponse> continuation);
   * @query q?: string, limit?: number, skip?: number, sortBy?: string, order?: string
   * @response Types.ProductsResponse
   */
  static async searchProducts(
    options?: {
      queryParams?: { q?: string; limit?: number; skip?: number; sortBy?: string; order?: string };
    },
    client: HttpClient = defaultClient,
  ): Promise<ApiResponse<Types.ProductsResponse>> {
    return client.request<Types.ProductsResponse>("GET", "products/search", {
      queryParams: options?.queryParams,
    });
  }
}

// ============================================================================
// MASTER API SDK OBJECT (1 Services)
// ============================================================================

export const sdk = {
  client: defaultClient,
  DummyJsonApi,
};

// Universal SDK export
export const apiSdk = sdk;
export default sdk;
