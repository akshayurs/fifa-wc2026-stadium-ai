/**
 * Content-Security-Policy construction for the per-request nonce strategy.
 *
 * A fresh nonce is generated for every navigation in `proxy.ts`; Next.js then
 * stamps it onto its framework scripts and inline styles automatically. The
 * resulting `strict-dynamic` policy blocks injected inline scripts without an
 * allow-list of external hosts.
 */

/** Generates a base64 nonce. `random` is injectable for deterministic tests. */
export function generateNonce(
  random: () => string = () => globalThis.crypto.randomUUID(),
): string {
  return Buffer.from(random()).toString("base64");
}

/** Builds the CSP header value for a given nonce and environment. */
export function buildContentSecurityPolicy(
  nonce: string,
  isDev: boolean,
): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    // React uses eval only in development for richer stack traces.
    ...(isDev ? ["'unsafe-eval'"] : []),
  ].join(" ");

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}
