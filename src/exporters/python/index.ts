import * as fs from "fs";
import * as path from "path";
import { ScannedEndpoint } from "../../core/scanner";
import { SecurityScanResult } from "../../core/security-scanner";
import { DtoExtractionResult, extractDtoModels } from "../../core/dto-extractor";
import { generatePythonClient } from "./client";
import { generatePythonServices } from "./services";
import { generatePythonModels } from "./models";

export * from "./client";
export * from "./services";
export * from "./models";

export interface PythonGeneratorOptions {
  endpoints: ScannedEndpoint[];
  outputDir: string;
  baseUrl?: string;
  securityResult?: SecurityScanResult;
  sourcesDir?: string;
  dtoResult?: DtoExtractionResult;
}

export function generatePythonSdk(options: PythonGeneratorOptions): {
  clientPath: string;
  servicesPath: string;
  modelsPath: string;
} {
  const { endpoints, outputDir, baseUrl, securityResult } = options;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. client.py
  const clientPath = path.join(outputDir, "client.py");
  fs.writeFileSync(clientPath, generatePythonClient(baseUrl || "https://api.example.com", securityResult), "utf8");

  // 2. models.py
  const modelsPath = path.join(outputDir, "models.py");
  const dtoResult = options.dtoResult || (options.sourcesDir ? extractDtoModels(endpoints, options.sourcesDir) : { classIndex: new Map(), modelUsage: new Map(), models: new Map() });
  generatePythonModels(dtoResult, modelsPath);

  // 3. services.py
  const servicesPath = path.join(outputDir, "services.py");
  fs.writeFileSync(servicesPath, generatePythonServices(endpoints), "utf8");

  // 4. __init__.py
  const initPath = path.join(outputDir, "__init__.py");
  fs.writeFileSync(
    initPath,
    `from .client import HttpClient, ApiResponse, default_client\nfrom . import services\nfrom . import models\n`,
    "utf8"
  );

  return { clientPath, servicesPath, modelsPath };
}
