import { describe, expect, it } from "vitest";
import { getClientIp, jsonError, jsonResponse } from "@/lib/http";

describe("jsonResponse", () => {
  it("serializes the body with no-store and JSON headers", async () => {
    const response = jsonResponse(200, { ok: true });

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-type")).toBe(
      "application/json; charset=utf-8",
    );
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("merges extra headers", () => {
    const response = jsonResponse(
      429,
      { error: "slow down" },
      { "retry-after": "3" },
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("3");
  });
});

describe("jsonError", () => {
  it("wraps the message in a standard error body", async () => {
    const response = jsonError(400, "Bad request");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Bad request" });
  });
});

describe("getClientIp", () => {
  it("uses the first non-empty x-forwarded-for entry", () => {
    const request = new Request("https://example.test", {
      headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1" },
    });

    expect(getClientIp(request)).toBe("203.0.113.9");
  });

  it("skips blank forwarded entries before the real client", () => {
    const request = new Request("https://example.test", {
      headers: { "x-forwarded-for": " , 198.51.100.4" },
    });

    expect(getClientIp(request)).toBe("198.51.100.4");
  });

  it("falls back to x-real-ip when forwarded-for is absent", () => {
    const request = new Request("https://example.test", {
      headers: { "x-real-ip": "192.0.2.7" },
    });

    expect(getClientIp(request)).toBe("192.0.2.7");
  });

  it("returns 'anonymous' when no client headers are present", () => {
    const request = new Request("https://example.test");

    expect(getClientIp(request)).toBe("anonymous");
  });
});
