"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { reducedMotion, useGsap } from "@/components/motion/gsapClient";

/**
 * Wrap a dashboard screen to give it smooth motion without touching each card:
 *  - Framer Motion fades the whole screen in.
 *  - GSAP ScrollTrigger staggers its blocks in as they enter the viewport (once each).
 *
 * `selector` picks the blocks (defaults to direct children, the children of <main>/<aside>
 * and anything with data-reveal). Pass `deps` (e.g. [loading]) so blocks that render after
 * data arrives also animate; blocks already shown are never animated twice.
 * Respects prefers-reduced-motion (no transforms at all).
 */
const DEFAULT = ":scope > *, :scope main > *, :scope aside > *, :scope [data-reveal]";

/** Nearest ancestor that scrolls (the portal's <main> does); undefined = the window. */
function scrollParent(el) {
  for (let node = el?.parentElement; node && node !== document.body; node = node.parentElement) {
    const { overflowY } = window.getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
  }
  return undefined;
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function MotionStage({ children, selector = DEFAULT, deps = [], watch = true, style, className, as = "div" }) {
  const ref = useRef(null);
  const triggers = useRef([]);
  const reduce = useReducedMotion();
  const { gsap, ScrollTrigger } = useGsap();
  const Tag = motion[as] || motion.div;

  const reveal = () => {
    const root = ref.current;
    if (!root || reducedMotion()) return;
    const items = Array.from(root.querySelectorAll(selector)).filter(
      (el) => !el.dataset.revealed && el.offsetParent !== null && !el.matches("[data-no-reveal], [role=dialog], [aria-modal=true], script, style, link")
    );
    if (!items.length) return;
    items.forEach((el) => {
      el.dataset.revealed = "1";
    });
    gsap.set(items, { autoAlpha: 0, y: 22 });
    const made = ScrollTrigger.batch(items, {
      scroller: scrollParent(root),
      start: "top 96%",
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.06,
          overwrite: true,
          clearProps: "transform,opacity,visibility",
        }),
    });
    triggers.current.push(...made);
    ScrollTrigger.refresh();
  };

  useIsoLayoutEffect(() => {
    reveal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Blocks that appear later (data arrived, tab switched) animate in too.
  useEffect(() => {
    const root = ref.current;
    if (!watch || !root || reducedMotion() || typeof MutationObserver === "undefined") return undefined;
    let timer = null;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(reveal, 60);
    });
    observer.observe(root, { childList: true, subtree: true });
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch]);

  useEffect(() => {
    const root = ref.current;
    return () => {
      triggers.current.forEach((t) => t.kill());
      triggers.current = [];
      // Never leave a block hidden if the screen unmounts before it scrolled into view.
      if (root) gsap.set(root.querySelectorAll("[data-revealed]"), { clearProps: "transform,opacity,visibility" });
    };
  }, [gsap]);

  return (
    <Tag
      ref={ref}
      className={className}
      // Opacity only: a transform here would break position:fixed / sticky children while it runs.
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={style}
    >
      {children}
    </Tag>
  );
}
