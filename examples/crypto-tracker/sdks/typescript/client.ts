export interface RequestOptions {
  pathParams?: Record<string, string | number>;
  queryParams?: Record<string, any>;
  headers?: Record<string, string>;
  payload?: any;
  body?: any;
}

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
  headers: Headers;
  error?: string;
}

export class HttpClient {
  public baseUrl: string;
  public headers: Record<string, string> = {
    "Content-Type": "application/json",
    // Discovered from OkHttp Interceptors in decompiled APK:
    Cookie: "",
    "Transfer-Encoding": "",
    "User-Agent": "Mozilla/5.0 (Android; Mobile)",
  };

  /**
   * Optional hook called before every request (for HMAC signatures, timestamps, nonce).
   */
  public beforeRequest?: (req: RequestInit, url: URL) => void | Promise<void>;

  constructor(baseUrl: string = "https://api.coingecko.com/api/v3") {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  public setAuth(token: string): void {
    this.headers["Authorization"] = token.startsWith("Bearer ") ? token : "Bearer " + token;
  }

  public async request<T = any>(
    method: string,
    endpoint: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    let path = endpoint;
    if (options?.pathParams) {
      for (const [k, v] of Object.entries(options.pathParams)) {
        path = path.replace("{" + k + "}", encodeURIComponent(String(v)));
      }
    }

    const fullUrl = path.startsWith("http") ? path : this.baseUrl + "/" + path.replace(/^\/+/, "");
    const url = new URL(fullUrl);

    if (options?.queryParams) {
      for (const [k, v] of Object.entries(options.queryParams)) {
        if (v !== undefined && v !== null) {
          if (Array.isArray(v)) {
            v.forEach((item) => url.searchParams.append(k, String(item)));
          } else {
            url.searchParams.append(k, String(v));
          }
        }
      }
    }

    const payloadData = options?.payload !== undefined ? options.payload : options?.body;
    const isJson =
      payloadData && typeof payloadData === "object" && !(payloadData instanceof FormData);
    const reqInit: RequestInit = {
      method: method.toUpperCase(),
      headers: { ...this.headers, ...options?.headers },
      body: isJson ? JSON.stringify(payloadData) : payloadData,
    };

    if (this.beforeRequest) {
      await this.beforeRequest(reqInit, url);
    }

    try {
      const res = await fetch(url.toString(), reqInit);
      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      return {
        ok: res.ok,
        status: res.status,
        data,
        headers: res.headers,
        error: res.ok ? undefined : typeof data === "object" && data?.message ? data.message : text,
      };
    } catch (err: any) {
      return {
        ok: false,
        status: 0,
        data: null as any,
        headers: new Headers(),
        error: err?.message || String(err),
      };
    }
  }
}

export const defaultClient = new HttpClient();
