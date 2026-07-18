import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { OpsDashboard } from "@/components/OpsDashboard";
import { deriveMetrics, getStadiumSnapshot } from "@/lib/stadium-data";

const snapshot = getStadiumSnapshot(2026);
const metrics = deriveMetrics(snapshot);

describe("OpsDashboard", () => {
  it("renders the command center sections and live figures", () => {
    render(<OpsDashboard snapshot={snapshot} metrics={metrics} />);

    expect(
      screen.getByRole("heading", { name: /operations command center/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Overall occupancy")).toBeInTheDocument();
    expect(screen.getByText("Zone occupancy")).toBeInTheDocument();
    expect(screen.getByText("Gate throughput")).toBeInTheDocument();
    expect(screen.getByText("Gate A")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /ai operations briefing/i }),
    ).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <OpsDashboard snapshot={snapshot} metrics={metrics} />,
    );

    expect(
      await axe(container, { rules: { region: { enabled: false } } }),
    ).toHaveNoViolations();
  });
});
