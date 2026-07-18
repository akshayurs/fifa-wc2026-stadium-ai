import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssistantPanel } from "@/components/AssistantPanel";
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

describe("AssistantPanel", () => {
  it("submits a trimmed question", async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    mockedHook.mockReturnValue(stub({ run }));

    render(<AssistantPanel />);
    await userEvent.type(
      screen.getByLabelText(/your question/i),
      "  Where is Gate C?  ",
    );
    await userEvent.click(screen.getByRole("button", { name: "Ask" }));

    expect(run).toHaveBeenCalledWith({ message: "Where is Gate C?" });
  });

  it("does not submit an empty question", () => {
    const run = vi.fn().mockResolvedValue(undefined);
    mockedHook.mockReturnValue(stub({ run }));

    render(<AssistantPanel />);
    const textbox = screen.getByLabelText(/your question/i);
    fireEvent.submit(textbox.closest("form") as HTMLFormElement);

    expect(run).not.toHaveBeenCalled();
  });

  it("disables the control and shows a busy label while thinking", async () => {
    mockedHook.mockReturnValue(stub({ isLoading: true }));

    render(<AssistantPanel />);
    await userEvent.type(screen.getByLabelText(/your question/i), "Hello");

    expect(screen.getByRole("button", { name: /thinking/i })).toBeDisabled();
  });

  it("announces errors via an alert", () => {
    mockedHook.mockReturnValue(stub({ error: "Assistant unavailable." }));

    render(<AssistantPanel />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Assistant unavailable.",
    );
  });

  it("renders the streamed answer", () => {
    mockedHook.mockReturnValue(stub({ text: "Head to Gate C." }));

    render(<AssistantPanel />);

    expect(screen.getByText("Head to Gate C.")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    mockedHook.mockReturnValue(stub({}));

    const { container } = render(<AssistantPanel />);

    expect(
      await axe(container, { rules: { region: { enabled: false } } }),
    ).toHaveNoViolations();
  });
});
