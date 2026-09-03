/**
 * Auto-generated TypeScript Interfaces for API Payloads and Responses
 * Extracted from decompiled Retrofit Java interfaces and Moshi/Gson data models
 * Total models: 11
 */

// ============================================================================
// COMMON MODULE MODELS (1)
// ============================================================================

/**
 * Model: LicenseInfo
 * Nested child model / DTO
 */
export interface LicenseInfo {
  key?: string;
  name?: string;
  spdxId?: string;
}

// ============================================================================
// DATA MODULE MODELS (10)
// ============================================================================

/**
 * Model: GitHubRepo
 * @response For:
 *   - GET repos/{owner}/{repo}
 */
export interface GitHubRepo {
  id?: number;
  name?: string;
  fullName?: string;
  description?: string;
  htmlUrl?: string;
  stargazersCount?: number;
  forksCount?: number;
  openIssuesCount?: number;
  watchersCount?: number;
  language?: string;
  defaultBranch?: string;
  updatedAt?: string;
  createdAt?: string;
  owner?: GitHubUser;
  list?: string[];
  license?: LicenseInfo;
  archived?: boolean;
  isFork?: boolean;
}

/**
 * Model: List_GitHubCommit
 * @response For:
 *   - GET repos/{owner}/{repo}/commits
 */
export interface List_GitHubCommit {
  [key: string]: any;
}

/**
 * Model: List_GitHubUser
 * @response For:
 *   - GET repos/{owner}/{repo}/contributors
 */
export interface List_GitHubUser {
  [key: string]: any;
}

/**
 * Model: List_GitHubIssue
 * @response For:
 *   - GET repos/{owner}/{repo}/issues
 */
export interface List_GitHubIssue {
  [key: string]: any;
}

/**
 * Model: GitHubReadme
 * @response For:
 *   - GET repos/{owner}/{repo}/readme
 */
export interface GitHubReadme {
  name?: string;
  path?: string;
  sha?: string;
  size?: number;
  downloadUrl?: string;
  content?: string;
  encoding?: string;
  htmlUrl?: string;
}

/**
 * Model: GitHubUser
 * @response For:
 *   - GET users/{username}
 */
export interface GitHubUser {
  id?: number;
  login?: string;
  avatarUrl?: string;
  htmlUrl?: string;
  name?: string;
  company?: string;
  blog?: string;
  location?: string;
  email?: string;
  bio?: string;
  publicRepos?: number;
  publicGists?: number;
  followers?: number;
  following?: number;
  createdAt?: string;
  contributions?: number;
}

/**
 * Model: List_GitHubRepo
 * @response For:
 *   - GET users/{username}/repos
 *   - GET users/{username}/starred
 */
export interface List_GitHubRepo {
  [key: string]: any;
}

/**
 * Model: SearchResponse_GitHubCodeItem
 * @response For:
 *   - GET search/code
 */
export interface SearchResponse_GitHubCodeItem {
  [key: string]: any;
}

/**
 * Model: SearchResponse_GitHubRepo
 * @response For:
 *   - GET search/repositories
 */
export interface SearchResponse_GitHubRepo {
  [key: string]: any;
}

/**
 * Model: SearchResponse_GitHubUser
 * @response For:
 *   - GET search/users
 */
export interface SearchResponse_GitHubUser {
  [key: string]: any;
}
