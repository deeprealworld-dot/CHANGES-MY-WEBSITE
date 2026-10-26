"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// Intro loader, played once per browser visit.
//
// The inline script in layout.tsx decides whether this visit gets the intro (first visit in this
// browser session, no reduced-motion preference). It marks <html data-loader> before the first paint
// so a navy cover hides the page until this component mounts; if the loader cannot start, a CSS
// animation releases the cover after a few seconds so visitors are never stuck behind it.

const WORDS = ["Brief.", "Build.", "Launch.", "Trust."];
const BEAT_S = 0.62;
const FIRST_S = 0.3;
const wordAt = (index: number) => FIRST_S + index * BEAT_S; // 0.3, 0.92, 1.54, 2.16
const RULE_AFTER_S = 0.4; // the blue rule starts sweeping once TRUST. has settled
const RING_S = 2.2; // each hairline ring takes this long to cross the screen
const LIFT_AT_S = 3.35; // after the rule has landed and held for a beat
const LIFT_S = 1.1; // keep in sync with the transition on .ld.is-lift
// Unmount only after the curtain has fully lifted off the screen.
const RUN_MS = Math.round((LIFT_AT_S + LIFT_S) * 1000) + 150;
const EXIT_MS = 40; // natural end: the curtain is already off screen
const SKIP_EXIT_MS = 380; // skipped: fade out instead of cutting
// If fonts are very slow, do not wait for them forever.
const MAX_WAIT_MS = 6000;

// Whether this visit gets the intro. Read once, before the effect below removes the attribute.
let showIntro: boolean | null = null;
const readShowIntro = () => (showIntro ??= document.documentElement.hasAttribute("data-loader"));
const noSubscribe = () => () => {};

export function SiteLoader() {
  const show = useSyncExternalStore(noSubscribe, readShowIntro, () => false);
  const [phase, setPhase] = useState<"run" | "exit" | "done">("run");
  const [skipped, setSkipped] = useState(false);
  const [lifting, setLifting] = useState(false);

  useEffect(() => {
    if (!show) return;
    const root = document.documentElement;
    root.setAttribute("data-loader-live", "");

    // Block scrolling without touching overflow: hiding the scrollbar would resize the page when it returns.
    const blockScroll = (event: Event) => event.preventDefault();
    window.addEventListener("wheel", blockScroll, { passive: false });
    window.addEventListener("touchmove", blockScroll, { passive: false });

    let minElapsed = false;
    let fontsReady = false;
    let ending = false;
    const timers: number[] = [];

    const cleanup = () => {
      root.removeAttribute("data-loader");
      root.removeAttribute("data-loader-live");
      window.removeEventListener("wheel", blockScroll);
      window.removeEventListener("touchmove", blockScroll);
    };
    const end = (wasSkipped: boolean) => {
      if (ending) return;
      ending = true;
      setSkipped(wasSkipped);
      setPhase("exit");
      timers.push(
        window.setTimeout(() => {
          cleanup();
          setPhase("done");
        }, wasSkipped ? SKIP_EXIT_MS : EXIT_MS),
      );
    };
    const check = () => {
      if (minElapsed && fontsReady) end(false);
    };
    const skip = () => end(true);

    timers.push(window.setTimeout(() => setLifting(true), LIFT_AT_S * 1000));
    timers.push(window.setTimeout(() => ((minElapsed = true), check()), RUN_MS));
    timers.push(window.setTimeout(() => end(false), MAX_WAIT_MS));
    document.fonts.ready.then(() => ((fontsReady = true), check()));

    // Any tap or key press skips the intro.
    window.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", skip);
    return () => {
      timers.forEach(window.clearTimeout);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
      cleanup();
    };
  }, [show]);

  if (!show || phase === "done") return null;

  return (
    <div aria-hidden="true" className={`ld ${lifting ? "is-lift" : ""} ${phase === "exit" ? "is-exit" : ""} ${skipped ? "is-skip" : ""}`}>
      <Intro />
    </div>
  );
}

/* Restrained and slow: a hairline grid with small "+" marks, words that rise out of an invisible line,
   one hairline ring per beat, a thin blue rule under TRUST., then the whole screen lifts like a curtain. */
function Intro() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const CELL = 40;
    const width = (canvas.width = document.documentElement.clientWidth);
    const height = (canvas.height = window.innerHeight);
    const cx = width / 2;
    const cy = height / 2;
    const reach = Math.hypot(cx, cy);
    const started = performance.now();
    let frame = 0;

    const smooth = (x: number) => x * x * (3 - 2 * x);
    const drawMarks = (T: number) => {
      // A small "+" on every fourth grid intersection, fading in outward from the centre.
      for (let gx = 0; gx < width; gx += CELL * 4) {
        for (let gy = 0; gy < height; gy += CELL * 4) {
          const delay = 0.2 + (Math.hypot(gx - cx, gy - cy) / reach) * 0.9;
          const alpha = 0.3 * smooth(Math.min(1, Math.max(0, (T - delay) / 0.5)));
          if (alpha <= 0) continue;
          context.fillStyle = `rgba(255,255,255,${alpha})`;
          context.fillRect(gx - 4, gy, 9, 1);
          context.fillRect(gx, gy - 4, 1, 9);
        }
      }
    };

    const draw = (now: number) => {
      const T = Math.max(0, (now - started) / 1000);
      context.clearRect(0, 0, width, height);
      drawMarks(T);
      // One barely-there hairline ring per beat, expanding slowly.
      WORDS.forEach((_, index) => {
        const age = (T - wordAt(index)) / RING_S;
        if (age < 0 || age > 1) return;
        const eased = 1 - (1 - age) ** 4;
        context.beginPath();
        context.arc(cx, cy, 24 + eased * reach * 0.95, 0, Math.PI * 2);
        context.lineWidth = 1;
        context.strokeStyle = `rgba(${index % 2 ? "20,184,166" : "255,255,255"},${0.26 * (1 - age) ** 1.5})`;
        context.stroke();
      });
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      <div className="ld-grid" />
      <canvas className="ld-canvas" ref={canvasRef} />
      <div className="ld-qe">
        <div className="ld-qe-block">
          <div className="ld-qe-index">
            {WORDS.slice(0, 3).map((_, index) => (
              <span key={index} style={{ animationDelay: `${wordAt(index) + 0.1}s` }}>0{index + 1} / 03</span>
            ))}
          </div>
          <div className="ld-qe-line">
            {WORDS.map((word, index) => (
              <span
                className={`ld-qe-word ${index === 3 ? "is-trust" : ""}`}
                key={word}
                style={{ animationDelay: `${wordAt(index)}s`, ["--rule-delay" as string]: `${wordAt(index) + RULE_AFTER_S}s` }}
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>
      <span className="ld-qe-brand">DeepWebStudios<i>.</i></span>
      <div className="ld-qe-progress" style={{ ["--progress-s" as string]: `${LIFT_AT_S}s` }} />
    </>
  );
}
