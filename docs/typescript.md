# 📘 TypeScript SDK Guide

The generated TypeScript SDK is a modern, zero-dependency client built on Web Standards (`fetch`, `Headers`, `Request`, `Response`). It provides complete TypeScript types, strong autocompletion, and non-destructive scaffolding.

---

## 📁 Directory Structure

```
sdk/typescript/
├── client.ts    # HttpClient class with baseUrl, discovered OkHttp headers, and auth helpers
├── types.ts     # 724+ TypeScript DTO models reconstructed from Java/Kotlin classes
└── index.ts     # 94 Service classes with typed static methods and default exports
```

---

## 🚀 Getting Started

### 1. Generating the SDK

```bash
npx retrofit-sdk-gen ./app.apk --output ./my-ts-sdk
```

### 2. Importing & Global Configuration

```typescript
import sdk, { defaultClient, AddressesService } from "./my-ts-sdk";

// Set Global Base URL (if different from discovered app URL)
defaultClient.baseUrl = "https://api.example.com";

// Set Authentication Token
defaultClient.headers["Authorization"] = "Bearer your_access_token_here";

// Add custom telemetry / device headers
defaultClient.headers["X-Client-Version"] = "1.0.0";
```

---

## 💡 Making API Calls

```mermaid
sequenceDiagram
    autonumber
    actor App as Application Code
    participant Service as Generated Service
    participant Client as defaultClient (HttpClient)
    participant API as Remote API Server

    App->>Service: Service.fetchData({ queryParams })
    Service->>Client: request("GET", "/endpoint", options)
    Client->>Client: Inject BaseUrl & Discovered Headers
    opt beforeRequest Hook
        Client->>Client: Compute Dynamic Signatures / Nonce
    end
    Client->>API: fetch(url, RequestInit)
    API-->>Client: HTTP 200 JSON Response
    Client->>Client: Parse into ApiResponse<T>
    Client-->>Service: Typed Promise<ApiResponse<T>>
    Service-->>App: Strongly-Typed Data & Autocompletion
```

### 1. Endpoints with Query Parameters
```typescript
import { AddressesService } from "./my-ts-sdk";

const response = await AddressesService.fetchAddressesWithRx({
  queryParams: {
    check_pin: true,
    context: "checkout",
  },
});

if (response.ok) {
  console.log("Customer addresses:", response.data);
} else {
  console.error("API error:", response.status, response.rawText);
}
```

### 2. Endpoints with Path Parameters & Request Body
```typescript
import { PayoutService } from "./my-ts-sdk";

const response = await PayoutService.fetchRefundModesWithChecksV2(
  { order_id: "ORD_99182" }, // Path params
  {
    payload: {
      amount: 499.00,
      payment_mode: "UPI",
    },
  }
);
```

### 3. Endpoints with Zero Parameters
Methods with zero query parameters or request body omit the `options` argument entirely:
```typescript
import { AddressAutofillService } from "./my-ts-sdk";

const eligibility = await AddressAutofillService.fetchEligibility();
console.log("Eligibility:", eligibility.data);
```

---

## 🛡️ Response Wrapper (`ApiResponse<T>`)

Every API method returns a strongly-typed `Promise<ApiResponse<T>>`:

```typescript
export interface ApiResponse<T> {
  ok: boolean;               // True if HTTP status is 2xx
  status: number;            // HTTP status code (200, 404, etc.)
  data: T | null;            // Typed JSON payload parsed from response
  rawText?: string;          // Fallback raw response string
  headers: Record<string, string>; // Response headers
}
```

---

## 🔒 Preserving Customizations (`client.ts`)

When you run `npx retrofit-sdk-gen` repeatedly to update your SDK:
- `client.ts` is **never overwritten** if it already exists!
- You can freely add custom retry logic, token refresh interceptors, logging, or proxy settings to `client.ts` without fear of losing changes on future rebuilds.
