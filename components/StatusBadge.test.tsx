import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "@/components/StatusBadge";
import type { OperationalStatus } from "@/lib/stadium-data";

const cases: ReadonlyArray<[OperationalStatus, string]> = [
  ["normal", "Status: Normal"],
  ["elevated", "Status: Elevated"],
  ["critical", "Status: Critical"],
];

describe("StatusBadge", () => {
  it.each(cases)("renders the %s status label", (status, label) => {
    render(<StatusBadge status={status} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<StatusBadge status="elevated" />);

    expect(
      await axe(container, { rules: { region: { enabled: false } } }),
    ).toHaveNoViolations();
  });
});
