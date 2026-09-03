import * as fs from "fs";
import * as path from "path";
import { ScannedEndpoint } from "../../core/scanner";
import { SecurityScanResult } from "../../core/security-scanner";
import { DtoExtractionResult, extractDtoModels } from "../../core/dto-extractor";
import { generateGoClient } from "./client";
import { generateGoServices } from "./services";
import { generateGoModels } from "./models";

export * from "./client";
export * from "./services";
export * from "./models";

export interface GoGeneratorOptions {
  endpoints: ScannedEndpoint[];
  outputDir: string;
  baseUrl?: string;
  securityResult?: SecurityScanResult;
  sourcesDir?: string;
  dtoResult?: DtoExtractionResult;
}

export function generateGoSdk(options: GoGeneratorOptions): {
  clientPath: string;
  servicesPath: string;
  modelsPath: string;
} {
  const { endpoints, outputDir, baseUrl, securityResult } = options;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. client.go
  const clientPath = path.join(outputDir, "client.go");
  fs.writeFileSync(clientPath, generateGoClient(baseUrl || "https://api.example.com", securityResult), "utf8");

  // 2. models.go
  const modelsPath = path.join(outputDir, "models.go");
  const dtoResult = options.dtoResult || (options.sourcesDir ? extractDtoModels(endpoints, options.sourcesDir) : { classIndex: new Map(), modelUsage: new Map(), models: new Map() });
  generateGoModels(dtoResult, modelsPath);

  // 3. services.go
  const servicesPath = path.join(outputDir, "services.go");
  fs.writeFileSync(servicesPath, generateGoServices(endpoints), "utf8");

  // 4. go.mod
  const goModPath = path.join(outputDir, "go.mod");
  fs.writeFileSync(goModPath, `module sdk\n\ngo 1.22\n`, "utf8");

  return { clientPath, servicesPath, modelsPath };
}
