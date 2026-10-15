"use client";

import { useEffect, useRef } from "react";

// Matches the 40px grid drawn by .hero-grid, so lit squares fill its cells exactly.
const CELL = 40;
// Brand blue and teal, as "r,g,b" so the alpha can change per frame.
const COLORS = ["37,99,235", "20,184,166"];
const PEAK_ALPHA = 0.75;
const FADE_MS = 1100;

type LitCell = { col: number; row: number; color: string; litAt: number };

// Lights the hero grid square under the mouse and lets a trail fade out behind it.
export function HeroSquareTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = canvas?.parentElement;
    const context = canvas?.getContext("2d");
    if (!canvas || !section || !context) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cells = new Map<string, LitCell>();
    let frame = 0;
    let lastPoint: { x: number; y: number } | null = null;

    const resize = () => {
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = section.clientWidth * scale;
      canvas.height = section.clientHeight * scale;
      context.setTransform(scale, 0, 0, scale, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(section);

    const draw = (now: number) => {
      context.clearRect(0, 0, section.clientWidth, section.clientHeight);
      for (const [key, cell] of cells) {
        const age = (now - cell.litAt) / FADE_MS;
        if (age >= 1) {
          cells.delete(key);
          continue;
        }
        context.fillStyle = `rgba(${cell.color},${PEAK_ALPHA * (1 - age) ** 1.6})`;
        // Inset by the 1px grid line so the square sits inside its cell.
        context.fillRect(cell.col * CELL + 1, cell.row * CELL + 1, CELL - 1, CELL - 1);
      }
      // Stop animating once every square has faded out.
      frame = cells.size > 0 ? requestAnimationFrame(draw) : 0;
    };

    const light = (x: number, y: number, now: number) => {
      const col = Math.floor(x / CELL);
      const row = Math.floor(y / CELL);
      const key = `${col}:${row}`;
      const color = cells.get(key)?.color ?? COLORS[Math.floor(Math.random() * COLORS.length)];
      cells.set(key, { col, row, color, litAt: now });
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = section.getBoundingClientRect();
      const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      const now = performance.now();

      // Fill in the cells between two events so a fast swipe leaves no gaps.
      const from = lastPoint ?? point;
      const steps = Math.max(1, Math.ceil(Math.hypot(point.x - from.x, point.y - from.y) / (CELL / 2)));
      for (let step = 1; step <= steps; step += 1) {
        const t = step / steps;
        light(from.x + (point.x - from.x) * t, from.y + (point.y - from.y) * t, now);
      }
      lastPoint = point;

      if (!frame) frame = requestAnimationFrame(draw);
    };
    const onPointerLeave = () => {
      lastPoint = null;
    };

    section.addEventListener("pointermove", onPointerMove);
    section.addEventListener("pointerleave", onPointerLeave);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      section.removeEventListener("pointermove", onPointerMove);
      section.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return <canvas aria-hidden="true" className="hero-square-trail" ref={canvasRef} />;
}
