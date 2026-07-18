import { VENUE_NAME } from "@/lib/constants";

/**
 * Simulated real-time stadium operations data.
 *
 * A live deployment would source these figures from turnstile counters, queue
 * sensors, and an incident-management system. Here they are generated
 * deterministically from a numeric seed so the UI feels live while tests and
 * the AI briefing remain fully reproducible.
 */

/** A seating zone and its live occupancy. */
export interface Zone {
  readonly id: string;
  readonly name: string;
  readonly capacity: number;
  readonly occupancy: number;
}

/** An entry gate and its live throughput. */
export interface Gate {
  readonly id: string;
  readonly name: string;
  readonly isOpen: boolean;
  readonly throughputPerMin: number;
  readonly waitMinutes: number;
}

/** Severity of an operational incident. */
export type IncidentSeverity = "low" | "medium" | "high";

/** A single operational incident. */
export interface Incident {
  readonly id: string;
  readonly zoneId: string;
  readonly severity: IncidentSeverity;
  readonly message: string;
  readonly minutesAgo: number;
}

/** A full point-in-time view of stadium operations. */
export interface StadiumSnapshot {
  readonly venue: string;
  readonly generatedAt: number;
  readonly zones: readonly Zone[];
  readonly gates: readonly Gate[];
  readonly incidents: readonly Incident[];
}

/** Overall operational posture derived from a snapshot. */
export type OperationalStatus = "normal" | "elevated" | "critical";

/** Aggregate metrics derived from a {@link StadiumSnapshot}. */
export interface StadiumMetrics {
  readonly totalCapacity: number;
  readonly totalOccupancy: number;
  readonly occupancyPct: number;
  readonly openGates: number;
  readonly activeIncidents: number;
  readonly busiestZone: Zone;
  readonly longestWaitGate: Gate;
  readonly status: OperationalStatus;
}

interface ZoneSeed {
  readonly id: string;
  readonly name: string;
  readonly capacity: number;
  readonly baseFill: number;
}

interface GateSeed {
  readonly id: string;
  readonly name: string;
  readonly baseThroughput: number;
  readonly baseWait: number;
}

const ZONE_SEEDS: readonly ZoneSeed[] = [
  { id: "north", name: "North Stand", capacity: 22000, baseFill: 0.82 },
  { id: "south", name: "South Stand", capacity: 22000, baseFill: 0.78 },
  { id: "east", name: "East Stand", capacity: 18000, baseFill: 0.7 },
  { id: "west", name: "West Stand", capacity: 20000, baseFill: 0.75 },
  {
    id: "hospitality",
    name: "Hospitality Suites",
    capacity: 4000,
    baseFill: 0.6,
  },
];

const GATE_SEEDS: readonly GateSeed[] = [
  { id: "gate-a", name: "Gate A", baseThroughput: 120, baseWait: 4 },
  { id: "gate-b", name: "Gate B", baseThroughput: 110, baseWait: 6 },
  { id: "gate-c", name: "Gate C", baseThroughput: 95, baseWait: 9 },
  { id: "gate-d", name: "Gate D", baseThroughput: 130, baseWait: 3 },
  { id: "gate-e", name: "Gate E", baseThroughput: 80, baseWait: 12 },
];

interface IncidentSeed {
  readonly zoneId: string;
  readonly severity: IncidentSeverity;
  readonly message: string;
}

const INCIDENT_SEEDS: readonly IncidentSeed[] = [
  {
    zoneId: "east",
    severity: "medium",
    message: "Concourse congestion near section 118.",
  },
  {
    zoneId: "north",
    severity: "low",
    message: "Lost-and-found request logged at guest services.",
  },
  {
    zoneId: "west",
    severity: "high",
    message: "Medical assistance requested; response team dispatched.",
  },
  {
    zoneId: "south",
    severity: "low",
    message: "Spill reported on stairwell S3; cleaning en route.",
  },
];

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

/** Clamps `value` to the inclusive `[min, max]` range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Returns the element of `items` with the highest `score`. */
export function maxBy<T>(items: readonly T[], score: (item: T) => number): T {
  return items.reduce((best, item) =>
    score(item) > score(best) ? item : best,
  );
}

/** Occupancy of a zone as a whole-number percentage. */
export function zoneOccupancyPct(zone: Zone): number {
  return Math.round((zone.occupancy / zone.capacity) * 100);
}

/**
 * Classifies overall operational posture from occupancy and incident load.
 * Critical conditions escalate ahead of merely elevated ones.
 */
export function classifyStatus(
  occupancyPct: number,
  activeIncidents: number,
): OperationalStatus {
  if (occupancyPct >= 90 || activeIncidents >= 3) {
    return "critical";
  }
  if (occupancyPct >= 78 || activeIncidents >= 1) {
    return "elevated";
  }
  return "normal";
}

/** Builds a deterministic, reproducible operations snapshot from `seed`. */
export function getStadiumSnapshot(seed: number): StadiumSnapshot {
  const random = createRandom(seed);

  const zones: Zone[] = ZONE_SEEDS.map((zone) => {
    const fill = clamp(zone.baseFill + (random() - 0.4) * 0.25, 0, 1);
    return {
      id: zone.id,
      name: zone.name,
      capacity: zone.capacity,
      occupancy: Math.round(zone.capacity * fill),
    };
  });

  const gates: Gate[] = GATE_SEEDS.map((gate) => {
    const waitJitter = Math.round((random() - 0.5) * 6);
    const throughputJitter = Math.round((random() - 0.5) * 30);
    return {
      id: gate.id,
      name: gate.name,
      isOpen: true,
      throughputPerMin: Math.max(0, gate.baseThroughput + throughputJitter),
      waitMinutes: Math.max(0, gate.baseWait + waitJitter),
    };
  });

  const incidentCount = Math.floor(random() * (INCIDENT_SEEDS.length + 1));
  const incidents: Incident[] = INCIDENT_SEEDS.slice(0, incidentCount).map(
    (incident, index) => ({
      id: `incident-${index + 1}`,
      zoneId: incident.zoneId,
      severity: incident.severity,
      message: incident.message,
      minutesAgo: 1 + Math.floor(random() * 30),
    }),
  );

  return { venue: VENUE_NAME, generatedAt: seed, zones, gates, incidents };
}

/** Returns a snapshot seeded by the current time (request-time freshness). */
export function getCurrentStadiumSnapshot(): StadiumSnapshot {
  return getStadiumSnapshot(Date.now());
}

/** Derives aggregate metrics from a snapshot. */
export function deriveMetrics(snapshot: StadiumSnapshot): StadiumMetrics {
  const totalCapacity = snapshot.zones.reduce(
    (sum, zone) => sum + zone.capacity,
    0,
  );
  const totalOccupancy = snapshot.zones.reduce(
    (sum, zone) => sum + zone.occupancy,
    0,
  );
  const occupancyPct = Math.round((totalOccupancy / totalCapacity) * 100);
  const openGates = snapshot.gates.filter((gate) => gate.isOpen).length;
  const activeIncidents = snapshot.incidents.length;

  return {
    totalCapacity,
    totalOccupancy,
    occupancyPct,
    openGates,
    activeIncidents,
    busiestZone: maxBy(snapshot.zones, zoneOccupancyPct),
    longestWaitGate: maxBy(snapshot.gates, (gate) => gate.waitMinutes),
    status: classifyStatus(occupancyPct, activeIncidents),
  };
}

/**
 * Renders a compact, model-friendly summary of live operations for grounding
 * the AI briefing. Kept deterministic and free of PII.
 */
export function summarizeForPrompt(
  snapshot: StadiumSnapshot,
  metrics: StadiumMetrics,
): string {
  const zoneLines = snapshot.zones
    .map((zone) => `- ${zone.name}: ${zoneOccupancyPct(zone)}% full`)
    .join("\n");
  const gateLines = snapshot.gates
    .map(
      (gate) =>
        `- ${gate.name}: ${gate.waitMinutes} min wait, ${gate.throughputPerMin}/min throughput`,
    )
    .join("\n");
  const incidentLines =
    snapshot.incidents.length === 0
      ? "- None active."
      : snapshot.incidents
          .map(
            (incident) =>
              `- [${incident.severity}] ${incident.message} (${incident.minutesAgo} min ago)`,
          )
          .join("\n");

  return [
    `Venue: ${snapshot.venue}`,
    `Overall occupancy: ${metrics.occupancyPct}% (${metrics.totalOccupancy} of ${metrics.totalCapacity}).`,
    `Operational status: ${metrics.status}.`,
    `Busiest zone: ${metrics.busiestZone.name}.`,
    `Longest gate wait: ${metrics.longestWaitGate.name} at ${metrics.longestWaitGate.waitMinutes} min.`,
    "",
    "Zones:",
    zoneLines,
    "",
    "Gates:",
    gateLines,
    "",
    "Active incidents:",
    incidentLines,
  ].join("\n");
}
