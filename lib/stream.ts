import { jsonError } from "@/lib/http";
import { logError } from "@/lib/logger";

/** Caller-safe message returned when the AI provider fails before streaming. */
const UPSTREAM_ERROR =
  "The AI service is temporarily unavailable. Please try again shortly.";

/**
 * Turns a text-chunk async generator into a streaming HTTP response.
 *
 * The first chunk is awaited eagerly so that pre-stream failures (bad
 * configuration, authentication, quota) become a clean JSON `502` instead of a
 * broken stream. Once streaming has begun, later failures abort the stream and
 * are logged server-side; internal details are never sent to the client.
 */
export async function streamTextResponse(
  generator: AsyncGenerator<string>,
  scope: string,
): Promise<Response> {
  let first: IteratorResult<string>;
  try {
    first = await generator.next();
  } catch (error) {
    logError(scope, error);
    return jsonError(502, UPSTREAM_ERROR);
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (!first.done) {
          controller.enqueue(encoder.encode(first.value));
        }
        for await (const chunk of generator) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch (error) {
        logError(scope, error);
        controller.error(error);
      }
    },
  });

  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-accel-buffering": "no",
    },
  });
}
