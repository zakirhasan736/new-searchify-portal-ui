"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchifyMark from "@/components/landing/SearchifyMark";
import HomeStickyNav from "@/components/landing/HomeStickyNav";
import SmoothScroll, { getLenis } from "@/components/motion/SmoothScroll";

const LINKS = [
  { href: "/#testimonials", label: "Testimonials", key: "testimonials", homeOnly: true },
  { href: "/#ai", label: "AI search", key: "ai", homeOnly: true },
  { href: "/#platforms", label: "Integrations", key: "platforms", homeOnly: true },
  { href: "/#vs", label: "Why Searchify", key: "vs", homeOnly: true },
  { href: "/#how", label: "How it works", key: "how", homeOnly: true },
  { href: "/pricing", label: "Pricing", key: "pricing" },
  { href: "/partners/login", label: "Partners", key: "partners" },
];

export default function LandingShell({
  current = "home",
  footerNote = "© Searchify",
  children,
}) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHome = current === "home";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isHome) return undefined;
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

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
  const visibleLinks = LINKS.filter((item) => !item.homeOnly || isHome);

  return (
    <div className={`sf-land${isHome ? " is-home-v3" : ""}`}>
      <SmoothScroll />
      {isHome ? <HomeStickyNav /> : null}
      {!isHome ? (
        <header className={`sf-top${scrolled ? " is-scrolled" : ""}`}>
          <nav className="sf-nav" aria-label="Main">
            <Link className="sf-brand" href="/" aria-label="Searchify home" onClick={close}>
              <SearchifyMark />
              <span>searchify</span>
            </Link>

            <button
              className="sf-menubtn"
              type="button"
              aria-expanded={open}
              aria-controls="sf-navlinks"
              onClick={() => setOpen((value) => !value)}
            >
              {open ? "Close" : "Menu"}
            </button>

            <div className={`sf-navlinks${open ? " open" : ""}`} id="sf-navlinks">
              {visibleLinks.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={current === item.key ? "page" : undefined}
                  onClick={close}
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/login" onClick={close}>
                Sign in
              </Link>
              <Link className="sf-cta" href="/signup?next=%2Fapp%2Fstart" onClick={close}>
                Scan your site
              </Link>
            </div>
          </nav>
        </header>
      ) : null}

      <div id="top" className="sf-main">
        {children}
      </div>

      <footer className="sf-footer">
        <div className="sf-footer-inner">
          <span className="sf-footer-copy">{footerNote}</span>
          <nav className="sf-footer-nav" aria-label="Footer">
            <Link href="/pricing" aria-current={current === "pricing" ? "page" : undefined}>
              Pricing
            </Link>
            <Link href="/partners/login">Affiliates</Link>
            <Link href="/privacy" aria-current={current === "privacy" ? "page" : undefined}>
              Privacy
            </Link>
            <Link href="/terms" aria-current={current === "terms" ? "page" : undefined}>
              Terms
            </Link>
            <Link href="/contact" aria-current={current === "contact" ? "page" : undefined}>
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
