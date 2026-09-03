# 🦀 Rust SDK Guide

The generated Rust SDK is a high-performance, asynchronous Rust crate powered by `reqwest`, `tokio`, and `serde`.

---

## 📁 Directory Structure

```
sdk/rust/
├── Cargo.toml         # Crate manifest with reqwest, tokio, serde
└── src/
    ├── lib.rs         # Root crate exports
    ├── client.rs      # Client struct wrapping reqwest::Client
    ├── models.rs      # 386+ Strongly-typed Rust structs with serde derives
    └── services.rs    # 94 Service structs with async methods
```

---

## 🚀 Getting Started

### 1. Generating the SDK

```bash
npx retrofit-sdk-gen ./app.apk --lang rust --output ./my-rust-sdk
```

### 2. Building the Crate

```bash
cd my-rust-sdk
cargo check
```

---

## 💡 Making API Calls

### 1. Asynchronous API Requests with Tokio
```rust
use app_sdk::{Client, AddressesService};
use std::collections::HashMap;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Initialize client with authentication
    let client = Client::new(Some("https://api.example.com"))
        .with_token("your_access_token_here");

    // 2. Prepare query parameters
    let mut query = HashMap::new();
    query.insert("check_pin", "true");
    query.insert("context", "checkout");

    // 3. Make async request
    let response = AddressesService::fetch_addresses_with_rx(&client, Some(&query)).await?;

    println!("Status: {}", response.status());
    let body = response.text().await?;
    println!("Response Body: {}", body);

    Ok(())
}
```

### 2. JSON Payloads
```rust
use app_sdk::{Client, PayoutService};
use serde_json::json;

let payload = json!({
    "amount": 499.00,
    "mode": "UPI"
});

let response = PayoutService::fetch_refund_modes_with_checks_v2(&client, Some(&payload)).await?;
```
