import { enforceRateLimit, readJsonBody } from "@/lib/api-guard";
import { streamFanAssistant } from "@/lib/gemini";
import { jsonError } from "@/lib/http";
import { streamTextResponse } from "@/lib/stream";
import { assistantRequestSchema, parseBody } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Streams a Gemini-powered fan Assistant reply.
 *
 * Pipeline: rate limit → decode JSON → validate → stream. Each stage returns a
 * safe, specific error and never leaks internal details.
 */
export async function POST(request: Request): Promise<Response> {
  const rateLimited = enforceRateLimit(request);
  if (rateLimited) {
    return rateLimited;
  }

  const body = await readJsonBody(request);
  if (!body.ok) {
    return body.response;
  }

  const parsed = parseBody(assistantRequestSchema, body.data);
  if (!parsed.success) {
    return jsonError(400, parsed.message);
  }

  return streamTextResponse(
    streamFanAssistant(parsed.data.message, request.signal),
    "assistant",
  );
}
