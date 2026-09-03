import * as fs from "fs";
import * as path from "path";
import { ScannedEndpoint } from "../../core/scanner";
import { SecurityScanResult } from "../../core/security-scanner";
import { DtoExtractionResult } from "../../core/dto-extractor";
import { generateClientCode } from "./client";
import { generateServices } from "./services";
import { generateTypeScriptModels } from "./models";

export * from "./models";
export * from "./services";
export * from "./client";

export interface TypeScriptGeneratorOptions {
  endpoints: ScannedEndpoint[];
  outputDir: string;
  baseUrl?: string;
  securityResult?: SecurityScanResult;
  sourcesDir?: string;
  dtoResult?: DtoExtractionResult;
  verbose?: boolean;
}

export function generateTypeScriptSdk(options: TypeScriptGeneratorOptions): {
  clientPath: string;
  servicesPath: string;
  modelsPath: string;
} {
  const { endpoints, outputDir, baseUrl, securityResult, sourcesDir, verbose } = options;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. client.ts
  const clientPath = path.join(outputDir, "client.ts");
  const clientCode = generateClientCode({
    baseUrl: baseUrl || "https://api.example.com",
    securityResult,
  });
  fs.writeFileSync(clientPath, clientCode, "utf8");

  // 2. types.ts (DTO models)
  const modelsPath = path.join(outputDir, "types.ts");
  generateTypeScriptModels({
    sourcesDir,
    outputPath: modelsPath,
    endpoints,
    verbose: verbose || false,
  });

  // 3. index.ts (API service methods)
  const servicesPath = path.join(outputDir, "index.ts");
  generateServices({
    endpoints,
    outputPath: servicesPath,
    modelsPath,
    verbose: verbose || false,
  });

  // 4. tsconfig.json (standard compiler configuration)
  const tsconfigPath = path.join(outputDir, "tsconfig.json");
  if (!fs.existsSync(tsconfigPath)) {
    fs.writeFileSync(
      tsconfigPath,
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "CommonJS",
            moduleResolution: "node",
            strict: false,
            noEmit: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
          },
          include: ["./**/*"],
        },
        null,
        2
      ),
      "utf8"
    );
  }

  return { clientPath, servicesPath, modelsPath };
}
