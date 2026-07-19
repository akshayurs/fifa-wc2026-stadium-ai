import { beforeEach, describe, expect, it, vi } from "vitest";
import { getServerEnv, type ServerEnv } from "@/lib/env";
import { GoogleGenAI } from "@google/genai";
import {
  buildSnapshotPrompt,
  generateOperationsSnapshot,
  withTimeoutSignal,
} from "@/lib/ops-source";

vi.mock("@/lib/env", () => ({
  getServerEnv: vi.fn(),
  resetServerEnvCache: vi.fn(),
}));
vi.mock("@google/genai", () => ({ GoogleGenAI: vi.fn() }));
const { logError } = vi.hoisted(() => ({ logError: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logError, logWarning: vi.fn() }));

const mockedEnv = vi.mocked(getServerEnv);
const MockedGoogleGenAI = vi.mocked(GoogleGenAI);

function makeEnv(overrides: Partial<ServerEnv>): ServerEnv {
  return {
    STADIUM_AI_MOCK: false,
    GEMINI_API_KEY: "test-key",
    GEMINI_MODEL: "gemini-test",
    RATE_LIMIT_MAX: 20,
    RATE_LIMIT_WINDOW_MS: 60_000,
    ...overrides,
  } as ServerEnv;
}

function mockGenerateContent(result: unknown): ReturnType<typeof vi.fn> {
  const generateContent = vi.fn().mockResolvedValue(result);
  MockedGoogleGenAI.mockImplementation(
    () => ({ models: { generateContent } }) as unknown as GoogleGenAI,
  );
  return generateContent;
}

const validPayload = {
  venue: "Test Arena",
  zones: [{ name: "Zone A", capacity: 1000, occupancy: 5000 }],
  gates: [
    { name: "Gate 1", isOpen: true, throughputPerMin: 100, waitMinutes: 5 },
  ],
  incidents: [
    {
      severity: "high",
      message: "Congestion at Gate 1.",
      minutesAgo: 4,
      zoneName: "Zone A",
    },
  ],
};

beforeEach(() => {
  mockedEnv.mockReset();
  MockedGoogleGenAI.mockReset();
  logError.mockClear();
});

describe("buildSnapshotPrompt", () => {
  it("asks for JSON output for the tournament venue", () => {
    const prompt = buildSnapshotPrompt();
    expect(prompt).toContain("JSON");
    expect(prompt).toContain("zones");
    expect(prompt).toContain("incidents");
  });
});

describe("withTimeoutSignal", () => {
  it("returns a bare timeout signal when no caller signal is given", () => {
    const combined = withTimeoutSignal(undefined, 1_000);

    expect(combined.aborted).toBe(false);
  });

  it("returns an already-aborted caller signal as-is", () => {
    const controller = new AbortController();
    controller.abort();

    const combined = withTimeoutSignal(controller.signal, 1_000);

    expect(combined.aborted).toBe(true);
  });

  it("propagates a later caller abort to the combined signal", () => {
    const controller = new AbortController();
    const combined = withTimeoutSignal(controller.signal, 1_000);

    expect(combined.aborted).toBe(false);
    controller.abort(new Error("caller cancelled"));

    expect(combined.aborted).toBe(true);
  });

  it("propagates the timeout to the combined signal", async () => {
    vi.useFakeTimers();
    try {
      const controller = new AbortController();
      const combined = withTimeoutSignal(controller.signal, 1_000);

      await vi.advanceTimersByTimeAsync(1_001);

      expect(combined.aborted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("generateOperationsSnapshot", () => {
  it("uses the procedural fallback in mock mode", async () => {
    mockedEnv.mockReturnValue(makeEnv({ STADIUM_AI_MOCK: true }));

    const snapshot = await generateOperationsSnapshot();

    expect(snapshot.zones).toHaveLength(5);
    expect(MockedGoogleGenAI).not.toHaveBeenCalled();
  });

  it("uses the fallback when no key is configured", async () => {
    mockedEnv.mockReturnValue(
      makeEnv({ STADIUM_AI_MOCK: false, GEMINI_API_KEY: undefined }),
    );

    const snapshot = await generateOperationsSnapshot();

    expect(snapshot.zones).toHaveLength(5);
    expect(MockedGoogleGenAI).not.toHaveBeenCalled();
  });

  it("normalizes valid Gemini JSON, clamping occupancy to capacity", async () => {
    mockedEnv.mockReturnValue(makeEnv({}));
    const generateContent = mockGenerateContent({
      text: JSON.stringify(validPayload),
    });

    const snapshot = await generateOperationsSnapshot();

    expect(snapshot.venue).toBe("Test Arena");
    expect(snapshot.zones[0]).toMatchObject({
      id: "zone-1",
      capacity: 1000,
      occupancy: 1000, // clamped down from 5000
    });
    // Incident references the "Zone A" zone → resolved to its generated id.
    expect(snapshot.incidents[0]?.zoneId).toBe("zone-1");
    // The upstream call is always bounded by a timeout signal.
    expect(generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          abortSignal: expect.any(AbortSignal),
        }),
      }),
    );
    expect(logError).not.toHaveBeenCalled();
  });

  it("combines a caller signal with the timeout budget", async () => {
    mockedEnv.mockReturnValue(makeEnv({}));
    mockGenerateContent({ text: JSON.stringify(validPayload) });

    const controller = new AbortController();
    const snapshot = await generateOperationsSnapshot(controller.signal);

    expect(snapshot.venue).toBe("Test Arena");
  });

  it("slugs incident zone names that match no generated zone", async () => {
    mockedEnv.mockReturnValue(makeEnv({}));
    mockGenerateContent({
      text: JSON.stringify({
        ...validPayload,
        incidents: [
          {
            severity: "low",
            message: "Spill reported.",
            minutesAgo: 2,
            zoneName: "North Concourse",
          },
        ],
      }),
    });

    const snapshot = await generateOperationsSnapshot();

    expect(snapshot.incidents[0]?.zoneId).toBe("north-concourse");
  });

  it("falls back and logs when the model returns no text", async () => {
    mockedEnv.mockReturnValue(makeEnv({}));
    mockGenerateContent({ text: undefined });

    const snapshot = await generateOperationsSnapshot();

    expect(snapshot.zones).toHaveLength(5);
    expect(logError).toHaveBeenCalledWith("ops-snapshot", expect.any(Error));
  });

  it("falls back and logs when the JSON fails schema validation", async () => {
    mockedEnv.mockReturnValue(makeEnv({}));
    mockGenerateContent({ text: JSON.stringify({ venue: "x", zones: [] }) });

    const snapshot = await generateOperationsSnapshot();

    expect(snapshot.zones).toHaveLength(5);
    expect(logError).toHaveBeenCalledWith("ops-snapshot", expect.any(Error));
  });

  it("falls back and warns (not errors) when generation is aborted", async () => {
    mockedEnv.mockReturnValue(makeEnv({}));
    const generateContent = vi
      .fn()
      .mockRejectedValue(new DOMException("Aborted", "AbortError"));
    MockedGoogleGenAI.mockImplementation(
      () => ({ models: { generateContent } }) as unknown as GoogleGenAI,
    );

    const controller = new AbortController();
    controller.abort();
    const snapshot = await generateOperationsSnapshot(controller.signal);

    expect(snapshot.zones).toHaveLength(5);
    expect(logError).not.toHaveBeenCalled();
  });

  it("falls back and logs when the request rejects", async () => {
    mockedEnv.mockReturnValue(makeEnv({}));
    const generateContent = vi.fn().mockRejectedValue(new Error("network"));
    MockedGoogleGenAI.mockImplementation(
      () => ({ models: { generateContent } }) as unknown as GoogleGenAI,
    );

    const snapshot = await generateOperationsSnapshot();

    expect(snapshot.zones).toHaveLength(5);
    expect(logError).toHaveBeenCalledWith("ops-snapshot", expect.any(Error));
  });
});
