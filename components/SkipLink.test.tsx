import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { SkipLink } from "@/components/SkipLink";

describe("SkipLink", () => {
  it("links to the main content region", () => {
    render(<SkipLink />);

    const link = screen.getByRole("link", { name: /skip to main content/i });
    expect(link).toHaveAttribute("href", "#main-content");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<SkipLink />);

    expect(
      await axe(container, { rules: { region: { enabled: false } } }),
    ).toHaveNoViolations();
  });
});
