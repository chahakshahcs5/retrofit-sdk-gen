import * as fs from "fs";
import * as path from "path";
import * as prettier from "prettier";

// Core Engines
import { scanApis, ScanResult, ScannedEndpoint, resolveSourcesDir } from "./core/scanner";
import { scanSecurityInterceptors, SecurityScanResult } from "./core/security-scanner";
import {
  isPackageFile,
  decompilePackage,
  ensureJadx,
  clearSourcesCache,
  clearDownloadedJadx,
  clearAll,
  getDefaultCacheDir,
  getToolDir,
  CleanResult,
} from "./core/decompiler";
import { diffEndpoints, diffSourceDirs, diffApis, formatDiffMarkdown, ApiDiffResult } from "./core/diff";
import { extractDtoModels, DtoExtractionResult } from "./core/dto-extractor";
import { detectToolchains, compileSdk, ToolchainCheck, CompileResult } from "./core/toolchain";
import { runSdkVerification, TestRunnerOptions, TestRunnerResult } from "./core/test-runner";

// TypeScript Exporter
import {
  generateTypeScriptModels,
  GenerateModelsResult,
  generateServices,
  GenerateServicesResult,
  generateClientCode,
} from "./exporters/typescript";

// Multi-Language Exporters
import { generateOpenApi, OpenApiSpec } from "./exporters/openapi";
import { generatePostmanCollection, PostmanCollection } from "./exporters/postman";
import { generatePythonSdk, PythonGeneratorOptions } from "./exporters/python/index";
import { generateGoSdk, GoGeneratorOptions } from "./exporters/go/index";
import { generateCSharpSdk, CSharpGeneratorOptions } from "./exporters/csharp/index";
import { generateJavaSdk, JavaGeneratorOptions } from "./exporters/java/index";
import { generateRustSdk, RustGeneratorOptions } from "./exporters/rust/index";
import { generateCppSdk, CppGeneratorOptions } from "./exporters/cpp/index";
import { generateCSdk, CGeneratorOptions } from "./exporters/c/index";
import { startPlaygroundServer, PlaygroundServerOptions } from "./playground/server";

async function formatFile(filePath: string): Promise<void> {
  try {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, "utf8");
    const formatted = await prettier.format(content, {
      parser: "typescript",
      singleQuote: false,
      semi: true,
      trailingComma: "all",
      printWidth: 100,
    });
    fs.writeFileSync(filePath, formatted, "utf8");
  } catch {
    // Non-fatal fallback
  }
}

export type SupportedLanguage = "typescript" | "python" | "go" | "csharp" | "java" | "rust" | "cpp" | "c";

export interface SdkGeneratorOptions {
  sourcesDir?: string;
  outputDir?: string;
  verbose?: boolean;
  openapiPath?: string;
  postmanPath?: string;
  scanSecurity?: boolean;
  jadxPath?: string;
  noCache?: boolean;
  cleanCache?: boolean;
  cleanJadx?: boolean;
  languages?: SupportedLanguage[];
  sourcesOut?: string;
}

export interface SdkGeneratorResult {
  scanResult: ScanResult;
  modelsResult?: GenerateModelsResult;
  servicesResult?: GenerateServicesResult;
  clientCreated: boolean;
  outputDir: string;
  durationMs: number;
  openapiPath?: string;
  postmanPath?: string;
  securityResult?: SecurityScanResult;
  decompiledSources?: string;
  typescriptDir?: string;
  pythonDir?: string;
  goDir?: string;
  csharpDir?: string;
  javaDir?: string;
  rustDir?: string;
  cppDir?: string;
  cDir?: string;
}

/**
 * Universal Android Retrofit to Multi-Language SDK Generator
 */
export async function generateSdk(options: SdkGeneratorOptions = {}): Promise<SdkGeneratorResult> {
  const startTime = Date.now();
  const outputDir = path.resolve(process.cwd(), options.outputDir || "sdk");

  let sourcesDir: string;
  let decompiledSources: string | undefined = undefined;
  const rawInput = options.sourcesDir || "sources";

  if (options.cleanJadx && !isPackageFile(rawInput)) {
    const res = clearDownloadedJadx();
    if (res.cleared) {
      console.log(`[DECOMPILER] Removed downloaded JADX binary (${res.formattedSize}) at ${res.path}`);
    }
  }

  if (options.cleanCache && !isPackageFile(rawInput)) {
    const res = clearSourcesCache();
    if (res.cleared) {
      console.log(`[DECOMPILER] Cleared decompilation cache (${res.formattedSize}) at ${res.path}`);
    }
  }

  if (isPackageFile(rawInput)) {
    console.log(`[DECOMPILER] Detected Android package input: ${rawInput}`);
    sourcesDir = await decompilePackage(rawInput, {
      jadxPath: options.jadxPath,
      verbose: options.verbose,
      noCache: options.noCache,
      cleanCache: options.cleanCache,
      cleanJadx: options.cleanJadx,
      sourcesOut: options.sourcesOut,
    });
    decompiledSources = sourcesDir;
  } else {
    sourcesDir = resolveSourcesDir(options.sourcesDir);
  }

  console.log("\n================================================================================");
  console.log("             RETROFIT TO MULTI-LANGUAGE SDK GENERATOR (CLI)                     ");
  console.log("================================================================================\n");
  console.log(`Sources Directory: ${sourcesDir}`);
  console.log(`Target SDK Output: ${outputDir}\n`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // STAGE 1: Scan Endpoints
  console.log("[STAGE 1/3] Scanning Retrofit Java/Kotlin Interfaces & Endpoints...");
  const scanStart = Date.now();
  const scanResult = scanApis({
    sourcesDir,
    verbose: options.verbose,
  });
  const scanDuration = Date.now() - scanStart;
  const modulesCount = Object.keys(scanResult.moduleBreakdown).length;
  console.log(`[STAGE 1/3] Completed in ${scanDuration}ms!`);
  console.log(`            Found: ${scanResult.totalCount} endpoints across ${modulesCount} modules`);
  if (scanResult.detectedBaseUrl) {
    console.log(`            Detected App Base URL: ${scanResult.detectedBaseUrl}\n`);
  } else {
    console.log("");
  }

  // Security Interceptors Scan
  let securityResultOut: SecurityScanResult | undefined = undefined;
  if (options.scanSecurity) {
    console.log("[SECURITY] Scanning OkHttp Interceptors for global auth tokens and headers...");
    securityResultOut = scanSecurityInterceptors(sourcesDir);
    console.log(`[SECURITY] Found ${securityResultOut.interceptorsFound.length} OkHttp Interceptors`);
    console.log(`           Detected Headers (${securityResultOut.detectedHeaderNames.length}):`, securityResultOut.detectedHeaderNames);
    if (securityResultOut.authHeaders.length > 0) {
      console.log(`           Identified Auth Headers:`, securityResultOut.authHeaders);
    }
    console.log("");
  }

  const isMultiLang = Boolean(options.languages && options.languages.length > 1);
  const requestedLangs = options.languages || ["typescript"];

  // Helper to determine destination path
  const getLangOutDir = (lang: string) =>
    isMultiLang ? path.join(outputDir, "sdks", lang) : path.join(outputDir);

  // 1. TypeScript SDK Generation
  let clientCreated = false;
  let modelsResult: GenerateModelsResult | undefined = undefined;
  let servicesResult: GenerateServicesResult | undefined = undefined;
  let typescriptDirOut: string | undefined = undefined;
  let typesFilePathOut: string | undefined = undefined;

  if (requestedLangs.includes("typescript")) {
    const tsOut = getLangOutDir("typescript");
    if (!fs.existsSync(tsOut)) {
      fs.mkdirSync(tsOut, { recursive: true });
    }
    typescriptDirOut = tsOut;

    // Scaffolding starter client.ts
    const clientPath = path.join(tsOut, "client.ts");
    if (!fs.existsSync(clientPath)) {
      console.log("[SCAFFOLD] Generating plug-and-play starter client.ts...");
      if (!securityResultOut) {
        securityResultOut = scanSecurityInterceptors(sourcesDir);
      }
      const starterClientCode = generateClientCode({
        baseUrl: scanResult.detectedBaseUrl,
        securityResult: securityResultOut,
      });
      fs.writeFileSync(clientPath, starterClientCode, "utf8");
      clientCreated = true;
      console.log(`[SCAFFOLD] Created starter ${clientPath} (Pre-filled baseUrl: ${scanResult.detectedBaseUrl || "https://api.example.com"})`);
      if (securityResultOut.detectedHeaderNames.length > 0) {
        console.log(`[SCAFFOLD] Discovered & injected ${securityResultOut.detectedHeaderNames.length} OkHttp headers into client.ts:`, securityResultOut.detectedHeaderNames);
      }
      console.log("");
    } else {
      console.log(`[SCAFFOLD] Preserving existing custom client.ts at ${clientPath} (will not overwrite)\n`);
    }

    // STAGE 2: Extract DTOs & Generate TypeScript Models
    console.log("[STAGE 2/3] Extracting DTOs and generating TypeScript models (types.ts)...");
    const modelsStart = Date.now();
    const typesFilePath = path.join(tsOut, "types.ts");
    typesFilePathOut = typesFilePath;
    modelsResult = generateTypeScriptModels({
      sourcesDir,
      outputPath: typesFilePath,
      endpoints: scanResult.apis,
      verbose: options.verbose,
    });
    const modelsDuration = Date.now() - modelsStart;
    console.log(`[STAGE 2/3] Completed in ${modelsDuration}ms!`);
    console.log(`            Generated: ${modelsResult.totalModels} interfaces in ${typesFilePath}\n`);

    // STAGE 3: Generate API Services & index.ts
    console.log("[STAGE 3/3] Generating API Service Classes & index.ts...");
    const servicesStart = Date.now();
    const indexFilePath = path.join(tsOut, "index.ts");
    servicesResult = generateServices({
      endpoints: scanResult.apis,
      outputPath: indexFilePath,
      modelsPath: typesFilePath,
      verbose: options.verbose,
    });
    const servicesDuration = Date.now() - servicesStart;
    console.log(`[STAGE 3/3] Completed in ${servicesDuration}ms!`);
    console.log(`            Generated: ${servicesResult.totalMethods} typed API methods in ${indexFilePath}\n`);

    // Prettier Formatting
    const formatStart = Date.now();
    await formatFile(clientPath);
    await formatFile(typesFilePath);
    await formatFile(indexFilePath);
    const formatDuration = Date.now() - formatStart;
    console.log(`[FORMAT] Formatted SDK files with Prettier in ${formatDuration}ms!\n`);

    // Emit standard tsconfig.json if missing
    const tsconfigOutPath = path.join(tsOut, "tsconfig.json");
    if (!fs.existsSync(tsconfigOutPath)) {
      fs.writeFileSync(
        tsconfigOutPath,
        JSON.stringify(
          {
            compilerOptions: {
              target: "ES2022",
              module: "CommonJS",
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
  }

  // Extract DTO models once for all languages
  let sharedDtoResult: DtoExtractionResult | undefined = undefined;
  if (sourcesDir) {
    sharedDtoResult = extractDtoModels(scanResult.apis, sourcesDir, { verbose: options.verbose });
  }

  // 2. Python SDK
  let pythonDirOut: string | undefined = undefined;
  if (requestedLangs.includes("python")) {
    const pyDir = getLangOutDir("python");
    generatePythonSdk({ endpoints: scanResult.apis, outputDir: pyDir, baseUrl: scanResult.detectedBaseUrl, securityResult: securityResultOut, dtoResult: sharedDtoResult });
    pythonDirOut = pyDir;
    console.log(`[PYTHON] Successfully generated Python SDK in ${pyDir}\n`);
  }

  // 3. Go SDK
  let goDirOut: string | undefined = undefined;
  if (requestedLangs.includes("go")) {
    const goDir = getLangOutDir("go");
    generateGoSdk({ endpoints: scanResult.apis, outputDir: goDir, baseUrl: scanResult.detectedBaseUrl, securityResult: securityResultOut, dtoResult: sharedDtoResult });
    goDirOut = goDir;
    console.log(`[GO] Successfully generated Go SDK in ${goDir}\n`);
  }

  // 4. C# SDK
  let csharpDirOut: string | undefined = undefined;
  if (requestedLangs.includes("csharp")) {
    const csDir = getLangOutDir("csharp");
    generateCSharpSdk({ endpoints: scanResult.apis, outputDir: csDir, baseUrl: scanResult.detectedBaseUrl, securityResult: securityResultOut, dtoResult: sharedDtoResult });
    csharpDirOut = csDir;
    console.log(`[CSHARP] Successfully generated C# SDK in ${csDir}\n`);
  }

  // 5. Java SDK
  let javaDirOut: string | undefined = undefined;
  if (requestedLangs.includes("java")) {
    const jDir = getLangOutDir("java");
    generateJavaSdk({ endpoints: scanResult.apis, outputDir: jDir, baseUrl: scanResult.detectedBaseUrl, securityResult: securityResultOut, dtoResult: sharedDtoResult });
    javaDirOut = jDir;
    console.log(`[JAVA] Successfully generated Java SDK in ${jDir}\n`);
  }

  // 6. Rust SDK
  let rustDirOut: string | undefined = undefined;
  if (requestedLangs.includes("rust")) {
    const rDir = getLangOutDir("rust");
    generateRustSdk({ endpoints: scanResult.apis, outputDir: rDir, baseUrl: scanResult.detectedBaseUrl, securityResult: securityResultOut, dtoResult: sharedDtoResult });
    rustDirOut = rDir;
    console.log(`[RUST] Successfully generated Rust SDK in ${rDir}\n`);
  }

  // 7. C++ SDK
  let cppDirOut: string | undefined = undefined;
  if (requestedLangs.includes("cpp")) {
    const cppDir = getLangOutDir("cpp");
    generateCppSdk({ endpoints: scanResult.apis, outputDir: cppDir, baseUrl: scanResult.detectedBaseUrl, securityResult: securityResultOut, dtoResult: sharedDtoResult });
    cppDirOut = cppDir;
    console.log(`[CPP] Successfully generated C++ SDK in ${cppDir}\n`);
  }

  // 8. C SDK
  let cDirOut: string | undefined = undefined;
  if (requestedLangs.includes("c")) {
    const cDir = getLangOutDir("c");
    generateCSdk({ endpoints: scanResult.apis, outputDir: cDir, baseUrl: scanResult.detectedBaseUrl, securityResult: securityResultOut, dtoResult: sharedDtoResult });
    cDirOut = cDir;
    console.log(`[C] Successfully generated C SDK in ${cDir}\n`);
  }

  // Optional: OpenAPI 3.0.3 Export
  let openapiPathOut: string | undefined = undefined;
  if (options.openapiPath) {
    const targetPath = path.resolve(process.cwd(), options.openapiPath);
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    console.log(`[OPENAPI] Generating OpenAPI 3.0.3 specification at ${targetPath}...`);
    const spec = generateOpenApi(scanResult.apis, {
      baseUrl: scanResult.detectedBaseUrl,
      typesFilePath: typesFilePathOut,
    });
    fs.writeFileSync(targetPath, JSON.stringify(spec, null, 2), "utf8");
    openapiPathOut = targetPath;
    console.log(`[OPENAPI] Successfully exported OpenAPI 3.0.3 spec to ${targetPath}\n`);
  }

  // Optional: Postman Collection Export
  let postmanPathOut: string | undefined = undefined;
  if (options.postmanPath) {
    const targetPath = path.resolve(process.cwd(), options.postmanPath);
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    console.log(`[POSTMAN] Generating Postman Collection v2.1 at ${targetPath}...`);
    const collection = generatePostmanCollection(scanResult.apis, {
      baseUrl: scanResult.detectedBaseUrl,
    });
    fs.writeFileSync(targetPath, JSON.stringify(collection, null, 2), "utf8");
    postmanPathOut = targetPath;
    console.log(`[POSTMAN] Successfully exported Postman Collection to ${targetPath}\n`);
  }

  const durationMs = Date.now() - startTime;
  console.log("================================================================================");
  console.log(`  SDK GENERATION SUCCESSFUL in ${durationMs}ms`);
  console.log("================================================================================");
  console.log(`  - Total Endpoints:  ${scanResult.totalCount}`);
  if (modelsResult) console.log(`  - Total Data Types: ${modelsResult.totalModels}`);
  console.log(`  - Output Folder:    ${outputDir}`);
  if (openapiPathOut) console.log(`  - OpenAPI Spec:     ${openapiPathOut}`);
  if (postmanPathOut) console.log(`  - Postman Export:   ${postmanPathOut}`);
  if (typescriptDirOut) console.log(`  - TypeScript SDK:   ${typescriptDirOut}`);
  if (pythonDirOut)     console.log(`  - Python SDK:       ${pythonDirOut}`);
  if (goDirOut)         console.log(`  - Go SDK:           ${goDirOut}`);
  if (csharpDirOut)     console.log(`  - C# SDK:           ${csharpDirOut}`);
  if (javaDirOut)       console.log(`  - Java SDK:         ${javaDirOut}`);
  if (rustDirOut)       console.log(`  - Rust SDK:         ${rustDirOut}`);
  if (cppDirOut)        console.log(`  - C++ SDK:          ${cppDirOut}`);
  if (cDirOut)          console.log(`  - C SDK:            ${cDirOut}`);
  if (options.sourcesOut) console.log(`  - Exported Sources: ${path.resolve(process.cwd(), options.sourcesOut)}`);
  console.log("================================================================================\n");

  return {
    scanResult,
    modelsResult,
    servicesResult,
    clientCreated,
    outputDir,
    durationMs,
    openapiPath: openapiPathOut,
    postmanPath: postmanPathOut,
    securityResult: securityResultOut,
    typescriptDir: typescriptDirOut,
    pythonDir: pythonDirOut,
    goDir: goDirOut,
    csharpDir: csharpDirOut,
    javaDir: javaDirOut,
    rustDir: rustDirOut,
    cppDir: cppDirOut,
    cDir: cDirOut,
  };
}

export {
  scanApis,
  generateTypeScriptModels,
  generateServices,
  generateOpenApi,
  generatePostmanCollection,
  scanSecurityInterceptors,
  diffEndpoints,
  diffSourceDirs,
  diffApis,
  formatDiffMarkdown,
  isPackageFile,
  decompilePackage,
  ensureJadx,
  clearSourcesCache,
  clearDownloadedJadx,
  clearAll,
  getDefaultCacheDir,
  getToolDir,
  generateClientCode,
  resolveSourcesDir,
  startPlaygroundServer,
  generatePythonSdk,
  generateGoSdk,
  generateCSharpSdk,
  generateJavaSdk,
  generateRustSdk,
  generateCppSdk,
  generateCSdk,
  extractDtoModels,
  detectToolchains,
  compileSdk,
  runSdkVerification,
  ToolchainCheck,
  CompileResult,
  TestRunnerOptions,
  TestRunnerResult,
};
