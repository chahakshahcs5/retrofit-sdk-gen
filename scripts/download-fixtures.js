#!/usr/bin/env node

/**
 * Helper script to obtain test APK fixtures on-demand.
 * 
 * 1. Checks if APKs exist locally in parent directory or test-fixtures/
 * 2. If missing, downloads official sample APKs from GitHub Release assets
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const FIXTURES = [
  { name: "ShopFlow.apk", fallbackLocal: "../ShopFlow.apk" },
  { name: "GitHub Client.apk", fallbackLocal: "../GitHub Client.apk" },
  { name: "Crypto Tracker.apk", fallbackLocal: "../Crypto Tracker.apk" },
];

const TARGET_DIR = path.resolve(__dirname, "..", "test-fixtures");
const REPO = process.env.GITHUB_REPOSITORY || "chahakshahcs5/retrofit-sdk-gen";
const RELEASE_TAG = "fixtures-v1.0";

if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

console.log("================================================================================");
console.log("                📦 RETROFIT SDK FIXTURES DOWNLOADER                           ");
console.log("================================================================================\n");

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
      file.on("error", (err) => {
        try { fs.unlinkSync(dest); } catch {}
        reject(err);
      });
    }).on("error", (err) => {
      reject(err);
    });
  });
}

async function main() {
  for (const fixture of FIXTURES) {
    const targetPath = path.join(TARGET_DIR, fixture.name);

    // 1. Check if already in test-fixtures
    if (fs.existsSync(targetPath)) {
      const stat = fs.statSync(targetPath);
      console.log(`✅ [FOUND] ${fixture.name} already in test-fixtures/ (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
      continue;
    }

    // 2. Check if present in parent directory
    const parentPath = path.resolve(__dirname, "..", fixture.fallbackLocal);
    if (fs.existsSync(parentPath)) {
      console.log(`📋 [COPYING] Copying ${fixture.name} from local workspace into test-fixtures/...`);
      fs.copyFileSync(parentPath, targetPath);
      console.log(`✅ [READY] ${fixture.name} ready in test-fixtures/`);
      continue;
    }

    // 3. Download from GitHub Release assets
    const downloadUrl = `https://github.com/${REPO}/releases/download/${RELEASE_TAG}/${encodeURIComponent(fixture.name)}`;
    console.log(`🌐 [DOWNLOADING] Fetching ${fixture.name} from ${downloadUrl}...`);
    try {
      await downloadFile(downloadUrl, targetPath);
      console.log(`✅ [DOWNLOADED] ${fixture.name} successfully cached in test-fixtures/`);
    } catch (err) {
      console.warn(`⚠️  Could not download ${fixture.name}: ${err.message}`);
      console.log(`   (You can manually place ${fixture.name} into ${TARGET_DIR})`);
    }
  }

  console.log("\n================================================================================");
  console.log("All available fixtures ready in test-fixtures/! Run: npm run test:all-apks");
  console.log("================================================================================\n");
}

main().catch((err) => {
  console.error("Error setting up fixtures:", err);
  process.exit(1);
});
