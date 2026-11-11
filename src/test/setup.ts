// Vitest global setup: provide the env contract the auth modules expect so
// nothing throws on a fresh clone (CI provides these too). Individual tests
// override values locally where they assert on them. Vitest sets NODE_ENV=test.
process.env.SG_JWT_SECRET ??= "test-jwt-secret";
process.env.SG_ISSUER ??= "sg";
