import { VENUE_CONTEXT } from "@/lib/constants";
import {
  clamp,
  entityId,
  severityFromScore,
  type Gate,
  type Incident,
  type StadiumSnapshot,
  type Zone,
} from "@/lib/stadium-data";

/**
 * Procedural, dataset-free snapshot generator.
 *
 * Used as a deterministic fallback whenever the AI source is unavailable —
 * offline, in tests, or on a transient provider error. Every value is computed
 * at call time from a seed; nothing is stored.
 */

const ZONE_COUNT = 5;
const GATE_COUNT = 6;
const MAX_INCIDENTS = 4;

const ZONE_BASE_CAPACITY = 12_000;
const ZONE_CAPACITY_SPREAD = 12_000;
const ZONE_BASE_FILL = 0.55;
const ZONE_FILL_SPREAD = 0.45;
const ZONE_FILL_BIAS = 0.4;

const GATE_BASE_THROUGHPUT = 60;
const GATE_THROUGHPUT_SPREAD = 90;
const GATE_MAX_WAIT_MINUTES = 14;

const INCIDENT_MAX_AGE_MINUTES = 30;

/** Deterministic pseudo-random generator (mulberry32). */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generates a well-formed, bounded snapshot from a numeric seed. */
export function synthesizeSnapshot(seed: number): StadiumSnapshot {
  const random = createRandom(seed);

  const zones: Zone[] = Array.from({ length: ZONE_COUNT }, (_, index) => {
    const capacity =
      ZONE_BASE_CAPACITY + Math.round(random() * ZONE_CAPACITY_SPREAD);
    const fill = clamp(
      ZONE_BASE_FILL + (random() - ZONE_FILL_BIAS) * ZONE_FILL_SPREAD,
      0,
      1,
    );
    return {
      id: entityId("zone", index),
      name: `Seating Zone ${index + 1}`,
      capacity,
      occupancy: Math.round(capacity * fill),
    };
  });

  const gates: Gate[] = Array.from({ length: GATE_COUNT }, (_, index) => ({
    id: entityId("gate", index),
    name: `Gate ${index + 1}`,
    isOpen: true,
    throughputPerMin:
      GATE_BASE_THROUGHPUT + Math.round(random() * GATE_THROUGHPUT_SPREAD),
    waitMinutes: Math.round(random() * GATE_MAX_WAIT_MINUTES),
  }));

  const incidentCount = Math.floor(random() * MAX_INCIDENTS);
  const incidents: Incident[] = Array.from(
    { length: incidentCount },
    (_, index) => {
      const zoneNumber = 1 + Math.floor(random() * zones.length);
      const severity = severityFromScore(random());
      return {
        id: entityId("incident", index),
        zoneId: `zone-${zoneNumber}`,
        severity,
        message: `Reported ${severity}-severity activity in Seating Zone ${zoneNumber}.`,
        minutesAgo: 1 + Math.floor(random() * INCIDENT_MAX_AGE_MINUTES),
      };
    },
  );

  return { venue: VENUE_CONTEXT, generatedAt: seed, zones, gates, incidents };
}
