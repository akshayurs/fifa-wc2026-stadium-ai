import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OpsBriefingPanel } from "@/components/OpsBriefingPanel";
import {
  useTextStream,
  type TextStreamState,
} from "@/components/useTextStream";

vi.mock("@/components/useTextStream", () => ({ useTextStream: vi.fn() }));
const mockedHook = vi.mocked(useTextStream);

function stub(overrides: Partial<TextStreamState>): TextStreamState {
  return {
    text: "",
    isLoading: false,
    error: null,
    run: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

beforeEach(() => {
  mockedHook.mockReset();
});

describe("OpsBriefingPanel", () => {
  it("requests a briefing when the button is clicked", async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    mockedHook.mockReturnValue(stub({ run }));

    render(<OpsBriefingPanel />);
    await userEvent.click(
      screen.getByRole("button", { name: /generate briefing/i }),
    );

    expect(run).toHaveBeenCalledWith({});
  });

  it("shows a busy label while loading", () => {
    mockedHook.mockReturnValue(stub({ isLoading: true }));

    render(<OpsBriefingPanel />);

    const button = screen.getByRole("button", { name: /generating/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("renders streamed briefing text", () => {
    mockedHook.mockReturnValue(stub({ text: "Zone C nearing capacity." }));

    render(<OpsBriefingPanel />);

    expect(screen.getByText("Zone C nearing capacity.")).toBeInTheDocument();
  });

  it("announces errors via an alert", () => {
    mockedHook.mockReturnValue(stub({ error: "Unable to generate." }));

    render(<OpsBriefingPanel />);

    expect(screen.getByRole("alert")).toHaveTextContent("Unable to generate.");
  });

  it("has no accessibility violations", async () => {
    mockedHook.mockReturnValue(stub({}));

    const { container } = render(<OpsBriefingPanel />);

    expect(
      await axe(container, { rules: { region: { enabled: false } } }),
    ).toHaveNoViolations();
  });
});
