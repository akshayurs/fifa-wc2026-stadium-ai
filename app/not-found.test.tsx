import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import NotFound from "@/app/not-found";

describe("NotFound", () => {
  it("explains the 404 and links home", () => {
    render(<NotFound />);

    expect(
      screen.getByRole("heading", { name: /page not found/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /return to the command center/i }),
    ).toHaveAttribute("href", "/");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<NotFound />);

    expect(
      await axe(container, { rules: { region: { enabled: false } } }),
    ).toHaveNoViolations();
  });
});
