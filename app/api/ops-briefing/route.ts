import { enforceRateLimit, readJsonBody } from "@/lib/api-guard";
import { streamOpsBriefing } from "@/lib/gemini";
import { jsonError } from "@/lib/http";
import {
  deriveMetrics,
  getCurrentStadiumSnapshot,
  summarizeForPrompt,
} from "@/lib/stadium-data";
import { streamTextResponse } from "@/lib/stream";
import { opsBriefingRequestSchema, parseBody } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Streams a Gemini-generated operations briefing grounded in the current
 * (simulated real-time) stadium snapshot.
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

  const parsed = parseBody(opsBriefingRequestSchema, body.data);
  if (!parsed.success) {
    return jsonError(400, parsed.message);
  }

  const snapshot = getCurrentStadiumSnapshot();
  const metrics = deriveMetrics(snapshot);
  let summary = summarizeForPrompt(snapshot, metrics);
  if (parsed.data.focusZoneId) {
    summary += `\n\nFocus especially on zone: ${parsed.data.focusZoneId}.`;
  }

  return streamTextResponse(
    streamOpsBriefing(summary, request.signal),
    "ops-briefing",
  );
}
