import { zoneOccupancyPct, type Zone } from "@/lib/stadium-data";

/** Per-zone occupancy shown as accessible native progress meters. */
export function ZoneOccupancy({ zones }: { readonly zones: readonly Zone[] }) {
  return (
    <ul className="space-y-3">
      {zones.map((zone) => {
        const pct = zoneOccupancyPct(zone);
        return (
          <li key={zone.id}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-text">{zone.name}</span>
              <span className="text-muted">{pct}% full</span>
            </div>
            <progress
              className="meter"
              max={100}
              value={pct}
              aria-label={`${zone.name} occupancy`}
            >
              {pct}%
            </progress>
          </li>
        );
      })}
    </ul>
  );
}
