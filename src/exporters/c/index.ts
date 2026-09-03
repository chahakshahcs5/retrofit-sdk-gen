import * as fs from "fs";
import * as path from "path";
import { ScannedEndpoint } from "../../core/scanner";
import { SecurityScanResult } from "../../core/security-scanner";
import { DtoExtractionResult, extractDtoModels } from "../../core/dto-extractor";
import { generateCHeader, generateCSource } from "./client";
import { generateCServicesHeader, generateCServicesSource } from "./services";
import { generateCModels } from "./models";

export * from "./client";
export * from "./services";
export * from "./models";

export interface CGeneratorOptions {
  endpoints: ScannedEndpoint[];
  outputDir: string;
  baseUrl?: string;
  securityResult?: SecurityScanResult;
  sourcesDir?: string;
  dtoResult?: DtoExtractionResult;
}

export function generateCSdk(options: CGeneratorOptions): {
  clientPath: string;
  servicesPath: string;
  modelsPath: string;
} {
  const { endpoints, outputDir, baseUrl, securityResult } = options;

  const incDir = path.join(outputDir, "include");
  const srcDir = path.join(outputDir, "src");
  if (!fs.existsSync(incDir)) fs.mkdirSync(incDir, { recursive: true });
  if (!fs.existsSync(srcDir)) fs.mkdirSync(srcDir, { recursive: true });

  // 1. include/client.h & src/client.c
  const clientHeader = path.join(incDir, "client.h");
  const clientSrc = path.join(srcDir, "client.c");
  fs.writeFileSync(clientHeader, generateCHeader(baseUrl || "https://api.example.com", securityResult), "utf8");
  fs.writeFileSync(clientSrc, generateCSource(baseUrl || "https://api.example.com", securityResult), "utf8");

  // 2. include/models.h
  const modelsPath = path.join(incDir, "models.h");
  const dtoResult = options.dtoResult || (options.sourcesDir ? extractDtoModels(endpoints, options.sourcesDir) : { classIndex: new Map(), modelUsage: new Map(), models: new Map() });
  generateCModels(dtoResult, modelsPath);

  // 3. include/services.h & src/services.c
  const servicesHeader = path.join(incDir, "services.h");
  const servicesSrc = path.join(srcDir, "services.c");
  fs.writeFileSync(servicesHeader, generateCServicesHeader(endpoints), "utf8");
  fs.writeFileSync(servicesSrc, generateCServicesSource(endpoints), "utf8");

  // 4. Makefile
  const makefilePath = path.join(outputDir, "Makefile");
  fs.writeFileSync(
    makefilePath,
    `CC ?= gcc\nCFLAGS ?= -Wall -Wextra -O2 -Iinclude\n\nSRCS = src/client.c src/services.c\nOBJS = $(SRCS:.c=.o)\nTARGET = libapp_sdk.a\n\nall: $(TARGET)\n\n$(TARGET): $(OBJS)\n\tar rcs $@ $^\n\n%.o: %.c\n\t$(CC) $(CFLAGS) -c $< -o $@\n\nclean:\n\trm -f $(OBJS) $(TARGET)\n\n.PHONY: all clean\n`,
    "utf8"
  );

  // 5. CMakeLists.txt (For Visual Studio MSVC & CMake workflows)
  const cmakePath = path.join(outputDir, "CMakeLists.txt");
  fs.writeFileSync(
    cmakePath,
    `cmake_minimum_required(VERSION 3.10)\nproject(AppSdkC C)\nset(CMAKE_C_STANDARD 99)\ninclude_directories(include)\nadd_library(app_sdk STATIC src/client.c src/services.c)\n`,
    "utf8"
  );

  return { clientPath: clientHeader, servicesPath: servicesHeader, modelsPath };
}
