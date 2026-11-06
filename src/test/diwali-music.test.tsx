import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DiwaliMusic } from "@/components/diwali/DiwaliMusic";

describe("Diwali background music", () => {
  let paused: boolean;
  let hidden: boolean;
  let play: ReturnType<typeof vi.spyOn>;
  let pause: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    const saved = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => saved.set(key, value),
      clear: () => saved.clear(),
    });
    paused = true;
    hidden = false;
    vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
    vi.spyOn(HTMLMediaElement.prototype, "paused", "get").mockImplementation(() => paused);
    play = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (
      this: HTMLMediaElement,
    ) {
      paused = false;
      this.dispatchEvent(new Event("play"));
      return Promise.resolve();
    });
    pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function (
      this: HTMLMediaElement,
    ) {
      paused = true;
      this.dispatchEvent(new Event("pause"));
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("attempts soft-volume looping autoplay and exposes a mute control", () => {
    const { container } = render(<DiwaliMusic />);
    const audio = container.querySelector("audio")!;
    expect(play).toHaveBeenCalledTimes(1);
    expect(audio.volume).toBe(0.24);
    expect(audio.loop).toBe(true);
    expect(screen.getByRole("button", { name: "Mute Diwali music" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("retries blocked autoplay on the first tap without a rejected promise", async () => {
    play.mockRejectedValueOnce(new DOMException("User gesture required", "NotAllowedError"));
    render(<DiwaliMusic />);
    expect(screen.getByRole("button", { name: "Play Diwali music" })).toBeInTheDocument();
    fireEvent.pointerDown(document.body);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Mute Diwali music" })).toBeInTheDocument(),
    );
    expect(play).toHaveBeenCalledTimes(2);
  });

  it("remembers mute, ignores later document clicks, and lets visitors unmute", () => {
    render(<DiwaliMusic />);
    fireEvent.click(screen.getByRole("button", { name: "Mute Diwali music" }));
    expect(localStorage.getItem("praavi:diwali-music:muted")).toBe("1");
    fireEvent.pointerDown(document.body);
    expect(play).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Play Diwali music" }));
    expect(play).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem("praavi:diwali-music:muted")).toBe("0");
  });

  it("honors a saved mute preference on the next visit", () => {
    localStorage.setItem("praavi:diwali-music:muted", "1");
    render(<DiwaliMusic />);
    fireEvent.pointerDown(document.body);
    expect(play).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Play Diwali music" }));
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("pauses in a hidden tab, resumes on return, and cleans up on unmount", () => {
    const { unmount } = render(<DiwaliMusic />);
    hidden = true;
    fireEvent(document, new Event("visibilitychange"));
    expect(pause).toHaveBeenCalledTimes(1);
    hidden = false;
    fireEvent(document, new Event("visibilitychange"));
    expect(play).toHaveBeenCalledTimes(2);
    unmount();
    expect(pause).toHaveBeenCalledTimes(2);
    fireEvent.pointerDown(document.body);
    fireEvent(document, new Event("visibilitychange"));
    expect(play).toHaveBeenCalledTimes(2);
  });
});
