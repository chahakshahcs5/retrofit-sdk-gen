import * as fs from "fs";
import * as path from "path";
import { ScannedEndpoint } from "../../core/scanner";
import { SecurityScanResult } from "../../core/security-scanner";
import { DtoExtractionResult, extractDtoModels } from "../../core/dto-extractor";
import { generateJavaClient } from "./client";
import { generateJavaServices } from "./services";
import { generateJavaModels } from "./models";

export * from "./client";
export * from "./services";
export * from "./models";

export interface JavaGeneratorOptions {
  endpoints: ScannedEndpoint[];
  outputDir: string;
  baseUrl?: string;
  securityResult?: SecurityScanResult;
  sourcesDir?: string;
  dtoResult?: DtoExtractionResult;
}

export function generateJavaSdk(options: JavaGeneratorOptions): {
  clientPath: string;
  servicesPath: string;
  modelsPath: string;
} {
  const { endpoints, outputDir, baseUrl, securityResult } = options;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Client.java
  const clientPath = path.join(outputDir, "Client.java");
  fs.writeFileSync(clientPath, generateJavaClient(baseUrl || "https://api.example.com", securityResult), "utf8");

  // 2. ApiResponse.java
  const apiRespPath = path.join(outputDir, "ApiResponse.java");
  fs.writeFileSync(
    apiRespPath,
    `package com.app.sdk;\n\npublic class ApiResponse<T> {\n    private final boolean ok;\n    private final int statusCode;\n    private final T data;\n    private final String error;\n\n    public ApiResponse(boolean ok, int statusCode, T data, String error) {\n        this.ok = ok;\n        this.statusCode = statusCode;\n        this.data = data;\n        this.error = error;\n    }\n\n    public boolean isOk() { return ok; }\n    public int getStatusCode() { return statusCode; }\n    public T getData() { return data; }\n    public String getError() { return error; }\n}\n`,
    "utf8"
  );

  // 3. Models.java
  const modelsPath = path.join(outputDir, "Models.java");
  const dtoResult = options.dtoResult || (options.sourcesDir ? extractDtoModels(endpoints, options.sourcesDir) : { classIndex: new Map(), modelUsage: new Map(), models: new Map() });
  generateJavaModels(dtoResult, modelsPath);

  // 4. Services.java
  const servicesPath = path.join(outputDir, "Services.java");
  fs.writeFileSync(servicesPath, generateJavaServices(endpoints), "utf8");

  // 5. pom.xml
  const pomPath = path.join(outputDir, "pom.xml");
  fs.writeFileSync(
    pomPath,
    `<project xmlns="http://maven.apache.org/POM/4.0.0"\n         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">\n    <modelVersion>4.0.0</modelVersion>\n    <groupId>com.app</groupId>\n    <artifactId>app-sdk</artifactId>\n    <version>1.0.0</version>\n    <properties>\n        <maven.compiler.source>17</maven.compiler.source>\n        <maven.compiler.target>17</maven.compiler.target>\n        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>\n    </properties>\n</project>\n`,
    "utf8"
  );

  return { clientPath, servicesPath, modelsPath };
}
