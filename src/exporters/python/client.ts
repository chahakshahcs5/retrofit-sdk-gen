import { SecurityScanResult } from "../../core/security-scanner";

export function generatePythonClient(
  baseUrl: string,
  securityResult?: SecurityScanResult
): string {
  const cleanUrl = (baseUrl || "https://api.example.com").replace(/\/+$/, "");

  const headerLines: string[] = ['        "Content-Type": "application/json",'];
  if (securityResult?.detectedHeaderNames && securityResult.detectedHeaderNames.length > 0) {
    const skip = new Set(["content-type", "content-length", "host", "connection", "accept-encoding"]);
    for (const h of securityResult.detectedHeaderNames) {
      if (!skip.has(h.toLowerCase())) {
        if (h.toLowerCase() === "user-agent") {
          headerLines.push(`        "${h}": "Mozilla/5.0 (Android; Mobile)",`);
        } else if (h.toLowerCase().includes("priority")) {
          headerLines.push(`        "${h}": "normal",`);
        } else {
          headerLines.push(`        "${h}": "",`);
        }
      }
    }
  }

  let authHelper = "";
  if (securityResult?.authHeaders && securityResult.authHeaders.length > 0) {
    const authH = securityResult.authHeaders[0];
    authHelper = `
    def set_auth(self, token: str) -> None:
        """Configures authentication token for header: ${authH}"""
        self.headers["${authH}"] = token if token.startswith("Bearer ") else f"Bearer {token}"
`;
  } else {
    authHelper = `
    def set_auth(self, token: str) -> None:
        """Configures Authorization header"""
        self.headers["Authorization"] = token if token.startswith("Bearer ") else f"Bearer {token}"
`;
  }

  return `import json
import urllib.parse
import urllib.request
from typing import Optional, Dict, Any, TypeVar, Generic
from dataclasses import dataclass

T = TypeVar("T")

@dataclass
class ApiResponse(Generic[T]):
    ok: bool
    status: int
    data: Optional[T] = None
    headers: Optional[Dict[str, str]] = None
    error: Optional[str] = None

class HttpClient:
    def __init__(self, base_url: str = "${cleanUrl}"):
        self.base_url = base_url.rstrip("/")
        self.headers: Dict[str, str] = {
${headerLines.join("\n")}
        }
${authHelper}
    def request(
        self,
        method: str,
        endpoint: str,
        path_params: Optional[Dict[str, Any]] = None,
        query_params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        payload: Optional[Any] = None
    ) -> ApiResponse[Any]:
        path = endpoint
        if path_params:
            for k, v in path_params.items():
                path = path.replace(f"{{{k}}}", urllib.parse.quote(str(v), safe=""))

        url = f"{self.base_url}/{path.lstrip('/')}"
        if query_params:
            clean_params = {k: v for k, v in query_params.items() if v is not None}
            if clean_params:
                url += "?" + urllib.parse.urlencode(clean_params)

        merged_headers = {**self.headers, **(headers or {})}

        data = None
        if payload is not None:
            if isinstance(payload, (dict, list)):
                data = json.dumps(payload).encode("utf-8")
                merged_headers["Content-Type"] = "application/json"
            elif isinstance(payload, bytes):
                data = payload
            else:
                data = str(payload).encode("utf-8")

        req = urllib.request.Request(url, data=data, headers=merged_headers, method=method)

        try:
            with urllib.request.urlopen(req) as resp:
                status = resp.status
                resp_body = resp.read().decode("utf-8")
                resp_headers = dict(resp.headers)
                try:
                    parsed_data = json.loads(resp_body)
                except Exception:
                    parsed_data = resp_body
                return ApiResponse(ok=200 <= status < 300, status=status, data=parsed_data, headers=resp_headers)
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            try:
                parsed_err = json.loads(err_body)
            except Exception:
                parsed_err = err_body
            return ApiResponse(ok=False, status=e.code, data=parsed_err, headers=dict(e.headers), error=str(e))
        except Exception as e:
            return ApiResponse(ok=False, status=0, error=str(e))

default_client = HttpClient()
`;
}
