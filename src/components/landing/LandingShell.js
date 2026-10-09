"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

const LINKS = [
  { href: "/#how", label: "How it works", key: "how" },
  { href: "/pricing", label: "Pricing", key: "pricing" },
  { href: "/about", label: "About", key: "about" },
  { href: "/contact", label: "Contact", key: "contact" },
  { href: "/#questions", label: "FAQs", key: "faq" },
];

export default function LandingShell({ current = "home", footerNote = "Searchify · Fully developed · 2026", children }) {
  const pathname = usePathname() || "/";
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    const root = document.querySelector(".sf-land");
    if (!root) return undefined;
    const nodes = root.querySelectorAll("section, .hero, .pagehero, .contactintro, .closing, .pricewrap, .contactlayout");
    if (reduce) {
      nodes.forEach((node) => node.classList.add("is-in"));
      return undefined;
    }
    root.classList.add("js-motion");
    const seen = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          seen.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" },
    );
    nodes.forEach((node) => {
      node.classList.add("sf-rise");
      seen.observe(node);
    });
    return () => seen.disconnect();
  }, [pathname, reduce]);

  const close = () => setOpen(false);

  return (
    <div className="sf-land">
      <header className={`wrap${scrolled ? " is-scrolled" : ""}`}>
        <nav className="nav" aria-label="Main navigation">
          <Link className="brand" href={current === "home" ? "#top" : "/"} aria-label="Searchify home" onClick={close}>
            <motion.span
              className="mark"
              aria-hidden="true"
              animate={reduce ? undefined : { scale: scrolled ? 0.9 : 1, rotate: scrolled ? -6 : 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
            >
              s
            </motion.span>
            searchify
            <small>SEO OPERATOR</small>
          </Link>
          <button
            className="menubtn"
            type="button"
            aria-expanded={open}
            aria-controls="navlinks"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Close" : "Menu"}
          </button>
          <div className={`navlinks${open ? " open" : ""}`} id="navlinks">
            {LINKS.map((item) => (
              <span className="navitem" key={item.key}>
                <Link href={item.href} aria-current={current === item.key ? "page" : undefined} onClick={close}>
                  {item.label}
                </Link>
              </span>
            ))}
            <Link className="navsignin" href="/login" onClick={close}>
              Sign in
            </Link>
            <Link className="btn primary small" href="/signup" onClick={close}>
              Explore the product
            </Link>
          </div>
        </nav>
      </header>
      <motion.div
        key={pathname}
        initial={reduce ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
      <footer className="wrap footer">
        <Link href="/" className="brand" onClick={close}>
          <span className="mark">s</span>searchify
        </Link>
        <div className="footerlinks">
          <Link href="/pricing" aria-current={current === "pricing" ? "page" : undefined}>
            Pricing
          </Link>
          <Link href="/about" aria-current={current === "about" ? "page" : undefined}>
            About
          </Link>
          <Link href="/contact" aria-current={current === "contact" ? "page" : undefined}>
            Contact
          </Link>
          <Link href="/terms" aria-current={current === "terms" ? "page" : undefined}>
            Terms
          </Link>
          <Link href="/privacy" aria-current={current === "privacy" ? "page" : undefined}>
            Privacy
          </Link>
          <Link href="/#questions">FAQs</Link>
          <Link href="/login">Sign in</Link>
          {current === "home" ? <a href="#top">Back to top</a> : null}
        </div>
        <small>{footerNote}</small>
      </footer>
    </div>
  );
}
