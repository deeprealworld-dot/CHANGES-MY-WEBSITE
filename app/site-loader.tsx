"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// PROTOTYPES: four loading-screen concepts, shown only when the URL has ?loader=1 .. ?loader=4.
// Without that parameter nothing renders, so this is safe to ship while the choice is open.

type Variant = 1 | 2 | 3 | 4;

const VARIANTS: Record<Variant, { name: string; runMs: number; exitMs: number }> = {
  1: { name: "Grid Boot", runMs: 1500, exitMs: 700 },
  2: { name: "The Brief", runMs: 2500, exitMs: 60 },
  3: { name: "Stamp", runMs: 1500, exitMs: 500 },
  4: { name: "Marquee Curtain", runMs: 1400, exitMs: 650 },
};
// A real loader exits when the page is ready; this caps the wait if fonts are slow.
const MAX_WAIT_MS = 2500;

const readVariant = (): Variant | null => {
  const value = Number(new URLSearchParams(window.location.search).get("loader"));
  return value >= 1 && value <= 4 ? (value as Variant) : null;
};
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const noSubscribe = () => () => {};

export function SiteLoader() {
  const variant = useSyncExternalStore(noSubscribe, readVariant, () => null);
  const reduced = useSyncExternalStore(noSubscribe, prefersReducedMotion, () => false);
  const [phase, setPhase] = useState<"run" | "exit" | "done">("run");

  useEffect(() => {
    if (!variant) return;
    const root = document.documentElement;
    if (reduced) {
      root.removeAttribute("data-loader");
      return;
    }

    const { runMs, exitMs } = VARIANTS[variant];
    root.setAttribute("data-loader-live", "");
    root.style.overflow = "hidden";

    let minElapsed = false;
    let fontsReady = false;
    let ending = false;
    const timers: number[] = [];

    const cleanup = () => {
      root.removeAttribute("data-loader");
      root.removeAttribute("data-loader-live");
      root.style.overflow = "";
    };
    const end = () => {
      if (ending) return;
      ending = true;
      setPhase("exit");
      timers.push(
        window.setTimeout(() => {
          cleanup();
          setPhase("done");
        }, exitMs),
      );
    };
    const check = () => {
      if (minElapsed && fontsReady) end();
    };

    timers.push(window.setTimeout(() => ((minElapsed = true), check()), runMs));
    timers.push(window.setTimeout(end, MAX_WAIT_MS));
    document.fonts.ready.then(() => ((fontsReady = true), check()));

    // Any tap or key press skips the loader.
    window.addEventListener("pointerdown", end);
    window.addEventListener("keydown", end);
    return () => {
      timers.forEach(window.clearTimeout);
      window.removeEventListener("pointerdown", end);
      window.removeEventListener("keydown", end);
      cleanup();
    };
  }, [variant, reduced]);

  if (!variant) return null;

  return (
    <>
      {phase !== "done" && !reduced && (
        <div aria-hidden="true" className={`ld ld-${variant} ${phase === "exit" ? "is-exit" : ""}`}>
          {variant === 1 && <GridBoot runMs={VARIANTS[1].runMs} />}
          {variant === 2 && <TheBrief />}
          {variant === 3 && <Stamp />}
          {variant === 4 && <MarqueeCurtain />}
        </div>
      )}
      <nav aria-label="Loader prototypes" className={`ld-switcher ${phase === "run" ? "" : "show"}`}>
        <span>Loader {variant}: {VARIANTS[variant].name}</span>
        {([1, 2, 3, 4] as const).map((n) => (
          <a aria-current={n === variant ? "true" : undefined} href={`?loader=${n}`} key={n}>{n}</a>
        ))}
        <a href="?">Off</a>
      </nav>
    </>
  );
}

/* 1. Grid Boot: the hero grid draws itself, a diagonal wave of squares lights up, a counter runs to 100. */
function GridBoot({ runMs }: { runMs: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const CELL = 40;
    const COLORS = ["37,99,235", "20,184,166", "37,99,235"];
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const cols = Math.ceil(canvas.width / CELL);
    const rows = Math.ceil(canvas.height / CELL);
    const span = cols + rows;
    const started = performance.now();
    let frame = 0;

    const draw = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - started) / runMs));
      const front = (1 - (1 - t) ** 2) * (span + 8); // wave front, in diagonal cells
      context.clearRect(0, 0, canvas.width, canvas.height);
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const age = front - (col + row);
          if (age < 0) continue;
          const alpha = Math.max(0.4, 0.75 * (1 - age / 9));
          context.fillStyle = `rgba(${COLORS[(col * 7 + row * 13) % 3]},${alpha})`;
          context.fillRect(col * CELL + 1, row * CELL + 1, CELL - 1, CELL - 1);
        }
      }
      if (counterRef.current) counterRef.current.textContent = String(Math.round(100 * (1 - (1 - t) ** 3))).padStart(2, "0");
      if (t < 1) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [runMs]);

  return (
    <>
      <div className="ld-grid" />
      <canvas className="ld-canvas" ref={canvasRef} />
      <span className="ld-tl">DEEPWEBSTUDIOS<i>.</i></span>
      <span className="ld-tr">Loading</span>
      <span className="ld-counter" ref={counterRef}>00</span>
    </>
  );
}

/* 2. The Brief: words cut in on a beat while square rings pulse out through the grid; TRUST. lands,
   then the grid dissolves outward from the centre in a coloured wave to reveal the page. */
const BEATS = [0, 0.34, 0.68, 1.02]; // seconds: BRIEF. BUILD. LAUNCH. TRUST.
const PULSE_S = 0.6;
const REVEAL_AT = 1.75;
const REVEAL_S = 0.8;

function TheBrief() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const root = canvas?.closest(".ld");
    if (!canvas || !context || !root) return;
    const CELL = 40;
    const COLORS = ["37,99,235", "20,184,166"];
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const cols = Math.ceil(canvas.width / CELL);
    const rows = Math.ceil(canvas.height / CELL);
    const cx = (cols - 1) / 2;
    const cy = (rows - 1) / 2;
    const maxDist = Math.max(cx, cy) + 1;
    // Square (Chebyshev) distance from the centre cell, so rings are squares that follow the grid.
    const distance = (col: number, row: number) => Math.max(Math.abs(col - cx), Math.abs(row - cy));
    const started = performance.now();
    let frame = 0;
    let revealing = false;

    const draw = (now: number) => {
      const T = Math.max(0, (now - started) / 1000);
      context.clearRect(0, 0, canvas.width, canvas.height);

      if (T < REVEAL_AT) {
        BEATS.forEach((beat, index) => {
          const age = (T - beat) / PULSE_S;
          if (age < 0 || age > 1) return;
          const radius = 1.5 + age * maxDist;
          for (let row = 0; row < rows; row += 1) {
            for (let col = 0; col < cols; col += 1) {
              const off = Math.abs(distance(col, row) - radius);
              if (off > 1.3) continue;
              const alpha = 0.6 * (1 - age) ** 1.5 * (1 - off / 1.3);
              context.fillStyle = `rgba(${COLORS[(index + col + row) % 2]},${alpha})`;
              context.fillRect(col * CELL + 1, row * CELL + 1, CELL - 1, CELL - 1);
            }
          }
        });
      } else {
        if (!revealing) {
          // From here the canvas paints the navy itself, so cells can fade away one ring at a time.
          revealing = true;
          root.classList.add("is-reveal");
        }
        const elapsed = T - REVEAL_AT;
        for (let row = 0; row < rows; row += 1) {
          for (let col = 0; col < cols; col += 1) {
            const d = distance(col, row);
            const progress = Math.min(1, Math.max(0, (elapsed - (d / maxDist) * REVEAL_S * 0.6) / (REVEAL_S * 0.4)));
            if (progress >= 1) continue;
            context.fillStyle = `rgba(10,15,28,${1 - progress})`;
            context.fillRect(col * CELL, row * CELL, CELL, CELL);
            if (progress > 0) {
              context.fillStyle = `rgba(${COLORS[(col + row) % 2]},${0.55 * Math.sin(Math.PI * progress)})`;
              context.fillRect(col * CELL + 1, row * CELL + 1, CELL - 1, CELL - 1);
            }
          }
        }
        if (elapsed > REVEAL_S + 0.05) return;
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      <div className="ld-grid ld-grid-soft" />
      <canvas className="ld-canvas" ref={canvasRef} />
      <div className="ld-brief">
        {["Brief.", "Build.", "Launch."].map((word, index) => (
          <span className="ld-word" key={word} style={{ animationDelay: `${index * 0.34}s` }}>
            <small>0{index + 1} / 03</small>
            <b>{word}</b>
          </span>
        ))}
        <span className="ld-trust"><b>Trust.</b></span>
      </div>
    </>
  );
}

/* 3. Stamp: a blue block with a hard shadow drops in, ten grid squares fill, the block grows into the page. */
function Stamp() {
  return (
    <div className="ld-stamp">
      <div className="ld-block"><b>DW<i>.</i></b></div>
      <div className="ld-cells">
        {Array.from({ length: 10 }, (_, index) => (
          <span key={index} style={{ animationDelay: `${0.5 + index * 0.06}s` }} />
        ))}
      </div>
      <p>Deepwebstudios</p>
    </div>
  );
}

/* 4. Marquee Curtain: the industry ticker goes full screen, rows scrolling in opposite directions. */
const ROWS = [
  ["Restaurants", "Clinics", "Gyms"],
  ["Salons", "Coaching classes", "Consultants"],
  ["Cafes", "Studios", "Boutiques"],
  ["Clinics", "Gyms", "Restaurants"],
  ["Consultants", "Salons", "Coaching classes"],
];

function MarqueeCurtain() {
  return (
    <>
      <div className="ld-rows">
        {ROWS.map((words, row) => (
          <div className="ld-row" data-style={row % 3} key={row} style={{ animationDuration: `${1.5 + row * 0.25}s`, animationDirection: row % 2 ? "reverse" : "normal" }}>
            {[0, 1].map((copy) => (
              <span key={copy}>
                {[...words, ...words].map((word, index) => (
                  <em key={index}>{word}<i>✦</i></em>
                ))}
              </span>
            ))}
          </div>
        ))}
      </div>
      <span className="ld-badge">DeepWebStudios<i>.</i></span>
    </>
  );
}
