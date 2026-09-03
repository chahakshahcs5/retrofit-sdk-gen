import * as fs from "fs";
import * as path from "path";
import { ScannedEndpoint } from "../../core/scanner";
import { SecurityScanResult } from "../../core/security-scanner";
import { DtoExtractionResult, extractDtoModels } from "../../core/dto-extractor";
import { generateCppClient } from "./client";
import { generateCppServices } from "./services";
import { generateCppModels } from "./models";

export * from "./client";
export * from "./services";
export * from "./models";

export interface CppGeneratorOptions {
  endpoints: ScannedEndpoint[];
  outputDir: string;
  baseUrl?: string;
  securityResult?: SecurityScanResult;
  sourcesDir?: string;
  dtoResult?: DtoExtractionResult;
}

export function generateCppSdk(options: CppGeneratorOptions): {
  clientPath: string;
  servicesPath: string;
  modelsPath: string;
} {
  const { endpoints, outputDir, baseUrl, securityResult } = options;

  const incDir = path.join(outputDir, "include");
  if (!fs.existsSync(incDir)) {
    fs.mkdirSync(incDir, { recursive: true });
  }

  // 1. include/client.hpp
  const clientPath = path.join(incDir, "client.hpp");
  fs.writeFileSync(clientPath, generateCppClient(baseUrl || "https://api.example.com", securityResult), "utf8");

  // 2. include/models.hpp
  const modelsPath = path.join(incDir, "models.hpp");
  const dtoResult = options.dtoResult || (options.sourcesDir ? extractDtoModels(endpoints, options.sourcesDir) : { classIndex: new Map(), modelUsage: new Map(), models: new Map() });
  generateCppModels(dtoResult, modelsPath);

  // 3. include/services.hpp
  const servicesPath = path.join(incDir, "services.hpp");
  fs.writeFileSync(servicesPath, generateCppServices(endpoints), "utf8");

  // 4. include/sdk.hpp
  const sdkHpp = path.join(incDir, "sdk.hpp");
  fs.writeFileSync(
    sdkHpp,
    `#pragma once\n\n#include "client.hpp"\n#include "models.hpp"\n#include "services.hpp"\n`,
    "utf8"
  );

  // 5. CMakeLists.txt
  const cmakePath = path.join(outputDir, "CMakeLists.txt");
  fs.writeFileSync(
    cmakePath,
    `cmake_minimum_required(VERSION 3.14)\nproject(app_sdk LANGUAGES CXX)\n\nadd_library(app_sdk INTERFACE)\ntarget_include_directories(app_sdk INTERFACE include/)\ntarget_compile_features(app_sdk INTERFACE cxx_std_17)\n`,
    "utf8"
  );

  return { clientPath, servicesPath, modelsPath };
}
