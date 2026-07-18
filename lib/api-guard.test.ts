import { beforeEach, describe, expect, it, vi } from "vitest";
import { enforceRateLimit, readJsonBody } from "@/lib/api-guard";
import type { RateLimitResult } from "@/lib/rate-limit";

const { check } = vi.hoisted(() => ({ check: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  getSharedRateLimiter: () => ({ check }),
}));

function allow(): RateLimitResult {
  return { allowed: true, limit: 20, remaining: 19, retryAfterMs: 0 };
}

function block(retryAfterMs: number): RateLimitResult {
  return { allowed: false, limit: 20, remaining: 0, retryAfterMs };
}

describe("enforceRateLimit", () => {
  beforeEach(() => {
    check.mockReset();
  });

  it("returns null when the request is within budget", () => {
    check.mockReturnValue(allow());

    expect(enforceRateLimit(new Request("https://x.test"))).toBeNull();
  });

  it("returns a 429 with a rounded Retry-After when over budget", () => {
    check.mockReturnValue(block(1_500));

    const response = enforceRateLimit(new Request("https://x.test"));

    expect(response?.status).toBe(429);
    expect(response?.headers.get("retry-after")).toBe("2");
  });
});

describe("readJsonBody", () => {
  it("decodes a valid JSON body", async () => {
    const request = new Request("https://x.test", {
      method: "POST",
      body: JSON.stringify({ message: "hi" }),
    });

    const result = await readJsonBody(request);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ message: "hi" });
    }
  });

  it("returns a 400 response for malformed JSON", async () => {
    const request = new Request("https://x.test", {
      method: "POST",
      body: "{ not json",
    });

    const result = await readJsonBody(request);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
    }
  });
});
