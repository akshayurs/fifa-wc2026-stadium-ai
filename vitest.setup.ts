import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { toHaveNoViolations } from "jest-axe";
import { afterEach, expect, vi } from "vitest";

// Register the accessibility matcher used across component tests.
expect.extend(toHaveNoViolations);

// Ensure a clean DOM and fresh mocks between every test for isolation.
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
