import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_RATE_LIMIT_MAX,
  DEFAULT_RATE_LIMIT_WINDOW_MS,
} from "@/lib/constants";
import { getServerEnv, resetServerEnvCache } from "@/lib/env";

describe("getServerEnv", () => {
  beforeEach(() => {
    resetServerEnvCache();
    // Default to mock disabled so tests are independent of the ambient env;
    // individual tests override as needed.
    vi.stubEnv("STADIUM_AI_MOCK", "false");
  });

  it("parses mock mode without requiring an API key and applies defaults", () => {
    vi.stubEnv("STADIUM_AI_MOCK", "true");

    const env = getServerEnv();

    expect(env.STADIUM_AI_MOCK).toBe(true);
    expect(env.GEMINI_MODEL).toBe(DEFAULT_GEMINI_MODEL);
    expect(env.RATE_LIMIT_MAX).toBe(DEFAULT_RATE_LIMIT_MAX);
    expect(env.RATE_LIMIT_WINDOW_MS).toBe(DEFAULT_RATE_LIMIT_WINDOW_MS);
  });

  it("accepts a real API key with mock disabled", () => {
    vi.stubEnv("GEMINI_API_KEY", "secret-key");

    const env = getServerEnv();

    expect(env.STADIUM_AI_MOCK).toBe(false);
    expect(env.GEMINI_API_KEY).toBe("secret-key");
  });

  it("coerces custom numeric and model overrides", () => {
    vi.stubEnv("GEMINI_API_KEY", "secret-key");
    vi.stubEnv("GEMINI_MODEL", "gemini-custom");
    vi.stubEnv("RATE_LIMIT_MAX", "5");
    vi.stubEnv("RATE_LIMIT_WINDOW_MS", "1000");

    const env = getServerEnv();

    expect(env.GEMINI_MODEL).toBe("gemini-custom");
    expect(env.RATE_LIMIT_MAX).toBe(5);
    expect(env.RATE_LIMIT_WINDOW_MS).toBe(1000);
  });

  it("throws a value-free error when the key is missing and mock is off", () => {
    expect(() => getServerEnv()).toThrowError(/GEMINI_API_KEY/);
  });

  it("throws when a numeric setting is invalid", () => {
    vi.stubEnv("GEMINI_API_KEY", "secret-key");
    vi.stubEnv("RATE_LIMIT_MAX", "0");

    expect(() => getServerEnv()).toThrowError(/RATE_LIMIT_MAX/);
  });

  it("caches the parsed environment across calls", () => {
    vi.stubEnv("STADIUM_AI_MOCK", "true");

    const first = getServerEnv();
    const second = getServerEnv();

    expect(second).toBe(first);
    expect(Object.isFrozen(first)).toBe(true);
  });
});
