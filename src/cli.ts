#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";
import {
  generateSdk,
  diffApis,
  formatDiffMarkdown,
  scanSecurityInterceptors,
  resolveSourcesDir,
  isPackageFile,
  decompilePackage,
  scanApis,
  generateOpenApi,
  startPlaygroundServer,
  SupportedLanguage,
  clearSourcesCache,
  clearDownloadedJadx,
  clearAll,
  runSdkVerification,
} from "./index";

interface CliOptions {
  command: "generate" | "diff" | "security" | "serve" | "clean" | "test";
  inputTarget?: string;
  outputDir: string;
  verbose: boolean;
  openapiPath?: string;
  postmanPath?: string;
  scanSecurity: boolean;
  jadxPath?: string;
  noCache: boolean;
  cleanCache: boolean;
  cleanJadx: boolean;
  cleanAll: boolean;
  strict: boolean;
  skipMock: boolean;
  keepOutput: boolean;
  port: number;
  languages: SupportedLanguage[];
  languagesExplicit: boolean;
  diffTargetA?: string;
  diffTargetB?: string;
  diffOutput?: string;
  sourcesOut?: string;
}

function parseCliArgs(): CliOptions {
  const args = process.argv.slice(2);
  let command: "generate" | "diff" | "security" | "serve" | "clean" | "test" = "generate";
  let inputTarget: string | undefined = undefined;
  let outputDir = "sdk";
  let verbose = true;
  let openapiPath: string | undefined = undefined;
  let postmanPath: string | undefined = undefined;
  let openapiRequested = false;
  let postmanRequested = false;
  let scanSecurity = false;
  let jadxPath: string | undefined = undefined;
  let noCache = false;
  let cleanCache = false;
  let cleanJadx = false;
  let cleanAll = false;
  let strict = false;
  let skipMock = false;
  let keepOutput = false;
  let port = 3000;
  let languagesExplicit = false;
  const languages: SupportedLanguage[] = ["typescript"];
  let diffTargetA: string | undefined = undefined;
  let diffTargetB: string | undefined = undefined;
  let diffOutput: string | undefined = undefined;
  let sourcesOut: string | undefined = undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    // Subcommands
    if (arg === "serve") {
      command = "serve";
      if (i + 1 < args.length && !args[i + 1].startsWith("-")) inputTarget = args[++i];
      continue;
    }

    if (arg === "diff") {
      command = "diff";
      if (i + 1 < args.length && !args[i + 1].startsWith("-")) diffTargetA = args[++i];
      if (i + 1 < args.length && !args[i + 1].startsWith("-")) diffTargetB = args[++i];
      continue;
    }

    if (arg === "security") {
      command = "security";
      if (i + 1 < args.length && !args[i + 1].startsWith("-")) inputTarget = args[++i];
      continue;
    }

    if (arg === "clean") {
      command = "clean";
      continue;
    }

    if (arg === "test") {
      command = "test";
      if (i + 1 < args.length && !args[i + 1].startsWith("-")) inputTarget = args[++i];
      continue;
    }

    // Options
    if (arg.startsWith("--sources=") || arg.startsWith("--sources-dir=")) {
      inputTarget = arg.split("=")[1];
    } else if ((arg === "-s" || arg === "--sources" || arg === "--sources-dir") && i + 1 < args.length) {
      inputTarget = args[++i];
    } else if (arg.startsWith("--output=") || arg.startsWith("-o=")) {
      outputDir = arg.split("=")[1];
      diffOutput = outputDir;
    } else if ((arg === "-o" || arg === "--output" || arg === "--out") && i + 1 < args.length) {
      outputDir = args[++i];
      diffOutput = outputDir;
    } else if (arg === "--openapi") {
      openapiRequested = true;
      if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
        openapiPath = args[++i];
      }
    } else if (arg === "--postman") {
      postmanRequested = true;
      if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
        postmanPath = args[++i];
      }
    } else if (arg === "--security") {
      scanSecurity = true;
    } else if ((arg === "--port" || arg === "-p") && i + 1 < args.length) {
      port = parseInt(args[++i], 10) || 3000;
    } else if ((arg === "--lang" || arg === "-l") && i + 1 < args.length) {
      if (!languagesExplicit) {
        languages.length = 0;
        languagesExplicit = true;
      }
      const rawVal = args[++i].toLowerCase();
      const parts = rawVal.split(",").map((p) => p.trim());
      for (const val of parts) {
        if (val === "all") {
          const allLangs: SupportedLanguage[] = ["typescript", "python", "go", "csharp", "java", "rust", "cpp", "c"];
          for (const l of allLangs) {
            if (!languages.includes(l)) languages.push(l);
          }
        } else if (["python", "go", "csharp", "c#", "java", "rust", "cpp", "c++", "c", "ts", "typescript"].includes(val)) {
          let normalized: SupportedLanguage = val as SupportedLanguage;
          if (val === "c#") normalized = "csharp";
          if (val === "c++") normalized = "cpp";
          if (val === "ts") normalized = "typescript";
          if (!languages.includes(normalized)) languages.push(normalized);
        }
      }
    } else if (arg === "--jadx-path" && i + 1 < args.length) {
      jadxPath = args[++i];
    } else if (arg === "--no-cache") {
      noCache = true;
    } else if (arg === "--clean-cache" || arg === "--clear-cache") {
      cleanCache = true;
    } else if (arg === "--clean-jadx" || arg === "--clear-jadx") {
      cleanJadx = true;
    } else if (arg === "--clean-all" || arg === "--clear-all") {
      cleanAll = true;
      cleanCache = true;
      cleanJadx = true;
    } else if (arg === "--strict") {
      strict = true;
    } else if (arg === "--skip-mock") {
      skipMock = true;
    } else if (arg === "--keep-output" || arg === "--keep") {
      keepOutput = true;
    } else if (arg === "--cache" && command === "clean") {
      cleanCache = true;
    } else if (arg === "--jadx" && command === "clean") {
      cleanJadx = true;
    } else if (arg === "--all" && command === "clean") {
      cleanAll = true;
      cleanCache = true;
      cleanJadx = true;
    } else if ((arg === "--sources-out" || arg === "--export-sources") && i + 1 < args.length) {
      sourcesOut = args[++i];
    } else if (arg === "--quiet" || arg === "-q") {
      verbose = false;
    } else if (!arg.startsWith("-") && !inputTarget) {
      inputTarget = arg;
    }
  }

  if (command === "clean") {
    if (!cleanCache && !cleanJadx) {
      cleanCache = true;
      cleanJadx = true;
      cleanAll = true;
    }
  } else if (command === "generate" && !inputTarget && (cleanCache || cleanJadx || cleanAll)) {
    command = "clean";
  }

  if (openapiRequested && !openapiPath) {
    openapiPath = languages.length > 1
      ? path.join(outputDir, "specs", "openapi.json")
      : path.join(outputDir, "openapi.json");
  }

  if (postmanRequested && !postmanPath) {
    postmanPath = languages.length > 1
      ? path.join(outputDir, "specs", "postman_collection.json")
      : path.join(outputDir, "postman_collection.json");
  }

  return {
    command,
    inputTarget,
    outputDir,
    verbose,
    openapiPath,
    postmanPath,
    scanSecurity,
    jadxPath,
    noCache,
    cleanCache,
    cleanJadx,
    cleanAll,
    strict,
    skipMock,
    keepOutput,
    port,
    languages,
    languagesExplicit,
    diffTargetA,
    diffTargetB,
    diffOutput,
    sourcesOut,
  };
}

function printHelp(): void {
  console.log(`
retrofit-sdk-gen: Universal Android Retrofit to Multi-Language SDK Generator

USAGE:
  npx retrofit-sdk-gen [input] [options]
  npx retrofit-sdk-gen serve [input] [options]
  npx retrofit-sdk-gen diff <targetA> <targetB> [options]
  npx retrofit-sdk-gen security [input]
  npx retrofit-sdk-gen clean [--cache] [--jadx] [--all]
  npx retrofit-sdk-gen test <input> [options]

INPUT FORMATS:
  Direct Android Packages:  .apk, .apkm, .xapk, .aab, .apks, .zip
  Decompiled Directories:   ./sources or path to extracted Java/Kotlin sources

SUPPORTED LANGUAGES:
  TypeScript, Python, Go, C# (.NET 8), Java (11+), Rust, C++17, C99

OPTIONS:
  -s, --sources <path>     Path to APK file or decompiled 'sources' folder
  -o, --output <path>      Path to output generated SDK directory (default: ./sdk)
  -l, --lang <languages>   Languages: ts, python, go, csharp, java, rust, cpp, c, all (default: ts)
  --openapi [path]         Export OpenAPI 3.0.3 specification (default: ./sdk/openapi.json)
  --postman [path]         Export Postman Collection v2.1 (default: ./sdk/postman_collection.json)
  --security               Scan OkHttp interceptors for global headers and auth tokens
  -p, --port <number>      Port for the 'serve' API playground (default: 3000)
  --sources-out <path>     Export decompiled Java/Kotlin sources to a permanent directory
  --jadx-path <path>       Specify custom path to JADX executable
  --no-cache               Bypass decompilation cache and force re-decompiling
  --clean-cache            Remove cached decompiled sources from disk
  --clean-jadx             Remove auto-downloaded JADX binary from ~/.retrofit-sdk-gen/jadx
  --clean-all              Remove both decompiled cache and downloaded JADX tools
  --strict                 Fail test run if any language compiler toolchain is missing
  --skip-mock              Skip runtime mock server HTTP execution test
  --keep-output            Retain generated test SDK outputs on disk
  -q, --quiet              Suppress verbose logs
  -h, --help               Show this help menu

COMMANDS:
  serve [input]            Start local interactive API Playground & Mock Server (Scalar UI)
  diff <A> <B>             Compare two APK releases (or source trees) to generate an API Changelog
  security [target]        Scan OkHttp Interceptors to inspect global headers & auth mechanisms
  clean [--cache] [--jadx] Clean decompiled sources cache and/or downloaded JADX tools
  test <input>             Run 4-stage automated verification: AST scan, SDK gen, native compile & mock test

EXAMPLES:
  # 1. Boot local interactive API Playground & Mock Server:
  npx retrofit-sdk-gen serve ./app.apk --port 3000

  # 2. Save decompiled Java/Kotlin sources permanently to a folder:
  npx retrofit-sdk-gen ./app.apk --sources-out ./app_sources

  # 3. Generate ALL 8 Language SDKs together:
  npx retrofit-sdk-gen ./app.apk --lang all --openapi --postman

  # 4. Generate C#, Rust & Java SDKs:
  npx retrofit-sdk-gen ./app.apk --lang csharp,rust,java --output ./my-sdk

  # 5. Generate C++ & C SDKs:
  npx retrofit-sdk-gen ./app.apk --lang cpp,c --output ./native-sdks

  # 6. Compare Two APK Versions directly (Generates Changelog):
  npx retrofit-sdk-gen diff ./v29.1.apk ./v29.2.apk -o changelog.md

  # 7. Clean decompiled sources cache:
  npx retrofit-sdk-gen clean --cache
  # Or: npx retrofit-sdk-gen --clean-cache

  # 8. Clean downloaded JADX binary:
  npx retrofit-sdk-gen clean --jadx
  # Or: npx retrofit-sdk-gen --clean-jadx

  # 9. Clean all cached sources and downloaded tools:
  npx retrofit-sdk-gen clean --all

  # 10. Run 4-stage automated verification against an APK:
  npx retrofit-sdk-gen test ./app.apk

  # 11. Test specific languages with strict compiler checking:
  npx retrofit-sdk-gen test ./app.apk --lang ts,python,go --strict
`);
}

async function run(): Promise<void> {
  const opts = parseCliArgs();

  try {
    // Command: clean
    if (opts.command === "clean") {
      console.log("\n================================================================================");
      console.log("                       RETROFIT CLEANUP UTILITY                                 ");
      console.log("================================================================================\n");

      let cleanedAnything = false;

      if (opts.cleanCache) {
        const cacheRes = clearSourcesCache();
        if (cacheRes.cleared) {
          console.log(`[CLEAN] Cleared decompiled sources cache (${cacheRes.formattedSize}) at:`);
          console.log(`        ${cacheRes.path}\n`);
          cleanedAnything = true;
        } else {
          console.log(`[CLEAN] Decompiled sources cache was already empty:`);
          console.log(`        ${cacheRes.path}\n`);
        }
      }

      if (opts.cleanJadx) {
        const jadxRes = clearDownloadedJadx();
        if (jadxRes.cleared) {
          console.log(`[CLEAN] Removed downloaded JADX binary (${jadxRes.formattedSize}) at:`);
          console.log(`        ${jadxRes.path}\n`);
          cleanedAnything = true;
        } else {
          console.log(`[CLEAN] No downloaded JADX binary found at:`);
          console.log(`        ${jadxRes.path}\n`);
        }
      }

      if (cleanedAnything) {
        console.log("Cleanup complete!");
      } else {
        console.log("Everything is already clean.");
      }
      return;
    }

    // Command: test (Automated SDK Verification)
    if (opts.command === "test") {
      if (!opts.inputTarget) {
        console.error("Error: 'test' requires an input APK or source directory: npx retrofit-sdk-gen test <app.apk>");
        process.exit(1);
      }
      const testLanguages = opts.languagesExplicit ? opts.languages : undefined;
      const result = await runSdkVerification({
        inputTarget: opts.inputTarget,
        languages: testLanguages,
        strict: opts.strict,
        skipMock: opts.skipMock,
        keepOutput: opts.keepOutput,
        verbose: opts.verbose,
      });

      if (!result.passed) {
        process.exit(1);
      }
      return;
    }

    // Command: serve (API Playground & Mock Server)
    if (opts.command === "serve") {
      let targetDir = opts.inputTarget || "sources";
      if (isPackageFile(targetDir)) {
        console.log(`[DECOMPILER] Resolving Android package: ${targetDir}`);
        targetDir = await decompilePackage(targetDir, {
          jadxPath: opts.jadxPath,
          verbose: opts.verbose,
          noCache: opts.noCache,
          cleanCache: opts.cleanCache,
          cleanJadx: opts.cleanJadx,
          sourcesOut: opts.sourcesOut,
        });
      } else {
        targetDir = resolveSourcesDir(opts.inputTarget);
      }

      console.log(`[SCANNER] Scanning Retrofit endpoints in ${targetDir}...`);
      const scanResult = scanApis({ sourcesDir: targetDir });
      const openapiSpec = generateOpenApi(scanResult.apis, {
        baseUrl: scanResult.detectedBaseUrl,
      });

      const serverInfo = await startPlaygroundServer({
        port: opts.port,
        apis: scanResult.apis,
        openapiSpec,
        baseUrl: scanResult.detectedBaseUrl,
        verbose: opts.verbose,
      });

      console.log("\n================================================================================");
      console.log("            ⚡ RETROFIT API PLAYGROUND & MOCK SERVER ACTIVE                     ");
      console.log("================================================================================");
      console.log(`  - Playground UI:   ${serverInfo.url}`);
      console.log(`  - OpenAPI Spec:    ${serverInfo.url}/openapi.json`);
      console.log(`  - Live Mock APIs:  ${serverInfo.url}/mock/`);
      console.log(`  - Endpoints Count: ${scanResult.apis.length} across ${new Set(scanResult.apis.map(a => a.interface)).size} services`);
      console.log("================================================================================");
      console.log("  Press Ctrl+C to stop the server.\n");

      // Keep process alive
      await new Promise(() => {});
      return;
    }

    if (opts.command === "diff") {
      if (!opts.diffTargetA || !opts.diffTargetB) {
        console.error("Error: 'diff' requires two inputs (APKs or directories): npx retrofit-sdk-gen diff <A> <B>");
        process.exit(1);
      }
      console.log(`Comparing API endpoints between:\n  A: ${opts.diffTargetA}\n  B: ${opts.diffTargetB}\n`);
      const diffResult = await diffApis(opts.diffTargetA, opts.diffTargetB, {
        jadxPath: opts.jadxPath,
        verbose: opts.verbose,
      });
      const markdown = formatDiffMarkdown(diffResult);

      if (opts.diffOutput && opts.diffOutput.endsWith(".md")) {
        fs.writeFileSync(opts.diffOutput, markdown, "utf8");
        console.log(`Changelog saved to ${opts.diffOutput}`);
      } else {
        console.log(markdown);
      }
      return;
    }

    if (opts.command === "security") {
      let targetDir = opts.inputTarget || "sources";
      if (isPackageFile(targetDir)) {
        console.log(`[DECOMPILER] Decompiling ${targetDir} for security audit...`);
        targetDir = await decompilePackage(targetDir, {
          jadxPath: opts.jadxPath,
          verbose: opts.verbose,
          noCache: opts.noCache,
          cleanCache: opts.cleanCache,
          cleanJadx: opts.cleanJadx,
        });
      }
      console.log(`Scanning OkHttp Interceptors in ${targetDir}...`);
      const secResult = scanSecurityInterceptors(targetDir);
      console.log(`\nFound ${secResult.interceptorsFound.length} OkHttp Interceptors:`);
      for (const inc of secResult.interceptorsFound) {
        console.log(`- ${inc.className} (${inc.file}) -> Adds: [${inc.addedHeaders.join(", ")}]`);
      }
      console.log(`\nAll Detected Headers (${secResult.detectedHeaderNames.length}):`, secResult.detectedHeaderNames);
      if (secResult.authHeaders.length > 0) {
        console.log(`Auth Headers:`, secResult.authHeaders);
      }
      return;
    }

    // Default: Generate SDK
    await generateSdk({
      sourcesDir: opts.inputTarget,
      outputDir: opts.outputDir,
      verbose: opts.verbose,
      openapiPath: opts.openapiPath,
      postmanPath: opts.postmanPath,
      scanSecurity: opts.scanSecurity,
      jadxPath: opts.jadxPath,
      noCache: opts.noCache,
      cleanCache: opts.cleanCache,
      cleanJadx: opts.cleanJadx,
      languages: opts.languages,
      sourcesOut: opts.sourcesOut,
    });
  } catch (err: any) {
    console.error("Execution failed:", err?.message || err);
    process.exit(1);
  }
}

run();
