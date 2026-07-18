/**
 * HTTP helpers shared by the route handlers.
 *
 * All responses are marked non-cacheable and carry a JSON content type. Error
 * bodies contain only a generic, caller-safe message — never internal details.
 */

/** Shape of every JSON error returned by the API. */
export interface ApiErrorBody {
  readonly error: string;
}

/** Builds a `no-store` JSON response with the given status and payload. */
export function jsonResponse(
  status: number,
  body: unknown,
  headers: Readonly<Record<string, string>> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });
}

/** Builds a standardized JSON error response. */
export function jsonError(
  status: number,
  message: string,
  headers: Readonly<Record<string, string>> = {},
): Response {
  const body: ApiErrorBody = { error: message };
  return jsonResponse(status, body, headers);
}

/**
 * Derives a best-effort client identifier for rate limiting from proxy
 * headers, falling back to a shared bucket when none are present.
 *
 * The rightmost `x-forwarded-for` entry is used: it is appended by the
 * nearest trusted proxy, whereas leftmost entries are client-supplied and
 * trivially forgeable to rotate rate-limit buckets.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  const realIp = request.headers.get("x-real-ip") ?? "";

  const entries = forwardedFor
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  const candidate = entries.at(-1) ?? realIp.trim();

  return candidate.length > 0 ? candidate : "anonymous";
}
