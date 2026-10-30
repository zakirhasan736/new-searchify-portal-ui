"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SearchifyMark from "@/components/landing/SearchifyMark";

const NAV = [
  { href: "/#testimonials", label: "Testimonials" },
  { href: "/#ai", label: "AI search" },
  { href: "/#platforms", label: "Integrations" },
  { href: "/#vs", label: "Why Searchify" },
  { href: "/#how", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/login", label: "Sign in" },
];

const COLS = [
  [255, 90, 78],
  [255, 159, 67],
  [255, 197, 61],
  [61, 220, 132],
  [44, 199, 192],
  [77, 163, 255],
];

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function HomeBrandHero() {
  const heroRef = useRef(null);
  const lockupRef = useRef(null);
  const navRef = useRef(null);
  const goRestRef = useRef(() => {});
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const heroEl = heroRef.current;
    if (!heroEl) return undefined;

    const reduce = prefersReducedMotion();
    let g = {};
    let L = {};
    let raf = null;
    let last = 0;
    let waving = false;
    let busy = false;
    let ty = null;
    let resizeTimer = null;
    const intervals = [];
    const timeouts = [];

    const rnd = (a, b) => a + Math.random() * (b - a);
    const pos = (c, k) => [(c + 0.5) * g.cell, g.H / 2 + k * g.cell];
    const calm = (c, k) => {
      const p = pos(c, k);
      return (
        c < 0 ||
        c > 23 ||
        (p[0] > g.x0 && p[0] < g.x1 && p[1] > g.y0 && p[1] < g.y1) ||
        p[1] < g.navB + 4 ||
        p[1] < -g.cell ||
        p[1] > g.H + g.cell
      );
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const light = (c, k, level, hold, flash) => {
      if (calm(c, k)) return false;
      const key = `${c},${k}`;
      const d = L[key] || (L[key] = { c, k, b: 0 });
      d.t = level == null ? rnd(0.45, 1) : level;
      d.b = Math.max(d.b, flash == null ? Math.min(1.35, d.t + 0.45) : flash);
      d.off = hold ? performance.now() + hold : 0;
      d.wave = false;
      kick();
      return d;
    };

    const paint = () => {
      const R = g.R;
      const layers = [];
      let n = 0;
      for (const key in L) {
        const d = L[key];
        const b = d.b;
        if (b < 0.02) continue;
        const p = pos(d.c, d.k);
        const col = COLS[Math.floor(d.c / 4)];
        const a = Math.min(1, b);
        const rgb = `${col[0]},${col[1]},${col[2]}`;
        const gl = d.wave ? 3.6 : 2.9;
        const ga = (0.3 + 0.25 * Math.min(1, b)) * a;
        const hot = Math.max(0, b - 1) / 0.35;
        const x = `${p[0].toFixed(1)}px ${p[1].toFixed(1)}px`;
        const m = 0.75 * Math.min(1, hot);
        const core = `${Math.round(col[0] + (255 - col[0]) * m)},${Math.round(col[1] + (255 - col[1]) * m)},${Math.round(col[2] + (255 - col[2]) * m)}`;
        layers.push(
          `radial-gradient(circle at ${x}, rgba(${core},${a.toFixed(2)}) 0, rgba(${core},${a.toFixed(2)}) ${(R * 0.55).toFixed(1)}px, rgba(${rgb},${a.toFixed(2)}) ${R.toFixed(1)}px, rgba(${rgb},${ga.toFixed(2)}) ${(R + 1).toFixed(1)}px, rgba(${rgb},0) ${(R * gl * (0.8 + 0.4 * Math.min(1.3, b))).toFixed(1)}px)`
        );
        n += 1;
      }
      layers.push("radial-gradient(ellipse 30% 13% at 50% 50%, rgba(10,11,13,.72), rgba(10,11,13,0))");
      layers.push(`radial-gradient(circle, #1A1D22 0, #1A1D22 ${R.toFixed(1)}px, rgba(26,29,34,0) ${(R + 1).toFixed(1)}px)`);
      const sz = [];
      const ps = [];
      const rp = [];
      for (let i = 0; i < n + 1; i += 1) {
        sz.push("100% 100%");
        ps.push("0 0");
        rp.push("no-repeat");
      }
      sz.push(`${g.cell.toFixed(2)}px ${g.cell.toFixed(2)}px`);
      ps.push(`0 ${((g.H / 2 - g.cell / 2) % g.cell).toFixed(2)}px`);
      rp.push("repeat");
      heroEl.style.backgroundImage = layers.join(",");
      heroEl.style.backgroundSize = sz.join(",");
      heroEl.style.backgroundPosition = ps.join(",");
      heroEl.style.backgroundRepeat = rp.join(",");
    };

    function frame(now) {
      raf = null;
      const dt = Math.min(64, now - (last || now));
      last = now;
      let moving = false;
      for (const key in L) {
        const d = L[key];
        if (d.off && now >= d.off) {
          d.t = 0;
          d.off = 0;
        }
        const target = d.t;
        const speed = target < d.b ? (target === 0 ? (d.wave ? 0.022 : 0.012) : 0.014) : 0.035;
        let nb = d.b + (target - d.b) * Math.min(1, speed * dt);
        if (Math.abs(nb - target) < 0.01) nb = target;
        else moving = true;
        d.b = nb;
        if (d.t === 0 && d.b < 0.02) delete L[key];
      }
      paint();
      if (moving) kick();
      else last = 0;
    }

    const count = () => {
      let n = 0;
      for (const k in L) if (L[k].t > 0) n += 1;
      return n;
    };

    const geo = () => {
      const W = heroEl.clientWidth;
      const H = heroEl.clientHeight;
      const cell = W / 24;
      const K = Math.ceil(H / 2 / cell) + 1;
      const hr = heroEl.getBoundingClientRect();
      const lr = (lockupRef.current || heroEl).getBoundingClientRect();
      const nv = (navRef.current || heroEl).getBoundingClientRect();
      g = {
        W,
        H,
        cell,
        K,
        R: Math.max(3, cell * 0.15),
        x0: lr.left - hr.left - cell * 0.7,
        x1: lr.right - hr.left + cell * 0.7,
        y0: lr.top - hr.top - cell * 0.7,
        y1: lr.bottom - hr.top + cell * 0.7,
        navB: nv.bottom - hr.top,
      };
    };

    const seed = () => {
      L = {};
      let x = 7;
      for (let k = -g.K; k <= g.K; k += 1) {
        for (let c = 0; c < 24; c += 1) {
          x = (x * 9301 + 49297) % 233280;
          if (x / 233280 < 0.15) {
            const d = light(c, k, rnd(0.4, 1), rnd(400, 5200), 0);
            if (d) d.b = d.t;
          }
        }
      }
      paint();
    };

    const start = () => {
      geo();
      seed();
    };

    const tick = () => {
      const V = Math.floor(g.H / 2 / g.cell);
      const target = 24 * (2 * V + 1) * 0.16;
      let made = 0;
      let tries = 0;
      while (made < 2 && tries < 20) {
        tries += 1;
        if (count() < target * 1.1 && light(Math.floor(Math.random() * 24), Math.floor(Math.random() * (2 * V + 1)) - V, null, rnd(1800, 5200))) {
          made += 1;
        }
      }
    };

    const runWave = () => {
      if (waving) return;
      waving = true;
      const step = 62;
      for (let c = 0; c < 24; c += 1) {
        timeouts.push(
          setTimeout(() => {
            for (let k = -g.K; k <= g.K; k += 1) {
              if (Math.random() < 0.66) {
                const kk = k;
                timeouts.push(
                  setTimeout(() => {
                    const lv = Math.random() < 0.25 ? rnd(0.85, 1) : rnd(0.25, 0.8);
                    const key = `${c},${kk}`;
                    const prev = L[key] && L[key].t > 0 ? { t: L[key].t, off: L[key].off } : null;
                    const d = light(c, kk, lv, rnd(90, 320), lv + rnd(0.25, 0.5));
                    if (d) {
                      d.wave = true;
                      if (prev) {
                        d.t = prev.t;
                        d.off = prev.off;
                        d.wave = false;
                      }
                    }
                  }, rnd(0, 120))
                );
              }
            }
            if (c === 23) timeouts.push(setTimeout(() => { waving = false; }, 800));
          }, c * step)
        );
      }
    };

    const inHero = () => window.scrollY < heroEl.offsetHeight - 4;
    const goRest = () => {
      if (busy) return;
      busy = true;
      const rest = document.getElementById("rest");
      rest?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      timeouts.push(setTimeout(() => { busy = false; }, 900));
    };

    const onMove = (e) => {
      const r = heroEl.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const c = Math.round(x / g.cell - 0.5);
      const k = Math.round((y - g.H / 2) / g.cell);
      const key = `${c},${k}`;
      if (!L[key] || L[key].t === 0) light(c, k, rnd(0.85, 1), rnd(1100, 2200), 1.35);
    };

    const onWheel = (e) => {
      if (e.deltaY > 0 && inHero()) {
        e.preventDefault();
        goRest();
      }
    };
    const onTouchStart = (e) => {
      ty = e.touches[0].clientY;
    };
    const onTouchMove = (e) => {
      if (ty !== null && ty - e.touches[0].clientY > 8 && inHero()) {
        e.preventDefault();
        goRest();
        ty = null;
      }
    };
    const onKey = (e) => {
      if (
        inHero() &&
        ["ArrowDown", "PageDown", " ", "Spacebar"].includes(e.key) &&
        !/input|textarea/i.test(e.target?.tagName || "")
      ) {
        e.preventDefault();
        goRest();
      }
    };
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(start, 150);
    };

    start();
    if (document.fonts?.ready) document.fonts.ready.then(start).catch(() => {});

    heroEl.addEventListener("mousemove", onMove);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);

    if (!reduce) {
      intervals.push(setInterval(tick, 140));
      timeouts.push(setTimeout(runWave, 1400));
      intervals.push(setInterval(runWave, 9000));
    }

    goRestRef.current = goRest;

    return () => {
      if (raf) cancelAnimationFrame(raf);
      intervals.forEach(clearInterval);
      timeouts.forEach(clearTimeout);
      clearTimeout(resizeTimer);
      heroEl.removeEventListener("mousemove", onMove);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      goRestRef.current = () => {};
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <section
      ref={heroRef}
      className="sf-brand-hero"
      id="sfy-hero"
      aria-label="Searchify"
    >
      <nav ref={navRef} className="sf-brand-hero-nav" aria-label="Main">
        <Link className="sf-brand-hero-brand" href="#top" aria-label="Searchify home" onClick={closeMenu}>
          <SearchifyMark />
          <span>searchify</span>
        </Link>

        <button
          className="sf-brand-menubtn"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="sf-brand-links"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>

        <div
          id="sf-brand-links"
          className={`sf-brand-hero-links${menuOpen ? " is-open" : ""}`}
        >
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} onClick={closeMenu}>
              {item.label}
            </Link>
          ))}
          <Link className="sf-brand-cta" href="/#scan" onClick={closeMenu}>
            Scan your site
          </Link>
        </div>
      </nav>

      <div className="sf-brand-lockup">
        <div className="sf-brand-lockup-inner" id="lockup" ref={lockupRef}>
          <svg className="sf-brand-mark" viewBox="0 0 32 32" role="img" aria-label="Searchify logo">
            <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="#131519" stroke="#2E333B" strokeWidth="0.6" />
            <circle cx="9" cy="12.5" r="2.9" fill="#FF5A4E" style={{ filter: "drop-shadow(0 0 1.4px #FF5A4E)", animationDuration: "3.1s", animationDelay: "-.4s" }} />
            <circle cx="16" cy="12.5" r="2.9" fill="#FF9F43" style={{ filter: "drop-shadow(0 0 1.4px #FF9F43)", animationDuration: "3.7s", animationDelay: "-2.1s" }} />
            <circle cx="23" cy="12.5" r="2.9" fill="#FFC53D" style={{ filter: "drop-shadow(0 0 1.4px #FFC53D)", animationDuration: "2.9s", animationDelay: "-1.3s" }} />
            <circle cx="9" cy="19.5" r="2.9" fill="#3DDC84" style={{ filter: "drop-shadow(0 0 1.4px #3DDC84)", animationDuration: "3.4s", animationDelay: "-2.8s" }} />
            <circle cx="16" cy="19.5" r="2.9" fill="#2CC7C0" style={{ filter: "drop-shadow(0 0 1.4px #2CC7C0)", animationDuration: "3.9s", animationDelay: "-.9s" }} />
            <circle cx="23" cy="19.5" r="2.9" fill="#4DA3FF" style={{ filter: "drop-shadow(0 0 1.8px #4DA3FF)", animationDuration: "2.4s", animationDelay: "-1.7s" }} />
          </svg>
          <span className="sf-brand-word">searchify</span>
        </div>
      </div>

      <button
        type="button"
        className="sf-brand-cue"
        aria-label="Scroll to the next section"
        onClick={() => goRestRef.current()}
      >

        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </section>
  );
}
