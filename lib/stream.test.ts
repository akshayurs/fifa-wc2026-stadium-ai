import { beforeEach, describe, expect, it, vi } from "vitest";
import { streamTextResponse } from "@/lib/stream";

const { logError } = vi.hoisted(() => ({ logError: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logError, logWarning: vi.fn() }));

async function* okStream(): AsyncGenerator<string> {
  yield "Hel";
  yield "lo";
}

async function* emptyStream(): AsyncGenerator<string> {
  // Intentionally yields nothing.
}

async function* preFailStream(): AsyncGenerator<string> {
  throw new Error("upstream down");
}

async function* midFailStream(): AsyncGenerator<string> {
  yield "Hel";
  throw new Error("mid-stream");
}

describe("streamTextResponse", () => {
  beforeEach(() => {
    logError.mockClear();
  });

  it("streams all chunks with a text/plain, no-store response", async () => {
    const response = await streamTextResponse(okStream(), "assistant");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "text/plain; charset=utf-8",
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.text()).resolves.toBe("Hello");
  });

  it("returns an empty body for an empty stream", async () => {
    const response = await streamTextResponse(emptyStream(), "assistant");

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe("");
  });

  it("returns a clean 502 when the stream fails before the first chunk", async () => {
    const response = await streamTextResponse(preFailStream(), "assistant");

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: expect.stringContaining("temporarily unavailable"),
    });
    expect(logError).toHaveBeenCalledWith("assistant", expect.any(Error));
  });

  it("aborts the stream and logs when a later chunk fails", async () => {
    const response = await streamTextResponse(midFailStream(), "assistant");

    expect(response.status).toBe(200);
    await expect(response.text()).rejects.toThrow();
    expect(logError).toHaveBeenCalledWith("assistant", expect.any(Error));
  });
});
