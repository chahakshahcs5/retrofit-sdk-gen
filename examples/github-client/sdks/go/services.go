package sdk

import (
    "context"
)

// GitHubApiService provides access to 11 API endpoints.
type GitHubApiService struct {
    Client *Client
}

// NewGitHubApiService initializes a new GitHubApiService
func NewGitHubApiService(client *Client) *GitHubApiService {
    return &GitHubApiService{Client: client}
}

// GetRepository: GET repos/{owner}/{repo}
func (s *GitHubApiService) GetRepository(ctx context.Context, owner string, repo string) (*ApiResponse, error) {
    pathParams := map[string]string{
        "owner": owner,
        "repo": repo,
    }
    return s.Client.DoRequest(ctx, "GET", "repos/{owner}/{repo}", pathParams, nil, nil, nil)
}

// GetRepositoryCommits: GET repos/{owner}/{repo}/commits
func (s *GitHubApiService) GetRepositoryCommits(ctx context.Context, owner string, repo string, queryParams map[string]interface{}) (*ApiResponse, error) {
    pathParams := map[string]string{
        "owner": owner,
        "repo": repo,
    }
    return s.Client.DoRequest(ctx, "GET", "repos/{owner}/{repo}/commits", pathParams, queryParams, nil, nil)
}

// GetRepositoryContributors: GET repos/{owner}/{repo}/contributors
func (s *GitHubApiService) GetRepositoryContributors(ctx context.Context, owner string, repo string, queryParams map[string]interface{}) (*ApiResponse, error) {
    pathParams := map[string]string{
        "owner": owner,
        "repo": repo,
    }
    return s.Client.DoRequest(ctx, "GET", "repos/{owner}/{repo}/contributors", pathParams, queryParams, nil, nil)
}

// GetRepositoryIssues: GET repos/{owner}/{repo}/issues
func (s *GitHubApiService) GetRepositoryIssues(ctx context.Context, owner string, repo string, queryParams map[string]interface{}) (*ApiResponse, error) {
    pathParams := map[string]string{
        "owner": owner,
        "repo": repo,
    }
    return s.Client.DoRequest(ctx, "GET", "repos/{owner}/{repo}/issues", pathParams, queryParams, nil, nil)
}

// GetRepositoryReadme: GET repos/{owner}/{repo}/readme
func (s *GitHubApiService) GetRepositoryReadme(ctx context.Context, owner string, repo string) (*ApiResponse, error) {
    pathParams := map[string]string{
        "owner": owner,
        "repo": repo,
    }
    return s.Client.DoRequest(ctx, "GET", "repos/{owner}/{repo}/readme", pathParams, nil, nil, nil)
}

// GetUser: GET users/{username}
func (s *GitHubApiService) GetUser(ctx context.Context, username string) (*ApiResponse, error) {
    pathParams := map[string]string{
        "username": username,
    }
    return s.Client.DoRequest(ctx, "GET", "users/{username}", pathParams, nil, nil, nil)
}

// GetUserRepositories: GET users/{username}/repos
func (s *GitHubApiService) GetUserRepositories(ctx context.Context, username string, queryParams map[string]interface{}) (*ApiResponse, error) {
    pathParams := map[string]string{
        "username": username,
    }
    return s.Client.DoRequest(ctx, "GET", "users/{username}/repos", pathParams, queryParams, nil, nil)
}

// GetUserStarredRepositories: GET users/{username}/starred
func (s *GitHubApiService) GetUserStarredRepositories(ctx context.Context, username string, queryParams map[string]interface{}) (*ApiResponse, error) {
    pathParams := map[string]string{
        "username": username,
    }
    return s.Client.DoRequest(ctx, "GET", "users/{username}/starred", pathParams, queryParams, nil, nil)
}

// SearchCode: GET search/code
func (s *GitHubApiService) SearchCode(ctx context.Context, queryParams map[string]interface{}) (*ApiResponse, error) {
    var pathParams map[string]string = nil
    return s.Client.DoRequest(ctx, "GET", "search/code", pathParams, queryParams, nil, nil)
}

// SearchRepositories: GET search/repositories
func (s *GitHubApiService) SearchRepositories(ctx context.Context, queryParams map[string]interface{}) (*ApiResponse, error) {
    var pathParams map[string]string = nil
    return s.Client.DoRequest(ctx, "GET", "search/repositories", pathParams, queryParams, nil, nil)
}

// SearchUsers: GET search/users
func (s *GitHubApiService) SearchUsers(ctx context.Context, queryParams map[string]interface{}) (*ApiResponse, error) {
    var pathParams map[string]string = nil
    return s.Client.DoRequest(ctx, "GET", "search/users", pathParams, queryParams, nil, nil)
}
