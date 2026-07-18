import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/assistant/route";
import type { RateLimitResult } from "@/lib/rate-limit";

const { check, streamFanAssistant } = vi.hoisted(() => ({
  check: vi.fn(),
  streamFanAssistant: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({
  getSharedRateLimiter: () => ({ check }),
}));
vi.mock("@/lib/gemini", () => ({ streamFanAssistant }));

const allowed: RateLimitResult = {
  allowed: true,
  limit: 20,
  remaining: 19,
  retryAfterMs: 0,
};

async function* reply(): AsyncGenerator<string> {
  yield "Head to ";
  yield "Gate A.";
}

function postJson(body: string): Request {
  return new Request("https://x.test/api/assistant", {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/assistant", () => {
  beforeEach(() => {
    check.mockReset().mockReturnValue(allowed);
    streamFanAssistant.mockReset();
  });

  it("streams the assistant reply for a valid request", async () => {
    streamFanAssistant.mockReturnValue(reply());

    const response = await POST(
      postJson(JSON.stringify({ message: "Where is Gate A?" })),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "text/plain; charset=utf-8",
    );
    await expect(response.text()).resolves.toBe("Head to Gate A.");
    expect(streamFanAssistant).toHaveBeenCalledWith({
      message: "Where is Gate A?",
      locale: undefined,
      signal: expect.any(AbortSignal),
    });
  });

  it("forwards a validated locale to the assistant", async () => {
    streamFanAssistant.mockReturnValue(reply());

    const response = await POST(
      postJson(
        JSON.stringify({
          message: "¿Dónde está la puerta A?",
          locale: "es-MX",
        }),
      ),
    );

    expect(response.status).toBe(200);
    expect(streamFanAssistant).toHaveBeenCalledWith(
      expect.objectContaining({ locale: "es-MX" }),
    );
  });

  it("returns 429 when rate limited", async () => {
    check.mockReturnValue({
      allowed: false,
      limit: 20,
      remaining: 0,
      retryAfterMs: 1000,
    });

    const response = await POST(postJson(JSON.stringify({ message: "hello" })));

    expect(response.status).toBe(429);
    expect(streamFanAssistant).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed JSON", async () => {
    const response = await POST(postJson("{ broken"));

    expect(response.status).toBe(400);
  });

  it("returns 400 for a schema-invalid body", async () => {
    const response = await POST(postJson(JSON.stringify({ message: " " })));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: expect.stringContaining("too short"),
    });
  });
});
