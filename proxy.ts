import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildContentSecurityPolicy, generateNonce } from "@/lib/security";

/**
 * Request proxy (formerly "middleware" in earlier Next.js versions).
 *
 * Generates a fresh CSP nonce per navigation and attaches a strict
 * Content-Security-Policy to both the forwarded request (so Next.js can stamp
 * the nonce onto its scripts/styles) and the outgoing response.
 */
export function proxy(request: NextRequest): NextResponse {
  const nonce = generateNonce();
  const isDev = process.env.NODE_ENV === "development";
  const csp = buildContentSecurityPolicy(nonce, isDev);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Apply to pages only; skip API routes, static assets, and prefetches.
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
