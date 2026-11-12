#!/usr/bin/env node
// Gate: check:openapi - the hand-written OpenAPI spec must describe exactly the
// routes that exist. Walks src/app/api for route.ts files, derives the URL paths
// ([id] -> {id}), and diffs them against the path keys in openApiSpec.
//
// Keeps src/lib/useful/openapi.ts (which /api-docs renders) honest as routes are
// added or removed. Zero runtime deps; exits non-zero on drift.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function walk(dir, acc) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name === "route.ts") acc.push(full);
  }
  return acc;
}

const apiDir = path.join(root, "src/app/api");
const actual = walk(apiDir, [])
  .map((file) => {
    const rel = path
      .relative(apiDir, path.dirname(file))
      .split(path.sep)
      .join("/");
    const url = rel === "." ? "/api" : `/api/${rel}`;
    return url.replace(/\[([^\]]+)\]/g, "{$1}");
  })
  .sort();

const spec = fs.readFileSync(path.join(root, "src/lib/useful/openapi.ts"), "utf8");
const documented = [...spec.matchAll(/^\s{4}"(\/api[^"]*)":/gm)]
  .map((m) => m[1])
  .sort();

const undocumented = actual.filter((p) => !documented.includes(p));
const phantom = documented.filter((p) => !actual.includes(p));

if (undocumented.length || phantom.length) {
  console.error("check:openapi FAIL - the spec drifted from the routes:");
  for (const p of undocumented) console.error(`  - route exists but is undocumented: ${p}`);
  for (const p of phantom) console.error(`  - documented but no such route:    ${p}`);
  process.exit(1);
}
console.log(`check:openapi OK - ${actual.length} routes, all documented.`);
