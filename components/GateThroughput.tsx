import type { Gate } from "@/lib/stadium-data";

/** Per-gate wait time and throughput. */
export function GateThroughput({ gates }: { readonly gates: readonly Gate[] }) {
  return (
    <ul className="space-y-2">
      {gates.map((gate) => (
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
  );
}
