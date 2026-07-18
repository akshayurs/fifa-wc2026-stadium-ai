import { describe, expect, it } from "vitest";
import { VENUE_CONTEXT } from "@/lib/constants";
import {
  classifyStatus,
  clamp,
  deriveMetrics,
  maxBy,
  severityFromScore,
  summarizeForPrompt,
  synthesizeSnapshot,
  zoneOccupancyPct,
  type StadiumSnapshot,
} from "@/lib/stadium-data";

describe("clamp", () => {
  it("returns the value within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps below the minimum", () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it("clamps above the maximum", () => {
    expect(clamp(42, 0, 10)).toBe(10);
  });
});

describe("maxBy", () => {
  it("returns the element with the greatest score across both branches", () => {
    const items = [{ v: 1 }, { v: 3 }, { v: 2 }];

    expect(maxBy(items, (item) => item.v)).toEqual({ v: 3 });
  });
});

describe("zoneOccupancyPct", () => {
  it("computes a whole-number percentage", () => {
    expect(
      zoneOccupancyPct({ id: "z", name: "Z", capacity: 200, occupancy: 50 }),
    ).toBe(25);
  });
});

describe("classifyStatus", () => {
  it("is critical at very high occupancy", () => {
    expect(classifyStatus(90, 0)).toBe("critical");
  });

  it("is critical with three or more incidents", () => {
    expect(classifyStatus(10, 3)).toBe("critical");
  });

  it("is elevated at high occupancy", () => {
    expect(classifyStatus(78, 0)).toBe("elevated");
  });

  it("is elevated with at least one incident", () => {
    expect(classifyStatus(10, 1)).toBe("elevated");
  });

  it("is normal otherwise", () => {
    expect(classifyStatus(50, 0)).toBe("normal");
  });
});

describe("severityFromScore", () => {
  it("maps scores to severity bands", () => {
    expect(severityFromScore(0.95)).toBe("high");
    expect(severityFromScore(0.7)).toBe("medium");
    expect(severityFromScore(0.2)).toBe("low");
  });
});

describe("synthesizeSnapshot", () => {
  it("is deterministic for a given seed", () => {
    expect(synthesizeSnapshot(12_345)).toEqual(synthesizeSnapshot(12_345));
  });

  it("computes a well-formed, bounded snapshot with no stored dataset", () => {
    const snapshot = synthesizeSnapshot(2026);

    expect(snapshot.venue).toBe(VENUE_CONTEXT);
    expect(snapshot.generatedAt).toBe(2026);
    expect(snapshot.zones).toHaveLength(5);
    expect(snapshot.gates).toHaveLength(6);
    expect(snapshot.incidents.length).toBeLessThanOrEqual(4);

    for (const zone of snapshot.zones) {
      expect(zone.occupancy).toBeGreaterThanOrEqual(0);
      expect(zone.occupancy).toBeLessThanOrEqual(zone.capacity);
    }
    for (const gate of snapshot.gates) {
      expect(gate.waitMinutes).toBeGreaterThanOrEqual(0);
      expect(gate.throughputPerMin).toBeGreaterThanOrEqual(0);
    }
  });

  it("produces incidents referencing generated zones", () => {
    // Seed chosen to yield at least one incident.
    const withIncidents = Array.from({ length: 50 }, (_, i) =>
      synthesizeSnapshot(i + 1),
    ).find((snapshot) => snapshot.incidents.length > 0);

    expect(withIncidents).toBeDefined();
    for (const incident of withIncidents?.incidents ?? []) {
      expect(incident.zoneId).toMatch(/^zone-\d+$/);
      expect(["low", "medium", "high"]).toContain(incident.severity);
    }
  });
});

describe("deriveMetrics", () => {
  it("aggregates capacity, occupancy, and status", () => {
    const snapshot = synthesizeSnapshot(2026);
    const metrics = deriveMetrics(snapshot);

    expect(metrics.totalCapacity).toBe(
      snapshot.zones.reduce((sum, zone) => sum + zone.capacity, 0),
    );
    expect(metrics.openGates).toBe(snapshot.gates.length);
    expect(metrics.activeIncidents).toBe(snapshot.incidents.length);
    expect(metrics.occupancyPct).toBe(
      Math.round((metrics.totalOccupancy / metrics.totalCapacity) * 100),
    );
    expect(["normal", "elevated", "critical"]).toContain(metrics.status);
    expect(snapshot.zones).toContainEqual(metrics.busiestZone);
    expect(snapshot.gates).toContainEqual(metrics.longestWaitGate);
  });
});

describe("summarizeForPrompt", () => {
  const base: StadiumSnapshot = {
    venue: "Test Venue",
    generatedAt: 0,
    zones: [{ id: "z", name: "Zone Z", capacity: 100, occupancy: 50 }],
    gates: [
      {
        id: "g",
        name: "Gate G",
        isOpen: true,
        throughputPerMin: 100,
        waitMinutes: 5,
      },
    ],
    incidents: [],
  };

  it("renders 'None active' when there are no incidents", () => {
    const summary = summarizeForPrompt(base, deriveMetrics(base));

    expect(summary).toContain("Test Venue");
    expect(summary).toContain("None active.");
  });

  it("renders each active incident", () => {
    const snapshot: StadiumSnapshot = {
      ...base,
      incidents: [
        {
          id: "i1",
          zoneId: "z",
          severity: "high",
          message: "Medical response dispatched.",
          minutesAgo: 3,
        },
      ],
    };

    const summary = summarizeForPrompt(snapshot, deriveMetrics(snapshot));

    expect(summary).toContain("[high] Medical response dispatched.");
    expect(summary).toContain("3 min ago");
  });
});
