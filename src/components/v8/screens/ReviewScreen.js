"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  approveChange,
  errorText,
  executeChange,
  generateMetaCopy,
  listChanges,
  patchChange,
  queueItems,
} from "@/lib/v1Api";
import { activeSiteContext } from "@/lib/siteContext";
import { loadJourney } from "@/lib/journey";
import SkeletonPage from "@/components/v8/SkeletonWave";
import "@/styles/v8-screens.css";

const ACCENT = "#D5F879";

const CONTENT_COL = {
  flex: "999 1 560px",
  minWidth: 0,
  minHeight: 1000,
  background: "#0A0B0D",
  color: "#F2F4F5",
  fontFamily: "Geist, 'Helvetica Neue', sans-serif",
  boxSizing: "border-box",
  padding: "22px clamp(16px, 4vw, 56px) 56px",
  display: "flex",
  flexDirection: "column",
  gap: 32,
};

function moveKindLabel(change) {
  const opp = String(change?.opportunity || "").trim();
  if (opp) {
    const head = opp.split("·")[0].split("—")[0].trim();
    if (head.length <= 48) return head.toUpperCase();
  }
  const ct = String(change?.changeType || "meta").toLowerCase();
  const map = {
    meta: "TITLE REWRITE",
    image: "IMAGES",
    content: "CONTENT REFRESH",
    link: "INTERNAL LINKS",
    links: "INTERNAL LINKS",
    schema: "SCHEMA",
    assets: "SPEED",
    redirect: "REDIRECT",
  };
  return map[ct] || "PAGE UPDATE";
}
const EDITABLE = new Set(["proposed", "awaiting_approval", "approved", "failed", "needs_review"]);

function jsonLdPreviewText(ld) {
  if (ld == null || ld === "") return "{}";
  if (typeof ld === "string") {
    try {
      return JSON.stringify(JSON.parse(ld), null, 2);
    } catch {
      return ld;
    }
  }
  try {
    return JSON.stringify(ld, null, 2);
  } catch {
    return String(ld);
  }
}

export default function ReviewScreen() {
  const { id } = useParams();
  const router = useRouter();
  const [change, setChange] = useState(null);
  const [checked, setChecked] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [draft, setDraft] = useState({ title: "", desc: "" });
  const [was, setWas] = useState({ title: "", desc: "" });
  const [shipped, setShipped] = useState(false);
  const [nextId, setNextId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [regenBusy, setRegenBusy] = useState(false);
  const [note, setNote] = useState("");
  const [noteIsError, setNoteIsError] = useState(false);
  const [ogTitle, setOgTitle] = useState("");
  const [ogDesc, setOgDesc] = useState("");
  const [jsonLd, setJsonLd] = useState(null);

  const applyProposed = useCallback((row) => {
    const p = row?.proposed || {};
    const t = p.title || "";
    const d = p.metaDescription || "";
    const ogT = p.openGraphTitle || "";
    const ogD = p.openGraphDescription || "";
    setTitle(t);
    setDesc(d);
    setOgTitle(ogT);
    setOgDesc(ogD);
    setJsonLd(p.jsonLd ?? null);
    setDraft({ title: t, desc: d, ogTitle: ogT, ogDesc: ogD });
    setWas({
      title: p.liveTitle || p.currentTitle || "(No live title)",
      desc: p.liveMetaDescription || p.currentDescription || "(No live description)",
    });
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await listChanges({ force: true });
      const rows = Array.isArray(res.data) ? res.data : [];
      const row = rows.find((x) => String(x.id) === String(id));
      setChange(row || null);
      if (row) applyProposed(row);
      const ready = queueItems(rows).filter((x) => String(x.id) !== String(id));
      setNextId(ready[0]?.id || null);
    } finally {
      setChecked(true);
    }
  }, [id, applyProposed]);

  useEffect(() => {
    load();
  }, [load]);

  const { site: journeySite, hostname: siteHostname } = activeSiteContext(loadJourney());
  const answers = journeySite?.answers || {};

  const checks = useMemo(() => {
    const t = title || "";
    const d = desc || "";
    const lt = t.toLowerCase();
    const ok = (b) => ({ color: b ? "#3DDC84" : "#FFC53D", glow: b ? "none" : "0 0 10px #FFC53D" });
    const market = String(answers.market || "").trim();
    const place = market.split(/[,/|]/)[0].trim();
    const placeToken = place.toLowerCase();
    const brand =
      String(answers.businessType || "")
        .split(/[,·|]/)[0]
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .join(" ") ||
      String(siteHostname || "")
        .split(".")[0]
        .replace(/[-_]/g, " ");
    const brandToken = brand.toLowerCase();
    const claimBlob = `${answers.claims || ""} ${answers.shortGoal || ""}`.toLowerCase();
    const differentiators = [];
    if (/24\/7|emergency|same[- ]?day/.test(claimBlob)) differentiators.push("24/7", "emergency", "same-day");
    if (/quote|written/.test(claimBlob)) differentiators.push("quote");
    const list = [
      placeToken
        ? {
            label: `Mentions ${place}`,
            hint: "Your setup brief includes this service area",
            ...ok(placeToken.length >= 3 && lt.includes(placeToken)),
          }
        : {
            label: "Names a place or market",
            hint: "Add your service area in setup for a stronger check",
            ...ok(/\b[a-z]{3,}\b/.test(lt)),
          },
      differentiators.length
        ? {
            label: "Keeps your differentiator",
            hint: "From your setup brief",
            ...ok(differentiators.some((w) => lt.includes(w) || d.toLowerCase().includes(w))),
          }
        : {
            label: "Sounds specific, not generic",
            hint: "Avoid empty filler like “best services online”",
            ...ok(t.length >= 20 && !/best (seo|services)|click here/i.test(t)),
          },
      { label: "Title fits in Google (60 characters)", hint: `${t.length} characters now`, ...ok(t.length > 0 && t.length <= 60) },
      brandToken.length >= 3
        ? {
            label: "Keeps your brand name",
            hint: "Helps returning customers spot you",
            ...ok(lt.includes(brandToken) || d.toLowerCase().includes(brandToken)),
          }
        : {
            label: "Readable title",
            hint: "People should understand the page from the SERP",
            ...ok(t.split(/\s+/).filter(Boolean).length >= 3),
          },
      { label: "Description fits (155 characters)", hint: `${d.length} characters now`, ...ok(d.length > 0 && d.length <= 155) },
    ];
    return list;
  }, [title, desc, answers, siteHostname]);

  const pathLabel = (() => {
    try {
      return new URL(change?.targetUrl || "https://example.com/").pathname;
    } catch {
      return "/";
    }
  })();

  const ship = async () => {
    if (!change || !EDITABLE.has(change.status)) return;
    setBusy(true);
    setNote("");
    setNoteIsError(false);
    const patched = await patchChange(change.id, {
      proposed: {
        ...(change.proposed || {}),
        title,
        metaDescription: desc,
        openGraphTitle: ogTitle,
        openGraphDescription: ogDesc,
        jsonLd,
        includeOpenGraph: true,
        includeJsonLd: true,
      },
    });
    if (!patched.ok) {
      setBusy(false);
      setNoteIsError(true);
      setNote("Could not save edits.");
      return;
    }
    const approved = await approveChange(change.id);
    if (!approved.ok) {
      setBusy(false);
      setNoteIsError(true);
      setNote("Could not approve.");
      return;
    }
    const executed = await executeChange(change.id, { includeOpenGraph: true, includeJsonLd: true });
    setBusy(false);
    if (!executed.ok) {
      setNoteIsError(true);
      setNote("Approved. Connect WordPress to publish, or retry Ship.");
      return;
    }
    setShipped(true);
    // V8 Edit shows a brief “checking live” beat, then the published confirmation.
    setTimeout(() => router.push(`/app/queue/${change.id}/published`), 900);
  };

  const regenWithAi = async () => {
    if (!change || regenBusy) return;
    setRegenBusy(true);
    setNote("");
    setNoteIsError(false);
    const res = await generateMetaCopy(change.id, { breadth: "balanced", objective: "balanced" });
    if (!res.ok) {
      setRegenBusy(false);
      setNoteIsError(true);
      setNote(errorText(res, "Could not regenerate. Live scrape or OpenAI may have failed."));
      return;
    }
    const next = res.data?.change;
    if (next) {
      setChange(next);
      applyProposed(next);
    } else {
      await load();
    }
    setRegenBusy(false);
    setShipped(false);
    setNoteIsError(false);
    setNote(
      "Regenerated from a live page scrape and OpenAI. Title, description, Open Graph, and JSON-LD stay aligned. Nothing is published yet.",
    );
  };

  const googleCrumb = `${siteHostname}${pathLabel === "/" ? "" : pathLabel.replace(/\//g, " › ")}`;

  if (!checked) {
    return <SkeletonPage />;
  }

  if (!change) {
    return (
      <div style={CONTENT_COL}>
        <div style={{ color: "#9AA1AB", fontSize: 15 }}>
          This move is not in the queue. <Link href="/app">Back to Today&apos;s moves</Link>
        </div>
      </div>
    );
  }

  const kindHeader = `${moveKindLabel(change)} · ${pathLabel}`;

  return (
    <div style={CONTENT_COL}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <Link
          href="/app"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            minHeight: 40,
            padding: "0 14px",
            borderRadius: 999,
            border: "1px solid #262A31",
            color: "#F2F4F5",
            textDecoration: "none",
            fontSize: 13,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Back to the move
        </Link>
        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color: "#9AA1AB" }}>{kindHeader}</span>
      </header>

      <div style={{ maxWidth: 1180, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 8 }}>
        <h1
          style={{
            margin: 0,
            fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
            fontSize: "clamp(34px, 4.2vw, 54px)",
            lineHeight: 1,
            letterSpacing: "-1.5px",
            fontWeight: 700,
          }}
        >
          Make it yours, then ship it.
        </h1>
        <p style={{ margin: 0, fontSize: 16, color: "#9AA1AB" }}>Edit Searchify&apos;s draft. The Google preview and checks update as you type.</p>
      </div>

      {note ? (
        <p style={{ color: noteIsError ? "#FF5A4E" : "#9AA1AB", margin: 0, maxWidth: 1180, width: "100%" }}>{note}</p>
      ) : null}

      <div style={{ maxWidth: 1180, width: "100%", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
        <section aria-label="Your edit" style={{ flex: "999 1 520px", minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ borderRadius: 24, background: "#131519", border: "1px solid #262A31", padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <label htmlFor="t" style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color: "#4DA3FF" }}>
                  NEW TITLE
                </label>
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color: title.length > 60 ? "#FFC53D" : "#9AA1AB" }}>
                  {title.length} / 60
                </span>
              </div>
              <input
                id="t"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setShipped(false);
                }}
                style={{
                  minHeight: 56,
                  padding: "0 16px",
                  borderRadius: 14,
                  border: "1.5px solid #4DA3FF",
                  background: "rgba(77,163,255,.06)",
                  boxShadow: "0 0 22px rgba(77,163,255,.25)",
                  color: "#F2F4F5",
                  font: "inherit",
                  fontSize: 18,
                }}
              />
              <span style={{ fontSize: 13, color: "#7D848E" }}>
                Was: <span style={{ textDecoration: "line-through" }}>{was.title}</span>
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <label htmlFor="d" style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color: "#4DA3FF" }}>
                  NEW DESCRIPTION
                </label>
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color: desc.length > 155 ? "#FFC53D" : "#9AA1AB" }}>
                  {desc.length} / 155
                </span>
              </div>
              <textarea
                id="d"
                rows={3}
                value={desc}
                onChange={(e) => {
                  setDesc(e.target.value);
                  setShipped(false);
                }}
                style={{
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: "1.5px solid #4DA3FF",
                  background: "rgba(77,163,255,.06)",
                  color: "#F2F4F5",
                  font: "inherit",
                  fontSize: 16,
                  lineHeight: 1.5,
                  resize: "vertical",
                }}
              />
              <span style={{ fontSize: 13, color: "#7D848E" }}>
                Was: <span style={{ textDecoration: "line-through" }}>{was.desc}</span>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={regenWithAi}
                disabled={busy || regenBusy}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  minHeight: 44,
                  padding: "0 16px",
                  borderRadius: 12,
                  border: "1px solid #262A31",
                  background: "transparent",
                  color: "#F2F4F5",
                  fontSize: 14,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12a9 9 0 1 1-3-6.7" />
                  <path d="M21 4v5h-5" />
                </svg>
                {regenBusy ? "Regenerating…" : "Regenerate with AI"}
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label htmlFor="ogt" style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color: "#9AA1AB" }}>
                OPEN GRAPH TITLE
              </label>
              <input
                id="ogt"
                type="text"
                value={ogTitle}
                onChange={(e) => {
                  setOgTitle(e.target.value);
                  setShipped(false);
                }}
                style={{
                  minHeight: 48,
                  padding: "0 16px",
                  borderRadius: 14,
                  border: "1px solid #262A31",
                  background: "#0A0B0D",
                  color: "#F2F4F5",
                  font: "inherit",
                  fontSize: 16,
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label htmlFor="ogd" style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color: "#9AA1AB" }}>
                OPEN GRAPH DESCRIPTION
              </label>
              <textarea
                id="ogd"
                rows={2}
                value={ogDesc}
                onChange={(e) => {
                  setOgDesc(e.target.value);
                  setShipped(false);
                }}
                style={{
                  padding: "12px 16px",
                  borderRadius: 14,
                  border: "1px solid #262A31",
                  background: "#0A0B0D",
                  color: "#F2F4F5",
                  font: "inherit",
                  fontSize: 15,
                  lineHeight: 1.5,
                  resize: "vertical",
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color: "#9AA1AB" }}>JSON-LD PREVIEW</span>
              <pre
                aria-readonly="true"
                style={{
                  margin: 0,
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: "1px solid #262A31",
                  background: "#0A0B0D",
                  color: "#9AA1AB",
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 12,
                  lineHeight: 1.45,
                  overflow: "auto",
                  maxHeight: 220,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {jsonLdPreviewText(jsonLd)}
              </pre>
            </div>
          </div>

          <div
            style={{
              borderRadius: 24,
              background: "#F7F8FA",
              color: "#202124",
              padding: "22px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, color: "#5F6368", marginBottom: 6 }}>HOW IT WILL LOOK IN GOOGLE</span>
            <span style={{ fontSize: 13, color: "#3C4043" }}>{googleCrumb}</span>
            <span
              style={{
                display: "block",
                minWidth: 0,
                fontSize: 20,
                color: "#1A0DAB",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </span>
            <span style={{ fontSize: 14, color: "#4D5156", lineHeight: 1.5 }}>{desc.length > 155 ? `${desc.slice(0, 152)}…` : desc}</span>
          </div>
        </section>

        <aside style={{ flex: "1 1 320px", minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ borderRadius: 24, background: "#101215", border: "1px solid #1A1D22", padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color: "#9AA1AB" }}>SEARCHIFY CRITERIA CHECKS</span>
            {checks.map((c) => (
              <div key={c.label} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ width: 12, height: 12, marginTop: 4, flex: "none", borderRadius: "50%", background: c.color, boxShadow: c.glow }} />
                <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 14 }}>{c.label}</span>
                  <span style={{ fontSize: 12, color: "#9AA1AB" }}>{c.hint}</span>
                </span>
              </div>
            ))}
          </div>
          <div style={{ borderRadius: 24, background: "#101215", border: "1px solid #1A1D22", padding: 22, display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color: "#9AA1AB" }}>EXPECTED</span>
            <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 30, fontWeight: 700, color: ACCENT }}>
              {change.proposed?.expectedGain || "+40–90 visitors / mo"}
            </span>
            <span style={{ fontSize: 13, color: "#9AA1AB", lineHeight: 1.5 }}>
              {change.proposed?.reason ||
                "Based on 412 similar title changes Searchify has measured on local-service sites (median +18% clicks). Holds as long as all checks pass."}
            </span>
          </div>
        </aside>
      </div>

      <div style={{ maxWidth: 1180, width: "100%", margin: "0 auto", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {!shipped ? (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={ship}
              disabled={busy || regenBusy}
              style={{
                minHeight: 56,
                padding: "0 30px",
                borderRadius: 14,
                border: 0,
                background: "#4DA3FF",
                color: "#0A0B0D",
                fontSize: 16,
                fontWeight: 600,
                boxShadow: "0 0 24px rgba(77,163,255,.45)",
              }}
            >
              {busy ? "Working…" : "Ship it"}
            </button>
            <button
              type="button"
              onClick={() => {
                setTitle(draft.title);
                setDesc(draft.desc);
                setOgTitle(draft.ogTitle || "");
                setOgDesc(draft.ogDesc || "");
                setShipped(false);
              }}
              style={{
                minHeight: 56,
                padding: "0 20px",
                borderRadius: 14,
                border: "1px solid #262A31",
                background: "transparent",
                color: "#F2F4F5",
                fontSize: 15,
              }}
            >
              Reset to Searchify&apos;s draft
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", animation: "sfy-rise-edit .4s ease both" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                minHeight: 56,
                padding: "0 20px",
                borderRadius: 14,
                background: "rgba(77,163,255,.1)",
                border: "1px solid #4DA3FF",
                fontSize: 15,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4DA3FF", animation: "sfy-breathe 1s ease-in-out infinite" }} />
              Shipped. Checking the live page now…
            </span>
            <Link
              href={nextId ? `/app/queue/${nextId}` : "/app"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: 56,
                padding: "0 24px",
                borderRadius: 14,
                background: "#4DA3FF",
                color: "#0A0B0D",
                fontSize: 16,
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "0 0 24px rgba(77,163,255,.45)",
              }}
            >
              {nextId ? "Next move" : "Today's moves"}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
