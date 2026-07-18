import { describe, expect, it, vi } from "vitest";
import { logError, logWarning } from "@/lib/logger";

describe("logError", () => {
  it("logs an Error's message as structured JSON", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    logError("assistant", new Error("boom"), { status: 500 });

    expect(spy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(spy.mock.calls[0]?.[0] as string);
    expect(payload).toMatchObject({
      level: "error",
      scope: "assistant",
      message: "boom",
      status: 500,
    });
  });

  it("stringifies non-Error values safely", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    logError("assistant", "plain failure");

    const payload = JSON.parse(spy.mock.calls[0]?.[0] as string);
    expect(payload.message).toBe("plain failure");
  });
});

describe("logWarning", () => {
  it("logs a warning as structured JSON", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    logWarning("ratelimit", "throttled", { client: "203.0.113.9" });

    const payload = JSON.parse(spy.mock.calls[0]?.[0] as string);
    expect(payload).toMatchObject({
      level: "warn",
      scope: "ratelimit",
      message: "throttled",
      client: "203.0.113.9",
    });
  });
});
