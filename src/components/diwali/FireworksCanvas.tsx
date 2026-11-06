import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles } from "lucide-react";

import { CinematicFireworks } from "./cinematic-fireworks";

const SESSION_KEY = "praavi:diwali-fireworks:played";
// Remember playback during navigation even when storage is unavailable.
let playedInMemory = false;

export function FireworksCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const replayRef = useRef<(() => void) | null>(null);
  const [controls, setControls] = useState<{ host: HTMLElement; reduced: boolean } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const show = new CinematicFireworks(canvas, () => {
      // Mark actual playback, rather than effect setup, to support Strict Mode.
      playedInMemory = true;
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // Storage restrictions must not break the greeting.
      }
    });
    if (!show.available) return;

    let played = playedInMemory;
    try {
      played ||= sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      // Use the in-memory fallback above.
    }
    setControls({ host: document.body, reduced: motion.matches });
    replayRef.current = () => {
      if (!motion.matches) show.play();
    };
    const updateMotion = () => {
      setControls({ host: document.body, reduced: motion.matches });
      if (motion.matches) show.stop();
    };
    const hide = () => {
      if (document.hidden) show.stop();
    };
    const observer = new ResizeObserver(() => show.resize());
    observer.observe(canvas);
    motion.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", hide);
    if (!motion.matches && !played && !document.hidden) show.play();

    return () => {
      replayRef.current = null;
      observer.disconnect();
      motion.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", hide);
      show.dispose();
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="fireworks-canvas" aria-hidden="true" />
      {controls &&
        createPortal(
          <button
            type="button"
            className="fireworks-replay"
            onClick={() => replayRef.current?.()}
            disabled={controls.reduced}
            aria-label={
              controls.reduced ? "Fireworks paused for reduced motion" : "Replay fireworks"
            }
            title={controls.reduced ? "Fireworks paused for reduced motion" : "Replay fireworks"}
          >
            <Sparkles size={19} strokeWidth={1.5} aria-hidden="true" />
          </button>,
          controls.host,
        )}
    </>
  );
}
