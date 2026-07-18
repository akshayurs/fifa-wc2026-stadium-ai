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
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  const realIp = request.headers.get("x-real-ip") ?? "";

  const candidate =
    forwardedFor
      .split(",")
      .map((part) => part.trim())
      .find((part) => part.length > 0) ?? realIp.trim();

  return candidate.length > 0 ? candidate : "anonymous";
}
