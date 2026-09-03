package com.app.sdk;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

public class Client {
    private final String baseUrl;
    private final HttpClient httpClient;
    private final Map<String, String> defaultHeaders;

    public Client(String baseUrl) {
        this.baseUrl = (baseUrl != null ? baseUrl : "https://api.coingecko.com/api/v3").replaceAll("/+$", "");
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();
        this.defaultHeaders = new HashMap<>();
        this.defaultHeaders.put("Content-Type", "application/json");
        this.defaultHeaders.put("Cookie", "");
        this.defaultHeaders.put("Transfer-Encoding", "");
        this.defaultHeaders.put("User-Agent", "Mozilla/5.0 (Android; Mobile)");
    }

    public Client() {
        this("https://api.coingecko.com/api/v3");
    }

    public void setAuth(String token) {
        if (!token.startsWith("Bearer ") && !token.startsWith("bearer ")) {
            token = "Bearer " + token;
        }
        this.defaultHeaders.put("Authorization", token);
    }

    public ApiResponse<String> send(
            String method,
            String endpoint,
            Map<String, String> pathParams,
            Map<String, Object> queryParams,
            Map<String, String> customHeaders,
            String payload
    ) {
        try {
            String path = endpoint;
            if (pathParams != null) {
                for (Map.Entry<String, String> entry : pathParams.entrySet()) {
                    path = path.replace("{" + entry.getKey() + "}", URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8));
                }
            }

            StringBuilder urlBuilder = new StringBuilder(this.baseUrl).append("/").append(path.replaceAll("^/+", ""));

            if (queryParams != null && !queryParams.isEmpty()) {
                StringBuilder q = new StringBuilder();
                for (Map.Entry<String, Object> entry : queryParams.entrySet()) {
                    if (entry.getValue() != null) {
                        if (q.length() > 0) q.append("&");
                        q.append(URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8))
                         .append("=")
                         .append(URLEncoder.encode(String.valueOf(entry.getValue()), StandardCharsets.UTF_8));
                    }
                }
                if (q.length() > 0) {
                    urlBuilder.append("?").append(q);
                }
            }

            HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(urlBuilder.toString()))
                    .timeout(Duration.ofSeconds(30));

            for (Map.Entry<String, String> entry : this.defaultHeaders.entrySet()) {
                if (entry.getValue() != null && !entry.getValue().isEmpty()) {
                    reqBuilder.header(entry.getKey(), entry.getValue());
                }
            }

            if (customHeaders != null) {
                for (Map.Entry<String, String> entry : customHeaders.entrySet()) {
                    reqBuilder.header(entry.getKey(), entry.getValue());
                }
            }

            HttpRequest.BodyPublisher bodyPublisher = (payload != null && !payload.isEmpty())
                    ? HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8)
                    : HttpRequest.BodyPublishers.noBody();

            reqBuilder.method(method.toUpperCase(), bodyPublisher);

            HttpResponse<String> response = this.httpClient.send(reqBuilder.build(), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

            boolean isSuccess = response.statusCode() >= 200 && response.statusCode() < 300;
            return new ApiResponse<>(isSuccess, response.statusCode(), response.body(), null);
        } catch (Exception e) {
            return new ApiResponse<>(false, 0, null, e.getMessage());
        }
    }
}
