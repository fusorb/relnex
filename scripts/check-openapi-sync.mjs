#!/usr/bin/env node
// Gate: check:openapi - the hand-written OpenAPI spec must describe exactly the
// routes that exist: same paths AND same HTTP methods.
//
// Walks src/app/api for route.ts files, derives the URL paths ([id] -> {id}) and
// the exported methods, then diffs both against src/lib/useful/openapi.ts (which
// /api-docs renders). Zero runtime deps; exits non-zero on drift.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const METHODS = ["get", "post", "put", "patch", "delete"];

function walk(dir, acc) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name === "route.ts") acc.push(full);
  }
  return acc;
}

const apiDir = path.join(root, "src/app/api");
const actual = new Map(); // path -> Set(method)
for (const file of walk(apiDir, [])) {
  const rel = path.relative(apiDir, path.dirname(file)).split(path.sep).join("/");
  const url = (rel === "." ? "/api" : `/api/${rel}`).replace(/\[([^\]]+)\]/g, "{$1}");
  const text = fs.readFileSync(file, "utf8");
  const methods = new Set();
  for (const m of text.matchAll(
    /^\s*export\s+(?:async\s+)?(?:const|function)\s+(GET|POST|PUT|PATCH|DELETE)\b/gm,
  )) {
    methods.add(m[1].toLowerCase());
  }
  actual.set(url, methods);
}

// Slice the spec into per-path blocks so methods are matched inside their path.
const spec = fs.readFileSync(path.join(root, "src/lib/useful/openapi.ts"), "utf8");
const keyRe = /^ {4}"(\/api[^"]*)":\s*\{/gm;
const keys = [...spec.matchAll(keyRe)].map((m) => ({
  path: m[1],
  start: m.index + m[0].length,
}));
const documented = new Map();
keys.forEach((k, i) => {
  const end = i + 1 < keys.length ? keys[i + 1].start : spec.length;
  const block = spec.slice(k.start, end);
  const methods = new Set();
  for (const m of block.matchAll(/^ {6}(get|post|put|patch|delete):/gm)) {
    methods.add(m[1]);
  }
  documented.set(k.path, methods);
});

const errors = [];
for (const [p, methods] of actual) {
  if (!documented.has(p)) {
    errors.push(`route exists but is undocumented: ${p}`);
    continue;
  }
  for (const m of methods) {
    if (!documented.get(p).has(m)) errors.push(`undocumented method: ${m.toUpperCase()} ${p}`);
  }
}
for (const [p, methods] of documented) {
  if (!actual.has(p)) {
    errors.push(`documented but no such route: ${p}`);
    continue;
  }
  for (const m of methods) {
    if (METHODS.includes(m) && !actual.get(p).has(m)) {
      errors.push(`documented but not implemented: ${m.toUpperCase()} ${p}`);
    }
  }
}

if (errors.length) {
  console.error("check:openapi FAIL - the spec drifted from the routes:");
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log(`check:openapi OK - ${actual.size} routes, paths + methods documented.`);
