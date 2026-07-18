import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;
const isCI = process.env.CI === "true";

/**
 * End-to-end configuration.
 *
 * The web server is started in deterministic AI mock mode (`STADIUM_AI_MOCK`)
 * so the suite never depends on a live Gemini key or network access.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npm run start",
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: !isCI,
    env: {
      STADIUM_AI_MOCK: "true",
      GEMINI_API_KEY: "e2e-mock-key-unused",
    },
  },
});
