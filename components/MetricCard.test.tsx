import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { MetricCard } from "@/components/MetricCard";

describe("MetricCard", () => {
  it("renders label, value, and optional hint", () => {
    render(
      <dl>
        <MetricCard label="Open gates" value="5" hint="of 8" />
      </dl>,
    );

    expect(screen.getByText("Open gates")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("of 8")).toBeInTheDocument();
  });

  it("omits the hint when not provided", () => {
    render(
      <dl>
        <MetricCard label="Open gates" value="5" />
      </dl>,
    );

    expect(screen.queryByText("of 8")).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <dl>
        <MetricCard label="Open gates" value="5" hint="of 8" />
      </dl>,
    );

    expect(
      await axe(container, { rules: { region: { enabled: false } } }),
    ).toHaveNoViolations();
  });
});
