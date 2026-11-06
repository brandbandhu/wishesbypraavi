import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import { renderGreetingCard } from "@/lib/diwali-greeting";

vi.mock("@/components/diwali/FireworksCanvas", () => ({ FireworksCanvas: () => null }));
vi.mock("@/components/diwali/DiwaliMusic", () => ({ DiwaliMusic: () => null }));
vi.mock("@/lib/diwali-greeting", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/diwali-greeting")>()),
  renderGreetingCard: vi.fn().mockResolvedValue(undefined),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("standalone React greeting", () => {
  it("renders the greeting and validates an empty name without a router or server", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Happy Diwali", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Praavi Consultants" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Create my greeting" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Please enter your name");
    expect(renderGreetingCard).not.toHaveBeenCalled();
  });

  it("renders a personalized Canvas and enables its PNG download", async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Enter your name"), {
      target: { value: "  Asha Joshi  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create my greeting" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Download my greeting" })).toBeEnabled(),
    );
    const card = screen.getByRole("img", { name: /A personalized Diwali greeting for Asha Joshi/ });
    expect(card).toHaveAttribute("width", "1080");
    expect(card).toHaveAttribute("height", "1350");
    expect(renderGreetingCard).toHaveBeenCalledWith(card, "Asha Joshi");
  });
});
