import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy, generateNonce } from "@/lib/security";

describe("generateNonce", () => {
  it("base64-encodes the random source", () => {
    expect(generateNonce(() => "fixed-value")).toBe(
      Buffer.from("fixed-value").toString("base64"),
    );
  });

  it("produces a value by default", () => {
    expect(generateNonce().length).toBeGreaterThan(0);
  });
});

describe("buildContentSecurityPolicy", () => {
  it("emits a strict production policy without unsafe-eval", () => {
    const csp = buildContentSecurityPolicy("abc", false);

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain("unsafe-eval");
  });

  it("permits unsafe-eval only in development", () => {
    expect(buildContentSecurityPolicy("abc", true)).toContain("'unsafe-eval'");
  });
});
