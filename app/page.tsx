import { AssistantPanel } from "@/components/AssistantPanel";
import { OpsDashboard } from "@/components/OpsDashboard";
import { APP_NAME, TOURNAMENT, VENUE_NAME } from "@/lib/constants";
import { deriveMetrics, getCurrentStadiumSnapshot } from "@/lib/stadium-data";

// Rendered per request so the operations snapshot reflects "now" and the
// per-request CSP nonce can be applied during server rendering.
export const dynamic = "force-dynamic";

export default function HomePage() {
  const snapshot = getCurrentStadiumSnapshot();
  const metrics = deriveMetrics(snapshot);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-8">
      <section aria-labelledby="page-heading">
        <h1
          id="page-heading"
          className="text-3xl font-bold text-text sm:text-4xl"
        >
          {APP_NAME}
        </h1>
        <p className="mt-3 max-w-3xl text-muted">
          A GenAI-powered solution that optimizes stadium operations and
          enhances the {TOURNAMENT} experience through intelligent, real-time
          assistance. Live figures below are simulated for {VENUE_NAME}.
        </p>
      </section>

      <section id="operations" aria-label="Stadium operations">
        <OpsDashboard snapshot={snapshot} metrics={metrics} />
      </section>

      <section id="assistant" aria-label="Fan assistant">
        <AssistantPanel />
      </section>
    </div>
  );
}
