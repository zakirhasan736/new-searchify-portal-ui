"use client";

import { useEffect } from "react";

const COLS = [[255, 90, 78], [255, 159, 67], [255, 197, 61], [61, 220, 132], [44, 199, 192], [77, 163, 255]];

export default function HeroLights({ heroRef, canvasRef, lockRef, navRef }) {
  useEffect(() => {
    const heroEl = heroRef.current;
    const cv = canvasRef.current;
    if (!heroEl || !cv || !cv.getContext) return undefined;
    const cx = cv.getContext("2d");
    if (!cx) return undefined;
    const reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    let g = null;
    let L = {};
    let raf = null;
    let last = 0;
    let dead = false;
    let waving = false;
    let rt = null;
    let ro = null;
    let iTick = null;
    let iWave = null;
    const timers = new Set();
    const later = (fn, ms) => {
      const id = setTimeout(() => {
        timers.delete(id);
        if (!dead) fn();
      }, ms);
      timers.add(id);
      return id;
    };
    const zoomOf = (r) => (heroEl.clientWidth && r.width ? r.width / heroEl.clientWidth : 1);
    function geo() {
      const W = heroEl.clientWidth;
      const H = heroEl.clientHeight;
      if (!W || !H) {
        g = null;
        return;
      }
      const cell = W / 24;
      const K = Math.ceil(H / 2 / cell) + 1;
      const hr = heroEl.getBoundingClientRect();
      const z = zoomOf(hr);
      const lock = lockRef.current;
      const nav = navRef.current;
      const lr = lock ? lock.getBoundingClientRect() : null;
      const nv = nav ? nav.getBoundingClientRect() : null;
      g = {
        W, H, cell, K, R: Math.max(3, cell * 0.15),
        x0: lr ? (lr.left - hr.left) / z - cell * 0.7 : -1,
        x1: lr ? (lr.right - hr.left) / z + cell * 0.7 : -1,
        y0: lr ? (lr.top - hr.top) / z - cell * 0.7 : -1,
        y1: lr ? (lr.bottom - hr.top) / z + cell * 0.7 : -1,
        navB: nv ? (nv.bottom - hr.top) / z : 0,
      };
    }
    function pos(c, k) {
      return [(c + 0.5) * g.cell, g.H / 2 + k * g.cell];
    }
    function calm(c, k) {
      const p = pos(c, k);
      return c < 0 || c > 23 || (p[0] > g.x0 && p[0] < g.x1 && p[1] > g.y0 && p[1] < g.y1) || p[1] < g.navB + 4 || p[1] < -g.cell || p[1] > g.H + g.cell;
    }
    function rnd(a, b) {
      return a + Math.random() * (b - a);
    }
    function light(c, k, level, hold, flash) {
      if (!g || calm(c, k)) return false;
      const key = `${c},${k}`;
      const d = L[key] || (L[key] = { c, k, b: 0 });
      d.t = level == null ? rnd(0.45, 1) : level;
      d.b = Math.max(d.b, flash == null ? Math.min(1.35, d.t + 0.45) : flash);
      d.off = hold ? performance.now() + hold : 0;
      d.wave = false;
      kick();
      return d;
    }
    function sizeCanvas() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(g.W * dpr);
      cv.height = Math.round(g.H * dpr);
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function drawBase() {
      const R = g.R;
      cx.fillStyle = "#1A1D22";
      cx.beginPath();
      for (let k = -g.K; k <= g.K; k += 1) {
        const y = g.H / 2 + k * g.cell;
        if (y < -g.cell || y > g.H + g.cell) continue;
        for (let c = 0; c < 24; c += 1) {
          const x = (c + 0.5) * g.cell;
          cx.moveTo(x + R, y);
          cx.arc(x, y, R, 0, 6.2832);
        }
      }
      cx.fill();
      const rx = g.W * 0.3;
      const ry = g.H * 0.13;
      cx.save();
      cx.translate(g.W / 2, g.H / 2);
      cx.scale(1, ry / rx);
      const vg = cx.createRadialGradient(0, 0, 0, 0, 0, rx);
      vg.addColorStop(0, "rgba(10,11,13,.72)");
      vg.addColorStop(1, "rgba(10,11,13,0)");
      cx.fillStyle = vg;
      cx.fillRect(-rx, -rx, rx * 2, rx * 2);
      cx.restore();
    }
    function paint() {
      if (!g) return;
      const R = g.R;
      cx.clearRect(0, 0, g.W, g.H);
      drawBase();
      cx.globalCompositeOperation = "lighter";
      Object.keys(L).forEach((key) => {
        const d = L[key];
        const b = d.b;
        if (b < 0.02) return;
        const p = pos(d.c, d.k);
        const col = COLS[Math.floor(d.c / 4)];
        const a = Math.min(1, b);
        const rgb = `${col[0]},${col[1]},${col[2]}`;
        const gr = R * (d.wave ? 3.6 : 2.9) * (0.8 + 0.4 * Math.min(1.3, b));
        const halo = cx.createRadialGradient(p[0], p[1], R * 0.6, p[0], p[1], gr);
        halo.addColorStop(0, `rgba(${rgb},${(0.55 * a).toFixed(3)})`);
        halo.addColorStop(1, `rgba(${rgb},0)`);
        cx.fillStyle = halo;
        cx.beginPath();
        cx.arc(p[0], p[1], gr, 0, 6.2832);
        cx.fill();
      });
      cx.globalCompositeOperation = "source-over";
      Object.keys(L).forEach((key) => {
        const e = L[key];
        const bb = e.b;
        if (bb < 0.02) return;
        const q = pos(e.c, e.k);
        const c2 = COLS[Math.floor(e.c / 4)];
        const aa = Math.min(1, bb);
        const h2 = Math.max(0, bb - 1) / 0.35;
        const mix = (v, base) => Math.round(base + (v - base) * aa);
        let r = mix(c2[0], 26);
        let gg = mix(c2[1], 29);
        let bl = mix(c2[2], 34);
        if (h2 > 0) {
          const m = 0.7 * Math.min(1, h2);
          r = Math.round(r + (255 - r) * m);
          gg = Math.round(gg + (255 - gg) * m);
          bl = Math.round(bl + (255 - bl) * m);
        }
        cx.fillStyle = `rgb(${r},${gg},${bl})`;
        cx.beginPath();
        cx.arc(q[0], q[1], R + 0.5, 0, 6.2832);
        cx.fill();
      });
    }
    function frame(now) {
      raf = null;
      if (dead) return;
      const dt = Math.min(64, now - (last || now));
      last = now;
      let moving = false;
      Object.keys(L).forEach((key) => {
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
      });
      paint();
      if (moving) kick();
      else last = 0;
    }
    function kick() {
      if (!raf && !dead) raf = requestAnimationFrame(frame);
    }
    function count() {
      return Object.keys(L).filter((key) => L[key].t > 0).length;
    }
    function seed() {
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
    }
    function tick() {
      if (!g) return;
      const V = Math.floor(g.H / 2 / g.cell);
      const target = 24 * (2 * V + 1) * 0.16;
      let made = 0;
      let tries = 0;
      while (made < 2 && tries < 20) {
        tries += 1;
        if (count() < target * 1.1 && light(Math.floor(Math.random() * 24), Math.floor(Math.random() * (2 * V + 1)) - V, null, rnd(1800, 5200))) made += 1;
      }
    }
    function runWave() {
      if (waving || !g) return;
      waving = true;
      const step = 62;
      for (let c = 0; c < 24; c += 1) {
        later(() => {
          if (!g) return;
          for (let k = -g.K; k <= g.K; k += 1) {
            if (Math.random() < 0.66) {
              later(() => {
                const lv = Math.random() < 0.25 ? rnd(0.85, 1) : rnd(0.25, 0.8);
                const key = `${c},${k}`;
                const prev = L[key] && L[key].t > 0 ? { t: L[key].t, off: L[key].off } : null;
                const d = light(c, k, lv, rnd(90, 320), lv + rnd(0.25, 0.5));
                if (d) {
                  d.wave = true;
                  if (prev) {
                    d.t = prev.t;
                    d.off = prev.off;
                    d.wave = false;
                  }
                }
              }, rnd(0, 120));
            }
          }
          if (c === 23) later(() => { waving = false; }, 800);
        }, c * step);
      }
    }
    function start() {
      if (dead) return;
      geo();
      if (!g) return;
      sizeCanvas();
      seed();
    }
    function onResize() {
      clearTimeout(rt);
      rt = setTimeout(start, 150);
    }
    const fine = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 861px)");
    function onMove(e) {
      if (!g || !fine.matches || e.pointerType === "touch") return;
      const r = heroEl.getBoundingClientRect();
      const z = zoomOf(r);
      const x = (e.clientX - r.left) / z;
      const y = (e.clientY - r.top) / z;
      const c = Math.round(x / g.cell - 0.5);
      const k = Math.round((y - g.H / 2) / g.cell);
      const key = `${c},${k}`;
      if (!L[key] || L[key].t === 0) light(c, k, rnd(0.85, 1), rnd(1100, 2200), 1.35);
    }
    function syncMove() {
      heroEl.removeEventListener("pointermove", onMove);
      if (fine.matches) heroEl.addEventListener("pointermove", onMove);
    }
    start();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
    if (window.ResizeObserver) {
      ro = new ResizeObserver(onResize);
      ro.observe(heroEl);
    } else window.addEventListener("resize", onResize);
    syncMove();
    fine.addEventListener("change", syncMove);
    if (!reduce) {
      iTick = setInterval(tick, 140);
      later(runWave, 1400);
      iWave = setInterval(runWave, 9000);
    }
    return () => {
      dead = true;
      clearInterval(iTick);
      clearInterval(iWave);
      clearTimeout(rt);
      timers.forEach((id) => clearTimeout(id));
      timers.clear();
      if (raf) cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", onResize);
      fine.removeEventListener("change", syncMove);
      heroEl.removeEventListener("pointermove", onMove);
      L = {};
    };
  }, [heroRef, canvasRef, lockRef, navRef]);
  return null;
}
