import { getClientIp, jsonError } from "@/lib/http";
import { getSharedRateLimiter } from "@/lib/rate-limit";

/**
 * Applies the shared per-client rate limit to a request.
 *
 * @returns a `429` response when the client is over budget, otherwise `null`.
 */
export function enforceRateLimit(request: Request): Response | null {
  const result = getSharedRateLimiter().check(getClientIp(request));
  if (result.allowed) {
    return null;
  }
  const retryAfterSeconds = Math.ceil(result.retryAfterMs / 1000);
  return jsonError(429, "Too many requests. Please slow down.", {
    "retry-after": String(retryAfterSeconds),
  });
}

/** Result of attempting to decode a JSON request body. */
export type JsonBody =
  | { readonly ok: true; readonly data: unknown }
  | { readonly ok: false; readonly response: Response };

/** Reads and JSON-decodes a request body, returning a `400` on malformed input. */
export async function readJsonBody(request: Request): Promise<JsonBody> {
  try {
    const data: unknown = await request.json();
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      response: jsonError(400, "Request body must be valid JSON."),
    };
  }
}
