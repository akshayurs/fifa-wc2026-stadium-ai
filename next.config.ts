import type { NextConfig } from "next";

/**
 * Baseline security response headers applied to every route.
 *
 * The `Content-Security-Policy` header is intentionally NOT set here: it is
 * generated per-request with a fresh nonce in `proxy.ts` so that a strict,
 * `strict-dynamic` policy can be enforced. These headers cover the remaining
 * hardening (transport, framing, sniffing, referrer, and cross-origin
 * isolation) and apply uniformly to pages and API routes.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
] as const;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: [...securityHeaders] }];
  },
};

export default nextConfig;
