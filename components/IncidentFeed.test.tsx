import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { IncidentFeed } from "@/components/IncidentFeed";
import type { Incident } from "@/lib/stadium-data";

const incidents: readonly Incident[] = [
  {
    id: "i1",
    zoneId: "west",
    severity: "high",
    message: "Medical response dispatched.",
    minutesAgo: 3,
  },
];

describe("IncidentFeed", () => {
  it("shows an all-clear message when empty", () => {
    render(<IncidentFeed incidents={[]} />);

    expect(screen.getByText(/no active incidents/i)).toBeInTheDocument();
  });

  it("renders each incident with severity and age", () => {
    render(<IncidentFeed incidents={incidents} />);

    expect(screen.getByText("high")).toBeInTheDocument();
    expect(
      screen.getByText(/Medical response dispatched\./),
    ).toBeInTheDocument();
    expect(screen.getByText("3 min ago")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<IncidentFeed incidents={incidents} />);

    expect(
      await axe(container, { rules: { region: { enabled: false } } }),
    ).toHaveNoViolations();
  });
});
