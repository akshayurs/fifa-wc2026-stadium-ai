/**
 * Client-side helpers for consuming the API's streaming text responses.
 *
 * Kept framework-agnostic (plain `fetch` + Web Streams) so the networking and
 * decoding logic is unit-testable in isolation from React components.
 */

const GENERIC_FAILURE = "Request failed. Please try again.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Extracts a safe, human-readable error message from a failed response. */
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (isRecord(data) && typeof data.error === "string") {
      return data.error;
    }
  } catch {
    // Body was not JSON; fall through to the generic message.
  }
  return GENERIC_FAILURE;
}

/** Yields decoded text chunks from a streaming response body. */
export async function* readTextChunks(
  response: Response,
): AsyncGenerator<string> {
  const body = response.body;
  if (!body) {
    return;
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      const text = decoder.decode(value, { stream: true });
      if (text) {
        yield text;
      }
    }
    const tail = decoder.decode();
    if (tail) {
      yield tail;
    }
  } finally {
    reader.releaseLock();
  }
}

/** Options for {@link fetchTextStream}. */
export interface TextStreamRequest {
  readonly url: string;
  readonly body: unknown;
  readonly signal?: AbortSignal;
}

/**
 * POSTs `body` as JSON and invokes `onChunk` for each streamed text fragment.
 * Throws an `Error` with a caller-safe message on a non-OK response.
 */
export async function fetchTextStream(
  { url, body, signal }: TextStreamRequest,
  onChunk: (text: string) => void,
): Promise<void> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  for await (const chunk of readTextChunks(response)) {
    onChunk(chunk);
  }
}
