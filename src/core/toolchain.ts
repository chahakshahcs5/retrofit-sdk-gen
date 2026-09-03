import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";
import { SupportedLanguage } from "../index";

export interface ToolchainCheck {
  language: SupportedLanguage;
  installed: boolean;
  binary: string;
  version?: string;
  installGuide: string;
}

export interface CompileResult {
  language: SupportedLanguage;
  passed: boolean;
  skipped: boolean;
  skipReason?: string;
  durationMs: number;
  output: string;
  error?: string;
}

/**
 * Checks if a specific CLI binary is executable and returns its version
 */
function probeBinary(cmd: string, versionFlag = "--version"): { installed: boolean; version?: string } {
  try {
    const isWindows = process.platform === "win32";
    // First verify binary exists in PATH
    const checkCmd = isWindows ? `where ${cmd}` : `which ${cmd}`;
    try {
      execSync(checkCmd, { stdio: "pipe" });
    } catch {
      return { installed: false };
    }

    const output = execSync(`${cmd} ${versionFlag}`, { stdio: "pipe", timeout: 8000 })
      .toString()
      .trim();
    const firstLine = output.split(/\r?\n/)[0].trim();
    return { installed: true, version: firstLine };
  } catch {
    return { installed: false };
  }
}

/**
 * Probes the local operating system to detect which language compilers are installed
 */
export function detectToolchains(): Record<SupportedLanguage, ToolchainCheck> {
  // 1. TypeScript (check local tsc or npx tsc)
  let tsProbe = probeBinary("tsc", "-v");
  if (!tsProbe.installed) {
    try {
      const shellCmd = process.platform === "win32" ? "cmd.exe" : "/bin/sh";
      const npxOut = execSync("npx -y tsc -v", { shell: shellCmd, stdio: "pipe", timeout: 15000 })
        .toString()
        .trim();
      tsProbe = { installed: true, version: npxOut.split(/\r?\n/)[0] };
    } catch {}
  }

  // 2. Python
  let pyProbe = probeBinary("python", "--version");
  let pyBin = "python";
  if (!pyProbe.installed) {
    pyProbe = probeBinary("python3", "--version");
    if (pyProbe.installed) pyBin = "python3";
  }

  // 3. Go
  const goProbe = probeBinary("go", "version");

  // 4. C# (.NET)
  const csharpProbe = probeBinary("dotnet", "--version");

  // 5. Java (javac)
  const javaProbe = probeBinary("javac", "-version");

  // 6. Rust (cargo)
  const rustProbe = probeBinary("cargo", "--version");

  // Helper: Probe Visual Studio Build Tools on Windows
  function findVisualStudioTools(): { vsPath?: string; clPath?: string; cmakePath?: string; clVersion?: string } {
    if (process.platform !== "win32") return {};
    const vswhere = "C:\\Program Files (x86)\\Microsoft Visual Studio\\Installer\\vswhere.exe";
    if (!fs.existsSync(vswhere)) return {};
    try {
      const vsPath = execSync(`"${vswhere}" -latest -products * -property installationPath`, { stdio: "pipe" })
        .toString()
        .trim();
      if (!vsPath || !fs.existsSync(vsPath)) return {};

      const cmakeBin = path.join(vsPath, "Common7", "IDE", "CommonExtensions", "Microsoft", "CMake", "CMake", "bin", "cmake.exe");
      const cmakePath = fs.existsSync(cmakeBin) ? cmakeBin : undefined;

      let clPath: string | undefined = undefined;
      let clVersion: string | undefined = undefined;
      const msvcBase = path.join(vsPath, "VC", "Tools", "MSVC");
      if (fs.existsSync(msvcBase)) {
        const versions = fs.readdirSync(msvcBase).sort().reverse();
        for (const ver of versions) {
          const candidate = path.join(msvcBase, ver, "bin", "Hostx64", "x64", "cl.exe");
          if (fs.existsSync(candidate)) {
            clPath = candidate;
            clVersion = `MSVC ${ver}`;
            break;
          }
        }
      }
      return { vsPath, clPath, cmakePath, clVersion };
    } catch {
      return {};
    }
  }

  const vsTools = findVisualStudioTools();

  // 7. C++ (cmake + Visual Studio MSVC + g++/clang++)
  let cmakeProbe = probeBinary("cmake", "--version");
  if (!cmakeProbe.installed && vsTools.cmakePath) {
    cmakeProbe = { installed: true, version: "CMake (Visual Studio Build Tools)" };
  }
  const gppProbe = probeBinary("g++", "--version");
  const clangppProbe = probeBinary("clang++", "--version");
  const isCppInstalled = cmakeProbe.installed || gppProbe.installed || clangppProbe.installed || !!vsTools.clPath;
  const cppVersion = cmakeProbe.version || vsTools.clVersion || gppProbe.version || clangppProbe.version;
  const cppBinary = vsTools.cmakePath || (cmakeProbe.installed ? "cmake" : gppProbe.installed ? "g++" : clangppProbe.installed ? "clang++" : vsTools.clPath || "cl");

  // 8. C (Visual Studio MSVC / CMake / gcc / clang)
  const gccProbe = probeBinary("gcc", "--version");
  const clangProbe = probeBinary("clang", "--version");
  const isCInstalled = gccProbe.installed || clangProbe.installed || cmakeProbe.installed || !!vsTools.clPath;
  const cVersion = gccProbe.version || clangProbe.version || cmakeProbe.version || vsTools.clVersion;
  const cBinary = gccProbe.installed ? "gcc" : clangProbe.installed ? "clang" : (vsTools.cmakePath || (cmakeProbe.installed ? "cmake" : vsTools.clPath || "cl"));

  return {
    typescript: {
      language: "typescript",
      installed: tsProbe.installed,
      binary: "tsc",
      version: tsProbe.version,
      installGuide: "npm install -g typescript",
    },
    python: {
      language: "python",
      installed: pyProbe.installed,
      binary: pyBin,
      version: pyProbe.version,
      installGuide: "https://www.python.org/downloads/",
    },
    go: {
      language: "go",
      installed: goProbe.installed,
      binary: "go",
      version: goProbe.version,
      installGuide: "https://go.dev/dl/",
    },
    csharp: {
      language: "csharp",
      installed: csharpProbe.installed,
      binary: "dotnet",
      version: csharpProbe.version ? `.NET ${csharpProbe.version}` : undefined,
      installGuide: "https://dotnet.microsoft.com/download",
    },
    java: {
      language: "java",
      installed: javaProbe.installed,
      binary: "javac",
      version: javaProbe.version,
      installGuide: "winget install EclipseAdoptium.Temurin.17.JRE (or https://adoptium.net)",
    },
    rust: {
      language: "rust",
      installed: rustProbe.installed,
      binary: "cargo",
      version: rustProbe.version,
      installGuide: "https://rustup.rs",
    },
    cpp: {
      language: "cpp",
      installed: isCppInstalled,
      binary: cppBinary,
      version: cppVersion,
      installGuide: "Install Visual Studio C++ Build Tools or GCC/CMake",
    },
    c: {
      language: "c",
      installed: isCInstalled,
      binary: cBinary,
      version: cVersion,
      installGuide: "Install Visual Studio C++ Build Tools or MinGW-w64 (GCC)",
    },
  };
}

/**
 * Runs native compilation / type-check for a generated SDK directory
 */
export async function compileSdk(
  language: SupportedLanguage,
  sdkDir: string,
  toolchain: ToolchainCheck
): Promise<CompileResult> {
  const startTime = Date.now();

  if (!fs.existsSync(sdkDir)) {
    return {
      language,
      passed: false,
      skipped: true,
      skipReason: `Directory does not exist: ${sdkDir}`,
      durationMs: 0,
      output: "",
    };
  }

  if (!toolchain.installed) {
    return {
      language,
      passed: false,
      skipped: true,
      skipReason: `Toolchain '${toolchain.binary}' not found. Install: ${toolchain.installGuide}`,
      durationMs: 0,
      output: "",
    };
  }

  const isWindows = process.platform === "win32";
  const absSdkDir = path.resolve(sdkDir);

  try {
    let result: { status: number | null; stdout: string; stderr: string };

    switch (language) {
      case "typescript": {
        // Create temporary tsconfig if missing for strict check
        const tsconfigPath = path.join(absSdkDir, "tsconfig.json");
        const hadTsconfig = fs.existsSync(tsconfigPath);
        if (!hadTsconfig) {
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
                },
              },
              null,
              2
            )
          );
        }

        const cmd = isWindows ? "npx.cmd" : "npx";
        const args = ["-y", "tsc", "--noEmit", "-p", "."];
        const res = spawnSync(cmd, args, { shell: true, cwd: absSdkDir, encoding: "utf8" });
        if (!hadTsconfig) {
          try {
            fs.unlinkSync(tsconfigPath);
          } catch {}
        }
        result = { status: res.status, stdout: res.stdout || "", stderr: res.stderr || "" };
        break;
      }

      case "python": {
        // Syntax check all Python files using python compileall
        const cmd = toolchain.binary;
        const args = ["-m", "compileall", "-q", "."];
        const res = spawnSync(cmd, args, { shell: true, cwd: absSdkDir, encoding: "utf8" });
        result = { status: res.status, stdout: res.stdout || "", stderr: res.stderr || "" };
        break;
      }

      case "go": {
        // Run go vet ./...
        const cmd = "go";
        const args = ["vet", "./..."];
        const res = spawnSync(cmd, args, { shell: true, cwd: absSdkDir, encoding: "utf8" });
        result = { status: res.status, stdout: res.stdout || "", stderr: res.stderr || "" };
        break;
      }

      case "csharp": {
        // Run dotnet build
        const cmd = "dotnet";
        const args = ["build", "-c", "Release", "--nologo"];
        const res = spawnSync(cmd, args, { shell: true, cwd: absSdkDir, encoding: "utf8" });
        result = { status: res.status, stdout: res.stdout || "", stderr: res.stderr || "" };
        break;
      }

      case "java": {
        // Compile all Java sources with javac
        const tempBin = path.join(absSdkDir, ".bin");
        if (!fs.existsSync(tempBin)) fs.mkdirSync(tempBin, { recursive: true });

        const javaFiles: string[] = [];
        const findJavaFiles = (dir: string) => {
          for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
            const p = path.join(dir, ent.name);
            if (ent.isDirectory() && ent.name !== ".bin") findJavaFiles(p);
            else if (ent.isFile() && ent.name.endsWith(".java")) javaFiles.push(p);
          }
        };
        findJavaFiles(absSdkDir);

        if (javaFiles.length === 0) {
          result = { status: 0, stdout: "No java files to compile", stderr: "" };
        } else {
          const cmd = "javac";
          const args = ["-d", tempBin, ...javaFiles];
          const res = spawnSync(cmd, args, { shell: true, cwd: absSdkDir, encoding: "utf8" });
          try {
            fs.rmSync(tempBin, { recursive: true, force: true });
          } catch {}
          result = { status: res.status, stdout: res.stdout || "", stderr: res.stderr || "" };
        }
        break;
      }

      case "rust": {
        // Run cargo check
        const cmd = "cargo";
        const args = ["check", "--quiet"];
        const res = spawnSync(cmd, args, { shell: true, cwd: absSdkDir, encoding: "utf8" });
        result = { status: res.status, stdout: res.stdout || "", stderr: res.stderr || "" };
        break;
      }

      case "cpp": {
        // Check CMakeLists.txt configuration with CMake (supports Visual Studio Build Tools)
        const cmd = toolchain.binary.toLowerCase().includes("cmake") ? `"${toolchain.binary}"` : "cmake";
        const args = ["-B", "build_test", "-S", "."];
        const res = spawnSync(cmd, args, { shell: true, cwd: absSdkDir, encoding: "utf8" });
        try {
          fs.rmSync(path.join(absSdkDir, "build_test"), { recursive: true, force: true });
        } catch {}
        result = { status: res.status, stdout: res.stdout || "", stderr: res.stderr || "" };
        break;
      }

      case "c": {
        // If CMakeLists.txt is present and CMake is available, use CMake
        const cmakeListsPath = path.join(absSdkDir, "CMakeLists.txt");
        if (fs.existsSync(cmakeListsPath)) {
          const cmd = toolchain.binary.toLowerCase().includes("cmake") ? `"${toolchain.binary}"` : "cmake";
          const args = ["-B", "build_test", "-S", "."];
          const res = spawnSync(cmd, args, { shell: true, cwd: absSdkDir, encoding: "utf8" });
          try {
            fs.rmSync(path.join(absSdkDir, "build_test"), { recursive: true, force: true });
          } catch {}
          result = { status: res.status, stdout: res.stdout || "", stderr: res.stderr || "" };
        } else {
          // Check syntax using gcc/clang
          const cFiles: string[] = [];
          const findCFiles = (dir: string) => {
            for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
              const p = path.join(dir, ent.name);
              if (ent.isDirectory()) findCFiles(p);
              else if (ent.isFile() && ent.name.endsWith(".c")) cFiles.push(p);
            }
          };
          findCFiles(absSdkDir);

          if (cFiles.length === 0) {
            result = { status: 0, stdout: "No C files to compile", stderr: "" };
          } else {
            const cmd = toolchain.binary;
            const args = ["-fsyntax-only", "-Iinclude", ...cFiles];
            const res = spawnSync(cmd, args, { shell: true, cwd: absSdkDir, encoding: "utf8" });
            result = { status: res.status, stdout: res.stdout || "", stderr: res.stderr || "" };
          }
        }
        break;
      }

      default:
        result = { status: 0, stdout: "Unknown language", stderr: "" };
    }

    const durationMs = Date.now() - startTime;
    const passed = result.status === 0;
    const output = (result.stdout + "\n" + result.stderr).trim();

    return {
      language,
      passed,
      skipped: false,
      durationMs,
      output,
      error: passed ? undefined : output || `Exit code ${result.status}`,
    };
  } catch (err: any) {
    return {
      language,
      passed: false,
      skipped: false,
      durationMs: Date.now() - startTime,
      output: err.message,
      error: err.message,
    };
  }
}
