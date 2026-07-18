import { describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";
import { config, proxy } from "@/proxy";

function makeRequest(): NextRequest {
  return { headers: new Headers({ host: "stadium.test" }) } as NextRequest;
}

describe("proxy", () => {
  it("attaches a nonce-based CSP to the response", () => {
    const response = proxy(makeRequest());
    const csp = response.headers.get("content-security-policy");

    expect(csp).toContain("default-src 'self'");
    expect(csp).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
  });

  it("scopes itself to pages via the matcher config", () => {
    expect(config.matcher[0]?.source).toContain("_next/static");
  });
});
