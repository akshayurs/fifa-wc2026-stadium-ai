import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { ZoneOccupancy } from "@/components/ZoneOccupancy";
import type { Zone } from "@/lib/stadium-data";

const zones: readonly Zone[] = [
  { id: "north", name: "North Stand", capacity: 200, occupancy: 100 },
  { id: "south", name: "South Stand", capacity: 100, occupancy: 90 },
];

describe("ZoneOccupancy", () => {
  it("renders an accessible meter per zone with its percentage", () => {
    render(<ZoneOccupancy zones={zones} />);

    const north = screen.getByRole("progressbar", {
      name: "North Stand occupancy",
    });
    expect(north).toHaveAttribute("value", "50");
    expect(screen.getByText("90% full")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ZoneOccupancy zones={zones} />);

    expect(
      await axe(container, { rules: { region: { enabled: false } } }),
    ).toHaveNoViolations();
  });
});
