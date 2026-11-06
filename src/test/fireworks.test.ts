import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CinematicFireworks } from "@/components/diwali/cinematic-fireworks";

describe("cinematic fireworks lifecycle", () => {
  let frames: Map<number, FrameRequestCallback>;
  let nextId: number;
  let canvas: HTMLCanvasElement;
  let drawn: number;
  let clear: ReturnType<typeof vi.fn>;

  const tick = (time: number) => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(time));
  };

  beforeEach(() => {
    frames = new Map();
    nextId = 0;
    drawn = 0;
    clear = vi.fn();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.set(++nextId, callback);
      return nextId;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
    const noop = () => {};
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      setTransform: noop,
      clearRect: clear,
      fillRect: noop,
      createRadialGradient: () => ({ addColorStop: noop }),
      beginPath: noop,
      moveTo: noop,
      lineTo: noop,
      stroke: noop,
      drawImage: () => {
        drawn++;
      },
    } as unknown as CanvasRenderingContext2D);
    canvas = document.createElement("canvas");
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      width: 1440,
      height: 900,
    } as DOMRect);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("launches, renders the finale and becomes fully idle after eight seconds", () => {
    const started = vi.fn();
    const show = new CinematicFireworks(canvas, started);
    show.play();
    expect(started).not.toHaveBeenCalled();
    for (let time = 0; time <= 8000; time += 16) tick(time);
    expect(started).toHaveBeenCalledTimes(1);
    expect(drawn).toBeGreaterThan(1000);
    expect(frames.size).toBe(0);
    expect(clear).toHaveBeenLastCalledWith(0, 0, 1440, 900);
    show.dispose();
  });

  it("restarts one animation loop on rapid replay and cancels it on disposal", () => {
    const started = vi.fn();
    const show = new CinematicFireworks(canvas, started);
    show.play();
    tick(0);
    tick(1000);
    show.play();
    show.play();
    show.play();
    expect(frames.size).toBe(1);
    tick(2000);
    expect(started).toHaveBeenCalledTimes(2);
    show.dispose();
    expect(frames.size).toBe(0);
    show.play();
    expect(frames.size).toBe(0);
  });

  it("caps mobile DPR and scales the active show when the viewport changes", () => {
    vi.stubGlobal("devicePixelRatio", 3);
    vi.mocked(canvas.getBoundingClientRect).mockReturnValue({ width: 390, height: 844 } as DOMRect);
    const show = new CinematicFireworks(canvas, () => {});
    expect([canvas.width, canvas.height]).toEqual([585, 1266]);
    show.play();
    tick(0);
    for (let time = 16; time < 1500; time += 16) tick(time);
    vi.mocked(canvas.getBoundingClientRect).mockReturnValue({ width: 844, height: 390 } as DOMRect);
    show.resize();
    tick(1510);
    expect(frames.size).toBe(1);
    show.dispose();
  });

  it("leaves the page usable when Canvas 2D is unavailable", () => {
    vi.mocked(canvas.getContext).mockReturnValue(null);
    const show = new CinematicFireworks(canvas, () => {});
    show.play();
    expect(show.available).toBe(false);
    expect(frames.size).toBe(0);
    show.dispose();
  });
});
