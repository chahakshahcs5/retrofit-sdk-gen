import { ScannedEndpoint, scanApis } from "./scanner";

export interface EndpointChange {
  endpoint: string;
  method: string;
  interface: string;
  changes: string[];
  oldEndpoint: ScannedEndpoint;
  newEndpoint: ScannedEndpoint;
}

export interface ApiDiffResult {
  added: ScannedEndpoint[];
  removed: ScannedEndpoint[];
  modified: EndpointChange[];
  totalOld: number;
  totalNew: number;
}

/**
 * Compares two sets of scanned Retrofit endpoints and detects additions, removals, and changes
 */
export function diffEndpoints(
  oldEndpoints: ScannedEndpoint[],
  newEndpoints: ScannedEndpoint[]
): ApiDiffResult {
  const makeKey = (ep: ScannedEndpoint) => `${ep.method.toUpperCase()} ${ep.endpoint}`;

  const oldMap = new Map<string, ScannedEndpoint>();
  for (const ep of oldEndpoints) {
    oldMap.set(makeKey(ep), ep);
  }

  const newMap = new Map<string, ScannedEndpoint>();
  for (const ep of newEndpoints) {
    newMap.set(makeKey(ep), ep);
  }

  const added: ScannedEndpoint[] = [];
  const removed: ScannedEndpoint[] = [];
  const modified: EndpointChange[] = [];

  // Check for additions and modifications
  for (const [key, newEp] of newMap.entries()) {
    if (!oldMap.has(key)) {
      added.push(newEp);
    } else {
      const oldEp = oldMap.get(key)!;
      const changes: string[] = [];

      // Response type change
      if (oldEp.responseType !== newEp.responseType) {
        changes.push(`Response changed: ${oldEp.responseType || "void"} -> ${newEp.responseType || "void"}`);
      }

      // Request body change
      if (oldEp.requestBodyType !== newEp.requestBodyType) {
        changes.push(`Payload changed: ${oldEp.requestBodyType || "none"} -> ${newEp.requestBodyType || "none"}`);
      }

      // Query params change
      const oldQueries = Array.isArray(oldEp.queryParams) ? oldEp.queryParams : Object.keys(oldEp.queryParams || {});
      const newQueries = Array.isArray(newEp.queryParams) ? newEp.queryParams : Object.keys(newEp.queryParams || {});
      const addedQ = newQueries.filter((q) => !oldQueries.includes(q));
      const removedQ = oldQueries.filter((q) => !newQueries.includes(q));
      if (addedQ.length > 0) changes.push(`Added query params: ${addedQ.join(", ")}`);
      if (removedQ.length > 0) changes.push(`Removed query params: ${removedQ.join(", ")}`);

      // Headers change
      const oldH = oldEp.headers || [];
      const newH = newEp.headers || [];
      const addedH = newH.filter((h) => !oldH.includes(h));
      const removedH = oldH.filter((h) => !newH.includes(h));
      if (addedH.length > 0) changes.push(`Added headers: ${addedH.join(", ")}`);
      if (removedH.length > 0) changes.push(`Removed headers: ${removedH.join(", ")}`);

      if (changes.length > 0) {
        modified.push({
          endpoint: newEp.endpoint,
          method: newEp.method,
          interface: newEp.interface,
          changes,
          oldEndpoint: oldEp,
          newEndpoint: newEp,
        });
      }
    }
  }

  // Check for removals
  for (const [key, oldEp] of oldMap.entries()) {
    if (!newMap.has(key)) {
      removed.push(oldEp);
    }
  }

  return {
    added,
    removed,
    modified,
    totalOld: oldEndpoints.length,
    totalNew: newEndpoints.length,
  };
}

import { isPackageFile, decompilePackage } from "./decompiler";

/**
 * Resolves an input target which can be either an Android package file (.apk/.apkm/.xapk/.aab)
 * or an existing directory of decompiled sources.
 */
export async function resolveSourcesInput(
  inputPath: string,
  options?: { jadxPath?: string; verbose?: boolean }
): Promise<string> {
  if (isPackageFile(inputPath)) {
    return await decompilePackage(inputPath, options);
  }
  return inputPath;
}

/**
 * Compares two APK packages, split bundles, or source directories directly
 */
export async function diffApis(
  inputA: string,
  inputB: string,
  options?: { jadxPath?: string; verbose?: boolean }
): Promise<ApiDiffResult> {
  const sourcesA = await resolveSourcesInput(inputA, options);
  const sourcesB = await resolveSourcesInput(inputB, options);
  const oldScan = scanApis({ sourcesDir: sourcesA });
  const newScan = scanApis({ sourcesDir: sourcesB });
  return diffEndpoints(oldScan.apis, newScan.apis);
}

/**
 * Compares two APK decompiled source directories directly
 */
export function diffSourceDirs(oldDir: string, newDir: string): ApiDiffResult {
  const oldScan = scanApis({ sourcesDir: oldDir });
  const newScan = scanApis({ sourcesDir: newDir });
  return diffEndpoints(oldScan.apis, newScan.apis);
}

/**
 * Formats API Diff Result into Markdown or CLI table
 */
export function formatDiffMarkdown(diff: ApiDiffResult): string {
  let md = `# API Changelog & Diff Report\n\n`;
  md += `| Metric | Count |\n`;
  md += `| :--- | :--- |\n`;
  md += `| Previous Endpoints | ${diff.totalOld} |\n`;
  md += `| Current Endpoints | ${diff.totalNew} |\n`;
  md += `| 🟢 Added Endpoints | ${diff.added.length} |\n`;
  md += `| 🔴 Removed Endpoints | ${diff.removed.length} |\n`;
  md += `| 🟡 Modified Endpoints | ${diff.modified.length} |\n\n`;

  if (diff.added.length > 0) {
    md += `## 🟢 Added Endpoints (${diff.added.length})\n\n`;
    for (const ep of diff.added) {
      md += `- \`${ep.method.toUpperCase()} ${ep.endpoint}\` (${ep.interface}.${ep.function || ""})\n`;
    }
    md += `\n`;
  }

  if (diff.removed.length > 0) {
    md += `## 🔴 Removed Endpoints (${diff.removed.length})\n\n`;
    for (const ep of diff.removed) {
      md += `- \`${ep.method.toUpperCase()} ${ep.endpoint}\` (${ep.interface}.${ep.function || ""})\n`;
    }
    md += `\n`;
  }

  if (diff.modified.length > 0) {
    md += `## 🟡 Modified Endpoints (${diff.modified.length})\n\n`;
    for (const mod of diff.modified) {
      md += `### \`${mod.method.toUpperCase()} ${mod.endpoint}\` (${mod.interface})\n`;
      for (const ch of mod.changes) {
        md += `- ${ch}\n`;
      }
      md += `\n`;
    }
  }

  return md;
}
