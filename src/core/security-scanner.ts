import * as fs from "fs";
import * as path from "path";
import { walkDir } from "./scanner";

export interface DetectedInterceptor {
  file: string;
  className: string;
  addedHeaders: string[];
}

export interface SecurityScanResult {
  interceptorsFound: DetectedInterceptor[];
  commonHeaders: Record<string, string>;
  authHeaders: string[];
  signingDetected: boolean;
  detectedHeaderNames: string[];
}

/**
 * Scans decompiled sources for OkHttp Interceptors to discover global headers,
 * auth tokens, and request signing behaviors.
 */
export function scanSecurityInterceptors(sourcesDir: string): SecurityScanResult {
  const interceptorsFound: DetectedInterceptor[] = [];
  const allHeaders = new Set<string>();
  const authHeaders = new Set<string>();
  let signingDetected = false;

  if (fs.existsSync(sourcesDir)) {
    walkDir(sourcesDir, (file: string) => {
      const content = fs.readFileSync(file, "utf8");
      if (!content.includes("Interceptor")) return;

      const isInterceptor =
        content.includes("implements Interceptor") ||
        content.includes("implements okhttp3.Interceptor") ||
        content.includes(": Interceptor");

      if (!isInterceptor) return;

      const className = path.basename(file, path.extname(file));
      const addedHeaders: string[] = [];

      // Look for .addHeader("Key", ...) or .header("Key", ...)
      for (const m of content.matchAll(/\.(?:addHeader|header)\s*\(\s*"([^"]+)"\s*,\s*(?:[^\n)]+)\)/g)) {
        const headerName = m[1].trim();
        addedHeaders.push(headerName);
        allHeaders.add(headerName);

        if (/auth|token|session|jwt|key|secret/i.test(headerName)) {
          authHeaders.add(headerName);
        }
        if (/sign|hmac|hash|signature|digest/i.test(headerName)) {
          signingDetected = true;
        }
      }

      // Look for request.header("Key") reads
      for (const m of content.matchAll(/request\.header\s*\(\s*"([^"]+)"\s*\)/g)) {
        const headerName = m[1].trim();
        allHeaders.add(headerName);
      }

      if (addedHeaders.length > 0) {
        interceptorsFound.push({
          file: path.relative(sourcesDir, file).replace(/\\/g, "/"),
          className,
          addedHeaders: Array.from(new Set(addedHeaders)),
        });
      }
    });
  }

  const commonHeaders: Record<string, string> = {};
  for (const h of allHeaders) {
    if (h.toLowerCase() === "user-agent") commonHeaders[h] = "Mozilla/5.0 (Android)";
    else if (h.toLowerCase() === "accept-encoding") commonHeaders[h] = "gzip, deflate";
    else if (h.toLowerCase() === "content-type") commonHeaders[h] = "application/json";
    else commonHeaders[h] = "";
  }

  return {
    interceptorsFound,
    commonHeaders,
    authHeaders: Array.from(authHeaders),
    signingDetected,
    detectedHeaderNames: Array.from(allHeaders).sort(),
  };
}
