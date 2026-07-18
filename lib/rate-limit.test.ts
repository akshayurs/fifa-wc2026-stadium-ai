import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetServerEnvCache } from "@/lib/env";
import {
  RateLimiter,
  getSharedRateLimiter,
  resetSharedRateLimiter,
} from "@/lib/rate-limit";

describe("RateLimiter", () => {
  it("allows requests up to the limit then blocks with a retry hint", () => {
    let now = 1_000;
    const limiter = new RateLimiter({
      max: 2,
      windowMs: 1_000,
      now: () => now,
    });

    expect(limiter.check("client").allowed).toBe(true);
    const second = limiter.check("client");
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);

    const blocked = limiter.check("client");
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBe(1_000);

    now += 250;
    const stillBlocked = limiter.check("client");
    expect(stillBlocked.allowed).toBe(false);
    expect(stillBlocked.retryAfterMs).toBe(750);
  });

  it("permits requests again once the window slides forward", () => {
    let now = 0;
    const limiter = new RateLimiter({
      max: 1,
      windowMs: 1_000,
      now: () => now,
    });

    expect(limiter.check("client").allowed).toBe(true);
    expect(limiter.check("client").allowed).toBe(false);

    now += 1_001;
    expect(limiter.check("client").allowed).toBe(true);
  });

  it("tracks separate clients independently", () => {
    const limiter = new RateLimiter({ max: 1, windowMs: 1_000, now: () => 0 });

    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("b").allowed).toBe(true);
  });

  it("defaults to the real clock when none is injected", () => {
    const limiter = new RateLimiter({ max: 1, windowMs: 1_000 });

    expect(limiter.check("client").allowed).toBe(true);
  });

  it("clears state on reset", () => {
    const limiter = new RateLimiter({ max: 1, windowMs: 1_000, now: () => 0 });

    limiter.check("client");
    limiter.reset();

    expect(limiter.check("client").allowed).toBe(true);
  });
});

describe("getSharedRateLimiter", () => {
  beforeEach(() => {
    resetServerEnvCache();
    resetSharedRateLimiter();
    vi.stubEnv("STADIUM_AI_MOCK", "true");
    vi.stubEnv("RATE_LIMIT_MAX", "3");
    vi.stubEnv("RATE_LIMIT_WINDOW_MS", "5000");
  });

  it("builds a limiter from the environment and caches it", () => {
    const first = getSharedRateLimiter();
    const second = getSharedRateLimiter();

    expect(first).toBe(second);
    expect(first.check("client").limit).toBe(3);
  });

  it("rebuilds after reset", () => {
    const first = getSharedRateLimiter();
    resetSharedRateLimiter();
    const second = getSharedRateLimiter();

    expect(first).not.toBe(second);
  });
});
