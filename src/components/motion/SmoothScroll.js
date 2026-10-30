"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { reducedMotion, useGsap } from "@/components/motion/gsapClient";

/**
 * Lenis smooth scrolling (wheel + trackpad, up and down) synced with GSAP ScrollTrigger.
 * Touch keeps the native momentum scroll. Off when the user prefers reduced motion.
 * In-page "#hash" links scroll smoothly through Lenis with the sticky-header offset.
 */
export function getLenis() {
  return typeof window !== "undefined" ? window.__sfLenis || null : null;
}

export function scrollToTarget(target, { offset = 0 } = {}) {
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) return;
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.1 });
  else el.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth" });
}

export default function SmoothScroll({ offset = -88 }) {
  const { gsap, ScrollTrigger } = useGsap();

  useEffect(() => {
    if (reducedMotion()) return undefined;
    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
    });
    window.__sfLenis = lenis;
    document.documentElement.classList.add("sf-lenis");
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const onClick = (event) => {
      const a = event.target.closest?.("a[href*='#']");
      if (!a || event.defaultPrevented || event.metaKey || event.ctrlKey || event.button !== 0) return;
      const url = new URL(a.href, window.location.href);
      if (url.pathname !== window.location.pathname || !url.hash || url.hash === "#") return;
      const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!el) return;
      event.preventDefault();
      lenis.scrollTo(el, { offset: url.hash === "#top" ? 0 : offset, duration: 1.1 });
      history.replaceState(null, "", url.hash);
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
      document.documentElement.classList.remove("sf-lenis");
      if (window.__sfLenis === lenis) window.__sfLenis = null;
    };
  }, [gsap, ScrollTrigger, offset]);

  return null;
}
