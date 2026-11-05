"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import HeroLights from "@/components/landing/v2/HeroLights";
import { BOARD, CHANGE_LOG, LOOK_FOR, buildLandingFrame } from "@/components/landing/v2/landingFrame";
import sample from "@/components/landing/v2/sampleA.json";
import { normalizeSiteUrl, stashPendingSite } from "@/lib/journey";
import "@/styles/landing-v2.css";

const MONO = { fontFamily: '"Open Sans", sans-serif', fontWeight: 700 };
const DISPLAY = { fontFamily: "'Bricolage Grotesque', Geist, sans-serif" };

function Mark({ size = 30, lockup = false, className }) {
  return (
    <svg className={className} width={lockup ? undefined : size} height={lockup ? undefined : size} viewBox="0 0 32 32" role="img" aria-label={lockup ? "Searchify logo" : "Searchify"} style={lockup ? { width: "clamp(64px, 9vw, 132px)", height: "clamp(64px, 9vw, 132px)", flex: "none", overflow: "visible" } : { flex: "none", overflow: "visible" }}>
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="#131519" stroke="#2E333B" strokeWidth={lockup ? 0.6 : 1} />
      <circle cx="9" cy="12.5" r="2.9" fill="#FF5A4E" style={{ filter: "drop-shadow(0 0 1.4px #FF5A4E)", animationDuration: "3.1s", animationDelay: "-.4s" }} />
      <circle cx="16" cy="12.5" r="2.9" fill="#FF9F43" style={{ filter: "drop-shadow(0 0 1.4px #FF9F43)", animationDuration: "3.7s", animationDelay: "-2.1s" }} />
      <circle cx="23" cy="12.5" r="2.9" fill="#FFC53D" style={{ filter: "drop-shadow(0 0 1.4px #FFC53D)", animationDuration: "2.9s", animationDelay: "-1.3s" }} />
      <circle cx="9" cy="19.5" r="2.9" fill="#3DDC84" style={{ filter: "drop-shadow(0 0 1.4px #3DDC84)", animationDuration: "3.4s", animationDelay: "-2.8s" }} />
      <circle cx="16" cy="19.5" r="2.9" fill="#2CC7C0" style={{ filter: "drop-shadow(0 0 1.4px #2CC7C0)", animationDuration: "3.9s", animationDelay: "-.9s" }} />
      <circle cx="23" cy="19.5" r="2.9" fill="#4DA3FF" style={{ filter: "drop-shadow(0 0 1.8px #4DA3FF)", animationDuration: "2.4s", animationDelay: "-1.7s" }} />
    </svg>
  );
}

function MenuIcon({ open }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} />
    </svg>
  );
}

function scrollToSection(href) {
  if (typeof window === "undefined" || !href || href.charAt(0) !== "#") return false;
  const el = document.getElementById(href.slice(1));
  if (!el) return false;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const top = Math.max(0, window.scrollY + el.getBoundingClientRect().top - 76);
  window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  window.history.replaceState(null, "", href);
  return true;
}

function onSectionClick(event, href, closeMenu) {
  if (href.charAt(0) !== "#") {
    closeMenu();
    return;
  }
  event.preventDefault();
  closeMenu();
  window.setTimeout(() => scrollToSection(href), 40);
}

function SiteNav({ menu, setMenu, closeMenu, links, navRef, overlay }) {
  return (
    <nav ref={navRef} className="sfy-nav" aria-label="Main" style={{ position: overlay ? "absolute" : "relative", top: 0, left: 0, right: 0, zIndex: 3, maxWidth: 1240, margin: "0 auto", boxSizing: "border-box", padding: overlay ? "22px clamp(16px, 4vw, 40px)" : "14px clamp(16px, 4vw, 40px)", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
      <div className="brand" style={{ display: "flex", alignItems: "center", gap: 10, marginRight: "auto", cursor: "default" }}>
        <Mark />
        <span style={{ fontWeight: 600, fontSize: 18, letterSpacing: "-0.3px" }}>searchify</span>
      </div>
      <button type="button" className="lv2-menu" aria-expanded={menu} aria-label={menu ? "Close menu" : "Open menu"} onClick={() => setMenu((open) => !open)}>
        <MenuIcon open={menu} />
      </button>
      <div className={`lv2-links${menu ? " open" : ""}`} style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
        {links.map(([href, label]) => <a key={href} href={href} onClick={(event) => onSectionClick(event, href, closeMenu)} style={{ color: "#D7DADE", textDecoration: "none", fontSize: 14 }}>{label}</a>)}
        <Link href="/pricing" onClick={closeMenu} style={{ color: "#D7DADE", textDecoration: "none", fontSize: 14 }}>Pricing</Link>
        <Link href="/login" onClick={closeMenu} style={{ color: "#D7DADE", textDecoration: "none", fontSize: 14 }}>Sign in</Link>
      </div>
      <Link href="/free-analysis" className="cta-btn" style={{ display: "inline-flex", alignItems: "center", minHeight: 42, padding: "0 16px", borderRadius: 12, background: "#4DA3FF", color: "#0A0B0D", textDecoration: "none", fontSize: 14, fontWeight: 600, boxShadow: "0 0 20px rgba(77,163,255,.4)" }}>Scan your site</Link>
    </nav>
  );
}

function Badges({ badges }) {
  if (!badges?.builtBySovereign && !badges?.managedPlan) return null;
  return (
    <span style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {badges.builtBySovereign ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, border: "1px solid rgba(77,163,255,.5)", color: "#8CC4FF", fontSize: 12, fontWeight: 600 }}>Website made by Sovereign Standard + Searchify</span> : null}
      {badges.managedPlan ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, background: "rgba(61,220,132,.12)", border: "1px solid rgba(61,220,132,.55)", color: "#3DDC84", fontSize: 12, fontWeight: 600 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
          Customer opted for the Managed plan
        </span>
      ) : null}
    </span>
  );
}

function Stats({ rows = [] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6 }}>
      {rows.map((item) => (
        <span key={`${item.label}-${item.value}`} style={{ display: "flex", flexDirection: "column", gap: 2, padding: "12px 16px", borderRadius: 14, background: "#0A0B0D", border: "1px solid #1A1D22" }}>
          <span style={{ ...DISPLAY, fontSize: 26, fontWeight: 800, color: item.color, lineHeight: 1 }}>{item.value}</span>
          <span style={{ fontSize: 12, color: "#9AA1AB" }}>{item.label}</span>
        </span>
      ))}
    </div>
  );
}

function Check() {
  return <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style={{ flex: "none", marginTop: 3 }}><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#3DDC84" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function HomeView() {
  const router = useRouter();
  const heroRef = useRef(null);
  const canvasRef = useRef(null);
  const navRef = useRef(null);
  const lockRef = useRef(null);
  const [tick, setTick] = useState(0);
  const [tile, setTile] = useState("red");
  const [shipped, setShipped] = useState(false);
  const [undone, setUndone] = useState({});
  const [menu, setMenu] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [barHidden, setBarHidden] = useState(false);
  const reduceMotion = useReducedMotion();
  const menuRef = useRef(false);
  menuRef.current = menu;
  const [heroUrl, setHeroUrl] = useState("");
  const [footUrl, setFootUrl] = useState("");
  const [scanError, setScanError] = useState("");
  const frame = useMemo(() => buildLandingFrame(tick, sample), [tick]);
  const scene = BOARD[tile];
  const color = frame.colors[tile];

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce) {
      setTick(100);
      return undefined;
    }
    const id = window.setInterval(() => setTick((value) => value + 1), 100);
    return () => window.clearInterval(id);
  }, []);

  const goScan = (raw) => {
    const site = normalizeSiteUrl(raw);
    if (!site || !site.includes(".")) {
      setScanError("Enter a website address, like example.com.");
      return;
    }
    setScanError("");
    stashPendingSite(site);
    router.push(`/free-analysis?${new URLSearchParams({ site, run: "1" })}`);
  };

  const closeMenu = () => setMenu(false);

  useEffect(() => {
    let lastY = window.scrollY || 0;
    let wasPast = lastY > (heroRef.current?.offsetHeight || window.innerHeight) - 48;
    let pastNow = false;
    let hiddenNow = false;
    let ticking = false;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const measure = () => {
      ticking = false;
      const y = window.scrollY || 0;
      const heroH = heroRef.current?.offsetHeight || window.innerHeight;
      const past = y > heroH - 48;
      if (!reduce && heroRef.current) {
        const linear = Math.max(0, Math.min(1, y / heroH));
        const eased = linear * linear * (3 - 2 * linear);
        heroRef.current.style.setProperty("--sf-p", eased.toFixed(4));
      }
      if (past !== pastNow) {
        pastNow = past;
        setPastHero(past);
      }
      const delta = y - lastY;
      let nextHidden = hiddenNow;
      if (!past) {
        nextHidden = false;
        if (wasPast) setMenu(false);
      } else if (Math.abs(delta) > 4) {
        nextHidden = menuRef.current ? false : delta > 0 && y > heroH + 24;
      }
      if (nextHidden !== hiddenNow) {
        hiddenNow = nextHidden;
        setBarHidden(nextHidden);
      }
      wasPast = past;
      lastY = y;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    if (!menu) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setMenu(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);
  const links = [
    ["#testimonials", "Testimonials"],
    ["#ai", "AI search"],
    ["#platforms", "Integrations"],
    ["#vs", "Why Searchify"],
    ["#how", "How it works"],
  ];

  return (
    <div className={`lv2${menu ? " menu-open" : ""}`} style={{ minHeight: 4300, background: "#0A0B0D", color: "#F2F4F5", fontFamily: "Geist, 'Helvetica Neue', sans-serif" }}>
      <HeroLights heroRef={heroRef} canvasRef={canvasRef} lockRef={lockRef} navRef={navRef} />
      {menu ? <button type="button" className="lv2-backdrop" aria-label="Close menu" onClick={closeMenu} /> : null}
      <aside className={`lv2-side${menu ? " open" : ""}`} aria-label="Menu" aria-hidden={!menu}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Mark />
            <span style={{ fontWeight: 600, fontSize: 18, letterSpacing: "-0.3px" }}>searchify</span>
          </span>
          <button type="button" className="lv2-menu" aria-label="Close menu" onClick={closeMenu} style={{ display: "inline-flex" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        {links.map(([href, label]) => <a key={href} href={href} onClick={(event) => onSectionClick(event, href, closeMenu)}>{label}</a>)}
        <Link href="/pricing" onClick={closeMenu}>Pricing</Link>
        <Link href="/login" onClick={closeMenu}>Sign in</Link>
        <Link href="/free-analysis" className="lv2-side-scan" onClick={closeMenu}>Scan your site</Link>
      </aside>
      <AnimatePresence>
        {pastHero && (!barHidden || menu) ? (
          <motion.header
            key="lv2-sticky"
            className="lv2-sticky"
            initial={reduceMotion ? false : { y: -88, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduceMotion ? undefined : { y: -88, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <SiteNav menu={menu} setMenu={setMenu} closeMenu={closeMenu} links={links} />
          </motion.header>
        ) : null}
      </AnimatePresence>
      <section ref={heroRef} className="sfy-hero" aria-label="Searchify" style={{ position: "relative", height: "clamp(560px, 62vw, 900px)", overflow: "hidden", borderBottom: "1px solid #1A1D22", background: "#0A0B0D" }}>
        <canvas ref={canvasRef} aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "block", pointerEvents: "none" }} />
        <SiteNav menu={menu} setMenu={setMenu} closeMenu={closeMenu} links={links} navRef={navRef} overlay />
        <div style={{ position: "absolute", inset: 0, zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px", pointerEvents: "none" }}>
          <div ref={lockRef} className="sfy-lock" style={{ display: "flex", alignItems: "center", gap: "clamp(16px, 2.6vw, 38px)" }}>
            <Mark className="sfy-mark" lockup />
            <span style={{ ...DISPLAY, fontWeight: 800, fontSize: "clamp(56px, 9.8vw, 148px)", letterSpacing: "-0.03em", lineHeight: 1, color: "#F2F4F5" }}>searchify</span>
          </div>
        </div>
        <a href="#rest" className="sfy-cue" aria-label="Scroll to the next section" style={{ position: "absolute", left: "50%", bottom: 24, zIndex: 3, display: "grid", placeItems: "center", width: 48, height: 48, borderRadius: "50%", color: "#7D848E" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
        </a>
      </section>

      <header id="rest" style={{ maxWidth: 1240, margin: "0 auto", boxSizing: "border-box", padding: "72px clamp(16px, 4vw, 40px) 96px", display: "flex", flexWrap: "wrap", gap: 56, alignItems: "center" }}>
        <div style={{ flex: "1 1 480px", minWidth: 0, display: "flex", flexDirection: "column", gap: 26 }}>
          <h1 style={{ margin: 0, ...DISPLAY, fontSize: "clamp(44px, 6.2vw, 84px)", lineHeight: 0.96, letterSpacing: "-2.6px", fontWeight: 800 }}>{sample.hero.headline}</h1>
          <p style={{ margin: 0, fontSize: 19, color: "#9AA1AB", lineHeight: 1.5, maxWidth: 520 }}>{sample.hero.sub}</p>
          <form onSubmit={(event) => { event.preventDefault(); goScan(heroUrl); }} style={{ display: "flex", flexWrap: "wrap", gap: 10, maxWidth: 560 }}>
            <label htmlFor="hero-url" style={{ flex: "1 1 260px", display: "flex", alignItems: "center", minHeight: 60, padding: "0 18px", borderRadius: 14, background: "#131519", border: "1px solid #262A31" }}>
              <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Your website</span>
              <input id="hero-url" type="text" inputMode="url" autoComplete="url" placeholder="yourwebsite.com" value={heroUrl} onChange={(event) => setHeroUrl(event.target.value)} style={{ flex: 1, minWidth: 0, border: 0, outline: "none", background: "transparent", color: "#F2F4F5", fontFamily: "inherit", fontSize: 18 }} />
            </label>
            <button type="submit" style={{ display: "inline-flex", alignItems: "center", minHeight: 60, padding: "0 26px", borderRadius: 14, border: 0, background: "#4DA3FF", color: "#0A0B0D", fontSize: 16, fontWeight: 600, boxShadow: "0 0 28px rgba(77,163,255,.5)" }}>Scan it free</button>
          </form>
          <span style={{ fontSize: 13, color: "#7D848E" }}>No account. About 60 seconds. Nothing on your site changes. Then try Solo free for your first month.</span>
          {scanError ? <span role="alert" style={{ fontSize: 13, color: "#FF5A4E" }}>{scanError}</span> : null}
        </div>
        <div style={{ flex: "1 1 420px", minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          <div aria-hidden="true" style={{ background: "#101215", border: "1px solid #1A1D22", borderRadius: 28, padding: 28, display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", ...MONO, fontSize: 12, color: "#9AA1AB" }}>
              <span>yourwebsite.com</span><span style={{ color: frame.litColor, transition: "color .3s ease" }}>{frame.litLabel}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(8, minmax(0, 1fr))", gap: 12 }}>
              {frame.dots.map((dot, index) => (
                <div key={index} style={{ aspectRatio: "1", display: "grid", placeItems: "center" }}>
                  <div style={{ width: "58%", aspectRatio: "1", borderRadius: "50%", background: dot.color, opacity: dot.op, boxShadow: dot.shadow, transform: `scale(${dot.scale})`, animation: dot.anim, transition: "opacity .5s ease, box-shadow .35s ease, background .35s ease, transform .3s ease" }} />
                </div>
              ))}
            </div>
            <div style={{ minHeight: 34, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 6, borderRadius: 999, background: "#1A1D22", overflow: "hidden" }}><div style={{ height: "100%", width: frame.scanPct, borderRadius: 999, background: "linear-gradient(90deg, #4DA3FF, #3DDC84)", transition: "width .15s linear" }} /></div>
              {frame.scanDone ? <span style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: 999, background: "rgba(61,220,132,.12)", border: "1px solid rgba(61,220,132,.5)", color: "#3DDC84", fontSize: 12, fontWeight: 600, animation: "sfy-pop2 .45s ease-out both" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>Scan complete · 40 checks</span> : null}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "0 8px 0 18px" }}>
            <svg width="70" height="64" viewBox="0 0 70 64" aria-hidden="true" style={{ flex: "none", overflow: "visible", filter: "drop-shadow(0 0 6px rgba(77,163,255,.7))" }}>
              <path d="M60 58 C 30 58, 14 44, 16 8" fill="none" stroke="#4DA3FF" strokeWidth="3" strokeLinecap="round" />
              <path d="M7 18 L16 6 L25 18" fill="none" stroke="#4DA3FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="lv2-note" style={{ margin: "18px 0 0", fontFamily: "Raleway, sans-serif", fontSize: 30, lineHeight: 1.15, color: "#F2F4F5" }}>Getting every light green is only the beginning. The real goal is a board full of <span style={{ color: "#4DA3FF", textShadow: "0 0 12px rgba(77,163,255,.6)" }}>blue</span>: pages that are winning, and locked in.</p>
          </div>
        </div>
      </header>

      <section aria-label="Where people look for you" style={{ borderTop: "1px solid #1A1D22", borderBottom: "1px solid #1A1D22" }}>
        <div className="lv2-where" style={{ maxWidth: 1240, margin: "0 auto", boxSizing: "border-box", padding: "22px clamp(16px, 4vw, 40px)", display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ flex: "none", ...MONO, fontSize: 12, color: "#7D848E" }}>WHERE PEOPLE LOOK FOR YOU</span>
          <div className="sfy-marquee" style={{ flex: 1, minWidth: 0, overflow: "hidden", maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)" }}>
            <div className="sfy-track" style={{ display: "flex", width: "max-content", animation: "sfy-scroll 28s linear infinite" }}>
              {[0, 1].map((copy) => LOOK_FOR.map((name) => (
                <span key={`${copy}-${name}`} aria-hidden={copy === 1 || undefined} style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: 10, padding: "0 28px", fontSize: 16, fontWeight: 500, color: "#D7DADE", whiteSpace: "nowrap" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4DA3FF", boxShadow: "0 0 8px #4DA3FF" }} />{name}
                </span>
              )))}
            </div>
          </div>
        </div>
      </section>

      <div style={{ background: "#4DA3FF", borderTop: "1px solid #1A1D22", borderBottom: "1px solid #1A1D22" }}>
        <section id="ai" aria-labelledby="ai-h" style={{ maxWidth: 1240, margin: "0 auto", boxSizing: "border-box", padding: "100px clamp(16px, 4vw, 40px)", display: "flex", flexDirection: "column", gap: 40 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 48, alignItems: "center" }}>
            <div style={{ flex: "1 1 440px", minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
              <span style={{ fontFamily: "Caveat, cursive", fontSize: 36, color: "#0A0B0D", lineHeight: 1 }}>The landscape of search is evolving.</span>
              <h2 id="ai-h" style={{ margin: 0, ...DISPLAY, fontSize: "clamp(34px, 4.4vw, 56px)", lineHeight: 1, letterSpacing: "-1.6px", fontWeight: 700, color: "#0A0B0D" }}>Other businesses are being mentioned. Why not you?</h2>
              <p style={{ margin: 0, fontSize: 17, color: "rgba(10,11,13,.78)", lineHeight: 1.55, maxWidth: 520 }}>More and more people ask ChatGPT, Perplexity or Google&apos;s AI for a recommendation and never scroll the results. Those answers mention only a handful of businesses, and they don&apos;t simply copy Google&apos;s top ten. If AI can&apos;t read your site, or can&apos;t tell what you do and where, it recommends someone else.</p>
              <span style={{ fontSize: 12, color: "rgba(10,11,13,.65)" }}>Ahrefs found only about 1 in 10 AI citations comes from a page in Google&apos;s top 10 (2026).</span>
            </div>
            <figure aria-label="Examples of AI answers that recommend a business by name" style={{ flex: "1 1 440px", minWidth: 0, margin: 0, borderRadius: 24, background: "#0A0B0D", border: "1px solid #0A0B0D", boxShadow: "0 24px 60px rgba(0,0,0,.35)", padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span style={{ ...MONO, fontSize: 11, letterSpacing: ".05em", color: "#7D848E" }}>ASKED IN AN AI ASSISTANT · {frame.chat.topic}</span>
                <span style={{ display: "inline-flex", gap: 6 }}>{frame.chat.pips.map((pip, index) => <span key={index} style={{ width: 7, height: 7, borderRadius: "50%", background: pip, transition: "background .3s ease" }} />)}</span>
              </div>
              <div style={{ minHeight: 270, display: "flex", flexDirection: "column", gap: 14 }}>
                <span style={{ alignSelf: "flex-end", maxWidth: "88%", padding: "12px 16px", borderRadius: "18px 18px 4px 18px", background: "#1A1D22", fontSize: 15, lineHeight: 1.45 }}>{frame.chat.q}<span style={{ display: frame.chat.qCaret, width: 2, height: 16, marginLeft: 2, verticalAlign: "-3px", background: "#F2F4F5", animation: "sfy-blink 1s step-end infinite" }} /></span>
                {frame.chat.showA ? (
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", animation: "sfy-up .3s ease both" }}>
                    <span aria-hidden="true" style={{ flex: "none", width: 30, height: 30, borderRadius: 9, background: "#262A31", display: "grid", placeItems: "center", ...MONO, fontSize: 11, color: "#9AA1AB" }}>AI</span>
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12, fontSize: 15, lineHeight: 1.6, color: "#D7DADE" }}>
                      {frame.chat.thinking ? <span style={{ display: "inline-flex", gap: 5, paddingTop: 9 }}>{[0, 0.15, 0.3].map((delay) => <span key={delay} style={{ width: 7, height: 7, borderRadius: "50%", background: "#9AA1AB", animation: `sfy-dot3 1s ${delay}s infinite` }} />)}</span> : null}
                      <span>{frame.chat.a1}<strong style={{ color: "#F2F4F5", background: "rgba(61,220,132,.14)", padding: "0 4px", borderRadius: 5 }}>{frame.chat.a2}</strong>{frame.chat.a3}{frame.chat.showSite ? <> <span style={{ ...MONO, fontSize: 11, padding: "2px 6px", borderRadius: 6, background: "rgba(77,163,255,.15)", color: "#4DA3FF", animation: "sfy-pop2 .35s ease-out both" }}>{frame.chat.site}</span></> : null}{frame.chat.a4}</span>
                      {frame.chat.done ? <span style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 999, background: "rgba(61,220,132,.1)", border: "1px solid rgba(61,220,132,.5)", color: "#3DDC84", fontSize: 13, fontWeight: 600, animation: "sfy-pop2 .45s ease-out both" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>Named first. That could be your business.</span> : null}
                    </div>
                  </div>
                ) : null}
              </div>
              <span style={{ fontSize: 13, color: "#9AA1AB", lineHeight: 1.5 }}>The businesses that get named are the ones whose websites clearly say what they do, where, and why to trust them.</span>
              <figcaption style={{ fontSize: 12, color: "#7D848E" }}>Illustration with made-up businesses. Real AI answers vary.</figcaption>
            </figure>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "#0A0B0D" }}>How Searchify helps AI find and recommend you</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14 }}>
              {frame.aiCards.map((card) => (
                <div key={card.n} style={{ borderRadius: 20, background: "#0A0B0D", border: "1px solid #0A0B0D", boxShadow: "0 14px 34px rgba(0,0,0,.25)", padding: 22, display: "flex", flexDirection: "column", gap: 10 }}>
                  <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}><span style={{ ...MONO, fontSize: 12, color: "#4DA3FF" }}>{card.n}</span><span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 999, color: card.tagColor, background: card.tagBg }}>{card.tag}</span></span>
                  <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.3px" }}>{card.title}</span>
                  <span style={{ fontSize: 14, color: "#9AA1AB", lineHeight: 1.5 }}>{card.body}</span>
                </div>
              ))}
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#0A0B0D" }}>Straight talk: nobody can promise an AI will mention you. What we can do is make sure nothing on your site is standing in the way.</span>
          </div>
        </section>
      </div>

      <section id="vs" aria-labelledby="vs-h" style={{ maxWidth: 1240, margin: "0 auto", boxSizing: "border-box", padding: "90px clamp(16px, 4vw, 40px) 20px", display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 820 }}>
          <span style={{ fontFamily: "Caveat, cursive", fontSize: 36, color: "#3DDC84", lineHeight: 1 }}>&quot;Can&apos;t I just ask ChatGPT?&quot;</span>
          <h2 id="vs-h" style={{ margin: 0, ...DISPLAY, fontSize: "clamp(34px, 4.4vw, 56px)", lineHeight: 1, letterSpacing: "-1.6px", fontWeight: 700 }}>Here&apos;s the areas we excel in.</h2>
          <p style={{ margin: 0, fontSize: 17, color: "#9AA1AB", lineHeight: 1.55 }}>ChatGPT, Claude and Gemini are brilliant at explaining SEO. We use AI too. But a chat window can&apos;t see your private Google data, can&apos;t log in to your website, and isn&apos;t watching it next week. Searchify connects to all of it, acts on it with your OK, and proves what changed.</p>
        </div>
        <div style={{ borderRadius: 22, border: "1px solid #1A1D22", background: "#101215", overflowX: "auto" }}>
          <div style={{ minWidth: 640 }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr)", gap: 16, padding: "16px 22px", borderBottom: "1px solid #1A1D22", ...MONO, fontSize: 12, color: "#9AA1AB" }}>
              <span /><span>AI CHAT ASSISTANTS</span><span style={{ color: "#3DDC84" }}>SEARCHIFY</span>
            </div>
            {frame.vsRows.map((row) => (
              <div key={row.what} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr)", gap: 16, alignItems: "center", padding: "14px 22px", borderBottom: "1px solid #16181C", fontSize: 15 }}>
                <span style={{ fontWeight: 600 }}>{row.what}</span>
                <span style={{ color: "#9AA1AB" }}>{row.chat}</span>
                <span style={{ display: "flex", gap: 8, alignItems: "flex-start" }}><Check /><span>{row.us}</span></span>
              </div>
            ))}
          </div>
        </div>
        <span style={{ fontSize: 14, color: "#D7DADE" }}>Think of it this way: a chat assistant is a smart friend with good advice. Searchify is the crew that shows up every week, does the job, and shows you the before and after.</span>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", padding: "16px 20px", borderRadius: 18, background: "#101215", border: "1px solid #262A31" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, border: "1px solid #3A404A", fontSize: 11, fontWeight: 700, letterSpacing: ".04em", color: "#9AA1AB" }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>COMING SOON</span>
          <span style={{ flex: "1 1 360px", fontSize: 16, color: "#F2F4F5" }}>Already use Claude, ChatGPT or Gemini? Soon you can just ask it, and Searchify does the work on your website, with your OK.</span>
        </div>
      </section>

      <section id="platforms" aria-labelledby="pl-h" style={{ maxWidth: 1240, margin: "0 auto", boxSizing: "border-box", padding: "80px clamp(16px, 4vw, 40px) 10px" }}>
        <div className="sfy-wglow" style={{ borderRadius: 24, background: "#101215", border: "1px solid #1A1D22", padding: "clamp(22px, 3vw, 32px)", display: "flex", flexWrap: "wrap", gap: "20px 40px", alignItems: "center" }}>
          <div style={{ flex: "1 1 420px", display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 id="pl-h" style={{ margin: 0, ...DISPLAY, fontSize: "clamp(26px, 3vw, 36px)", lineHeight: 1.05, letterSpacing: "-1px", fontWeight: 700 }}>On WordPress? You&apos;re in.</h2>
            <p style={{ margin: 0, fontSize: 16, color: "#9AA1AB", lineHeight: 1.5 }}>WordPress runs about 43% of all websites. Searchify works with it today, plus your Google data. Other platforms are on the way, and you can scan any site for free right now.</p>
          </div>
          <div style={{ flex: "1 1 420px", display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(sample.integrations.live || []).map((name) => <span key={name} style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 40, padding: "0 14px", borderRadius: 999, background: "#101215", border: "1px solid rgba(61,220,132,.4)", fontSize: 14 }}><svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#3DDC84" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>{name}</span>)}
            {(sample.integrations.soon || []).map((name) => <span key={name} style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 40, padding: "0 14px", borderRadius: 999, background: "transparent", border: "1px dashed #3A404A", fontSize: 14, color: "#9AA1AB" }}>{name} · soon</span>)}
          </div>
        </div>
      </section>

      <section id="how" style={{ maxWidth: 1240, margin: "0 auto", boxSizing: "border-box", padding: "110px clamp(16px, 4vw, 40px)", display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 780, marginBottom: 18 }}>
          <h2 style={{ margin: 0, ...DISPLAY, fontSize: "clamp(34px, 4.4vw, 56px)", lineHeight: 1, letterSpacing: "-1.6px", fontWeight: 700 }}>You plug in. We find any issues, and fix it.</h2>
          <p style={{ margin: 0, fontSize: 17, color: "#9AA1AB", lineHeight: 1.55 }}>One thing at a time, in plain words. And we&apos;re honest about the part most SEO tools skip: Google takes a few weeks to reward a change.</p>
        </div>
        {[
          ["01 · PLUG IN", "Connect Google and WordPress", "Two connections, about two minutes. Searchify can only read your Google data, and only changes your website when you say so.", "plug"],
          ["02 · FIX ONE THING", "We write it. You publish it.", "Searchify writes the fix and checks it against its criteria. You approve it, it goes live on your website, and you can undo it any time.", "fix"],
          ["03 · LET IT BAKE", "Then let it bake", "Your fix is live the moment you publish. Google takes a few days to notice it and about four weeks to reward it. There's nothing for you to do. We watch the whole time.", "bake"],
          ["04 · SEE WHAT IT EARNED", "Tangible Change", "Measured from your own Google data, four weeks before and after. If a fix doesn't help, it's undone.", "earn"],
        ].map(([kicker, title, body, kind]) => (
          <div key={kicker} className="sfy-wglow" style={{ borderRadius: 24, background: "#101215", border: "1px solid #1A1D22", padding: "clamp(20px, 3vw, 32px)", display: "flex", flexWrap: "wrap", gap: "24px 44px", alignItems: "center" }}>
            <div style={{ flex: "1 1 280px", maxWidth: 400, display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ ...MONO, fontSize: 12, letterSpacing: ".04em", color: "#4DA3FF" }}>{kicker}</span>
              <h3 style={{ margin: 0, ...DISPLAY, fontSize: "clamp(24px, 2.4vw, 30px)", lineHeight: 1.08, letterSpacing: "-0.7px", fontWeight: 700 }}>{title}</h3>
              <p style={{ margin: 0, fontSize: 16, color: "#9AA1AB", lineHeight: 1.55 }}>{body}</p>
            </div>
            <div aria-hidden="true" style={{ flex: "2 1 520px", minWidth: 0, borderRadius: 18, background: "#0A0B0D", border: "1px solid #1A1D22", padding: 20, display: "flex", flexDirection: "column", gap: 14, minHeight: 230, boxSizing: "border-box", justifyContent: "center" }}>
              {kind === "plug" ? (
                <>
                  {frame.how.plugs.map((row) => (
                    <div key={row.name} className="lv2-plug" style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <span style={{ flex: "0 0 170px", fontSize: 14, fontWeight: 600 }}>{row.name}</span>
                      <span style={{ flex: 1, display: "flex", alignItems: "center" }}>
                        <span style={{ flex: 1, height: 6, borderRadius: 999, background: row.cable, boxShadow: row.glow, transition: "background .4s ease, box-shadow .4s ease" }} />
                        <span style={{ width: 26, height: 18, borderRadius: 5, background: row.cable, transform: `translateX(${row.shift})`, transition: "transform .45s cubic-bezier(.3,1.4,.5,1), background .4s ease" }} />
                        <span style={{ width: 30, height: 30, marginLeft: 4, borderRadius: 8, border: `2px solid ${row.socket}`, boxSizing: "border-box", display: "grid", placeItems: "center" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: row.led, boxShadow: row.ledGlow }} /></span>
                      </span>
                      <span style={{ flex: "0 0 120px", fontSize: 13, fontWeight: 600, color: row.statusColor }}>{row.status}</span>
                    </div>
                  ))}
                  <div style={{ minHeight: 42 }}>{frame.how.plugDone ? <LiveNote>You&apos;re plugged in. Your first scan is starting.</LiveNote> : null}</div>
                </>
              ) : null}
              {kind === "fix" ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                    <div style={{ borderRadius: 12, background: "rgba(255,90,78,.06)", border: "1px solid rgba(255,90,78,.45)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 5 }}><span style={{ ...MONO, fontSize: 10, color: "#FF5A4E" }}>ON YOUR SITE NOW · NOT GOOD ENOUGH</span><span style={{ fontSize: 14, color: "#9AA1AB", textDecoration: "line-through" }}>Roof Repair Services | Northline</span></div>
                    <div style={{ borderRadius: 12, background: "rgba(77,163,255,.06)", border: `1.5px solid ${frame.how.newBorder}`, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 5, transition: "border-color .3s ease" }}><span style={{ ...MONO, fontSize: 10, color: frame.how.newLabelColor }}>{frame.how.newLabel}</span><span style={{ fontSize: 14, color: "#F2F4F5", minHeight: 20 }}>{frame.how.typed}<span style={{ display: frame.how.caret, width: 2, height: 15, marginLeft: 1, verticalAlign: "-2px", background: "#4DA3FF", animation: "sfy-blink 1s step-end infinite" }} /></span></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px 16px" }}>
                    {frame.how.crit.map((item) => <span key={item.t} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: item.color, transition: "color .3s ease" }}><span style={{ width: 12, height: 12, flex: "none", borderRadius: "50%", background: item.dot, animation: item.anim, transition: "background .3s ease" }} />{item.t}</span>)}
                  </div>
                  <div style={{ minHeight: 44, display: "flex", alignItems: "center" }}>
                    {frame.how.canPub ? <span style={{ display: "inline-flex", alignItems: "center", minHeight: 40, padding: "0 18px", borderRadius: 11, background: frame.how.pubBg, color: "#0A0B0D", fontSize: 14, fontWeight: 600, boxShadow: frame.how.pubGlow, transform: `scale(${frame.how.pubScale})`, transition: "all .2s ease" }}>Publish to my website</span> : null}
                    {frame.how.published ? <LiveNote>Congratulations, your fix is live on your website.</LiveNote> : null}
                  </div>
                </>
              ) : null}
              {kind === "bake" ? (
                <>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><span style={{ fontSize: 15, fontWeight: 600 }}>New Google title for roof repair</span><span style={{ ...DISPLAY, fontSize: 22, fontWeight: 800, color: frame.how.dayColor }}>{frame.how.dayLabel}</span></div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
                    {frame.how.segs.map((seg) => (
                      <div key={seg.label} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                        <div style={{ height: 10, borderRadius: 999, backgroundColor: "#1A1D22", overflow: "hidden" }}><div style={{ height: "100%", width: seg.w, borderRadius: 999, backgroundColor: seg.fill.startsWith("repeating") ? "transparent" : seg.fill, backgroundImage: seg.fill.startsWith("repeating") ? seg.fill : "none", backgroundSize: "24px 10px", animation: seg.anim }} /></div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: seg.labelColor }}>{seg.label}</span>
                        <span style={{ fontSize: 11, color: "#7D848E" }}>{seg.sub}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ minHeight: 44, display: "flex", alignItems: "center" }}>
                    {frame.how.baking ? <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 999, background: "rgba(61,220,132,.08)", border: "1px solid rgba(61,220,132,.4)", color: "#3DDC84", fontSize: 13, fontWeight: 600 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>No action needed from you. Let it bake.</span> : null}
                    {frame.how.baked ? <LiveNote>Result is in: #9 → #5 on Google.</LiveNote> : null}
                  </div>
                </>
              ) : null}
              {kind === "earn" ? (
                <>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "20px 32px", alignItems: "flex-end" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ display: "flex", alignItems: "baseline", gap: 10 }}><span style={{ ...DISPLAY, fontSize: 64, lineHeight: 0.9, fontWeight: 800, letterSpacing: "-2px", color: "#3DDC84" }}>+{frame.how.vis}</span><span style={{ fontSize: 15, color: "#9AA1AB" }}>visitors a month</span></span>
                      <span style={{ fontSize: 14, color: "#D7DADE" }}>#{frame.how.rank} on Google · about {frame.how.calls} more calls a month</span>
                    </div>
                    <div style={{ flex: "1 1 240px", display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ height: 110, display: "flex", alignItems: "flex-end", gap: 6 }}>{frame.how.bars.map((bar, index) => <div key={index} style={{ flex: 1, height: bar.h, borderRadius: "6px 6px 2px 2px", background: bar.c, transition: "height .3s ease" }} />)}</div>
                      <span style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#7D848E" }}><span>4 weeks before</span><span>4 weeks after</span></span>
                    </div>
                  </div>
                  <div style={{ minHeight: 44, display: "flex", alignItems: "center" }}>{frame.how.earned ? <LiveNote>Congratulations: this fix earned +64 visitors a month.</LiveNote> : null}</div>
                </>
              ) : null}
            </div>
          </div>
        ))}
      </section>

      <section style={{ background: color, borderTop: "1px solid #1A1D22", borderBottom: "1px solid #1A1D22", transition: "background .45s ease" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", boxSizing: "border-box", padding: "100px clamp(16px, 4vw, 40px)", display: "flex", flexWrap: "wrap", gap: 48, alignItems: "center" }}>
          <div style={{ flex: "1 1 380px", display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ margin: 0, ...DISPLAY, fontSize: "clamp(34px, 4.4vw, 56px)", lineHeight: 1, letterSpacing: "-1.6px", fontWeight: 700, color: "#0A0B0D", transition: "color .3s ease" }}>Every task, colour-coded.</h2>
            <p style={{ margin: 0, fontSize: 17, color: "rgba(10,11,13,.75)", lineHeight: 1.5, maxWidth: 460 }}>No 40-tab SEO dashboard. One board that tells you what&apos;s urgent, what can wait, and what to leave alone.</p>
          </div>
          <div role="group" aria-label="Pick a colour to see it in action" style={{ flex: "1 1 460px", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            {frame.keys.map((key) => {
              const on = key === tile;
              const [label, desc] = frame.tileCopy[key];
              return (
                <button key={key} type="button" aria-pressed={on} onClick={() => { setTile(key); setShipped(false); }} style={{ textAlign: "left", fontFamily: "inherit", color: on ? "#F2F4F5" : "#0A0B0D", cursor: "pointer", borderRadius: 18, padding: 20, background: on ? "#0A0B0D" : "rgba(255,255,255,.2)", border: `1px solid ${on ? "#0A0B0D" : "rgba(10,11,13,.28)"}`, boxShadow: on ? "0 14px 34px rgba(0,0,0,.35)" : "none", display: "flex", flexDirection: "column", gap: 8, transition: "border-color .25s ease, box-shadow .25s ease, background .25s ease" }}>
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}><span style={{ width: 16, height: 16, borderRadius: "50%", background: frame.colors[key], boxShadow: on ? `0 0 12px ${frame.colors[key]}` : "0 0 0 2px rgba(10,11,13,.55)", animation: on ? "sfy-flicker 1.4s ease-in-out infinite" : "none" }} /><span style={{ ...MONO, fontSize: 11, color: on ? frame.colors[key] : "rgba(10,11,13,.6)" }}>{on ? "SHOWING ↓" : "TAP TO SEE"}</span></span>
                  <span style={{ fontSize: 17, fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 14, color: on ? "#9AA1AB" : "rgba(10,11,13,.72)" }}>{desc}</span>
                </button>
              );
            })}
          </div>
          <div aria-live="polite" style={{ flex: "1 1 100%", minWidth: 0, borderRadius: 24, background: "#0A0B0D", border: "1px solid #0A0B0D", boxShadow: "0 24px 60px rgba(0,0,0,.35)", padding: "clamp(20px, 3vw, 32px)", display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, ...MONO, fontSize: 12, color }}><span style={{ width: 9, height: 9, borderRadius: "50%", background: color, boxShadow: `0 0 10px ${color}` }} />{scene.tag}</span>
              <span style={{ color: "#3A404A" }}>·</span>
              <span style={{ ...MONO, fontSize: 12, color: "#9AA1AB" }}>{scene.page}</span>
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#7D848E" }}>Example from a real-style scan</span>
            </div>
            <h3 style={{ margin: 0, ...DISPLAY, fontSize: "clamp(24px, 2.8vw, 34px)", lineHeight: 1.08, letterSpacing: "-0.8px", fontWeight: 700 }}>{scene.title}</h3>
            {scene.isFix ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                  <div style={{ borderRadius: 16, background: "#101215", border: "1px solid #1A1D22", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 6 }}><span style={{ ...MONO, fontSize: 11, color: "#7D848E" }}>IN GOOGLE NOW</span><span style={{ fontSize: 17, color: "#8AB4F8", lineHeight: 1.35 }}>{scene.beforeT}</span><span style={{ fontSize: 14, color: "#9AA1AB", lineHeight: 1.45 }}>{scene.beforeD}</span></div>
                  <div style={{ borderRadius: 16, background: "rgba(77,163,255,.06)", border: `1.5px solid ${shipped ? "#3DDC84" : "#4DA3FF"}`, boxShadow: "0 0 24px rgba(77,163,255,.25)", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 6 }}><span style={{ ...MONO, fontSize: 11, color: shipped ? "#3DDC84" : "#4DA3FF" }}>{shipped ? "LIVE IN GOOGLE · CHECKED" : "WE SUGGEST"}</span><span style={{ fontSize: 17, color: "#8AB4F8", lineHeight: 1.35 }}>{scene.afterT}</span><span style={{ fontSize: 14, color: "#D7DADE", lineHeight: 1.45 }}>{scene.afterD}</span></div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ ...DISPLAY, fontSize: 24, fontWeight: 700, color: "#3DDC84", marginRight: "auto" }}>{scene.gain}</span>
                  {!shipped ? <button type="button" onClick={() => setShipped(true)} style={{ minHeight: 50, padding: "0 24px", borderRadius: 14, border: 0, background: "#4DA3FF", color: "#0A0B0D", fontWeight: 600, fontSize: 15, cursor: "pointer", boxShadow: "0 0 22px rgba(77,163,255,.45)" }}>Try it: Publish it</button> : (
                    <div style={{ flex: "1 1 100%", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", padding: "16px 18px", borderRadius: 16, background: "rgba(61,220,132,.08)", border: "1px solid rgba(61,220,132,.55)", boxShadow: "0 0 30px rgba(61,220,132,.15)", animation: "sfy-up .35s ease both" }}>
                      <span style={{ position: "relative", width: 46, height: 46, flex: "none", display: "grid", placeItems: "center" }}><span style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid #3DDC84", animation: "sfy-ring2 1.6s ease-out infinite" }} /><span style={{ position: "relative", width: 38, height: 38, borderRadius: "50%", background: "#3DDC84", boxShadow: "0 0 22px rgba(61,220,132,.7)", display: "grid", placeItems: "center", animation: "sfy-pop2 .5s ease-out both" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A0B0D" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg></span></span>
                      <span style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: 3 }}><strong style={{ fontSize: 16, color: "#F2F4F5" }}>Congratulations, your fix is live on your website.</strong><span style={{ fontSize: 13, color: "#9AA1AB", lineHeight: 1.5 }}>Checked live and saved in your change log. Google usually notices within a few days.</span></span>
                      <button type="button" onClick={() => setShipped(false)} style={{ minHeight: 44, padding: "0 16px", borderRadius: 12, border: "1px solid #262A31", background: "transparent", color: "#F2F4F5", fontWeight: 500, fontSize: 14 }}>Undo</button>
                    </div>
                  )}
                </div>
              </>
            ) : null}
            {scene.isList ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                  {scene.rows.map((row) => (
                    <div key={row.title} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, background: "#101215", border: "1px solid #1A1D22" }}>
                      <span style={{ flex: "none", width: 26, height: 26, borderRadius: "50%", display: "grid", placeItems: "center", background: row.bg, color: row.fg, fontSize: 13, fontWeight: 700 }}>{row.icon}</span>
                      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}><span style={{ fontSize: 14, fontWeight: 500 }}>{row.title}</span><span style={{ ...MONO, fontSize: 11, color: "#7D848E" }}>{row.sub}</span></span>
                    </div>
                  ))}
                </div>
                <span style={{ fontSize: 14, color: "#9AA1AB", lineHeight: 1.5 }}>{scene.foot}</span>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1240, margin: "0 auto", boxSizing: "border-box", padding: "100px clamp(16px, 4vw, 40px)", display: "flex", flexDirection: "column", gap: 36 }}>
        <h2 style={{ margin: 0, ...DISPLAY, fontSize: "clamp(34px, 4.4vw, 56px)", lineHeight: 1, letterSpacing: "-1.6px", fontWeight: 700, maxWidth: 720 }}>Automation you can actually trust with a client&apos;s site.</h2>
        <div style={{ borderRadius: 28, background: "#101215", border: "1px solid rgba(77,163,255,.45)", boxShadow: "0 0 40px rgba(77,163,255,.12)", padding: "clamp(24px, 3.5vw, 44px)", display: "flex", flexWrap: "wrap", gap: 36, alignItems: "center" }}>
          <div style={{ flex: "1 1 340px", minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            <span style={{ alignSelf: "flex-start", ...MONO, fontSize: 12, color: "#0A0B0D", background: "#4DA3FF", padding: "5px 10px", borderRadius: 999, fontWeight: 600 }}>ONLY IN SEARCHIFY · THE CHANGE LOG</span>
            <h3 style={{ margin: 0, ...DISPLAY, fontSize: "clamp(28px, 3.2vw, 40px)", lineHeight: 1.04, letterSpacing: "-1px", fontWeight: 700 }}>Every change is recorded, reversible and reported.</h3>
            <p style={{ margin: 0, fontSize: 16, color: "#9AA1AB", lineHeight: 1.55 }}>Searchify keeps its own change log tab for every site. You see exactly what changed, on which page, and when — titles, descriptions, images, links, content. Undo any change in one click, or roll a page back to any earlier version. Every change and every reversal flows straight into the report your client or boss receives.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["↺ Undo in one click", "⟲ Roll back to any version", "✉ Reported automatically"].map((item) => <span key={item} style={{ fontSize: 13, padding: "6px 12px", borderRadius: 999, border: "1px solid #262A31", color: "#D7DADE" }}>{item}</span>)}
            </div>
          </div>
          <div style={{ flex: "1 1 420px", minWidth: 0, borderRadius: 20, background: "#0A0B0D", border: "1px solid #1A1D22", padding: 8, display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px 8px" }}><span style={{ fontSize: 13, fontWeight: 600 }}>Change log · northline.example</span><span style={{ ...MONO, fontSize: 11, color: "#7D848E" }}>LIVE DEMO</span></div>
            {CHANGE_LOG.map((row) => {
              const off = !!undone[row.id];
              return (
                <div key={row.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, background: off ? "rgba(255,197,61,.06)" : "transparent", transition: "background .3s ease" }}>
                  <span style={{ flex: "none", ...MONO, fontSize: 10, padding: "3px 7px", borderRadius: 6, background: "#1A1D22", color: "#D7DADE" }}>{row.type}</span>
                  <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}><span style={{ fontSize: 14, textDecoration: off ? "line-through" : "none", color: off ? "#7D848E" : "#F2F4F5" }}>{row.what}</span><span style={{ ...MONO, fontSize: 11, color: off ? "#FFC53D" : "#7D848E" }}>{off ? "Reverted to the previous version · client report updated" : row.sub}</span></span>
                  <button type="button" onClick={() => setUndone((prev) => ({ ...prev, [row.id]: !prev[row.id] }))} style={{ flex: "none", minHeight: 36, padding: "0 12px", borderRadius: 10, border: `1px solid ${off ? "rgba(255,197,61,.5)" : "#262A31"}`, background: "transparent", color: off ? "#FFC53D" : "#F2F4F5", fontWeight: 500, fontSize: 13 }}>{off ? "Redo" : "Undo"}</button>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          {[["You approve every change", "Searchify drafts. You decide. Edit anything first.", "#4DA3FF"], ["Checked live", "After shipping, it reads the page back to confirm it matches.", "#262A31"], ["Nothing is ever lost", "The old version of every change is saved in the change log, forever.", "#262A31"], ["Winners stay locked", "Pages that already perform are off-limits.", "#262A31"]].map(([title, body, bar]) => (
            <div key={title} style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: `2px solid ${bar}`, paddingTop: 16 }}><span style={{ fontSize: 17, fontWeight: 600 }}>{title}</span><span style={{ fontSize: 14, color: "#9AA1AB", lineHeight: 1.5 }}>{body}</span></div>
          ))}
        </div>
      </section>

      <div className="sfy-gold" style={{ background: "linear-gradient(135deg, #B8862B 0%, #E9C25A 38%, #F6DC8A 52%, #D9A93F 70%, #B07D26 100%)", borderTop: "1px solid #1A1D22", borderBottom: "1px solid #1A1D22" }}>
        <section id="testimonials" aria-labelledby="tm-h" style={{ maxWidth: 1240, margin: "0 auto", boxSizing: "border-box", padding: "90px clamp(16px, 4vw, 40px)", display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 760 }}>
            <span style={{ fontFamily: "Caveat, cursive", fontSize: 36, color: "#0A0B0D", lineHeight: 1 }}>Real businesses. Real results.</span>
            <h2 id="tm-h" style={{ margin: 0, ...DISPLAY, fontSize: "clamp(34px, 4.4vw, 56px)", lineHeight: 1, letterSpacing: "-1.6px", fontWeight: 700, color: "#0A0B0D" }}>What Searchify has done for them.</h2>
          </div>
          <article className="sfy-wglow" style={{ borderRadius: 26, background: "#101215", border: "1px solid #1A1D22", padding: "clamp(20px, 3vw, 32px)", display: "flex", flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: "24px 44px" }}>
            <div aria-hidden="true" style={{ flex: "1.6 1 520px", minWidth: 0, position: "relative", height: 330, borderRadius: 18, background: "#0A0B0D", border: "1px solid #1A1D22", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: 0, zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "linear-gradient(#0A0B0D 70%, rgba(10,11,13,0))" }}>
                <span style={{ ...MONO, fontSize: 11, color: "#7D848E" }}>{sample.clients.soap.region}</span>
                <span style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}><span style={{ ...DISPLAY, fontSize: 26, fontWeight: 800, color: "#3DDC84" }}>{frame.soap.count}</span><span style={{ fontSize: 12, color: "#9AA1AB" }}>keywords at #1</span></span>
              </div>
              <div style={{ position: "absolute", left: 0, right: 0, top: 50, padding: "0 14px", animation: "sfy-ticker 9s linear infinite" }}>
                {frame.soap.rows.map((row, index) => (
                  <div key={`${row.kw}-${index}`} style={{ height: 40, display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #16181C" }}>
                    <span style={{ flex: "none", width: 34, height: 24, borderRadius: 7, background: "rgba(61,220,132,.16)", color: "#3DDC84", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800 }}>#1</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: "#F2F4F5", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.kw}</span>
                    <span style={{ flex: "none", fontSize: 12, color: "#3DDC84" }}>▲ {row.up}</span>
                  </div>
                ))}
              </div>
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 60, zIndex: 2, background: "linear-gradient(rgba(10,11,13,0), #0A0B0D)" }} />
            </div>
            <Story client={sample.clients.soap} />
          </article>
          <article className="sfy-wglow" style={{ borderRadius: 26, background: "#101215", border: "1px solid #1A1D22", padding: "clamp(20px, 3vw, 32px)", display: "flex", flexDirection: "row-reverse", flexWrap: "wrap", alignItems: "center", gap: "24px 44px" }}>
            <div aria-hidden="true" style={{ flex: "1.6 1 520px", minWidth: 0, position: "relative", height: 330, borderRadius: 18, background: "#0A0B0D", border: "1px solid #1A1D22", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 14, right: 14, top: 12, zIndex: 2, display: "flex", alignItems: "center", gap: 8, height: 34, padding: "0 12px", borderRadius: 999, background: "#F7F8FA", color: "#202124", fontSize: 13 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5F6368" strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
                <span>{sample.clients.aca.query}</span>
              </div>
              {frame.acaRows.map((row) => (
                <div key={row.key} style={{ position: "absolute", left: 14, right: 14, top: row.top, height: 42, display: "flex", alignItems: "center", gap: 10, padding: "0 14px", borderRadius: 11, background: row.bg, border: `1px solid ${row.border}`, boxShadow: row.glow, transition: "top .7s cubic-bezier(.3,1.2,.5,1), background .4s ease, box-shadow .4s ease" }}>
                  <span style={{ flex: "none", width: 28, fontSize: 12, fontWeight: 800, color: row.rankColor }}>#{row.rank}</span>
                  {row.isUs ? <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: "#F2F4F5", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sample.clients.aca.name}</span> : <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}><span style={{ width: row.w, height: 7, borderRadius: 4, background: "#262A31" }} /><span style={{ width: "40%", height: 5, borderRadius: 3, background: "#1A1D22" }} /></span>}
                  {row.showTop ? <span style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 9px", borderRadius: 999, background: "#3DDC84", color: "#0A0B0D", fontSize: 11, fontWeight: 700, animation: "sfy-pop2 .45s ease-out both" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>{sample.clients.aca.rankBadge}</span> : null}
                </div>
              ))}
            </div>
            <Story client={sample.clients.aca} />
          </article>
          <article className="sfy-wglow" style={{ borderRadius: 26, background: "#101215", border: "1px solid #1A1D22", padding: "clamp(20px, 3vw, 32px)", display: "flex", flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: "24px 44px" }}>
            <div aria-hidden="true" style={{ flex: "1.6 1 520px", minWidth: 0, position: "relative", height: 330, borderRadius: 18, background: "#0A0B0D", border: "1px solid #1A1D22", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 14, right: 14, top: 12, zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "7px 12px 7px 8px", borderRadius: 12, background: "#16181C", border: `1px solid ${frame.phys.callBorder}`, transition: "border-color .3s ease" }}>
                  <span style={{ width: 28, height: 28, borderRadius: "50%", background: frame.phys.callBg, display: "grid", placeItems: "center", animation: frame.phys.ring }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0A0B0D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg></span>
                  <span style={{ display: "flex", flexDirection: "column" }}><span style={{ fontSize: 12, fontWeight: 600, color: "#F2F4F5" }}>{frame.phys.callTitle}</span><span style={{ fontSize: 11, color: "#9AA1AB" }}>{frame.phys.callSub}</span></span>
                </span>
                <span style={{ textAlign: "right", display: "flex", flexDirection: "column" }}><span style={{ ...DISPLAY, fontSize: 24, fontWeight: 800, color: "#3DDC84", lineHeight: 1 }}>{frame.phys.booked}</span><span style={{ fontSize: 11, color: "#9AA1AB" }}>booked this week</span></span>
              </div>
              <div style={{ position: "absolute", left: 14, right: 14, top: 80, bottom: 12, display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 6 }}>
                {frame.phys.days.map((day) => (
                  <div key={day.name} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#7D848E", textAlign: "center" }}>{day.name}</span>
                    {day.slots.map((slot, index) => <span key={index} style={{ flex: 1, borderRadius: 6, background: slot.bg, border: `1px solid ${slot.border}`, display: "grid", placeItems: "center", fontSize: 9, fontWeight: 700, color: "#0A0B0D", animation: slot.anim, transition: "background .3s ease" }}>{slot.t}</span>)}
                  </div>
                ))}
              </div>
            </div>
            <Story client={sample.clients.physio} />
          </article>
        </section>
      </div>

      <section id="agencies" style={{ maxWidth: 1240, margin: "0 auto", boxSizing: "border-box", padding: "90px clamp(16px, 4vw, 40px) 100px" }}>
        <div style={{ borderRadius: 28, background: "#101215", border: "1px solid #1A1D22", padding: "clamp(28px, 4vw, 56px)", display: "flex", flexWrap: "wrap", gap: 40, alignItems: "center" }}>
          <div style={{ flex: "1 1 380px", display: "flex", flexDirection: "column", gap: 14 }}>
            <span style={{ ...MONO, fontSize: 12, color: "#9AA1AB" }}>FOR AGENCIES</span>
            <h2 style={{ margin: 0, ...DISPLAY, fontSize: "clamp(30px, 3.6vw, 46px)", lineHeight: 1.02, letterSpacing: "-1.2px", fontWeight: 700 }}>Every client on one screen. Reports that write themselves.</h2>
            <p style={{ margin: 0, fontSize: 16, color: "#9AA1AB", lineHeight: 1.5 }}>See which client needs attention, approve fixes across sites, and send a branded monthly report showing exactly what you published and what it earned.</p>
          </div>
          <div aria-hidden="true" style={{ flex: "1 1 380px", display: "flex", flexDirection: "column", gap: 10 }}>
            {[["#FF5A4E", "Northline Roofing", "6 urgent", "0 0 10px #FF5A4E"], ["#FFC53D", "Bowvalley Dental", "4 worth doing", "none"], ["#4DA3FF", "Prairie Coffee Co.", "all clear", "none"]].map(([dot, name, note, glow]) => (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, background: "#0A0B0D", border: "1px solid #1A1D22" }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: dot, boxShadow: glow }} /><span style={{ flex: 1, fontSize: 14 }}>{name}</span><span style={{ ...MONO, fontSize: 12, color: "#9AA1AB" }}>{note}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Managed" style={{ maxWidth: 1240, margin: "0 auto", boxSizing: "border-box", padding: "0 clamp(16px, 4vw, 40px) 60px" }}>
        <div style={{ borderRadius: 24, background: "rgba(61,220,132,.05)", border: "1px solid rgba(61,220,132,.4)", padding: "clamp(22px, 3vw, 32px)", display: "flex", flexWrap: "wrap", gap: "18px 32px", alignItems: "center" }}>
          <div style={{ flex: "1 1 460px", display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ ...MONO, fontSize: 12, color: "#3DDC84" }}>RATHER NOT DO IT YOURSELF?</span>
            <h2 style={{ margin: 0, ...DISPLAY, fontSize: "clamp(26px, 3vw, 36px)", lineHeight: 1.05, letterSpacing: "-1px", fontWeight: 700 }}>Our team runs Searchify for you.</h2>
            <p style={{ margin: 0, fontSize: 16, color: "#D7DADE", lineHeight: 1.5 }}>One 20-minute kickoff call, then a short email each month. Your strategist finds, writes and publishes every fix. From $599 a month.</p>
          </div>
          <Link href="/pricing" style={{ flex: "none", display: "inline-flex", alignItems: "center", minHeight: 52, padding: "0 22px", borderRadius: 14, background: "#3DDC84", color: "#0A0B0D", textDecoration: "none", fontSize: 15, fontWeight: 600 }}>See how Managed works →</Link>
        </div>
      </section>

      <section className="lv2-final" style={{ maxWidth: 1240, margin: "0 auto", boxSizing: "border-box", padding: "40px clamp(16px, 4vw, 40px) 120px", display: "flex", flexDirection: "column", alignItems: "center", gap: 22, textAlign: "center" }}>
        <h2 style={{ margin: 0, ...DISPLAY, fontSize: "clamp(38px, 5vw, 68px)", lineHeight: 0.98, letterSpacing: "-2px", fontWeight: 800, maxWidth: 820 }}>Find out if Google, and AI, can find you.</h2>
        <form onSubmit={(event) => { event.preventDefault(); goScan(footUrl); }} style={{ display: "flex", flexWrap: "wrap", gap: 10, width: "100%", maxWidth: 560, justifyContent: "center" }}>
          <label htmlFor="foot-url" style={{ flex: "1 1 260px", display: "flex", alignItems: "center", minHeight: 60, padding: "0 18px", borderRadius: 14, background: "#131519", border: "1px solid #262A31" }}>
            <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Your website</span>
            <input id="foot-url" type="text" inputMode="url" autoComplete="url" placeholder="yourwebsite.com" value={footUrl} onChange={(event) => setFootUrl(event.target.value)} style={{ flex: 1, minWidth: 0, border: 0, outline: "none", background: "transparent", color: "#F2F4F5", fontFamily: "inherit", fontSize: 18 }} />
          </label>
          <button type="submit" style={{ display: "inline-flex", alignItems: "center", minHeight: 60, padding: "0 26px", borderRadius: 14, border: 0, background: "#4DA3FF", color: "#0A0B0D", fontSize: 16, fontWeight: 600, boxShadow: "0 0 28px rgba(77,163,255,.5)" }}>Scan it free</button>
        </form>
      </section>

      <footer style={{ borderTop: "1px solid #1A1D22" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", boxSizing: "border-box", padding: "28px clamp(16px, 4vw, 40px)", display: "flex", flexWrap: "wrap", gap: "14px 28px", fontSize: 13, color: "#7D848E" }}>
          <span style={{ marginRight: "auto" }}>© Searchify</span>
          <Link href="/pricing" style={{ color: "#9AA1AB", textDecoration: "none" }}>Pricing</Link>
          <Link href="/partners" style={{ color: "#9AA1AB", textDecoration: "none" }}>Affiliates</Link>
          <Link href="/privacy" style={{ color: "#9AA1AB", textDecoration: "none" }}>Privacy</Link>
          <Link href="/terms" style={{ color: "#9AA1AB", textDecoration: "none" }}>Terms</Link>
          <Link href="/contact" style={{ color: "#9AA1AB", textDecoration: "none" }}>Contact</Link>
        </div>
      </footer>
    </div>
  );
}

function Story({ client }) {
  return (
    <div style={{ flex: "1 1 320px", minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "clamp(26px, 2.6vw, 34px)", fontWeight: 700, letterSpacing: "-0.8px", lineHeight: 1.05 }}>{client.name}</span>
      <Badges badges={client.badges} />
      <span style={{ fontSize: 14, color: "#9AA1AB" }}>{client.place}</span>
      <p style={{ margin: "4px 0 0", fontSize: 17, color: "#D7DADE", lineHeight: 1.55 }}>{client.story}</p>
      <Stats rows={(client.stats || []).map((item) => ({ ...item, color: { green: "#3DDC84", blue: "#4DA3FF", yellow: "#FFC53D", red: "#FF5A4E" }[item.tone] || "#F2F4F5" }))} />
    </div>
  );
}

function LiveNote({ children }) {
  return (
    <span style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 12, background: "rgba(61,220,132,.1)", border: "1px solid rgba(61,220,132,.55)", color: "#F2F4F5", fontSize: 14, fontWeight: 600, boxShadow: "0 0 26px rgba(61,220,132,.2)", animation: "sfy-pop2 .5s ease-out both" }}>
      <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#3DDC84", display: "grid", placeItems: "center" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0A0B0D" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></span>
      {children}
    </span>
  );
}
