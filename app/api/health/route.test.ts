import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";
import { APP_NAME } from "@/lib/constants";

describe("GET /api/health", () => {
  it("reports service liveness with non-sensitive metadata", async () => {
    const response = GET();

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      status: string;
      app: string;
      time: string;
    };
    expect(payload.status).toBe("ok");
    expect(payload.app).toBe(APP_NAME);
    expect(Number.isNaN(Date.parse(payload.time))).toBe(false);
  });
});
