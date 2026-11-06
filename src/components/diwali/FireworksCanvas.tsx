import { useEffect, useRef } from "react";

import { CinematicFireworks } from "./cinematic-fireworks";

export function FireworksCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    const observer = new ResizeObserver(() => show.resize());
    observer.observe(canvas);
    const updateScroll = () => {
      const atTop = window.scrollY < 32;
      if (atTop === inView) return;
      inView = atTop;
      syncPlayback();
    };
    window.addEventListener("scroll", updateScroll, { passive: true });
    motion.addEventListener("change", syncPlayback);
    document.addEventListener("visibilitychange", syncPlayback);
    syncPlayback();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateScroll);
      motion.removeEventListener("change", syncPlayback);
      document.removeEventListener("visibilitychange", syncPlayback);
      show.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="fireworks-canvas" aria-hidden="true" />;
}
