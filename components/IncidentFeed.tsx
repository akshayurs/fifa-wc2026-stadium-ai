import type { Incident, IncidentSeverity } from "@/lib/stadium-data";

const SEVERITY_CLASS: Record<IncidentSeverity, string> = {
  low: "text-ok",
  medium: "text-warn",
  high: "text-crit",
};

/** Live incident feed with an explicit all-clear empty state. */
export function IncidentFeed({
  incidents,
}: {
  readonly incidents: readonly Incident[];
}) {
  if (incidents.length === 0) {
    return (
      <p className="text-sm text-muted">
        No active incidents. All areas reporting clear.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {incidents.map((incident) => (
        <li
          key={incident.id}
          className="rounded-lg border border-border bg-surface p-3 text-sm"
        >
          <span
            className={`font-semibold uppercase ${SEVERITY_CLASS[incident.severity]}`}
          >
            {incident.severity}
          </span>
          <span className="text-text"> — {incident.message}</span>
          <span className="mt-1 block text-xs text-muted">
            {incident.minutesAgo} min ago
          </span>
        </li>
      ))}
    </ul>
  );
}
