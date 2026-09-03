import { SecurityScanResult } from "../../core/security-scanner";

export interface GenerateClientOptions {
  baseUrl?: string;
  securityResult?: SecurityScanResult;
}

/**
 * Dynamically generates the universal HttpClient starter code,
 * pre-populated with base URL, discovered OkHttp interceptor headers,
 * authentication helpers, and request signing hooks.
 */
export function generateClientCode(options: GenerateClientOptions | string = "https://api.example.com"): string {
  const opts: GenerateClientOptions = typeof options === "string" ? { baseUrl: options } : options;
  const cleanUrl = (opts.baseUrl || "https://api.example.com").replace(/\/+$/, "");

  // Build headers dictionary
  const headerLines: string[] = ['    "Content-Type": "application/json",'];

  if (opts.securityResult?.detectedHeaderNames && opts.securityResult.detectedHeaderNames.length > 0) {
    const standardSkip = new Set(["content-type", "content-length", "host", "connection", "accept-encoding"]);
    const customHeaders = opts.securityResult.detectedHeaderNames.filter(
      (h) => !standardSkip.has(h.toLowerCase())
    );

    if (customHeaders.length > 0) {
      headerLines.push("    // Discovered from OkHttp Interceptors in decompiled APK:");
      for (const h of customHeaders) {
        if (h.toLowerCase() === "user-agent") {
          headerLines.push(`    "${h}": "Mozilla/5.0 (Android; Mobile)",`);
        } else if (h.toLowerCase().includes("priority")) {
          headerLines.push(`    "${h}": "normal",`);
        } else {
          headerLines.push(`    "${h}": "",`);
        }
      }
    }
  }

  // Build auth helper method if auth headers detected
  let authHelper = "";
  if (opts.securityResult?.authHeaders && opts.securityResult.authHeaders.length > 0) {
    const primaryAuth = opts.securityResult.authHeaders[0];
    authHelper = `
  /**
   * Pre-configured authentication helper for discovered header: ${primaryAuth}
   */
  public setAuth(token: string): void {
    this.headers["${primaryAuth}"] = token.startsWith("Bearer ") ? token : "Bearer " + token;
  }
`;
  } else {
    authHelper = `
  public setAuth(token: string): void {
    this.headers["Authorization"] = token.startsWith("Bearer ") ? token : "Bearer " + token;
  }
`;
  }

  // Signing hook hint
  const signingHint = opts.securityResult?.signingDetected
    ? `
  // Note: Request signing / HMAC was detected in OkHttp Interceptors.
  // Set defaultClient.beforeRequest = async (req, url) => { ... } to compute dynamic signatures.`
    : "";

  return `export interface RequestOptions {
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
${headerLines.join("\n")}
  };

  /**
   * Optional hook called before every request (for HMAC signatures, timestamps, nonce).
   */
  public beforeRequest?: (req: RequestInit, url: URL) => void | Promise<void>;

  constructor(baseUrl: string = "${cleanUrl}") {
    this.baseUrl = baseUrl.replace(/\\/+$/, "");
  }
${authHelper}
  public async request<T = any>(
    method: string,
    endpoint: string,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    let path = endpoint;
    if (options?.pathParams) {
      for (const [k, v] of Object.entries(options.pathParams)) {
        path = path.replace("{" + k + "}", encodeURIComponent(String(v)));
      }
    }

    const fullUrl = path.startsWith("http")
      ? path
      : this.baseUrl + "/" + path.replace(/^\\/+/, "");
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
    const isJson = payloadData && typeof payloadData === "object" && !(payloadData instanceof FormData);
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
        error: res.ok ? undefined : (typeof data === "object" && data?.message ? data.message : text),
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
${signingHint}
export const defaultClient = new HttpClient();
`;
}
