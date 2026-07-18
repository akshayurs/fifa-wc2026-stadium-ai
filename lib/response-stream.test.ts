import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchTextStream, readTextChunks } from "@/lib/response-stream";

function streamResponse(chunks: Uint8Array[], init?: ResponseInit): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });
  return new Response(stream, init);
}

async function collect(generator: AsyncGenerator<string>): Promise<string[]> {
  const out: string[] = [];
  for await (const chunk of generator) {
    out.push(chunk);
  }
  return out;
}

const encoder = new TextEncoder();

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("readTextChunks", () => {
  it("decodes and yields text chunks", async () => {
    const response = streamResponse([
      encoder.encode("Hel"),
      encoder.encode("lo"),
    ]);

    await expect(collect(readTextChunks(response))).resolves.toEqual([
      "Hel",
      "lo",
    ]);
  });

  it("yields nothing for a body-less response", async () => {
    await expect(collect(readTextChunks(new Response(null)))).resolves.toEqual(
      [],
    );
  });

  it("buffers a multi-byte character split across chunks", async () => {
    // "é" (U+00E9) encodes to 0xC3 0xA9.
    const response = streamResponse([
      new Uint8Array([0xc3]),
      new Uint8Array([0xa9]),
    ]);

    await expect(collect(readTextChunks(response))).resolves.toEqual(["é"]);
  });

  it("flushes trailing incomplete bytes on close", async () => {
    const response = streamResponse([new Uint8Array([0xc3])]);

    const chunks = await collect(readTextChunks(response));
    expect(chunks.join("")).toBe("�");
  });
});

describe("fetchTextStream", () => {
  it("streams chunks to the callback on success", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(streamResponse([encoder.encode("Hi")]));
    vi.stubGlobal("fetch", fetchMock);

    const received: string[] = [];
    await fetchTextStream(
      { url: "/api/assistant", body: { message: "hello" } },
      (chunk) => received.push(chunk),
    );

    expect(received).toEqual(["Hi"]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/assistant",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ message: "hello" }),
      }),
    );
  });

  it("throws the server-provided error message on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Too many requests." }), {
          status: 429,
        }),
      ),
    );

    await expect(
      fetchTextStream({ url: "/api/assistant", body: {} }, () => undefined),
    ).rejects.toThrow("Too many requests.");
  });

  it("falls back to a generic message when the error body is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("boom", { status: 500 })),
    );

    await expect(
      fetchTextStream({ url: "/api/assistant", body: {} }, () => undefined),
    ).rejects.toThrow("Request failed. Please try again.");
  });

  it("falls back when the error body lacks a string error field", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ code: 500 }), { status: 500 }),
        ),
    );

    await expect(
      fetchTextStream({ url: "/api/assistant", body: {} }, () => undefined),
    ).rejects.toThrow("Request failed. Please try again.");
  });

  it("falls back when the error body is JSON null", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("null", { status: 400 })),
    );

    await expect(
      fetchTextStream({ url: "/api/assistant", body: {} }, () => undefined),
    ).rejects.toThrow("Request failed. Please try again.");
  });
});
