"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// PROTOTYPES: four loading-screen concepts, shown only when the URL has ?loader=1 .. ?loader=4.
// Without that parameter nothing renders, so this is safe to ship while the choice is open.

type Variant = 1 | 2 | 3 | 4 | 5;

// The Brief timeline, in seconds.
const BEAT_S = 0.5; // one beat per word: BRIEF. BUILD. LAUNCH. TRUST.
const BEATS = [0, BEAT_S, BEAT_S * 2, BEAT_S * 3];
const PULSE_S = 0.95; // how long each ripple takes to cross the screen
const REVEAL_AT = BEAT_S * 3 + 0.75; // TRUST. lands, holds, then the reveal starts
const REVEAL_S = 1.3;
// Unmount only after the reveal has fully finished, so nothing is cut short.
const BRIEF_RUN_MS = Math.round((REVEAL_AT + REVEAL_S) * 1000) + 250;

// Quiet Editorial timeline, in seconds.
const QE_WORDS = ["Brief.", "Build.", "Launch.", "Trust."];
const QE_BEAT_S = 0.62;
const QE_FIRST_S = 0.3;
const QE_AT = (index: number) => QE_FIRST_S + index * QE_BEAT_S; // 0.3, 0.92, 1.54, 2.16
const QE_RULE_AFTER_S = 0.4; // the blue rule starts sweeping once TRUST. has settled
const QE_RING_S = 2.2; // each hairline ring takes this long to cross the screen
const QE_REVEAL_AT = 3.35; // after the rule has landed and held for a beat
const QE_REVEAL_S = 1.0;
const QE_RUN_MS = Math.round((QE_REVEAL_AT + QE_REVEAL_S) * 1000) + 250;

const VARIANTS: Record<Variant, { name: string; runMs: number; exitMs: number }> = {
  1: { name: "Grid Boot", runMs: 1500, exitMs: 700 },
  2: { name: "The Brief", runMs: BRIEF_RUN_MS, exitMs: 40 },
  3: { name: "Stamp", runMs: 1500, exitMs: 500 },
  4: { name: "Marquee Curtain", runMs: 1400, exitMs: 650 },
  5: { name: "Quiet Editorial", runMs: QE_RUN_MS, exitMs: 40 },
};
// A real loader exits when the page is ready; this caps the wait if fonts are slow.
const MAX_WAIT_MS = 6000;

const readVariant = (): Variant | null => {
  const value = Number(new URLSearchParams(window.location.search).get("loader"));
  return value >= 1 && value <= 5 ? (value as Variant) : null;
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
          {variant === 5 && <QuietEditorial />}
        </div>
      )}
      <nav aria-label="Loader prototypes" className={`ld-switcher ${phase === "run" ? "" : "show"}`}>
        <span>Loader {variant}: {VARIANTS[variant].name}</span>
        {([1, 2, 3, 4, 5] as const).map((n) => (
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
    canvas.width = document.documentElement.clientWidth;
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

/* 2. The Brief: words cut in on a beat while circular ripples pulse out through the grid; TRUST. lands,
   then a circle opens from the centre, edged in blue and teal, and reveals the page. */
const ripple = (context: CanvasRenderingContext2D, x: number, y: number, radius: number, thickness: number, color: string, alpha: number, width: number, height: number) => {
  const gradient = context.createRadialGradient(x, y, Math.max(0, radius - thickness), x, y, radius + thickness);
  gradient.addColorStop(0, `rgba(${color},0)`);
  gradient.addColorStop(0.55, `rgba(${color},${alpha})`);
  gradient.addColorStop(1, `rgba(${color},0)`);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
};

function TheBrief() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const root = canvas?.closest(".ld");
    if (!canvas || !context || !root) return;
    const CELL = 40;
    const BLUE = "37,99,235";
    const TEAL = "20,184,166";
    const width = (canvas.width = document.documentElement.clientWidth);
    const height = (canvas.height = window.innerHeight);
    const cx = width / 2;
    const cy = height / 2;
    const reach = Math.hypot(cx, cy); // centre to corner
    const started = performance.now();
    let frame = 0;
    let revealing = false;

    const drawGrid = (alpha: number) => {
      // Same lines as the CSS grid behind the words, so swapping between them is invisible.
      context.fillStyle = `rgba(${TEAL},${alpha})`;
      for (let x = 0; x < width; x += CELL) context.fillRect(x, 0, 1, height);
      for (let y = 0; y < height; y += CELL) context.fillRect(0, y, width, 1);
    };

    const draw = (now: number) => {
      const T = Math.max(0, (now - started) / 1000);
      context.clearRect(0, 0, width, height);

      if (T < REVEAL_AT) {
        BEATS.forEach((beat, index) => {
          const age = (T - beat) / PULSE_S;
          if (age < 0 || age > 1) return;
          const eased = 1 - (1 - age) ** 2; // fast out, slow settle
          const alpha = 0.55 * (1 - age) ** 1.3;
          ripple(context, cx, cy, 40 + eased * reach * 1.05, 70, index % 2 ? TEAL : BLUE, alpha, width, height);
          // A thinner second ring trails the first, in the other brand colour.
          if (age > 0.12) ripple(context, cx, cy, 40 + (1 - (1 - (age - 0.12)) ** 2) * reach * 1.05, 34, index % 2 ? BLUE : TEAL, alpha * 0.7, width, height);
        });
      } else {
        if (!revealing) {
          // From here the canvas paints the navy and the grid itself so a circle can be cut out of both.
          revealing = true;
          root.classList.add("is-reveal");
        }
        const progress = Math.min(1, (T - REVEAL_AT) / REVEAL_S);
        const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2; // ease in-out
        const radius = eased * (reach + 120);
        context.fillStyle = "#0a0f1c";
        context.fillRect(0, 0, width, height);
        drawGrid(0.14);
        // Cut a circle out of the navy, with a soft edge.
        context.globalCompositeOperation = "destination-out";
        const hole = context.createRadialGradient(cx, cy, Math.max(0, radius - 60), cx, cy, radius);
        hole.addColorStop(0, "rgba(0,0,0,1)");
        hole.addColorStop(1, "rgba(0,0,0,0)");
        context.fillStyle = hole;
        context.fillRect(0, 0, width, height);
        context.globalCompositeOperation = "source-over";
        // Blue and teal rings ride the edge of the opening circle.
        if (progress < 1) {
          const fade = Math.min(1, (1 - progress) * 3);
          ripple(context, cx, cy, radius, 46, BLUE, 0.5 * fade, width, height);
          ripple(context, cx, cy, Math.max(0, radius - 36), 26, TEAL, 0.45 * fade, width, height);
        }
        if (progress >= 1) {
          context.clearRect(0, 0, width, height);
          return;
        }
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
          <span className="ld-word" key={word} style={{ animationDelay: `${index * BEAT_S}s`, animationDuration: `${BEAT_S}s` }}>
            <small>0{index + 1} / 03</small>
            <b>{word}</b>
          </span>
        ))}
        <span className="ld-trust" style={{ animationDelay: `${BEAT_S * 3}s` }}><b>Trust.</b></span>
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

/* 5. Quiet Editorial: restrained and slow. Hairline grid with small "+" marks, words that rise out of an
   invisible line, one hairline ring per beat, a thin blue rule under TRUST., then a circle opens to the page. */
function QuietEditorial() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const root = canvas?.closest(".ld");
    if (!canvas || !context || !root) return;
    const CELL = 40;
    const width = (canvas.width = document.documentElement.clientWidth);
    const height = (canvas.height = window.innerHeight);
    const cx = width / 2;
    const cy = height / 2;
    const reach = Math.hypot(cx, cy);
    const started = performance.now();
    let frame = 0;
    let revealing = false;

    const smooth = (x: number) => x * x * (3 - 2 * x);
    const drawGrid = () => {
      // Same hairlines as the CSS grid behind everything, so the swap at reveal time is invisible.
      context.fillStyle = "rgba(20,184,166,0.08)";
      for (let x = 0; x < width; x += CELL) context.fillRect(x, 0, 1, height);
      for (let y = 0; y < height; y += CELL) context.fillRect(0, y, width, 1);
    };
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

      if (T < QE_REVEAL_AT) {
        drawMarks(T);
        // One barely-there hairline ring per beat, expanding slowly.
        QE_WORDS.forEach((_, index) => {
          const age = (T - QE_AT(index)) / QE_RING_S;
          if (age < 0 || age > 1) return;
          const eased = 1 - (1 - age) ** 4;
          context.beginPath();
          context.arc(cx, cy, 24 + eased * reach * 0.95, 0, Math.PI * 2);
          context.lineWidth = 1;
          context.strokeStyle = `rgba(${index % 2 ? "20,184,166" : "255,255,255"},${0.26 * (1 - age) ** 1.5})`;
          context.stroke();
        });
      } else {
        if (!revealing) {
          // From here the canvas paints the navy, grid and marks itself so a circle can be cut out of them.
          revealing = true;
          root.classList.add("is-reveal");
        }
        const progress = Math.min(1, (T - QE_REVEAL_AT) / QE_REVEAL_S);
        const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
        const radius = eased * (reach + 40);
        context.fillStyle = "#0a0f1c";
        context.fillRect(0, 0, width, height);
        drawGrid();
        drawMarks(99);
        context.globalCompositeOperation = "destination-out";
        const hole = context.createRadialGradient(cx, cy, Math.max(0, radius - 26), cx, cy, radius);
        hole.addColorStop(0, "rgba(0,0,0,1)");
        hole.addColorStop(1, "rgba(0,0,0,0)");
        context.fillStyle = hole;
        context.fillRect(0, 0, width, height);
        context.globalCompositeOperation = "source-over";
        if (progress >= 1) {
          context.clearRect(0, 0, width, height);
          return;
        }
        // A single 1px blue hairline rides the edge of the opening circle.
        context.beginPath();
        context.arc(cx, cy, Math.max(0, radius - 13), 0, Math.PI * 2);
        context.lineWidth = 1;
        context.strokeStyle = `rgba(37,99,235,${Math.min(1, (1 - progress) * 2.5)})`;
        context.stroke();
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      <div className="ld-grid ld-grid-quiet" />
      <canvas className="ld-canvas" ref={canvasRef} />
      <div className="ld-qe">
        <div className="ld-qe-block">
          <div className="ld-qe-index">
            {QE_WORDS.slice(0, 3).map((_, index) => (
              <span key={index} style={{ animationDelay: `${QE_AT(index) + 0.1}s` }}>0{index + 1} / 03</span>
            ))}
          </div>
          <div className="ld-qe-line">
            {QE_WORDS.map((word, index) => (
              <span
                className={`ld-qe-word ${index === 3 ? "is-trust" : ""}`}
                key={word}
                style={{ animationDelay: `${QE_AT(index)}s`, ["--rule-delay" as string]: `${QE_AT(index) + QE_RULE_AFTER_S}s` }}
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>
      <span className="ld-qe-brand">DeepWebStudios<i>.</i></span>
      <div className="ld-qe-progress" style={{ ["--progress-s" as string]: `${QE_REVEAL_AT}s` }} />
    </>
  );
}
