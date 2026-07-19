import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { GateThroughput } from "@/components/GateThroughput";
import type { Gate } from "@/lib/stadium-data";

const gates: readonly Gate[] = [
  {
    id: "a",
    name: "Gate A",
    isOpen: true,
    throughputPerMin: 120,
    waitMinutes: 4,
  },
  {
    id: "b",
    name: "Gate B",
    isOpen: true,
    throughputPerMin: 90,
    waitMinutes: 8,
  },
];

describe("GateThroughput", () => {
  it("renders each gate's wait and throughput", () => {
    render(<GateThroughput gates={gates} />);

    expect(screen.getByText("Gate A")).toBeInTheDocument();
    expect(screen.getByText("4 min wait · 120/min")).toBeInTheDocument();
    expect(screen.getByText("8 min wait · 90/min")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<GateThroughput gates={gates} />);

    expect(
      await axe(container, { rules: { region: { enabled: false } } }),
    ).toHaveNoViolations();
  });
});
