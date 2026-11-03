"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Site-wide motion, in one place:
//   - scroll reveals: tagged blocks rise into view once as they enter the screen,
//   - a thin scroll-progress bar and a header shadow once the page has moved,
//   - the nav link of the section being read is highlighted,
//   - marks the document so route changes can fade in (see template.tsx).
//
// Everything here is progressive: with JavaScript off, or for visitors who prefer reduced motion,
// nothing is ever hidden and the page simply shows its content.

type Group = { selector: string; base?: number; step?: number };

// Which blocks reveal, and how they stagger. Siblings matched by the same selector are delayed one
// `step` after each other (capped), so a row of cards cascades instead of appearing together.
const GROUPS: Group[] = [
  { selector: ".section-heading .eyebrow" },
  { selector: ".section-heading h2", base: 90 },
  { selector: ".section-heading > p", base: 190 },
  { selector: "main > section.grid > article", step: 140 },
  { selector: "main > section.grid li", base: 260, step: 80 },
  { selector: ".work-row", step: 90 },
  { selector: ".work-note" },
  { selector: ".bento-card", step: 110 },
  { selector: "#process .h-fit > *", step: 90 },
  { selector: ".process-step", step: 130 },
  { selector: ".about-card", step: 130 },
  { selector: ".founder-card" },
  { selector: ".about-facts li", step: 70 },
  { selector: ".quote-offer" },
  { selector: ".quote-offer li", base: 220, step: 120 },
  { selector: ".faq-intro > *", step: 90 },
  { selector: ".faq-item", step: 55 },
  { selector: ".proof-card", step: 130 },
  { selector: "#contact .contact-copy > *", step: 90 },
  { selector: ".contact-form", base: 160 },
  { selector: "footer .footer-brand, footer .footer-column", step: 100 },
  { selector: "[data-reveal='']", step: 0 },
];

const SECTIONS = ["work", "services", "process", "about", "pricing", "faq", "contact"];
const MAX_STAGGER = 6;

export function Motion() {
  const pathname = usePathname();
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---- scroll reveals -------------------------------------------------------------------------
    let observer: IntersectionObserver | null = null;
    // Blocks still waiting to be revealed.
    const pending = new Set<HTMLElement>();
    const show = (el: Element) => {
      el.setAttribute("data-in", "");
      observer?.unobserve(el);
      pending.delete(el as HTMLElement);
    };
    if (!reduced && "IntersectionObserver" in window) {
      const targets: HTMLElement[] = [];
      for (const { selector, base = 0, step = 0 } of GROUPS) {
        const seen = new Map<Element, number>();
        document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
          if (el.hasAttribute("data-in")) return;
          const parent = el.parentElement as Element;
          const index = seen.get(parent) ?? 0;
          seen.set(parent, index + 1);
          if (!el.hasAttribute("data-reveal")) {
            el.setAttribute("data-reveal", "");
            el.style.setProperty("--d", `${base + Math.min(index, MAX_STAGGER) * step}ms`);
          }
          targets.push(el);
        });
      }

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting || entry.boundingClientRect.top < 0) show(entry.target);
          }
        },
        { rootMargin: "0px 0px -8% 0px" },
      );
      // Anything already on screen is marked before the hidden state applies, so it animates in
      // from its start position instead of flashing.
      for (const el of targets) {
        const rect = el.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) el.setAttribute("data-in", "");
        else {
          observer.observe(el);
          pending.add(el);
        }
      }
      root.setAttribute("data-motion", "");
    }

    // ---- scroll progress, header shadow, current section -----------------------------------------
    const links = new Map<string, Element[]>();
    for (const id of SECTIONS) links.set(id, [...document.querySelectorAll(`header nav a[href="#${id}"]`)]);
    let current = "";
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const max = root.scrollHeight - window.innerHeight;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      if (y > 8 !== root.hasAttribute("data-scrolled")) root.toggleAttribute("data-scrolled", y > 8);

      let active = "";
      for (const id of SECTIONS) {
        const rect = document.getElementById(id)?.getBoundingClientRect();
        if (rect && rect.top <= 140 && rect.bottom > 140) active = id;
      }
      if (active !== current) {
        links.get(current)?.forEach((a) => a.removeAttribute("aria-current"));
        links.get(active)?.forEach((a) => a.setAttribute("aria-current", "true"));
        current = active;
      }
    };
    // The observer only reports blocks that enter the screen, so a long jump (the nav, a link to #faq, a
    // reload mid-page) can skip right over some. Once scrolling settles, show everything that is now above
    // the screen so scrolling back up never uncovers an empty gap.
    let settle = 0;
    const showPassed = () => {
      for (const el of [...pending]) if (el.getBoundingClientRect().top < 0) show(el);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
      if (pending.size) {
        window.clearTimeout(settle);
        settle = window.setTimeout(showPassed, 120);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    // From here on a new route fades in; the very first page does not (the intro covers it).
    const navTimer = window.setTimeout(() => root.setAttribute("data-nav", ""), 400);

    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(navTimer);
      window.clearTimeout(settle);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  return <div aria-hidden="true" className="scroll-progress" ref={progressRef} />;
}
