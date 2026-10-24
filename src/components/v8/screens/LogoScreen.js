"use client";

import Link from "next/link";
import SearchifyMarkSvg from "@/components/v8/SearchifyMarkSvg";
import "@/styles/v8-screens.css";

const LEVELS = [
  { c: "#FF5A4E", label: "1 Poor" },
  { c: "#FF9F43", label: "2 Fair" },
  { c: "#FFC53D", label: "3 Good" },
  { c: "#3DDC84", label: "4 Strong" },
  { c: "#2CC7C0", label: "5 Great" },
  { c: "#4DA3FF", label: "6 Excellent" },
];

/**
 * Logo.dc.html — brand mark reference (six lights = page quality board).
 */
export default function LogoScreen() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `@keyframes sfy-light{0%,100%{opacity:1}50%{opacity:.55}}@media (prefers-reduced-motion:reduce){*{animation:none!important}}`,
        }}
      />
      <div
        style={{
          minHeight: "100dvh",
          boxSizing: "border-box",
          background: "#0A0B0D",
          color: "#F2F4F5",
          fontFamily: "Geist, 'Helvetica Neue', sans-serif",
          padding: "clamp(24px, 5vw, 56px)",
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", maxWidth: 1200, width: "100%", margin: "0 auto" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, color: "#F2F4F5", textDecoration: "none" }}>
            <SearchifyMarkSvg size={28} />
            <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontWeight: 800, fontSize: 18 }}>searchify</span>
          </Link>
          <Link href="/skins" style={{ fontSize: 13, color: "#9AA1AB", textDecoration: "none" }}>
            All skins
          </Link>
        </header>

        <div
          style={{
            maxWidth: 1200,
            width: "100%",
            margin: "0 auto",
            boxSizing: "border-box",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
            gap: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: 28,
              borderRadius: 28,
              background: "#101215",
              border: "1px solid #1A1D22",
              padding: "48px 24px",
              minHeight: 420,
            }}
          >
            <svg width="240" height="240" viewBox="0 0 32 32" role="img" aria-label="Searchify logo">
              <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="#131519" stroke="#2E333B" strokeWidth="0.6" />
              <circle cx="9" cy="12.5" r="2.9" fill="#FF5A4E" style={{ filter: "drop-shadow(0 0 1.2px #FF5A4E)" }} />
              <circle cx="16" cy="12.5" r="2.9" fill="#FF9F43" style={{ filter: "drop-shadow(0 0 1.2px #FF9F43)" }} />
              <circle cx="23" cy="12.5" r="2.9" fill="#FFC53D" style={{ filter: "drop-shadow(0 0 1.2px #FFC53D)" }} />
              <circle cx="9" cy="19.5" r="2.9" fill="#3DDC84" style={{ filter: "drop-shadow(0 0 1.2px #3DDC84)" }} />
              <circle cx="16" cy="19.5" r="2.9" fill="#2CC7C0" style={{ filter: "drop-shadow(0 0 1.2px #2CC7C0)" }} />
              <circle
                cx="23"
                cy="19.5"
                r="2.9"
                fill="#4DA3FF"
                style={{ filter: "drop-shadow(0 0 1.6px #4DA3FF)", animation: "sfy-light 2.4s ease-in-out infinite" }}
              />
            </svg>
            <span
              style={{
                fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                fontWeight: 800,
                fontSize: "clamp(40px, 6vw, 56px)",
                letterSpacing: "-1.6px",
                lineHeight: 1,
              }}
            >
              searchify
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24, justifyContent: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#7D848E" }}>The mark</span>
              <p style={{ margin: 0, fontSize: 20, lineHeight: 1.45, maxWidth: 460 }}>
                Six lights, one for each level. They read left to right, top to bottom, from{" "}
                <span style={{ color: "#FF5A4E" }}>Poor</span> to <span style={{ color: "#4DA3FF" }}>Excellent</span>, the
                same board every customer sees on their site.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 8, fontSize: 12, color: "#9AA1AB" }}>
              {LEVELS.map((l) => (
                <span key={l.label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ width: 14, height: 14, borderRadius: "50%", background: l.c }} />
                  {l.label}
                </span>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 24,
                padding: 22,
                borderRadius: 20,
                background: "#101215",
                border: "1px solid #1A1D22",
                flexWrap: "wrap",
              }}
            >
              {[64, 32, 16].map((s) => (
                <span key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, fontSize: 12, color: "#7D848E" }}>
                  <SearchifyMarkSvg size={s} />
                  {s}
                </span>
              ))}
              <span style={{ flex: 1 }} />
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 16px",
                  borderRadius: 14,
                  background: "#F2F4F5",
                  color: "#0A0B0D",
                }}
              >
                <SearchifyMarkSvg size={34} />
                <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontWeight: 800, fontSize: 24, letterSpacing: "-0.6px" }}>
                  searchify
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
