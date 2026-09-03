import * as fs from "fs";
import * as path from "path";
import { ScannedEndpoint } from "../../core/scanner";
import { SecurityScanResult } from "../../core/security-scanner";
import { DtoExtractionResult, extractDtoModels } from "../../core/dto-extractor";
import { generateCSharpClient } from "./client";
import { generateCSharpServices } from "./services";
import { generateCSharpModels } from "./models";

export * from "./client";
export * from "./services";
export * from "./models";

export interface CSharpGeneratorOptions {
  endpoints: ScannedEndpoint[];
  outputDir: string;
  baseUrl?: string;
  securityResult?: SecurityScanResult;
  sourcesDir?: string;
  dtoResult?: DtoExtractionResult;
}

export function generateCSharpSdk(options: CSharpGeneratorOptions): {
  clientPath: string;
  servicesPath: string;
  modelsPath: string;
} {
  const { endpoints, outputDir, baseUrl, securityResult } = options;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Client.cs
  const clientPath = path.join(outputDir, "Client.cs");
  fs.writeFileSync(clientPath, generateCSharpClient(baseUrl || "https://api.example.com", securityResult), "utf8");

  // 2. Models.cs
  const modelsPath = path.join(outputDir, "Models.cs");
  const dtoResult = options.dtoResult || (options.sourcesDir ? extractDtoModels(endpoints, options.sourcesDir) : { classIndex: new Map(), modelUsage: new Map(), models: new Map() });
  generateCSharpModels(dtoResult, modelsPath);

  // 3. Services.cs
  const servicesPath = path.join(outputDir, "Services.cs");
  fs.writeFileSync(servicesPath, generateCSharpServices(endpoints), "utf8");

  // 4. AppSdk.csproj
  const csprojPath = path.join(outputDir, "AppSdk.csproj");
  fs.writeFileSync(
    csprojPath,
    `<Project Sdk="Microsoft.NET.Sdk">\n  <PropertyGroup>\n    <TargetFramework>net8.0</TargetFramework>\n    <Nullable>enable</Nullable>\n    <ImplicitUsings>enable</ImplicitUsings>\n  </PropertyGroup>\n</Project>\n`,
    "utf8"
  );

  return { clientPath, servicesPath, modelsPath };
}
