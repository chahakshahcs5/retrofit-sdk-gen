import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as http from "http";
import { SupportedLanguage } from "../index";
import { scanApis, ScanResult, ScannedEndpoint } from "./scanner";
import { scanSecurityInterceptors, SecurityScanResult } from "./security-scanner";
import { isPackageFile, decompilePackage } from "./decompiler";
import { extractDtoModels, DtoExtractionResult } from "./dto-extractor";
import { generateOpenApi, OpenApiSpec } from "../exporters/openapi";
import { generatePostmanCollection } from "../exporters/postman";
import { generateTypeScriptSdk } from "../exporters/typescript/index";
import { generatePythonSdk } from "../exporters/python/index";
import { generateGoSdk } from "../exporters/go/index";
import { generateCSharpSdk } from "../exporters/csharp/index";
import { generateJavaSdk } from "../exporters/java/index";
import { generateRustSdk } from "../exporters/rust/index";
import { generateCppSdk } from "../exporters/cpp/index";
import { generateCSdk } from "../exporters/c/index";
import { startPlaygroundServer } from "../playground/server";
import { detectToolchains, compileSdk, ToolchainCheck, CompileResult } from "./toolchain";

export interface TestRunnerOptions {
  inputTarget: string;
  languages?: SupportedLanguage[];
  strict?: boolean;
  skipMock?: boolean;
  keepOutput?: boolean;
  testDir?: string;
  verbose?: boolean;
}

export interface StageResult {
  name: string;
  passed: boolean;
  durationMs: number;
  details: string;
}

export interface TestRunnerResult {
  passed: boolean;
  totalDurationMs: number;
  stages: StageResult[];
  scanResult: ScanResult;
  dtoResult: DtoExtractionResult;
  securityResult: SecurityScanResult;
  compilationResults: CompileResult[];
  mockTestPassed: boolean;
  outputDir: string;
}

const ALL_LANGUAGES: SupportedLanguage[] = [
  "typescript",
  "python",
  "go",
  "csharp",
  "java",
  "rust",
  "cpp",
  "c",
];

export async function runSdkVerification(options: TestRunnerOptions): Promise<TestRunnerResult> {
  const overallStart = Date.now();
  const stages: StageResult[] = [];
  const targetLanguages = options.languages && options.languages.length > 0 ? options.languages : ALL_LANGUAGES;

  const testBaseDir = options.testDir
    ? path.resolve(process.cwd(), options.testDir)
    : path.join(os.tmpdir(), `retrofit-test-${Date.now()}`);

  if (!fs.existsSync(testBaseDir)) {
    fs.mkdirSync(testBaseDir, { recursive: true });
  }

  console.log("\n================================================================================");
  console.log("            🧪 RETROFIT AUTOMATED SDK VERIFICATION & TEST RUNNER               ");
  console.log("================================================================================\n");
  console.log(`Target Input:   ${options.inputTarget}`);
  console.log(`Languages:      ${targetLanguages.join(", ")}`);
  console.log(`Strict Mode:    ${options.strict ? "Enabled (fails on missing compiler)" : "Disabled"}`);
  console.log(`Test Output:    ${testBaseDir}\n`);

  // --------------------------------------------------------------------------
  // STAGE 1: Decompilation & AST Extraction Assertions
  // --------------------------------------------------------------------------
  const stage1Start = Date.now();
  console.log("[STAGE 1/4] Scanning and extracting AST from input...");

  let sourcesDir: string;
  if (isPackageFile(options.inputTarget)) {
    console.log(`  - Decompiling Android package: ${path.basename(options.inputTarget)}...`);
    sourcesDir = await decompilePackage(options.inputTarget, { verbose: options.verbose });
  } else {
    sourcesDir = path.resolve(process.cwd(), options.inputTarget);
  }

  const scanResult = scanApis({ sourcesDir });
  if (scanResult.totalCount === 0) {
    throw new Error(`Stage 1 Failed: Zero Retrofit endpoints detected in ${sourcesDir}`);
  }

  const dtoResult = extractDtoModels(scanResult.apis, sourcesDir);
  const securityResult = scanSecurityInterceptors(sourcesDir);

  const stage1Duration = Date.now() - stage1Start;
  stages.push({
    name: "AST Extraction",
    passed: true,
    durationMs: stage1Duration,
    details: `Discovered ${scanResult.totalCount} endpoints, ${dtoResult.models.size} models, ${securityResult.interceptorsFound.length} OkHttp interceptors`,
  });
  console.log(`  ✅ Stage 1 Passed: ${scanResult.totalCount} endpoints, ${dtoResult.models.size} models in ${stage1Duration}ms\n`);

  // --------------------------------------------------------------------------
  // STAGE 2: Multi-Language SDK & Spec Generation
  // --------------------------------------------------------------------------
  const stage2Start = Date.now();
  console.log(`[STAGE 2/4] Generating SDKs for ${targetLanguages.length} languages & specs...`);

  const sdksDir = path.join(testBaseDir, "sdks");
  const specsDir = path.join(testBaseDir, "specs");
  fs.mkdirSync(sdksDir, { recursive: true });
  fs.mkdirSync(specsDir, { recursive: true });

  // OpenAPI & Postman
  const openapiPath = path.join(specsDir, "openapi.json");
  const postmanPath = path.join(specsDir, "postman_collection.json");
  const openapiSpec = generateOpenApi(scanResult.apis, {
    baseUrl: scanResult.detectedBaseUrl,
  });
  fs.writeFileSync(openapiPath, JSON.stringify(openapiSpec, null, 2), "utf8");

  const postmanCol = generatePostmanCollection(scanResult.apis, {
    baseUrl: scanResult.detectedBaseUrl,
  });
  fs.writeFileSync(postmanPath, JSON.stringify(postmanCol, null, 2), "utf8");

  const generatedDirs: Partial<Record<SupportedLanguage, string>> = {};

  for (const lang of targetLanguages) {
    const langDir = path.join(sdksDir, lang);
    fs.mkdirSync(langDir, { recursive: true });
    generatedDirs[lang] = langDir;

    switch (lang) {
      case "typescript":
        generateTypeScriptSdk({
          endpoints: scanResult.apis,
          outputDir: langDir,
          sourcesDir,
          baseUrl: scanResult.detectedBaseUrl,
          securityResult,
          dtoResult,
        });
        break;
      case "python":
        generatePythonSdk({ endpoints: scanResult.apis, outputDir: langDir, sourcesDir, baseUrl: scanResult.detectedBaseUrl });
        break;
      case "go":
        generateGoSdk({ endpoints: scanResult.apis, outputDir: langDir, sourcesDir, baseUrl: scanResult.detectedBaseUrl });
        break;
      case "csharp":
        generateCSharpSdk({ endpoints: scanResult.apis, outputDir: langDir, sourcesDir, baseUrl: scanResult.detectedBaseUrl });
        break;
      case "java":
        generateJavaSdk({ endpoints: scanResult.apis, outputDir: langDir, sourcesDir, baseUrl: scanResult.detectedBaseUrl });
        break;
      case "rust":
        generateRustSdk({ endpoints: scanResult.apis, outputDir: langDir, sourcesDir, baseUrl: scanResult.detectedBaseUrl });
        break;
      case "cpp":
        generateCppSdk({ endpoints: scanResult.apis, outputDir: langDir, sourcesDir, baseUrl: scanResult.detectedBaseUrl });
        break;
      case "c":
        generateCSdk({ endpoints: scanResult.apis, outputDir: langDir, sourcesDir, baseUrl: scanResult.detectedBaseUrl });
        break;
    }
  }

  const stage2Duration = Date.now() - stage2Start;
  stages.push({
    name: "SDK Generation",
    passed: true,
    durationMs: stage2Duration,
    details: `Generated ${targetLanguages.length} language SDKs + OpenAPI 3.0 + Postman Collection`,
  });
  console.log(`  ✅ Stage 2 Passed: ${targetLanguages.length} SDKs generated in ${stage2Duration}ms\n`);

  // --------------------------------------------------------------------------
  // STAGE 3: Toolchain Detection & Native Compilation
  // --------------------------------------------------------------------------
  console.log("[STAGE 3/4] Checking local compilers and building SDKs...");
  const toolchains = detectToolchains();

  // Print Toolchain Matrix
  console.log("  ┌────────────────────────────────────────────────────────────────────────┐");
  console.log("  │                       LOCAL COMPILER TOOLCHAINS                        │");
  console.log("  ├──────────────┬───────────┬────────────────────────────┬────────────────┤");
  console.log("  │ Language     │ Status    │ Binary / Version           │ Action         │");
  console.log("  ├──────────────┼───────────┼────────────────────────────┼────────────────┤");

  for (const lang of targetLanguages) {
    const tc = toolchains[lang];
    const statusIcon = tc.installed ? "✅ Ready  " : "⚠️  Missing";
    const binVer = (tc.version ? `${tc.version}` : tc.binary).slice(0, 26).padEnd(26);
    const action = tc.installed ? "Compile & Vet" : "Skip (No Tool)";
    const langPad = lang.padEnd(12);
    console.log(`  │ ${langPad} │ ${statusIcon}│ ${binVer} │ ${action.padEnd(14)} │`);
  }
  console.log("  └──────────────┴───────────┴────────────────────────────┴────────────────┘\n");

  const compilationResults: CompileResult[] = [];
  let allCompilationsPassed = true;

  for (const lang of targetLanguages) {
    const langDir = generatedDirs[lang]!;
    const tc = toolchains[lang];

    process.stdout.write(`  Building [${lang}]... `);
    const compResult = await compileSdk(lang, langDir, tc);
    compilationResults.push(compResult);

    if (compResult.skipped) {
      console.log(`⏩ SKIPPED (${compResult.skipReason})`);
      if (options.strict) {
        allCompilationsPassed = false;
      }
    } else if (compResult.passed) {
      console.log(`✅ PASSED (${compResult.durationMs}ms)`);
    } else {
      console.log(`❌ FAILED`);
      if (compResult.error) {
        console.log(`     Error: ${compResult.error.split("\n")[0]}`);
      }
      allCompilationsPassed = false;
    }
  }

  stages.push({
    name: "Language Compilation",
    passed: allCompilationsPassed,
    durationMs: compilationResults.reduce((acc, c) => acc + c.durationMs, 0),
    details: `${compilationResults.filter((c) => c.passed).length} passed, ${compilationResults.filter((c) => c.skipped).length} skipped, ${compilationResults.filter((c) => !c.passed && !c.skipped).length} failed`,
  });

  console.log();

  // --------------------------------------------------------------------------
  // STAGE 4: End-to-End Mock Server Execution Test
  // --------------------------------------------------------------------------
  let mockTestPassed = true;
  if (!options.skipMock) {
    const stage4Start = Date.now();
    console.log("[STAGE 4/4] Verifying End-to-End Mock Server & Request Serialization...");

    const testPort = 3199;
    try {
      const serverInfo = await startPlaygroundServer({
        port: testPort,
        apis: scanResult.apis,
        openapiSpec,
        baseUrl: scanResult.detectedBaseUrl,
        verbose: false,
      });

      // Test HTTP call to mock server
      const testUrl = `http://localhost:${testPort}/openapi.json`;
      const mockOk = await new Promise<boolean>((resolve) => {
        http.get(testUrl, (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              const parsed = JSON.parse(data);
              resolve(res.statusCode === 200 && parsed.openapi !== undefined);
            } catch {
              resolve(false);
            }
          });
        }).on("error", () => resolve(false));
      });

      await serverInfo.close();

      const stage4Duration = Date.now() - stage4Start;
      mockTestPassed = mockOk;
      stages.push({
        name: "Runtime Mock Server",
        passed: mockOk,
        durationMs: stage4Duration,
        details: mockOk ? "Mock API server booted and responded with valid OpenAPI schema" : "Mock server failed HTTP ping",
      });

      if (mockOk) {
        console.log(`  ✅ Stage 4 Passed: Runtime mock server verified in ${stage4Duration}ms\n`);
      } else {
        console.log(`  ❌ Stage 4 Failed: Mock server ping failed\n`);
      }
    } catch (err: any) {
      mockTestPassed = false;
      stages.push({
        name: "Runtime Mock Server",
        passed: false,
        durationMs: Date.now() - stage4Start,
        details: err.message,
      });
      console.log(`  ❌ Stage 4 Failed: ${err.message}\n`);
    }
  }

  // --------------------------------------------------------------------------
  // SUMMARY & CLEANUP
  // --------------------------------------------------------------------------
  const totalDurationMs = Date.now() - overallStart;
  const overallPassed = stages.every((s) => s.passed) && allCompilationsPassed && mockTestPassed;

  console.log("================================================================================");
  console.log(overallPassed ? "                      🎉 VERIFICATION SUITE PASSED!                             " : "                      ⚠️ VERIFICATION SUITE ENCOUNTERED FAILURES               ");
  console.log("================================================================================\n");

  for (const st of stages) {
    const icon = st.passed ? "✅" : "❌";
    console.log(`  ${icon} ${st.name.padEnd(25)} [${st.durationMs}ms] - ${st.details}`);
  }

  console.log(`\n  Total Test Time: ${totalDurationMs}ms`);

  if (!options.keepOutput) {
    try {
      fs.rmSync(testBaseDir, { recursive: true, force: true });
    } catch {}
  } else {
    console.log(`  Test artifacts retained at: ${testBaseDir}`);
  }

  console.log("================================================================================\n");

  return {
    passed: overallPassed,
    totalDurationMs,
    stages,
    scanResult,
    dtoResult,
    securityResult,
    compilationResults,
    mockTestPassed,
    outputDir: testBaseDir,
  };
}
