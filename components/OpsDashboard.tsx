import { IncidentFeed } from "@/components/IncidentFeed";
import { MetricCard } from "@/components/MetricCard";
import { OpsBriefingPanel } from "@/components/OpsBriefingPanel";
import { StatusBadge } from "@/components/StatusBadge";
import { ZoneOccupancy } from "@/components/ZoneOccupancy";
import type { StadiumMetrics, StadiumSnapshot } from "@/lib/stadium-data";

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

/** Operations command center: live metrics, zones, gates, incidents, and AI briefing. */
export function OpsDashboard({
  snapshot,
  metrics,
}: {
  readonly snapshot: StadiumSnapshot;
  readonly metrics: StadiumMetrics;
}) {
  return (
    <section aria-labelledby="ops-heading" className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="ops-heading" className="text-2xl font-bold text-text">
          Operations Command Center
        </h2>
        <StatusBadge status={metrics.status} />
      </header>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Overall occupancy"
          value={`${metrics.occupancyPct}%`}
          hint={`${formatNumber(metrics.totalOccupancy)} of ${formatNumber(metrics.totalCapacity)} seats`}
        />
        <MetricCard
          label="Open gates"
          value={formatNumber(metrics.openGates)}
        />
        <MetricCard
          label="Active incidents"
          value={formatNumber(metrics.activeIncidents)}
        />
        <MetricCard
          label="Longest gate wait"
          value={`${metrics.longestWaitGate.waitMinutes} min`}
          hint={metrics.longestWaitGate.name}
        />
      </dl>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-3 text-lg font-semibold text-text">
            Zone occupancy
          </h3>
          <ZoneOccupancy zones={snapshot.zones} />
        </div>
        <div>
          <h3 className="mb-3 text-lg font-semibold text-text">
            Gate throughput
          </h3>
          <ul className="space-y-2">
            {snapshot.gates.map((gate) => (
              <li
                key={gate.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              >
                <span className="font-medium text-text">{gate.name}</span>
                <span className="text-muted">
                  {gate.waitMinutes} min wait · {gate.throughputPerMin}/min
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold text-text">Incident feed</h3>
        <IncidentFeed incidents={snapshot.incidents} />
      </div>

      <OpsBriefingPanel />
    </section>
  );
}
