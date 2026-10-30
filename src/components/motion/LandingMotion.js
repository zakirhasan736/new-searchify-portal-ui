"use client";

import { useEffect } from "react";
import { reducedMotion, useGsap } from "@/components/motion/gsapClient";

/**
 * Landing page motion (GSAP + ScrollTrigger; Lenis smooth scroll lives in LandingShell):
 *  - headings, cards and rows ease up as they enter the viewport (once each, staggered)
 *  - illustrations drift slightly with scroll (parallax, scrubbed both directions)
 * Nothing hijacks the wheel; with prefers-reduced-motion everything stays static.
 */
const REVEAL = [
  "#rest .sf-hero-copy > *",
  "#rest .sf-hero-hand",
  "#rest .sf-script",
  "#rest h2",
  "#rest h3",
  "#rest .sf-split-copy > p",
  "#rest .sf-card",
  "#rest .sf-ai-help-card",
  "#rest .sf-ai-help-note",
  "#rest .sf-vs-head",
  "#rest .sf-vs-row",
  "#rest .sf-plat-legend > *",
  "#rest .sf-plat-card",
  "#rest .sf-plugs-label",
  "#rest .sf-tile",
  "#rest .sf-scene",
  "#rest .sf-changelog",
  "#rest .sf-trust-grid > div",
  "#rest .sf-quote",
  "#rest .sf-agency",
  "#rest .sf-closing > *",
  "#rest [data-reveal]",
].join(",");

const PARALLAX = [
  "#rest .sf-hero-board",
  "#rest .sf-hero-hand",
  "#rest .sf-ai-chat",
  "#rest .sf-platforms-chart",
];

export default function LandingMotion({ root = "#rest" }) {
  const { gsap, ScrollTrigger } = useGsap();

  useEffect(() => {
    if (reducedMotion()) return undefined;
    const scope = document.querySelector(root);
    if (!scope) return undefined;
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray(REVEAL).filter((el) => !el.closest(".sf-marquee"));
      gsap.set(items, { autoAlpha: 0, y: 34 });
      ScrollTrigger.batch(items, {
        start: "top 90%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.07, overwrite: true, clearProps: "transform,opacity,visibility" }),
      });

      PARALLAX.forEach((selector) => {
        gsap.utils.toArray(selector).forEach((el) => {
          gsap.fromTo(
            el,
            { y: 40 },
            { y: -40, ease: "none", force3D: true, scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.8 } },
          );
        });
      });

      // The scan board's dots light up one after another when it comes into view.
      const dots = gsap.utils.toArray("#rest .sf-dot-cell");
      if (dots.length) {
        gsap.from(dots, {
          autoAlpha: 0,
          scale: 0.6,
          duration: 0.4,
          ease: "back.out(2)",
          stagger: { each: 0.015, from: "start" },
          clearProps: "transform,opacity,visibility",
          scrollTrigger: { trigger: dots[0], start: "top 92%", once: true },
        });
      }
    }, scope);
    // Images / fonts change heights; recompute trigger positions once things settle.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    document.fonts?.ready?.then(refresh).catch(() => {});
    return () => {
      window.removeEventListener("load", refresh);
      ctx.revert();
    };
  }, [gsap, ScrollTrigger, root]);

  return null;
}
