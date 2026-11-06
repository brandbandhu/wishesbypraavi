import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import musicUrl from "@/assets/deepavali-festival-of-lights.mp3";

const MUTE_KEY = "praavi:diwali-music:muted";

export function DiwaliMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const mutedByUser = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let disposed = false;
    let hasPlayed = false;
    audio.volume = 0.24;
    try {
      mutedByUser.current = localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      /* Storage is optional. */
    }

    const tryPlay = () => {
      if (disposed || document.hidden || mutedByUser.current) return;
      void audio.play().catch(() => {
        // Autoplay may need a real user gesture; the speaker control stays ready.
      });
    };
    const unlock = (event: Event) => {
      if (event instanceof KeyboardEvent && !["Enter", " "].includes(event.key)) return;
      if (event.target instanceof Element && event.target.closest(".diwali-music-control")) return;
      tryPlay();
    };
    const removeUnlock = () => {
      hasPlayed = true;
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
    const visibility = () => {
      if (document.hidden) audio.pause();
      else if (hasPlayed) tryPlay();
    };
    document.addEventListener("pointerdown", unlock, { passive: true });
    document.addEventListener("keydown", unlock);
    document.addEventListener("visibilitychange", visibility);
    audio.addEventListener("play", removeUnlock);
    tryPlay();

    return () => {
      disposed = true;
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
      document.removeEventListener("visibilitychange", visibility);
      audio.removeEventListener("play", removeUnlock);
      audio.pause();
    };
  }, []);

  function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    mutedByUser.current = !audio.paused;
    try {
      localStorage.setItem(MUTE_KEY, mutedByUser.current ? "1" : "0");
    } catch {
      /* Storage is optional. */
    }
    if (mutedByUser.current) audio.pause();
    else void audio.play().catch(() => setPlaying(false));
  }

  const label = unavailable
    ? "Diwali music unavailable"
    : playing
      ? "Mute Diwali music"
      : "Play Diwali music";
  return (
    <>
      <audio
        ref={audioRef}
        src={musicUrl}
        loop
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => {
          setPlaying(false);
          setUnavailable(true);
        }}
      />
      <button
        type="button"
        className="diwali-music-control"
        onClick={toggleMusic}
        aria-label={label}
        aria-pressed={playing}
        title={`${label} — Deepavali (Festival Of Lights)`}
        disabled={unavailable}
      >
        {playing ? (
          <Volume2 size={17} aria-hidden="true" />
        ) : (
          <VolumeX size={17} aria-hidden="true" />
        )}
        <span>{playing ? "Music on" : "Music off"}</span>
      </button>
    </>
  );
}
