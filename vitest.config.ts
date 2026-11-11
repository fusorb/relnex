import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // Windows I/O contention + heavy import chains (prisma, facet-sdk): cap
    // workers, mirroring the sibling SovGrant vitest config.
    pool: "threads",
    maxWorkers: 2,
    testTimeout: 15000,
    hookTimeout: 30000,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/core/**", "src/lib/**"],
    },
  },
  // Mirror tsconfig `paths` so tests import the same specifiers the app does.
  resolve: {
    alias: {
      "@": path.resolve(root, "src"),
      "@prisma-client": path.resolve(root, "prisma/generated/index"),
      "@styles": path.resolve(root, "src/styles"),
    },
  },
});
