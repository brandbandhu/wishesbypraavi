import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles } from "lucide-react";

import { CinematicFireworks } from "./cinematic-fireworks";

export function FireworksCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const replayRef = useRef<(() => void) | null>(null);
  const [controls, setControls] = useState<{ host: HTMLElement; reduced: boolean } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const show = new CinematicFireworks(canvas);
    if (!show.available) return;

    let inView = window.scrollY < 32;
    let autoplaying = false;
    const syncPlayback = () => {
      if (!motion.matches && !document.hidden && inView) {
        if (!autoplaying) show.play(true);
        autoplaying = true;
      } else {
        show.stop();
        autoplaying = false;
      }
    };
    setControls({ host: document.body, reduced: motion.matches });
    replayRef.current = () => {
      if (!motion.matches && !document.hidden) {
        show.play(inView);
        autoplaying = inView;
      }
    };
    const updateMotion = () => {
      setControls({ host: document.body, reduced: motion.matches });
      syncPlayback();
    };
    const observer = new ResizeObserver(() => show.resize());
    observer.observe(canvas);
    const updateScroll = () => {
      const atTop = window.scrollY < 32;
      if (atTop === inView) return;
      inView = atTop;
      syncPlayback();
    };
    window.addEventListener("scroll", updateScroll, { passive: true });
    motion.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", syncPlayback);
    syncPlayback();

    return () => {
      replayRef.current = null;
      observer.disconnect();
      window.removeEventListener("scroll", updateScroll);
      motion.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", syncPlayback);
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
