"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import SearchifyMark from "@/components/landing/SearchifyMark";
import { getLenis, scrollToHash } from "@/components/motion/SmoothScroll";

const LINKS = [
  { href: "/#testimonials", label: "Testimonials" },
  { href: "/#ai", label: "AI search" },
  { href: "/#platforms", label: "Integrations" },
  { href: "/#vs", label: "Why Searchify" },
  { href: "/#how", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/login", label: "Sign in" },
];

/**
 * Sticky home nav: hidden while the brand hero fills the viewport.
 * After leaving the hero, hide on scroll-down and slide back in on scroll-up.
 */
export default function HomeStickyNav() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mounted, setMounted] = useState(false);
  const openRef = useRef(false);
  openRef.current = open;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let lastY = typeof window !== "undefined" ? window.scrollY : 0;
    let ticking = false;

    const measure = () => {
      ticking = false;
      const y = window.scrollY || 0;
      const hero = document.getElementById("sfy-hero");
      const heroH = hero?.offsetHeight || window.innerHeight;
      const past = y > heroH - 48;
      setPastHero(past);

      const delta = y - lastY;
      if (!past) {
        setHidden(false);
        setOpen(false);
      } else if (Math.abs(delta) > 4) {
        // Scroll down → tuck away; scroll up → bring back (keep open while mobile menu is open).
        if (openRef.current) setHidden(false);
        else setHidden(delta > 0 && y > heroH + 24);
      }
      lastY = y;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    const lenis = getLenis();
    lenis?.on?.("scroll", onScroll);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      lenis?.off?.("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    getLenis()?.stop();
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      getLenis()?.start();
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);
  const show = pastHero && !hidden;

  const onNavClick = (event, href) => {
    close();
    // Let Lenis restart after menu unlock, then scroll to the section top.
    window.setTimeout(() => {
      scrollToHash(href);
    }, 40);
    if (href.includes("#")) event.preventDefault();
  };

  const navLinks = (
    <>
      {LINKS.map((item) => (
        <Link key={item.href} href={item.href} onClick={(event) => onNavClick(event, item.href)}>
          {item.label}
        </Link>
      ))}
      <Link className="sf-home-sticky-cta" href="/signup?next=%2Fapp%2Fstart" onClick={close}>
        Scan your site
      </Link>
    </>
  );

  return (
    <>
      <AnimatePresence>
        {show ? (
          <motion.header
            key="sf-home-sticky"
            className={`sf-home-sticky${open ? " is-open is-menu-open" : ""}`}
            initial={reduce ? false : { y: -88, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? undefined : { y: -88, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <nav className="sf-home-sticky-nav" aria-label="Main">
              <Link className="sf-home-sticky-brand" href="/" aria-label="Searchify home" onClick={close}>
                <SearchifyMark />
                <span>searchify</span>
              </Link>

              <button
                className="sf-home-sticky-menubtn"
                type="button"
                aria-expanded={open}
                aria-controls="sf-home-sticky-links"
                onClick={() => setOpen((value) => !value)}
              >
                {open ? "Close" : "Menu"}
              </button>

              <div id="sf-home-sticky-links" className="sf-home-sticky-links sf-home-sticky-links-inline">
                {navLinks}
              </div>
            </nav>
          </motion.header>
        ) : null}
      </AnimatePresence>

      {mounted && open
        ? createPortal(
            <div
              className="sf-mobile-nav-sheet is-open"
              id="sf-home-sticky-links-mobile"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
            >
              <div className="sf-mobile-nav-bar">
                <Link className="sf-home-sticky-brand" href="/" aria-label="Searchify home" onClick={close}>
                  <SearchifyMark />
                  <span>searchify</span>
                </Link>
                <button className="sf-home-sticky-menubtn" type="button" onClick={close}>
                  Close
                </button>
              </div>
              <div className="sf-mobile-nav-links">{navLinks}</div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
