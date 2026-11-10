#!/usr/bin/env node
// Gate: check:env - every env var read in code must be documented in .env.example.
//
// Prevents the "code reads SG_* but the template lists a retired contract" class of drift.
// Framework-provided and optional cloud fallbacks are allowlisted. Exits non-zero.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ALLOW = new Set(["NODE_ENV", "LOG_LEVEL"]);
const isAllowed = (k) => ALLOW.has(k) || k.startsWith("AWS_");

function walk(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx)$/.test(e.name)) acc.push(full);
  }
  return acc;
}

const used = new Set();
for (const f of walk(path.join(root, "src"), [])) {
  const text = fs.readFileSync(f, "utf8");
  for (const m of text.matchAll(/process\.env\.([A-Z0-9_]+)/g)) used.add(m[1]);
  for (const m of text.matchAll(/process\.env\[\s*["']([A-Z0-9_]+)["']\s*\]/g)) used.add(m[1]);
}

const example = fs.readFileSync(path.join(root, ".env.example"), "utf8");
const declared = new Set();
for (const line of example.split(/\r?\n/)) {
  const m = line.match(/^\s*#?\s*([A-Z][A-Z0-9_]*)\s*=/);
  if (m) declared.add(m[1]);
}

const missing = [...used].filter((k) => !isAllowed(k) && !declared.has(k)).sort();
if (missing.length) {
  console.error("check:env FAIL - env vars read in code but missing from .env.example:");
  for (const k of missing) console.error("  - " + k);
  process.exit(1);
}
console.log(`check:env OK - ${used.size} env var(s) referenced in code, all documented.`);
