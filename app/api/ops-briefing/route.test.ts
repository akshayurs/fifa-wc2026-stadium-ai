import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/ops-briefing/route";
import type { RateLimitResult } from "@/lib/rate-limit";

const { check, streamOpsBriefing, generateOperationsSnapshot } = vi.hoisted(
  () => ({
    check: vi.fn(),
    streamOpsBriefing: vi.fn(),
    generateOperationsSnapshot: vi.fn(),
  }),
);
vi.mock("@/lib/rate-limit", () => ({
  getSharedRateLimiter: () => ({ check }),
}));
vi.mock("@/lib/gemini", () => ({ streamOpsBriefing }));
vi.mock("@/lib/ops-source", () => ({ generateOperationsSnapshot }));

const allowed: RateLimitResult = {
  allowed: true,
  limit: 20,
  remaining: 19,
  retryAfterMs: 0,
};

const snapshot = {
  venue: "Test Venue",
  generatedAt: 0,
  zones: [{ id: "zone-1", name: "Zone 1", capacity: 1000, occupancy: 500 }],
  gates: [
    {
      id: "gate-1",
      name: "Gate 1",
      isOpen: true,
      throughputPerMin: 100,
      waitMinutes: 5,
    },
  ],
  incidents: [],
};

async function* briefing(): AsyncGenerator<string> {
  yield "Situation nominal.";
}

function postJson(body: string): Request {
  return new Request("https://x.test/api/ops-briefing", {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/ops-briefing", () => {
  beforeEach(() => {
    check.mockReset().mockReturnValue(allowed);
    streamOpsBriefing.mockReset().mockReturnValue(briefing());
    generateOperationsSnapshot.mockReset().mockResolvedValue(snapshot);
  });

  it("streams a briefing grounded in the current snapshot", async () => {
    const response = await POST(postJson(JSON.stringify({})));

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe("Situation nominal.");
    const summary = streamOpsBriefing.mock.calls[0]?.[0] as string;
    expect(summary).toContain("Venue:");
    expect(summary).not.toContain("Focus especially on zone");
  });

  it("appends the requested focus zone to the prompt", async () => {
    await POST(postJson(JSON.stringify({ focusZoneId: "north" })));

    const summary = streamOpsBriefing.mock.calls[0]?.[0] as string;
    expect(summary).toContain("Focus especially on zone: north.");
  });

  it("returns 400 for an invalid focus zone id", async () => {
    const response = await POST(
      postJson(JSON.stringify({ focusZoneId: "Bad Zone!" })),
    );

    expect(response.status).toBe(400);
    expect(streamOpsBriefing).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed JSON", async () => {
    const response = await POST(postJson("{ broken"));

    expect(response.status).toBe(400);
  });

  it("returns 429 when rate limited", async () => {
    check.mockReturnValue({
      allowed: false,
      limit: 20,
      remaining: 0,
      retryAfterMs: 500,
    });

    const response = await POST(postJson(JSON.stringify({})));

    expect(response.status).toBe(429);
  });
});
