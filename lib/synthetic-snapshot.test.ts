import { describe, expect, it } from "vitest";
import { VENUE_CONTEXT } from "@/lib/constants";
import { synthesizeSnapshot } from "@/lib/synthetic-snapshot";

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
