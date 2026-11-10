#!/usr/bin/env node
// Gate: check:boundaries - import-boundary discipline.
//
// Enforces the rules the docs promise:
//  1. No import of the deleted @/lib/useful/db-client (use DbClient from @/core/flows).
//  2. Client files ("use client") import the leaf @/lib/errors/api-error, never the barrel.
//  3. Auth guards/session come from @/core/auth, never @/domains/auth.
//  4. No deep relative import into prisma/generated (use the @prisma-client alias).
// Exits non-zero on any violation.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function walk(dir, acc) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx)$/.test(e.name)) acc.push(full);
  }
  return acc;
}

const errors = [];
for (const f of walk(path.join(root, "src"), [])) {
  const rel = path.relative(root, f).replace(/\\/g, "/");
  const text = fs.readFileSync(f, "utf8");
  const isClient = /^\s*["']use client["']/m.test(text);

  if (/from\s+["']@\/lib\/useful\/db-client["']/.test(text))
    errors.push(`${rel}: imports the deleted @/lib/useful/db-client (use DbClient from @/core/flows)`);

  if (isClient && /from\s+["']@\/lib\/errors["']/.test(text))
    errors.push(`${rel}: client file imports the @/lib/errors barrel (use @/lib/errors/api-error)`);

  if (/import\s*\{[^}]*\b(requireAuth|requireOnboarded|getSession)\b[^}]*\}\s*from\s*["']@\/domains\/auth["']/.test(text))
    errors.push(`${rel}: auth guard/session imported from @/domains/auth (use @/core/auth)`);

  for (const m of text.matchAll(/from\s+["']([^"']*prisma\/generated[^"']*)["']/g))
    errors.push(`${rel}: deep import into prisma/generated ("${m[1]}") - use the @prisma-client alias`);
}

if (errors.length) {
  console.error("check:boundaries FAIL - import-boundary violation:");
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log("check:boundaries OK - import boundaries hold.");
