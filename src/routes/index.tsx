import { useEffect, useRef, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight, Download, RotateCcw, Sparkles } from "lucide-react";
import praaviLogoUrl from "@/assets/praavi-logo.png";

import { Button } from "@/components/ui/button";
import { FireworksCanvas } from "@/components/diwali/FireworksCanvas";
import { createGreetingFilename, renderGreetingCard, sanitizeGreetingName } from "@/lib/diwali-greeting";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Happy Diwali from Praavi Consultants" },
      {
        name: "description",
        content: "A little light, just for you. Celebrate Diwali with Praavi Consultants and create a personalized festive greeting to share.",
      },
      { property: "og:title", content: "Happy Diwali from Praavi Consultants" },
      {
        property: "og:description",
        content: "May your world shine brighter. Make a personal Diwali greeting with warm wishes from Team Praavi Consultants.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DiwaliExperience,
});

function DiwaliExperience() {
  const [draft, setDraft] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [cardReady, setCardReady] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sparkleBurst, setSparkleBurst] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!name || !cardRef.current) return;

    let active = true;
    setCardReady(false);
    void renderGreetingCard(cardRef.current, name).then(() => {
      if (active) setCardReady(true);
    });

    return () => {
      active = false;
    };
  }, [name]);

  function createGreeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = sanitizeGreetingName(draft);

    if (!cleanName) {
      setError("Please enter your name to create your greeting.");
      return;
    }

    setError("");
    setName(cleanName);
    setSparkleBurst(true);
    window.setTimeout(() => setSparkleBurst(false), 1200);
  }

  async function downloadGreeting() {
    const canvas = cardRef.current;
    if (!canvas || !name || !cardReady || downloading) return;

    setDownloading(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      const href = blob ? URL.createObjectURL(blob) : canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = href;
      link.download = createGreetingFilename(name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      if (blob) window.setTimeout(() => URL.revokeObjectURL(href), 1000);
    } finally {
      setDownloading(false);
    }
  }

  function createAnotherGreeting() {
    setName("");
    setCardReady(false);
    setDraft("");
    setError("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section aria-labelledby="welcome-title" className="welcome-scene relative isolate flex min-h-[min(880px,100svh)] min-h-screen flex-col items-center justify-center px-6 py-20 text-center">
        <FireworksCanvas />
        <div aria-hidden="true" className="welcome-halo" />

        <div className="welcome-content relative z-10 flex w-full max-w-3xl flex-col items-center">
          <div className="brand-wordmark welcome-reveal welcome-reveal-1" aria-label="Praavi Consultants">
            <img src={praaviLogoUrl} alt="Praavi Consultants" width={150} height={60} className="brand-logo" />
          </div>

          <p className="welcome-eyebrow welcome-reveal welcome-reveal-2 mt-12">
            A celebration of light &amp; new beginnings
          </p>
          <p className="welcome-prelude welcome-reveal welcome-reveal-3 mt-5">May your world shine brighter</p>
          <h1 id="welcome-title" className="welcome-title welcome-reveal welcome-reveal-4 mt-1">
            Happy Diwali
          </h1>
          <p className="welcome-message welcome-reveal welcome-reveal-5 mt-6 max-w-xl">
            May every light bring new opportunities, every celebration create beautiful memories, and every new beginning lead to greater success.
          </p>

          <div className="welcome-signoff welcome-reveal welcome-reveal-6 mt-8">
            <span>With love &amp; warm wishes</span>
            <strong>TEAM PRAAVI</strong>
          </div>

          <img
            className="welcome-diya"
            src="/src/assets/praavi-diya.png"
            alt="A glowing, ornate golden diya"
            width={1024}
            height={1024}
            fetchPriority="high"
          />

          <a className="welcome-scroll welcome-reveal welcome-reveal-6 mt-10" href="#make-a-greeting">
            <span>Create your personalized greeting</span>
            <ArrowDown aria-hidden="true" size={15} strokeWidth={1.5} />
          </a>
        </div>

      </section>

      <section id="make-a-greeting" aria-labelledby="create-title" className="greeting-section relative px-5 py-24 sm:px-8 sm:py-32">
        <div className="section-ornament section-ornament-top" aria-hidden="true" />
        <div className="mx-auto w-full max-w-6xl">
          <div className="greeting-intro mx-auto max-w-2xl text-center">
            <span className="section-kicker">A WISH TO CALL YOUR OWN</span>
            <h2 id="create-title" className="section-title mt-5">A little light, just for you.</h2>
            <p className="section-description mx-auto mt-5 max-w-xl">
              Make this celebration more personal. Create a beautiful Diwali greeting with your name and carry the festive wishes with you.
            </p>
          </div>

          <div className={`greeting-workspace mx-auto mt-12 ${name ? "has-greeting" : ""}`}>
            <form className="name-form mx-auto" onSubmit={createGreeting} noValidate>
              <label htmlFor="client-name" className="form-label">Enter your name</label>
              <div className="form-control-row mt-3">
                <input
                  ref={inputRef}
                  id="client-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  maxLength={120}
                  placeholder="e.g. Rahul Sharma"
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    if (error) setError("");
                  }}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "name-error" : undefined}
                  className="name-input min-w-0 flex-1"
                />
                <Button type="submit" className="create-button h-14 shrink-0 px-6 sm:px-7">
                  Create my greeting
                  <Sparkles aria-hidden="true" size={16} strokeWidth={1.7} />
                </Button>
              </div>
              {error && <p className="form-error mt-3" id="name-error" role="alert">{error}</p>}
            </form>

            {name && (
              <div className={`preview-area mt-14 ${cardReady ? "preview-ready" : "preview-loading"}`} aria-live="polite">
                <div className="preview-heading mb-5 flex items-end justify-between gap-4">
                  <div>
                    <span className="section-kicker">MADE JUST FOR YOU</span>
                    <h3 className="preview-title mt-2">Your Diwali greeting</h3>
                  </div>
                  <span className="preview-dimensions hidden sm:block">1080 × 1350 px</span>
                </div>

                <div className={`greeting-card-frame ${sparkleBurst ? "sparkle-burst" : ""}`}>
                  <canvas
                    ref={cardRef}
                    className="greeting-card-canvas"
                    width={1080}
                    height={1350}
                    aria-label={`A personalized Diwali greeting for ${name}, from Team Praavi Consultants`}
                    role="img"
                  />
                  {!cardReady && <div className="card-loading" aria-hidden="true" />}
                </div>

                <div className="preview-actions mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button type="button" onClick={downloadGreeting} disabled={!cardReady || downloading} className="download-button h-12 px-6">
                    <Download aria-hidden="true" size={17} strokeWidth={1.8} />
                    {downloading ? "Preparing your card…" : "Download my greeting"}
                  </Button>
                  <Button type="button" variant="outline" onClick={createAnotherGreeting} className="another-button h-12 px-5">
                    <RotateCcw aria-hidden="true" size={15} strokeWidth={1.8} />
                    Create another
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="greeting-footer flex flex-col items-center gap-3 px-6 py-9 text-center">
        <span className="footer-wordmark">PRAAVI <span>CONSULTANTS</span></span>
        <span className="footer-note">Digital Marketing · Web Development · Creative Solutions</span>
        <a className="footer-home-link" href="#welcome-title" aria-label="Back to the Diwali greeting">
          Back to the light <ArrowUpRight aria-hidden="true" size={12} />
        </a>
      </footer>
    </main>
  );
}
