import * as fs from "fs";
import * as path from "path";
import { ScannedEndpoint } from "../../core/scanner";
import { SecurityScanResult } from "../../core/security-scanner";
import { DtoExtractionResult, extractDtoModels } from "../../core/dto-extractor";
import { generateRustClient } from "./client";
import { generateRustServices } from "./services";
import { generateRustModels } from "./models";

export * from "./client";
export * from "./services";
export * from "./models";

export interface RustGeneratorOptions {
  endpoints: ScannedEndpoint[];
  outputDir: string;
  baseUrl?: string;
  securityResult?: SecurityScanResult;
  sourcesDir?: string;
  dtoResult?: DtoExtractionResult;
}

export function generateRustSdk(options: RustGeneratorOptions): {
  clientPath: string;
  servicesPath: string;
  modelsPath: string;
} {
  const { endpoints, outputDir, baseUrl, securityResult } = options;

  const srcDir = path.join(outputDir, "src");
  if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
  }

  // 1. Cargo.toml
  const cargoToml = path.join(outputDir, "Cargo.toml");
  fs.writeFileSync(
    cargoToml,
    `[package]\nname = "app_sdk"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\nreqwest = { version = "0.11", features = ["json"] }\ntokio = { version = "1", features = ["full"] }\nserde = { version = "1.0", features = ["derive"] }\nserde_json = "1.0"\n`,
    "utf8"
  );

  // 2. src/client.rs
  const clientPath = path.join(srcDir, "client.rs");
  fs.writeFileSync(clientPath, generateRustClient(baseUrl || "https://api.example.com", securityResult), "utf8");

  // 3. src/models.rs
  const modelsPath = path.join(srcDir, "models.rs");
  const dtoResult = options.dtoResult || (options.sourcesDir ? extractDtoModels(endpoints, options.sourcesDir) : { classIndex: new Map(), modelUsage: new Map(), models: new Map() });
  generateRustModels(dtoResult, modelsPath);

  // 4. src/services.rs
  const servicesPath = path.join(srcDir, "services.rs");
  fs.writeFileSync(servicesPath, generateRustServices(endpoints), "utf8");

  // 5. src/lib.rs
  const libRs = path.join(srcDir, "lib.rs");
  fs.writeFileSync(
    libRs,
    `pub mod client;\npub mod models;\npub mod services;\n\npub use client::Client;\npub use services::*;\n`,
    "utf8"
  );

  return { clientPath, servicesPath, modelsPath };
}
