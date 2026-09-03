import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";
import { execSync, spawnSync } from "child_process";

export const PACKAGE_EXTENSIONS = new Set([".apk", ".apkm", ".xapk", ".aab", ".apks", ".zip"]);

export interface DecompilerOptions {
  jadxPath?: string;
  cacheDir?: string;
  verbose?: boolean;
  noCache?: boolean;
  sourcesOut?: string;
  cleanCache?: boolean;
  cleanJadx?: boolean;
}

export interface CleanResult {
  cleared: boolean;
  path: string;
  freedBytes: number;
  formattedSize: string;
}

/**
 * Checks if a given file path is an Android package file
 */
export function isPackageFile(targetPath: string): boolean {
  if (!fs.existsSync(targetPath)) return false;
  const stat = fs.statSync(targetPath);
  if (!stat.isFile()) return false;
  const ext = path.extname(targetPath).toLowerCase();
  return PACKAGE_EXTENSIONS.has(ext);
}

/**
 * Verifies that a working 64-bit Java runtime is available
 */
export function ensureJava(): void {
  try {
    const res = spawnSync("java", ["-version"], { stdio: "pipe" });
    if (res.status !== 0 && res.error) {
      throw res.error;
    }
  } catch {
    throw new Error(
      "Java Runtime (JRE/JDK 11+) is required to run JADX.\n" +
      "Please install Java: https://adoptium.net/ or run: winget install EclipseAdoptium.Temurin.17.JRE"
    );
  }
}

/**
 * Returns the directory used to cache downloaded tools (~/.retrofit-sdk-gen)
 */
export function getToolDir(): string {
  const home = os.homedir();
  const toolDir = path.join(home, ".retrofit-sdk-gen");
  if (!fs.existsSync(toolDir)) {
    fs.mkdirSync(toolDir, { recursive: true });
  }
  return toolDir;
}

/**
 * Returns the default directory used for decompiled APK cache
 */
export function getDefaultCacheDir(customDir?: string): string {
  if (customDir) return path.resolve(process.cwd(), customDir);
  return path.join(os.tmpdir(), "retrofit-cache");
}

/**
 * Format bytes to readable human string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Computes directory size recursively
 */
export function getDirectorySize(dirPath: string): number {
  let totalSize = 0;
  if (!fs.existsSync(dirPath)) return 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        totalSize += getDirectorySize(fullPath);
      } else if (entry.isFile()) {
        totalSize += fs.statSync(fullPath).size;
      }
    }
  } catch { }
  return totalSize;
}

/**
 * Clears cached decompiled APK sources from disk
 */
export function clearSourcesCache(customCacheDir?: string): CleanResult {
  const cachePath = getDefaultCacheDir(customCacheDir);
  if (!fs.existsSync(cachePath)) {
    return {
      cleared: false,
      path: cachePath,
      freedBytes: 0,
      formattedSize: "0 B",
    };
  }
  const freedBytes = getDirectorySize(cachePath);
  try {
    fs.rmSync(cachePath, { recursive: true, force: true });
    return {
      cleared: true,
      path: cachePath,
      freedBytes,
      formattedSize: formatBytes(freedBytes),
    };
  } catch (err: any) {
    throw new Error(`Failed to clear cached sources at ${cachePath}: ${err.message}`);
  }
}

/**
 * Removes downloaded JADX binary and archives from ~/.retrofit-sdk-gen/jadx
 */
export function clearDownloadedJadx(): CleanResult {
  const toolDir = getToolDir();
  const jadxHome = path.join(toolDir, "jadx");
  if (!fs.existsSync(jadxHome)) {
    return {
      cleared: false,
      path: jadxHome,
      freedBytes: 0,
      formattedSize: "0 B",
    };
  }
  const freedBytes = getDirectorySize(jadxHome);
  try {
    fs.rmSync(jadxHome, { recursive: true, force: true });
    // Also remove any leftover .zip archives in toolDir
    if (fs.existsSync(toolDir)) {
      const tempZips = fs.readdirSync(toolDir).filter((f) => f.startsWith("jadx-") && f.endsWith(".zip"));
      for (const z of tempZips) {
        try {
          fs.rmSync(path.join(toolDir, z), { force: true });
        } catch { }
      }
    }
    return {
      cleared: true,
      path: jadxHome,
      freedBytes,
      formattedSize: formatBytes(freedBytes),
    };
  } catch (err: any) {
    throw new Error(`Failed to remove downloaded JADX binary at ${jadxHome}: ${err.message}`);
  }
}

/**
 * Clears both decompilation cache and downloaded JADX toolchain
 */
export function clearAll(options?: { customCacheDir?: string }): {
  cache: CleanResult;
  jadx: CleanResult;
} {
  const cache = clearSourcesCache(options?.customCacheDir);
  const jadx = clearDownloadedJadx();
  return { cache, jadx };
}

/**
 * Ensures JADX is available either in PATH, custom location, or auto-downloaded
 */
export async function ensureJadx(customPath?: string): Promise<string> {
  ensureJava();

  // 1. Custom path
  if (customPath && fs.existsSync(customPath)) {
    return customPath;
  }
  if (process.env.JADX_PATH && fs.existsSync(process.env.JADX_PATH)) {
    return process.env.JADX_PATH;
  }

  // 2. Check system PATH
  const isWindows = process.platform === "win32";
  const cmd = isWindows ? "where jadx" : "which jadx";
  try {
    const out = execSync(cmd, { stdio: "pipe" }).toString().trim();
    const firstPath = out.split(/\r?\n/)[0].trim();
    if (firstPath && fs.existsSync(firstPath)) {
      return firstPath;
    }
  } catch {
    // Not in PATH, fall through
  }

  // 3. Check local cache (~/.retrofit-sdk-gen/jadx/bin/jadx)
  const toolDir = getToolDir();
  const jadxHome = path.join(toolDir, "jadx");
  const jadxBin = path.join(jadxHome, "bin", isWindows ? "jadx.bat" : "jadx");

  if (fs.existsSync(jadxBin)) {
    return jadxBin;
  }

  // 4. Auto-download official JADX release
  const JADX_VERSION = "1.5.0";
  const downloadUrl = `https://github.com/skylot/jadx/releases/download/v${JADX_VERSION}/jadx-${JADX_VERSION}.zip`;

  console.log(`[DECOMPILER] JADX is not found in PATH.`);
  console.log(`[DECOMPILER] Auto-downloading official JADX v${JADX_VERSION} from GitHub...`);

  const tempZip = path.join(toolDir, `jadx-${JADX_VERSION}.zip`);
  const res = await fetch(downloadUrl);
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download JADX from ${downloadUrl}: HTTP ${res.status}`);
  }

  const fileStream = fs.createWriteStream(tempZip);
  // @ts-ignore - ReadableStream conversion
  const reader = res.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    fileStream.write(Buffer.from(value));
  }
  await new Promise((resolve) => fileStream.end(resolve));

  console.log(`[DECOMPILER] Extracting JADX into ${jadxHome}...`);
  if (!fs.existsSync(jadxHome)) {
    fs.mkdirSync(jadxHome, { recursive: true });
  }

  // Extract using system tar or powershell
  try {
    execSync(`tar -xf "${tempZip}" -C "${jadxHome}"`, { stdio: "pipe" });
  } catch {
    if (isWindows) {
      execSync(`powershell -Command "Expand-Archive -Path '${tempZip}' -DestinationPath '${jadxHome}' -Force"`, {
        stdio: "pipe",
      });
    } else {
      execSync(`unzip -q -o "${tempZip}" -d "${jadxHome}"`, { stdio: "pipe" });
    }
  }

  // Cleanup temp zip
  try {
    fs.unlinkSync(tempZip);
  } catch { }

  // Make executable on Unix
  if (!isWindows) {
    try {
      execSync(`chmod +x "${jadxBin}"`, { stdio: "pipe" });
    } catch { }
  }

  if (!fs.existsSync(jadxBin)) {
    throw new Error(`JADX extraction failed. Could not find binary at: ${jadxBin}`);
  }

  console.log(`[DECOMPILER] JADX v${JADX_VERSION} successfully installed and ready!\n`);
  return jadxBin;
}

/**
 * Extracts base.apk if input is a split bundle (.apkm, .xapk, .apks, .zip)
 */
export function unpackBundleIfSplit(inputPath: string, extractDir: string): string {
  const ext = path.extname(inputPath).toLowerCase();
  if (ext === ".apk" || ext === ".aab") {
    return inputPath;
  }

  if (!fs.existsSync(extractDir)) {
    fs.mkdirSync(extractDir, { recursive: true });
  }

  console.log(`[DECOMPILER] Unpacking split bundle (${ext}): ${path.basename(inputPath)}...`);

  // Extract archive
  try {
    execSync(`tar -xf "${inputPath}" -C "${extractDir}"`, { stdio: "pipe" });
  } catch {
    if (process.platform === "win32") {
      execSync(`powershell -Command "Expand-Archive -Path '${inputPath}' -DestinationPath '${extractDir}' -Force"`, {
        stdio: "pipe",
      });
    } else {
      execSync(`unzip -q -o "${inputPath}" -d "${extractDir}"`, { stdio: "pipe" });
    }
  }

  // Look for base.apk or any .apk file inside
  const files = fs.readdirSync(extractDir);
  const baseApk = files.find((f) => f.toLowerCase() === "base.apk");
  if (baseApk) {
    const fullBase = path.join(extractDir, baseApk);
    console.log(`[DECOMPILER] Located primary ${baseApk} inside bundle`);
    return fullBase;
  }

  const anyApk = files.find((f) => f.toLowerCase().endsWith(".apk"));
  if (anyApk) {
    const fullAny = path.join(extractDir, anyApk);
    console.log(`[DECOMPILER] Located ${anyApk} inside bundle`);
    return fullAny;
  }

  throw new Error(`Split bundle does not contain any .apk file: ${inputPath}`);
}

/**
 * Calculates a unique cache hash for an APK file based on size + header bytes + mtime
 */
export function getPackageHash(filePath: string): string {
  const stat = fs.statSync(filePath);
  const fd = fs.openSync(filePath, "r");
  const sampleSize = Math.min(stat.size, 1024 * 1024);
  const buffer = Buffer.alloc(sampleSize);
  fs.readSync(fd, buffer, 0, sampleSize, 0);
  fs.closeSync(fd);

  return crypto
    .createHash("sha256")
    .update(buffer)
    .update(String(stat.size))
    .update(String(stat.mtimeMs))
    .digest("hex")
    .slice(0, 16);
}

/**
 * Decompiles an Android package file into Java sources using JADX (with caching)
 * Returns the absolute path to the decompiled `sources/` folder.
 */
export async function decompilePackage(
  packagePath: string,
  options: DecompilerOptions = {}
): Promise<string> {
  const absPackagePath = path.resolve(process.cwd(), packagePath);
  if (!fs.existsSync(absPackagePath)) {
    throw new Error(`Package file not found: ${absPackagePath}`);
  }

  if (options.cleanJadx) {
    const res = clearDownloadedJadx();
    if (res.cleared) {
      console.log(`[DECOMPILER] Removed downloaded JADX binary (${res.formattedSize}) at: ${res.path}`);
    }
  }

  const jadxBin = await ensureJadx(options.jadxPath);
  const hash = getPackageHash(absPackagePath);

  // Setup cache directory: default to .retrofit-cache/<hash>
  const cacheBase = options.cacheDir
    ? path.resolve(process.cwd(), options.cacheDir)
    : getDefaultCacheDir();

  if (options.cleanCache) {
    const res = clearSourcesCache(options.cacheDir);
    if (res.cleared) {
      console.log(`[DECOMPILER] Cleared cached sources (${res.formattedSize}) at: ${res.path}`);
    }
  }

  const decompileOutDir = path.join(cacheBase, hash);
  const sourcesDir = path.join(decompileOutDir, "sources");

  const exportToSourcesOut = (srcDir: string) => {
    if (options.sourcesOut) {
      const targetOut = path.resolve(process.cwd(), options.sourcesOut);
      if (!fs.existsSync(targetOut)) {
        fs.mkdirSync(targetOut, { recursive: true });
      }
      console.log(`[DECOMPILER] Exporting decompiled sources to: ${targetOut}...`);
      fs.cpSync(srcDir, targetOut, { recursive: true });
      console.log(`[DECOMPILER] Successfully exported sources to: ${targetOut}\n`);
    }
  };

  // Check cache hit
  if (!options.noCache && fs.existsSync(sourcesDir) && fs.readdirSync(sourcesDir).length > 0) {
    console.log(`[DECOMPILER] Cache hit for ${path.basename(absPackagePath)} (Hash: ${hash})`);
    console.log(`[DECOMPILER] Reusing previously decompiled sources: ${sourcesDir}\n`);
    exportToSourcesOut(sourcesDir);
    return sourcesDir;
  }

  // Unpack split bundle if needed
  const splitDir = path.join(decompileOutDir, "unpacked_bundle");
  const targetApk = unpackBundleIfSplit(absPackagePath, splitDir);

  const cores = Math.max(1, os.cpus().length || 4);
  console.log(`[DECOMPILER] Decompiling ${path.basename(targetApk)} with JADX (threads: ${cores})...`);
  const startTime = Date.now();

  if (!fs.existsSync(decompileOutDir)) {
    fs.mkdirSync(decompileOutDir, { recursive: true });
  }

  // Execute JADX (code only with --no-res)
  const isWindows = process.platform === "win32";
  const safeApk = isWindows && targetApk.includes(" ") ? `"${targetApk}"` : targetApk;
  const safeOut = isWindows && decompileOutDir.includes(" ") ? `"${decompileOutDir}"` : decompileOutDir;
  const args = ["--no-res", "-j", String(cores), "-d", safeOut, safeApk];

  const result = spawnSync(jadxBin, args, {
    shell: isWindows,
    stdio: options.verbose ? "inherit" : "pipe",
    maxBuffer: 50 * 1024 * 1024,
  });

  if (result.error || !fs.existsSync(sourcesDir) || fs.readdirSync(sourcesDir).length === 0) {
    const errorMsg = result.stderr ? result.stderr.toString() : result.error?.message || "Unknown error";
    if (!fs.existsSync(sourcesDir) || fs.readdirSync(sourcesDir).length === 0) {
      throw new Error(`JADX decompilation failed: ${errorMsg}`);
    }
  }

  const durationMs = Date.now() - startTime;
  console.log(`[DECOMPILER] Decompilation completed in ${durationMs}ms!`);
  console.log(`[DECOMPILER] Generated sources at: ${sourcesDir}\n`);

  exportToSourcesOut(sourcesDir);
  return sourcesDir;
}
