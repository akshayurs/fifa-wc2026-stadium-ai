import { describe, expect, it } from "vitest";
import {
  assistantRequestSchema,
  opsBriefingRequestSchema,
  parseBody,
} from "@/lib/validation";

describe("parseBody with assistantRequestSchema", () => {
  it("accepts a valid message and trims it", () => {
    const result = parseBody(assistantRequestSchema, {
      message: "  Where is Gate C?  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toBe("Where is Gate C?");
    }
  });

  it("accepts an optional well-formed locale", () => {
    const result = parseBody(assistantRequestSchema, {
      message: "Hola",
      locale: "es-MX",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty message", () => {
    const result = parseBody(assistantRequestSchema, { message: " " });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toMatch(/too short/i);
    }
  });

  it("rejects an over-long message", () => {
    const result = parseBody(assistantRequestSchema, {
      message: "x".repeat(1001),
    });

    expect(result.success).toBe(false);
  });

  it("rejects a malformed locale", () => {
    const result = parseBody(assistantRequestSchema, {
      message: "hello",
      locale: "not-a-locale",
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown fields", () => {
    const result = parseBody(assistantRequestSchema, {
      message: "hello",
      admin: true,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a non-object body", () => {
    const result = parseBody(assistantRequestSchema, "not json");

    expect(result.success).toBe(false);
  });
});

describe("parseBody with opsBriefingRequestSchema", () => {
  it("accepts an empty body", () => {
    const result = parseBody(opsBriefingRequestSchema, {});

    expect(result.success).toBe(true);
  });

  it("accepts a valid focus zone id", () => {
    const result = parseBody(opsBriefingRequestSchema, {
      focusZoneId: "north",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid focus zone id", () => {
    const result = parseBody(opsBriefingRequestSchema, {
      focusZoneId: "North Stand!",
    });

    expect(result.success).toBe(false);
  });
});
