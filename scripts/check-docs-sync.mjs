#!/usr/bin/env node
// Gate: check:docs - documentation must not drift from reality.
//
// Computes the real counts from the source of truth (Prisma schema, API routes,
// domain directories) and fails if any checked doc declares a stale number.
// Mirrors the facet-style drift gates. Zero runtime deps; exits non-zero on drift.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

// --- Actual counts (source of truth) ---
const schema = read("prisma/schema.prisma");
const models = (schema.match(/^model\s+\w+/gm) || []).length;
const enums = (schema.match(/^enum\s+\w+/gm) || []).length;

function walk(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else if (e.name === "route.ts") acc.push(full);
  }
  return acc;
}
const routes = walk(path.join(root, "src/app/api"), []).length;
const domains = fs
  .readdirSync(path.join(root, "src/domains"), { withFileTypes: true })
  .filter((e) => e.isDirectory()).length;

const actual = { models, enums, routes, domains };

// --- 1) Canonical declarations must be present and correct ---
const required = [
  ["docs/relnex-roadmap.md", `${models} models, ${enums} enums`],
  [".agent/todo.txt", `${models} models, ${enums} enums, ${routes} routes, ${domains} domains`],
  ["docs/architecture.md", `(${domains} domains)`],
];

// --- 2) No stale literal numbers anywhere in the checked docs ---
const DOC_FILES = [
  "README.md",
  "CLAUDE.md",
  "AGENTS.md",
  "docs/relnex-roadmap.md",
  "docs/architecture.md",
  "docs/identity-model.md",
  ".agent/todo.txt",
];
const PATTERNS = [
  [/\b(\d+)\s+models\b/g, "models"],
  [/\b(\d+)\s+enums\b/g, "enums"],
  [/\b(\d+)\s+routes\b/g, "routes"],
  // The same count is phrased "route files" / "API route files" in places; without
  // these the word "routes" pattern silently skipped them (found via CLAUDE.md).
  [/\b(\d+)\s+route files\b/g, "routes"],
  [/\b(\d+)\s+API route files\b/g, "routes"],
  [/\b(\d+)\s+domains\b/g, "domains"],
];

const errors = [];
for (const [file, needle] of required) {
  if (!read(file).includes(needle)) {
    errors.push(`${file}: missing canonical count "${needle}"`);
  }
}
for (const file of DOC_FILES) {
  const text = read(file);
  for (const [re, key] of PATTERNS) {
    for (const m of text.matchAll(re)) {
      if (Number(m[1]) !== actual[key]) {
        errors.push(`${file}: stale "${m[0].trim()}" - actual ${key} = ${actual[key]}`);
      }
    }
  }
}

if (errors.length) {
  console.error("check:docs FAIL - documentation drifted from reality:");
  for (const e of errors) console.error("  - " + e);
  console.error(
    `\nActual: ${models} models, ${enums} enums, ${routes} routes, ${domains} domains.`,
  );
  process.exit(1);
}
console.log(
  `check:docs OK - ${models} models, ${enums} enums, ${routes} routes, ${domains} domains.`,
);
