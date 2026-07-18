import { MAX_BODY_BYTES } from "@/lib/constants";
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

const BODY_TOO_LARGE: JsonBody = {
  ok: false,
  response: jsonError(413, "Request body is too large."),
};

/**
 * Reads and JSON-decodes a request body. Returns a `413` when the body
 * exceeds {@link MAX_BODY_BYTES} (checked against both the declared
 * `content-length` and the actual bytes read, so neither can be lied about)
 * and a `400` on malformed JSON.
 */
export async function readJsonBody(request: Request): Promise<JsonBody> {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_BODY_BYTES) {
    return BODY_TOO_LARGE;
  }

  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return BODY_TOO_LARGE;
    }
    const data: unknown = JSON.parse(text);
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      response: jsonError(400, "Request body must be valid JSON."),
    };
  }
}
