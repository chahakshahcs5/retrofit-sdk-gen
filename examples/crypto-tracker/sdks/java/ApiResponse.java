package com.app.sdk;

public class ApiResponse<T> {
    private final boolean ok;
    private final int statusCode;
    private final T data;
    private final String error;

    public ApiResponse(boolean ok, int statusCode, T data, String error) {
        this.ok = ok;
        this.statusCode = statusCode;
        this.data = data;
        this.error = error;
    }

    public boolean isOk() { return ok; }
    public int getStatusCode() { return statusCode; }
    public T getData() { return data; }
    public String getError() { return error; }
}
