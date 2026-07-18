import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTextStream } from "@/components/useTextStream";

const { fetchTextStream } = vi.hoisted(() => ({ fetchTextStream: vi.fn() }));
vi.mock("@/lib/response-stream", () => ({ fetchTextStream }));

const URL = "/api/assistant";
const ERROR = "It failed.";

beforeEach(() => {
  fetchTextStream.mockReset();
});

describe("useTextStream", () => {
  it("accumulates streamed chunks and clears loading", async () => {
    fetchTextStream.mockImplementation(
      async (_request: unknown, onChunk: (chunk: string) => void) => {
        onChunk("He");
        onChunk("llo");
      },
    );

    const { result } = renderHook(() => useTextStream(URL, ERROR));

    await act(async () => {
      await result.current.run({ message: "hi" });
    });

    expect(result.current.text).toBe("Hello");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("surfaces a friendly error when the request fails", async () => {
    fetchTextStream.mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => useTextStream(URL, ERROR));

    await act(async () => {
      await result.current.run({});
    });

    expect(result.current.error).toBe(ERROR);
    expect(result.current.isLoading).toBe(false);
  });

  it("ignores abort errors without surfacing them", async () => {
    fetchTextStream.mockRejectedValue(
      new DOMException("aborted", "AbortError"),
    );

    const { result } = renderHook(() => useTextStream(URL, ERROR));

    await act(async () => {
      await result.current.run({});
    });

    expect(result.current.error).toBeNull();
  });

  it("aborts a previous in-flight request on a new run", async () => {
    fetchTextStream.mockResolvedValue(undefined);

    const { result } = renderHook(() => useTextStream(URL, ERROR));

    await act(async () => {
      await result.current.run({});
    });
    await act(async () => {
      await result.current.run({});
    });

    const firstSignal = fetchTextStream.mock.calls[0]?.[0]
      .signal as AbortSignal;
    expect(firstSignal.aborted).toBe(true);
  });

  it("aborts on unmount after a request has started", async () => {
    fetchTextStream.mockResolvedValue(undefined);

    const { result, unmount } = renderHook(() => useTextStream(URL, ERROR));

    await act(async () => {
      await result.current.run({});
    });
    const signal = fetchTextStream.mock.calls[0]?.[0].signal as AbortSignal;
    unmount();

    expect(signal.aborted).toBe(true);
  });

  it("unmounts cleanly when no request was made", () => {
    const { unmount } = renderHook(() => useTextStream(URL, ERROR));

    expect(() => unmount()).not.toThrow();
  });
});
