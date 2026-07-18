import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

/**
 * Flat ESLint configuration.
 *
 * Layers, in order of increasing precedence:
 *  1. Next.js Core Web Vitals + TypeScript rules (includes `jsx-a11y`).
 *  2. Project-wide strictness (no `any`, no `console`, type-only imports, a11y).
 *  3. Relaxations scoped to test/tooling files.
 *  4. `eslint-config-prettier` last, to disable stylistic rules owned by Prettier.
 */
const eslintConfig = defineConfig([
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
  ...nextVitals,
  ...nextTs,
  {
    name: "stadium/strict",
    rules: {
      "no-console": "error",
      "no-debugger": "error",
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always"],
      "object-shorthand": ["error", "always"],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/label-has-associated-control": "error",
      "jsx-a11y/no-autofocus": "error",
      "jsx-a11y/no-redundant-roles": "error",
    },
  },
  {
    name: "stadium/tests",
    files: ["**/*.test.{ts,tsx}", "e2e/**/*.ts", "vitest.setup.ts"],
    rules: {
      "no-console": "off",
      // Test doubles model empty/failed generators, which legitimately never yield.
      "require-yield": "off",
    },
  },
  prettier,
]);

export default eslintConfig;
