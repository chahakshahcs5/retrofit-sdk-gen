using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace App.Sdk
{
    public class ApiResponse<T>
    {
        public bool Ok { get; set; }
        public int StatusCode { get; set; }
        public T? Data { get; set; }
        public string? RawText { get; set; }
        public HttpResponseHeaders? Headers { get; set; }
        public string? Error { get; set; }
    }

    public class HttpClientWrapper
    {
        public string BaseUrl { get; set; }
        public HttpClient Client { get; set; }
        public Dictionary<string, string> DefaultHeaders { get; set; }

        public HttpClientWrapper(string? baseUrl = null, HttpClient? client = null)
        {
            BaseUrl = (baseUrl ?? "https://dummyjson.com").TrimEnd('/');
            Client = client ?? new HttpClient();
            DefaultHeaders = new Dictionary<string, string>();
            DefaultHeaders["Content-Type"] = "application/json";
            DefaultHeaders["Accept"] = "";
            DefaultHeaders["Authorization"] = "";
            DefaultHeaders["Cookie"] = "";
            DefaultHeaders["Transfer-Encoding"] = "";
            DefaultHeaders["User-Agent"] = "Mozilla/5.0 (Android; Mobile)";
        }

        public void SetAuth(string token)
        {
            if (!token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                token = "Bearer " + token;
            DefaultHeaders["Authorization"] = token;
        }

        public async Task<ApiResponse<T>> SendAsync<T>(
            HttpMethod method,
            string endpoint,
            Dictionary<string, string>? pathParams = null,
            Dictionary<string, object>? queryParams = null,
            Dictionary<string, string>? customHeaders = null,
            object? payload = null,
            CancellationToken cancellationToken = default
        )
        {
            var path = endpoint;
            if (pathParams != null)
            {
                foreach (var kvp in pathParams)
                {
                    path = path.Replace("{" + kvp.Key + "}", Uri.EscapeDataString(kvp.Value));
                }
            }

            var url = $"{BaseUrl}/{path.TrimStart('/')}";
            if (queryParams != null && queryParams.Count > 0)
            {
                var queryList = new List<string>();
                foreach (var kvp in queryParams)
                {
                    if (kvp.Value != null)
                    {
                        queryList.Add($"{Uri.EscapeDataString(kvp.Key)}={Uri.EscapeDataString(kvp.Value.ToString() ?? "")}");
                    }
                }
                if (queryList.Count > 0)
                {
                    url += "?" + string.Join("&", queryList);
                }
            }

            using var request = new HttpRequestMessage(method, url);

            foreach (var kvp in DefaultHeaders)
            {
                if (!string.IsNullOrEmpty(kvp.Value))
                    request.Headers.TryAddWithoutValidation(kvp.Key, kvp.Value);
            }

            if (customHeaders != null)
            {
                foreach (var kvp in customHeaders)
                {
                    request.Headers.TryAddWithoutValidation(kvp.Key, kvp.Value);
                }
            }

            if (payload != null)
            {
                var json = JsonSerializer.Serialize(payload);
                request.Content = new StringContent(json, Encoding.UTF8, "application/json");
            }

            try
            {
                using var response = await Client.SendAsync(request, cancellationToken);
                var rawText = await response.Content.ReadAsStringAsync(cancellationToken);
                var isSuccess = response.IsSuccessStatusCode;

                T? data = default;
                if (isSuccess && !string.IsNullOrWhiteSpace(rawText))
                {
                    try
                    {
                        data = JsonSerializer.Deserialize<T>(rawText, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    }
                    catch { }
                }

                return new ApiResponse<T>
                {
                    Ok = isSuccess,
                    StatusCode = (int)response.StatusCode,
                    Data = data,
                    RawText = rawText,
                    Headers = response.Headers
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<T>
                {
                    Ok = false,
                    StatusCode = 0,
                    Error = ex.Message
                };
            }
        }
    }

    public static class GlobalSdk
    {
        public static HttpClientWrapper DefaultClient { get; } = new HttpClientWrapper();
    }
}
