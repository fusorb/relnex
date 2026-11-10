#!/usr/bin/env node
// Gate: check:legacy - retired names must not exist in the live tree.
//
// Allowed only in the lineaged history: .agent/episodes.md and .agent/archive/**.
// This file is itself allowlisted (it names the terms). Exits non-zero on a hit.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const TERMS = /arcbase|arc-id|arcid|arcevo|nexashelf/i;

const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "dist", "out", "generated"]);
const SKIP_REL = new Set([".agent/archive"]);
const ALLOW_FILES = new Set([
  ".agent/episodes.md",
  ".commandcode/settings.json",
  "scripts/check-legacy-names.mjs",
]);
const TEXT_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|json|md|txt|css|yaml|yml|prisma)$/;

function walk(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === ".git") continue;
    const full = path.join(dir, e.name);
    const rel = path.relative(root, full).replace(/\\/g, "/");
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name) || SKIP_REL.has(rel)) continue;
      walk(full, acc);
    } else {
      acc.push({ full, rel });
    }
  }
  return acc;
}

const hits = [];
for (const { full, rel } of walk(root, [])) {
  if (ALLOW_FILES.has(rel) || rel === ".env") continue;
  if (rel.startsWith(".commandcode/taste/")) continue; // auto-managed
  const base = path.basename(rel);
  if (!TEXT_EXT.test(base) && !base.includes(".env")) continue;
  let text;
  try {
    text = fs.readFileSync(full, "utf8");
  } catch {
    continue;
  }
  text.split(/\r?\n/).forEach((line, i) => {
    if (TERMS.test(line)) hits.push(`${rel}:${i + 1}: ${line.trim().slice(0, 120)}`);
  });
}

if (hits.length) {
  console.error("check:legacy FAIL - retired names found outside the allowlist:");
  for (const h of hits) console.error("  - " + h);
  process.exit(1);
}
console.log("check:legacy OK - no retired names outside .agent/episodes.md and .agent/archive/.");
