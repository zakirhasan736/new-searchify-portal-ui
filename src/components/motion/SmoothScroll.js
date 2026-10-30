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

export function scrollToTarget(target, { offset = -88 } = {}) {
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) return false;
  const lenis = getLenis();
  const after = () => {
    try {
      window.__sfRevealInView?.();
    } catch {
      /* ignore */
    }
    // Nav jumps can race ScrollTrigger — force-show section copy if still hidden.
    el.querySelectorAll("h2, h3, .sf-script, .sf-vs-copy > *, .sf-vs-head, .sf-vs-row, .sf-ai-help-note, p").forEach((node) => {
      if (getComputedStyle(node).opacity !== "0") return;
      node.style.opacity = "1";
      node.style.visibility = "visible";
      node.style.transform = "none";
      node.dataset.sfRevealed = "1";
    });
  };
  // Absolute Y is more reliable than element+offset with Lenis + GSAP transforms.
  const current = lenis?.scroll ?? window.scrollY ?? 0;
  const top = Math.max(0, el.getBoundingClientRect().top + current + offset);
  if (lenis) {
    try {
      lenis.start?.();
    } catch {
      /* ignore */
    }
    lenis.scrollTo(top, {
      duration: reducedMotion() ? 0 : 1.05,
      onComplete: after,
    });
  } else {
    window.scrollTo({ top, behavior: reducedMotion() ? "auto" : "smooth" });
    window.setTimeout(after, reducedMotion() ? 0 : 500);
  }
  return true;
}

/** Smooth-scroll to a home hash like "/#vs" or "#vs". Returns true if handled. */
export function scrollToHash(href, { offset = -88 } = {}) {
  if (typeof window === "undefined" || !href) return false;
  try {
    const url = new URL(href, window.location.href);
    const samePath =
      url.pathname.replace(/\/$/, "") === window.location.pathname.replace(/\/$/, "");
    if (!samePath || !url.hash || url.hash === "#") return false;
    const id = decodeURIComponent(url.hash.slice(1));
    const el = document.getElementById(id);
    if (!el) return false;
    const ok = scrollToTarget(el, { offset: url.hash === "#top" ? 0 : offset });
    if (ok) history.replaceState(null, "", url.hash);
    return ok;
  } catch {
    return false;
  }
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
      if (scrollToHash(a.getAttribute("href") || a.href, { offset })) {
        event.preventDefault();
      }
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
