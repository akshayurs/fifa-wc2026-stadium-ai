import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const rootDir = resolve(fileURLToPath(new URL(".", import.meta.url)));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": rootDir,
      // `server-only` throws when imported outside a React Server environment;
      // stub it so server modules stay unit-testable under Node/jsdom.
      "server-only": resolve(rootDir, "test/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "{lib,components,app,proxy}/**/*.test.{ts,tsx}",
      "*.test.{ts,tsx}",
    ],
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html", "lcov"],
      reportsDirectory: "./coverage",
      // Only application logic is measured. The `layout.tsx`/`page.tsx` shells
      // are thin server-component compositions exercised by the Playwright E2E
      // suite; everything with branching logic is unit-tested to 100% here.
      include: [
        "lib/**/*.ts",
        "components/**/*.{ts,tsx}",
        "app/api/**/*.ts",
        "app/error.tsx",
        "app/not-found.tsx",
        "proxy.ts",
      ],
      exclude: ["**/*.test.{ts,tsx}", "**/*.d.ts"],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
