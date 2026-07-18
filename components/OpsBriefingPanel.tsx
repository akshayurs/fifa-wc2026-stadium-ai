"use client";

import { useTextStream } from "@/components/useTextStream";

/** Client panel that requests and streams the Gemini operations briefing. */
export function OpsBriefingPanel() {
  const { text, isLoading, error, run } = useTextStream(
    "/api/ops-briefing",
    "Unable to generate a briefing right now. Please try again.",
  );

  return (
    <section
      aria-labelledby="briefing-heading"
      className="rounded-xl border border-border bg-surface-2 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="briefing-heading" className="text-lg font-semibold text-text">
          AI Operations Briefing
        </h3>
        <button
          type="button"
          onClick={() => void run({})}
          disabled={isLoading}
          aria-busy={isLoading}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-60"
        >
          {isLoading ? "Generating…" : "Generate briefing"}
        </button>
      </div>

      <p className="mt-2 text-sm text-muted">
        Gemini synthesizes live occupancy, gate waits, and incidents into
        prioritized recommendations.
      </p>

      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-crit">
          {error}
        </p>
      ) : null}

      <div
        aria-live="polite"
        aria-atomic="false"
        className="mt-3 min-h-6 whitespace-pre-wrap text-sm leading-relaxed text-text"
      >
        {text}
      </div>
    </section>
  );
}
