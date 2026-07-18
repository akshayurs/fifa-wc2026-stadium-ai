// Test stub for the `server-only` package.
//
// In a real Next.js build, importing `server-only` from a module that ends up
// in a client bundle is a hard error — that guard protects the Gemini key from
// ever reaching the browser. Under Vitest (plain Node) the real package throws
// on import because there is no React Server condition, so we alias it to this
// no-op via `vitest.config.ts`.
export {};
