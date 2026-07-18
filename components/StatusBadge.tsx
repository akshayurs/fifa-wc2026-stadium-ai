import type { OperationalStatus } from "@/lib/stadium-data";

const STATUS_META: Record<
  OperationalStatus,
  { readonly label: string; readonly className: string }
> = {
  normal: { label: "Normal", className: "bg-ok/15 text-ok" },
  elevated: { label: "Elevated", className: "bg-warn/15 text-warn" },
  critical: { label: "Critical", className: "bg-crit/15 text-crit" },
};

/** Coloured, text-labelled badge for the overall operational status. */
export function StatusBadge({
  status,
}: {
  readonly status: OperationalStatus;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${meta.className}`}
    >
      <span aria-hidden="true" className="h-2 w-2 rounded-full bg-current" />
      <span>Status: {meta.label}</span>
    </span>
  );
}
