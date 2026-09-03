/**
 * Complete Typed API SDK
 * Lists fully-typed methods for all 11 Retrofit API endpoints
 * Organized 1:1 by authentic Retrofit Service Interfaces from the decompiled Android App.
 * Direct static usage: ServiceName.methodName(params?, payload?, options?, client?)
 */

import * as Types from "./types";
import { HttpClient, ApiResponse, RequestOptions, defaultClient } from "./client";

export { HttpClient, ApiResponse, RequestOptions, defaultClient };
export * as Types from "./types";

// ============================================================================
// GITHUBAPISERVICE (11 Endpoints)
// Source: com/example/data/api/GitHubApiService.java
// ============================================================================

export class GitHubApiService {
  /**
   * GET repos/{owner}/{repo}
   * @interface GitHubApiService
   * @source com/example/data/api/GitHubApiService.java
   * @signature Object getRepository(@Path("owner") String str, @Path("repo") String str2, Continuation<? super GitHubRepo> continuation);
   * @path {owner}, {repo}
   * @response Types.GitHubRepo
   */
  static async getRepository(
    params: { owner: string | number; repo: string | number },
    client: HttpClient = defaultClient,
  ): Promise<ApiResponse<Types.GitHubRepo>> {
    return client.request<Types.GitHubRepo>("GET", "repos/{owner}/{repo}", {
      pathParams: params,
    });
  }

  /**
   * GET repos/{owner}/{repo}/commits
   * @interface GitHubApiService
   * @source com/example/data/api/GitHubApiService.java
   * @signature Object getRepositoryCommits(@Path("owner") String str, @Path("repo") String str2, @Query("per_page") int i, Continuation<? super List<GitHubCommit>> continuation);
   * @path {owner}, {repo}
   * @query per_page?: number
   * @response Types.List_GitHubCommit
   */
  static async getRepositoryCommits(
    params: { owner: string | number; repo: string | number },
    options?: {
      queryParams?: { per_page?: number };
    },
    client: HttpClient = defaultClient,
  ): Promise<ApiResponse<Types.List_GitHubCommit>> {
    return client.request<Types.List_GitHubCommit>("GET", "repos/{owner}/{repo}/commits", {
      pathParams: params,
      queryParams: options?.queryParams,
    });
  }

  /**
   * GET repos/{owner}/{repo}/contributors
   * @interface GitHubApiService
   * @source com/example/data/api/GitHubApiService.java
   * @signature Object getRepositoryContributors(@Path("owner") String str, @Path("repo") String str2, @Query("per_page") int i, Continuation<? super List<GitHubUser>> continuation);
   * @path {owner}, {repo}
   * @query per_page?: number
   * @response Types.List_GitHubUser
   */
  static async getRepositoryContributors(
    params: { owner: string | number; repo: string | number },
    options?: {
      queryParams?: { per_page?: number };
    },
    client: HttpClient = defaultClient,
  ): Promise<ApiResponse<Types.List_GitHubUser>> {
    return client.request<Types.List_GitHubUser>("GET", "repos/{owner}/{repo}/contributors", {
      pathParams: params,
      queryParams: options?.queryParams,
    });
  }

  /**
   * GET repos/{owner}/{repo}/issues
   * @interface GitHubApiService
   * @source com/example/data/api/GitHubApiService.java
   * @signature Object getRepositoryIssues(@Path("owner") String str, @Path("repo") String str2, @Query("state") String str3, @Query("per_page") int i, Continuation<? super List<GitHubIssue>> continuation);
   * @path {owner}, {repo}
   * @query state?: string, per_page?: number
   * @response Types.List_GitHubIssue
   */
  static async getRepositoryIssues(
    params: { owner: string | number; repo: string | number },
    options?: {
      queryParams?: { state?: string; per_page?: number };
    },
    client: HttpClient = defaultClient,
  ): Promise<ApiResponse<Types.List_GitHubIssue>> {
    return client.request<Types.List_GitHubIssue>("GET", "repos/{owner}/{repo}/issues", {
      pathParams: params,
      queryParams: options?.queryParams,
    });
  }

  /**
   * GET repos/{owner}/{repo}/readme
   * @interface GitHubApiService
   * @source com/example/data/api/GitHubApiService.java
   * @signature Object getRepositoryReadme(@Path("owner") String str, @Path("repo") String str2, Continuation<? super GitHubReadme> continuation);
   * @path {owner}, {repo}
   * @response Types.GitHubReadme
   */
  static async getRepositoryReadme(
    params: { owner: string | number; repo: string | number },
    client: HttpClient = defaultClient,
  ): Promise<ApiResponse<Types.GitHubReadme>> {
    return client.request<Types.GitHubReadme>("GET", "repos/{owner}/{repo}/readme", {
      pathParams: params,
    });
  }

  /**
   * GET users/{username}
   * @interface GitHubApiService
   * @source com/example/data/api/GitHubApiService.java
   * @signature Object getUser(@Path("username") String str, Continuation<? super GitHubUser> continuation);
   * @path {username}
   * @response Types.GitHubUser
   */
  static async getUser(
    params: { username: string | number },
    client: HttpClient = defaultClient,
  ): Promise<ApiResponse<Types.GitHubUser>> {
    return client.request<Types.GitHubUser>("GET", "users/{username}", {
      pathParams: params,
    });
  }

  /**
   * GET users/{username}/repos
   * @interface GitHubApiService
   * @source com/example/data/api/GitHubApiService.java
   * @signature Object getUserRepositories(@Path("username") String str, @Query("sort") String str2, @Query("per_page") int i, Continuation<? super List<GitHubRepo>> continuation);
   * @path {username}
   * @query sort?: string, per_page?: number
   * @response Types.List_GitHubRepo
   */
  static async getUserRepositories(
    params: { username: string | number },
    options?: {
      queryParams?: { sort?: string; per_page?: number };
    },
    client: HttpClient = defaultClient,
  ): Promise<ApiResponse<Types.List_GitHubRepo>> {
    return client.request<Types.List_GitHubRepo>("GET", "users/{username}/repos", {
      pathParams: params,
      queryParams: options?.queryParams,
    });
  }

  /**
   * GET users/{username}/starred
   * @interface GitHubApiService
   * @source com/example/data/api/GitHubApiService.java
   * @signature Object getUserStarredRepositories(@Path("username") String str, @Query("per_page") int i, Continuation<? super List<GitHubRepo>> continuation);
   * @path {username}
   * @query per_page?: number
   * @response Types.List_GitHubRepo
   */
  static async getUserStarredRepositories(
    params: { username: string | number },
    options?: {
      queryParams?: { per_page?: number };
    },
    client: HttpClient = defaultClient,
  ): Promise<ApiResponse<Types.List_GitHubRepo>> {
    return client.request<Types.List_GitHubRepo>("GET", "users/{username}/starred", {
      pathParams: params,
      queryParams: options?.queryParams,
    });
  }

  /**
   * GET search/code
   * @interface GitHubApiService
   * @source com/example/data/api/GitHubApiService.java
   * @signature Object searchCode(@Query("q") String str, @Query("sort") String str2, @Query("order") String str3, @Query("page") int i, @Query("per_page") int i2, Continuation<? super SearchResponse<GitHubCodeItem>> continuation);
   * @query q?: string, sort?: string, order?: string, page?: number, per_page?: number
   * @response Types.SearchResponse_GitHubCodeItem
   */
  static async searchCode(
    options?: {
      queryParams?: { q?: string; sort?: string; order?: string; page?: number; per_page?: number };
    },
    client: HttpClient = defaultClient,
  ): Promise<ApiResponse<Types.SearchResponse_GitHubCodeItem>> {
    return client.request<Types.SearchResponse_GitHubCodeItem>("GET", "search/code", {
      queryParams: options?.queryParams,
    });
  }

  /**
   * GET search/repositories
   * @interface GitHubApiService
   * @source com/example/data/api/GitHubApiService.java
   * @signature Object searchRepositories(@Query("q") String str, @Query("sort") String str2, @Query("order") String str3, @Query("page") int i, @Query("per_page") int i2, Continuation<? super SearchResponse<GitHubRepo>> continuation);
   * @query q?: string, sort?: string, order?: string, page?: number, per_page?: number
   * @response Types.SearchResponse_GitHubRepo
   */
  static async searchRepositories(
    options?: {
      queryParams?: { q?: string; sort?: string; order?: string; page?: number; per_page?: number };
    },
    client: HttpClient = defaultClient,
  ): Promise<ApiResponse<Types.SearchResponse_GitHubRepo>> {
    return client.request<Types.SearchResponse_GitHubRepo>("GET", "search/repositories", {
      queryParams: options?.queryParams,
    });
  }

  /**
   * GET search/users
   * @interface GitHubApiService
   * @source com/example/data/api/GitHubApiService.java
   * @signature Object searchUsers(@Query("q") String str, @Query("sort") String str2, @Query("order") String str3, @Query("page") int i, @Query("per_page") int i2, Continuation<? super SearchResponse<GitHubUser>> continuation);
   * @query q?: string, sort?: string, order?: string, page?: number, per_page?: number
   * @response Types.SearchResponse_GitHubUser
   */
  static async searchUsers(
    options?: {
      queryParams?: { q?: string; sort?: string; order?: string; page?: number; per_page?: number };
    },
    client: HttpClient = defaultClient,
  ): Promise<ApiResponse<Types.SearchResponse_GitHubUser>> {
    return client.request<Types.SearchResponse_GitHubUser>("GET", "search/users", {
      queryParams: options?.queryParams,
    });
  }
}

// ============================================================================
// MASTER API SDK OBJECT (1 Services)
// ============================================================================

export const sdk = {
  client: defaultClient,
  GitHubApiService,
};

// Universal SDK export
export const apiSdk = sdk;
export default sdk;
