"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { activeSiteContext } from "@/lib/siteContext";
import { loadJourney } from "@/lib/journey";
import {
  approveChange,
  changePath,
  executeChange,
  listChanges,
  patchChange,
  queueItems,
} from "@/lib/v1Api";
import { SkeletonRows } from "@/components/v8/SkeletonWave";
import DataHealthNotice from "@/components/v8/DataHealthNotice";
import "@/styles/v8-screens.css";

const BURST = Array.from({ length: 16 }, (_, i) => ({
  anim: `sfy-b${i % 8} 1.1s ${i < 8 ? ".25s" : ".45s"} ease-out both`,
  color: i % 3 === 2 ? "#B6F5CF" : "#3DDC84",
  size: i < 8 ? 9 : 6,
}));

function pageName(path) {
  const seg = String(path || "/").split("/").filter(Boolean).pop() || "home";
  const words = seg.replace(/[-_]/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function brandOf(host) {
  const bit = String(host || "").replace(/^www\./, "").split(".")[0] || "";
  return bit.replace(/[-_]/g, " ");
}

function queryOf(change, path) {
  const proposed = change.proposed || {};
  const fromQuery = proposed.keyword || proposed.query || proposed.targetQuery;
  if (fromQuery) return String(fromQuery).trim();
  const opp = String(change.opportunity || "").split("·")[0].trim();
  if (opp && opp.length < 60) return opp.toLowerCase();
  return pageName(path).toLowerCase();
}

function mapChange(change, host) {
  const proposed = change.proposed || {};
  const path = changePath(change);
  const query = queryOf(change, path);
  const evidence = proposed.evidence || {};
  const position = evidence.position && evidence.position !== "—" ? `#${evidence.position}` : "";
  const impressions = evidence.impressions && evidence.impressions !== "—" ? `${evidence.impressions} impressions` : "";
  return {
    id: change.id,
    raw: change,
    query,
    pageName: pageName(path),
    path,
    crumb: `${host || "your site"}${String(path).split("/").join(" › ")}`,
    vol: impressions || "From this page",
    rank: position ? `You're ${position} today` : "Spot not measured yet",
    oldT: proposed.beforeTitle || proposed.liveTitle || "(No title stored)",
    whyT: proposed.reason || "The live title does not say what this page is for.",
    oldD: proposed.beforeDescription || proposed.beforeMetaDescription || proposed.liveMetaDescription || "(No description. Google picks a sentence from the page.)",
    whyD: "The live description is what Google is using now.",
    draftT: proposed.title || "",
    draftD: proposed.metaDescription || "",
    estN: proposed.expectedGain || proposed.gain || "An estimate, not a promise",
    estWhere: position
      ? `If this page moves from ${position} for “${query}”.`
      : "A visitor estimate needs a Search Console position for this page.",
    estHow: "Your spot comes from Search Console when it is connected. Searches are not invented. An estimate, not a promise.",
  };
}

function ok(met) {
  return {
    met,
    color: met ? "#3DDC84" : "#FFC53D",
    glow: met ? "0 0 10px #3DDC84, 0 0 22px rgba(61,220,132,.55)" : "none",
    anim: met ? "sfy-glint 3.4s ease-in-out infinite" : "none",
    status: met ? "Met" : "Not yet",
  };
}

export default function EditPublishScreen() {
  const params = useParams();
  const wantedId = params?.id ? String(params.id) : "";
  const { hostname } = useMemo(() => activeSiteContext(loadJourney()), []);
  const brand = brandOf(hostname);
  const [rows, setRows] = useState(null);
  const [cur, setCur] = useState(0);
  const [done, setDone] = useState({});
  const [listOpen, setListOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [draft, setDraft] = useState({ title: "", desc: "" });
  const [phase, setPhase] = useState("idle");
  const [celebrate, setCelebrate] = useState(false);
  const [tip, setTip] = useState(null);
  const [typedN, setTypedN] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    listChanges({ force: true }).then((res) => {
      if (!live) return;
      const list = queueItems(Array.isArray(res.data) ? res.data : res.data?.changes || []).map((change) =>
        mapChange(change, hostname),
      );
      setRows(list);
      const start = Math.max(0, wantedId ? list.findIndex((row) => String(row.id) === wantedId) : 0);
      const pick = list[start] || list[0];
      setCur(start < 0 ? 0 : start);
      if (pick) {
        setTitle(pick.draftT);
        setDesc(pick.draftD);
        setDraft({ title: pick.draftT, desc: pick.draftD });
      }
    });
    return () => {
      live = false;
    };
  }, [hostname, wantedId]);

  const current = rows?.[cur] || null;

  useEffect(() => {
    if (!current) return;
    setTypedN(0);
    const id = setInterval(() => {
      setTypedN((n) => (n >= current.query.length ? n : n + 1));
    }, 80);
    return () => clearInterval(id);
  }, [current?.id, current?.query]);

  const load = (index) => {
    const next = rows?.[index];
    if (!next) return;
    setCur(index);
    setTitle(next.draftT);
    setDesc(next.draftD);
    setDraft({ title: next.draftT, desc: next.draftD });
    setPhase(done[next.id] ? "live" : "idle");
    setCelebrate(false);
    setListOpen(false);
    setError("");
  };

  const checks = useMemo(() => {
    if (!current) return [];
    const t = title || "";
    const d = desc || "";
    const lower = t.toLowerCase();
    const words = current.query.toLowerCase().split(/\s+/).filter((word) => word.length > 2);
    const missing = words.filter((word) => !lower.includes(word));
    const both = `${t} ${d}`.toLowerCase();
    return [
      { label: "Title uses the words people search", hint: missing.length ? `Missing: ${missing.join(", ")}` : `Has: ${words.join(", ") || current.query}`, ...ok(!missing.length && t.length > 0) },
      { label: "Different from the live title", hint: "Searchers should see a change", ...ok(t.trim() && t.trim() !== current.oldT.trim()) },
      { label: "Title fits in Google (60 characters)", hint: `${t.length} characters now`, ...ok(t.length > 0 && t.length <= 60) },
      { label: "Keeps your brand name", hint: brand ? `Looks for “${brand}”` : "Add the name people already know", ...ok(brand ? both.includes(brand.toLowerCase()) : true) },
      { label: "Description fits (155 characters)", hint: `${d.length} characters now`, ...ok(d.length > 0 && d.length <= 155) },
    ];
  }, [current, title, desc, brand]);

  const met = checks.filter((check) => check.met).length;
  const allMet = checks.length > 0 && met === checks.length;
  const shown = desc.length > 155 ? `${desc.slice(0, 152)}…` : desc;
  const queryWords = (current?.query || "").toLowerCase().split(/\s+/).filter(Boolean);
  const descSeg = shown.split(/(\s+)/).filter((part) => part.length).map((part) => {
    const clean = part.toLowerCase().replace(/[^a-z0-9]/g, "");
    const hit = queryWords.some((word) => clean === word || clean === `${word}s`);
    return { t: part, w: hit ? 700 : 400, c: hit ? "#202124" : "#4D5156" };
  });

  const waiting = (rows || []).filter((row) => !done[row.id]);
  const nextIndex = (() => {
    if (!rows) return -1;
    for (let step = 1; step <= rows.length; step += 1) {
      const index = (cur + step) % rows.length;
      if (index !== cur && !done[rows[index].id]) return index;
    }
    return -1;
  })();

  const publish = async () => {
    if (!current || phase === "publishing") return;
    setPhase("publishing");
    setError("");
    const patched = await patchChange(current.id, {
      proposed: { ...(current.raw.proposed || {}), title, metaDescription: desc },
    });
    if (!patched.ok) {
      setPhase("idle");
      setError("Could not save this draft.");
      return;
    }
    const approved = await approveChange(current.id);
    if (!approved.ok) {
      setPhase("idle");
      setError("Saved. It still needs approval before it can go live.");
      return;
    }
    const executed = await executeChange(current.id, { includeOpenGraph: true, includeJsonLd: true });
    if (!executed.ok) {
      setPhase("idle");
      setError("Approved. Connect WordPress to publish it on the website.");
      return;
    }
    setDone((prev) => ({ ...prev, [current.id]: true }));
    setPhase("live");
    setCelebrate(true);
  };

  if (rows === null) {
    return (
      <div style={{ padding: "22px clamp(16px, 4vw, 56px)" }}>
        <SkeletonRows count={4} />
      </div>
    );
  }

  if (!current) {
    return (
      <div style={{ padding: "22px clamp(16px, 4vw, 56px)", color: "#F2F4F5", display: "flex", flexDirection: "column", gap: 16, maxWidth: 720 }}>
        <h1 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "clamp(28px, 3.2vw, 40px)", letterSpacing: "-1px" }}>Edit how this page appears on Google</h1>
        <p style={{ margin: 0, color: "#9AA1AB", fontSize: 16 }}>Nothing is waiting. SearchLites writes the next title and description, then it shows up here.</p>
        <DataHealthNotice need={["site", "scan", "business", "firewall", "research", "publishing"]} onFixed={() => window.location.reload()} />
        <Link href="/app/results" style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", minHeight: 56, padding: "0 28px", borderRadius: 14, background: "#4DA3FF", color: "#0A0B0D", fontWeight: 600, textDecoration: "none" }}>Open SearchLites</Link>
      </div>
    );
  }

  return (
    <div style={{ flex: "999 1 560px", minWidth: 0, background: "#0A0B0D", color: "#F2F4F5", fontFamily: "Geist, 'Helvetica Neue', sans-serif", boxSizing: "border-box", padding: "22px clamp(16px, 4vw, 56px) 56px", display: "flex", flexDirection: "column", gap: 32 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <Link href="/app" style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 40, padding: "0 14px", borderRadius: 999, border: "1px solid #262A31", color: "#F2F4F5", textDecoration: "none", fontSize: 13 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
          Back to the move
        </Link>
        <span style={{ fontSize: 13, color: "#9AA1AB" }}>
          Changing: <span style={{ color: "#F2F4F5", fontWeight: 600 }}>{current.pageName}</span>{" "}
          <span style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 700, fontSize: 12, color: "#7D848E" }}>{current.path}</span>
        </span>
      </header>

      <DataHealthNotice need={["firewall", "publishing"]} />

      <div style={{ maxWidth: 1180, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          <span style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 700, fontSize: 11, color: "#4DA3FF", letterSpacing: ".8px" }}>PEOPLE SEARCH FOR</span>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", minHeight: 58, boxSizing: "border-box", padding: "8px 10px 8px 20px", borderRadius: 999, background: "#101215", border: "1.5px solid #4DA3FF", boxShadow: "0 0 20px rgba(77,163,255,.2)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4DA3FF" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true" style={{ flex: "none" }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.5-4.5" /></svg>
            <span style={{ flex: "1 1 200px", minWidth: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px", whiteSpace: "nowrap", overflow: "hidden" }}>
              {current.query.slice(0, typedN)}
              <span style={{ display: "inline-block", width: 2, height: "0.95em", marginLeft: 3, verticalAlign: "-0.12em", background: "#4DA3FF", animation: "sfy-caret 1s infinite" }} />
            </span>
            <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", minHeight: 36, padding: "0 12px", borderRadius: 999, background: "#1A1D22", fontSize: 13, color: "#D7DADE" }}>{current.vol}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 36, padding: "0 12px", borderRadius: 999, background: "rgba(255,197,61,.12)", fontSize: 13, fontWeight: 600, color: "#FFC53D" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#FFC53D" }} />
                {current.rank}
              </span>
              <button type="button" aria-expanded={listOpen} onClick={() => setListOpen((open) => !open)} style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 40, padding: "0 14px", borderRadius: 999, border: "1px solid #4DA3FF", background: "rgba(77,163,255,.12)", color: "#F2F4F5", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Fix {cur + 1} of {rows.length}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true" style={{ transform: listOpen ? "rotate(180deg)" : "none" }}><path d="M7 10l5 5 5-5" /></svg>
              </button>
            </span>
          </div>
          {listOpen ? (
            <div style={{ borderRadius: 18, background: "#101215", border: "1px solid #262A31", padding: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ padding: "8px 12px 4px", fontFamily: "'Open Sans', sans-serif", fontWeight: 700, fontSize: 11, color: "#9AA1AB", letterSpacing: ".4px" }}>SEARCHES WAITING FOR A FIX · {waiting.length} LEFT</span>
              {rows.map((row, index) => {
                const on = index === cur;
                const live = !!done[row.id];
                return (
                  <button key={row.id} type="button" onClick={() => load(index)} style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 56, padding: "0 12px", borderRadius: 12, border: `1px solid ${on ? "#4DA3FF" : "transparent"}`, background: on ? "rgba(77,163,255,.08)" : "transparent", color: "#F2F4F5", textAlign: "left", cursor: "pointer" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9AA1AB" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true" style={{ flex: "none" }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.5-4.5" /></svg>
                    <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{row.query}</span>
                      <span style={{ fontSize: 12, color: "#7D848E" }}>{row.pageName} · {row.vol} · {row.rank}</span>
                    </span>
                    <span style={{ flex: "none", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 999, color: live ? "#3DDC84" : on ? "#4DA3FF" : "#9AA1AB", background: live ? "rgba(61,220,132,.12)" : on ? "rgba(77,163,255,.12)" : "#1A1D22" }}>
                      {live ? "✓ Live" : on ? "Editing" : "Up next"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        <h1 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "clamp(28px, 3.2vw, 40px)", lineHeight: 1.05, letterSpacing: "-1px", fontWeight: 700 }}>Edit how this page appears on Google</h1>
        <p style={{ margin: 0, fontSize: 16, color: "#9AA1AB" }}>We&apos;ve written a draft for you. Change anything you like; the preview and checks update as you type.</p>
      </div>

      <div style={{ maxWidth: 1180, width: "100%", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
        <section aria-label="Your edit" style={{ flex: "999 1 520px", minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ borderRadius: 24, background: "#131519", border: "1px solid #262A31", padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, position: "relative" }}>
                  <label htmlFor="edit-title" style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 700, fontSize: 12, color: "#4DA3FF" }}>NEW TITLE</label>
                  <button type="button" aria-label="What is the title?" aria-expanded={tip === "title"} onClick={() => setTip(tip === "title" ? null : "title")} style={{ width: 22, height: 22, borderRadius: "50%", border: "1.5px solid #5B616B", background: "transparent", color: "#9AA1AB", display: "grid", placeItems: "center", cursor: "pointer" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M12 11v7" /><path d="M12 6.5h.01" /></svg>
                  </button>
                  {tip === "title" ? <span style={{ position: "absolute", top: "100%", left: -8, zIndex: 40, width: 280, maxWidth: "80vw", paddingTop: 8 }}><span style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 14px", borderRadius: 12, background: "#16181C", border: "1px solid #2E333B", boxShadow: "0 12px 32px rgba(0,0,0,.5)", fontSize: 13, lineHeight: 1.5, color: "#D7DADE" }}>The blue headline in Google. About 60 characters show before it’s cut off with “…”. <a href="https://searchify.io/help/titles" style={{ color: "#4DA3FF" }}>Learn more</a></span></span> : null}
                </span>
                <span style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 700, fontSize: 12, color: title.length > 60 ? "#FFC53D" : "#9AA1AB" }}>{title.length} / 60</span>
              </div>
              <input id="edit-title" value={title} onChange={(event) => { setTitle(event.target.value); setPhase("idle"); }} style={{ minHeight: 56, padding: "0 16px", borderRadius: 14, border: "1.5px solid #4DA3FF", background: "rgba(77,163,255,.06)", boxShadow: "0 0 22px rgba(77,163,255,.25)", color: "#F2F4F5", font: "inherit", fontSize: 18 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "12px 16px", borderRadius: 14, border: "1.5px solid rgba(255,90,78,.55)", background: "rgba(255,90,78,.06)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Open Sans', sans-serif", fontWeight: 700, fontSize: 11, color: "#FF5A4E", letterSpacing: ".4px" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>ON YOUR SITE NOW · NOT GOOD ENOUGH</span>
                <span style={{ fontSize: 17, color: "#FF8A80", textDecoration: "line-through", textDecorationColor: "#FF5A4E", textDecorationThickness: 2 }}>{current.oldT}</span>
                <span style={{ fontSize: 12, color: "#9AA1AB" }}>{current.whyT}</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, position: "relative" }}>
                  <label htmlFor="edit-desc" style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 700, fontSize: 12, color: "#4DA3FF" }}>NEW DESCRIPTION</label>
                  <button type="button" aria-label="What is the description?" aria-expanded={tip === "desc"} onClick={() => setTip(tip === "desc" ? null : "desc")} style={{ width: 22, height: 22, borderRadius: "50%", border: "1.5px solid #5B616B", background: "transparent", color: "#9AA1AB", display: "grid", placeItems: "center", cursor: "pointer" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M12 11v7" /><path d="M12 6.5h.01" /></svg>
                  </button>
                  {tip === "desc" ? <span style={{ position: "absolute", top: "100%", left: -8, zIndex: 40, width: 280, maxWidth: "80vw", paddingTop: 8 }}><span style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 14px", borderRadius: 12, background: "#16181C", border: "1px solid #2E333B", boxShadow: "0 12px 32px rgba(0,0,0,.5)", fontSize: 13, lineHeight: 1.5, color: "#D7DADE" }}>The grey text under the headline in Google. About 155 characters show, and Google sometimes writes its own if yours is missing. <a href="https://searchify.io/help/descriptions" style={{ color: "#4DA3FF" }}>Learn more</a></span></span> : null}
                </span>
                <span style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 700, fontSize: 12, color: desc.length > 155 ? "#FFC53D" : "#9AA1AB" }}>{desc.length} / 155</span>
              </div>
              <textarea id="edit-desc" rows={3} value={desc} onChange={(event) => { setDesc(event.target.value); setPhase("idle"); }} style={{ padding: "14px 16px", borderRadius: 14, border: "1.5px solid #4DA3FF", background: "rgba(77,163,255,.06)", color: "#F2F4F5", font: "inherit", fontSize: 16, lineHeight: 1.5, resize: "vertical" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "12px 16px", borderRadius: 14, border: "1.5px solid rgba(255,90,78,.55)", background: "rgba(255,90,78,.06)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Open Sans', sans-serif", fontWeight: 700, fontSize: 11, color: "#FF5A4E", letterSpacing: ".4px" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>ON YOUR SITE NOW · NOT GOOD ENOUGH</span>
                <span style={{ fontSize: 16, lineHeight: 1.5, color: "#FF8A80", textDecoration: "line-through", textDecorationColor: "#FF5A4E", textDecorationThickness: 2 }}>{current.oldD}</span>
                <span style={{ fontSize: 12, color: "#9AA1AB" }}>{current.whyD}</span>
              </div>
            </div>
          </div>
          <div style={{ borderRadius: 24, background: "#F7F8FA", color: "#202124", padding: "22px 24px", display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 700, fontSize: 11, color: "#5F6368", marginBottom: 6 }}>HOW IT WILL LOOK IN GOOGLE</span>
            <span style={{ fontSize: 13, color: "#3C4043" }}>{current.crumb}</span>
            <span style={{ fontSize: 20, color: "#1A0DAB", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
            <span style={{ fontSize: 14, lineHeight: 1.5 }}>
              {descSeg.map((seg, index) => (
                <span key={`${seg.t}-${index}`} style={{ fontWeight: seg.w, color: seg.c }}>{seg.t}</span>
              ))}
            </span>
            <span style={{ marginTop: 8, fontSize: 12, color: "#5F6368" }}>Google bolds the words people searched, so using them helps your listing stand out.</span>
          </div>
        </section>

        <aside style={{ flex: "1 1 320px", minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ borderRadius: 24, background: "#101215", border: "1px solid #1A1D22", padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <span style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 700, fontSize: 12, color: "#D7DADE", letterSpacing: ".4px" }}>SEARCHIFY CRITERIA MET?</span>
              <span style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 700, fontSize: 12, padding: "3px 10px", borderRadius: 999, color: allMet ? "#3DDC84" : "#FFC53D", background: allMet ? "rgba(61,220,132,.12)" : "rgba(255,197,61,.12)" }}>{met} of {checks.length}</span>
            </div>
            {checks.map((check, index) => (
              <div key={check.label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ width: 12, height: 12, marginTop: 4, flex: "none", borderRadius: "50%", background: check.color, boxShadow: check.glow, animation: check.anim, animationDelay: `${index * 0.9}s` }} />
                <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 14 }}>{check.label}</span>
                  <span style={{ fontSize: 12, color: "#9AA1AB" }}>{check.hint}</span>
                </span>
                <span style={{ flex: "none", fontSize: 12, fontWeight: 600, color: check.color }}>{check.status}</span>
              </div>
            ))}
          </div>
          <div style={{ borderRadius: 24, background: "#101215", border: "1px solid #1A1D22", padding: 22, display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 700, fontSize: 12, color: "#9AA1AB" }}>WHAT THIS COULD BRING</span>
            <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 30, fontWeight: 700, color: "#3DDC84" }}>{current.estN}</span>
            <span style={{ fontSize: 14, color: "#D7DADE", lineHeight: 1.5 }}>{current.estWhere}</span>
            <span style={{ fontSize: 12, color: "#7D848E", lineHeight: 1.5 }}>{current.estHow}</span>
          </div>
        </aside>
      </div>

      <div style={{ maxWidth: 1180, width: "100%", margin: "0 auto", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {error ? <span style={{ flex: "1 1 100%", fontSize: 14, color: "#FFC53D" }}>{error}</span> : null}
        {phase === "idle" ? (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={publish} style={{ minHeight: 56, padding: "0 30px", borderRadius: 14, border: 0, background: "#4DA3FF", color: "#0A0B0D", fontSize: 16, fontWeight: 600, boxShadow: "0 0 24px rgba(77,163,255,.45)", cursor: "pointer" }}>Publish to my website</button>
            <button type="button" onClick={() => { setTitle(draft.title); setDesc(draft.desc); }} style={{ minHeight: 56, padding: "0 20px", borderRadius: 14, border: "1px solid #262A31", background: "transparent", color: "#F2F4F5", fontSize: 15, cursor: "pointer" }}>Reset to Searchify&apos;s draft</button>
          </div>
        ) : null}
        {phase === "publishing" ? (
          <span role="status" style={{ display: "inline-flex", alignItems: "center", gap: 12, minHeight: 56, padding: "0 22px", borderRadius: 14, background: "rgba(77,163,255,.1)", border: "1px solid #4DA3FF", fontSize: 15 }}>
            <span style={{ width: 18, height: 18, boxSizing: "border-box", borderRadius: "50%", border: "2.5px solid rgba(77,163,255,.3)", borderTopColor: "#4DA3FF", animation: "sfy-spin .8s linear infinite" }} />
            Publishing to your website…
          </span>
        ) : null}
        {phase === "live" && !celebrate ? (
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10, minHeight: 56, padding: "0 20px", borderRadius: 14, background: "rgba(61,220,132,.1)", border: "1px solid rgba(61,220,132,.6)", fontSize: 15 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3DDC84", boxShadow: "0 0 8px #3DDC84" }} />
              Live on your website. Tracking has started.
            </span>
            {nextIndex >= 0 ? (
              <button type="button" onClick={() => load(nextIndex)} style={{ minHeight: 56, padding: "0 24px", borderRadius: 14, border: 0, background: "#4DA3FF", color: "#0A0B0D", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>Next fix: “{rows[nextIndex].query}” →</button>
            ) : (
              <Link href="/app" style={{ display: "inline-flex", alignItems: "center", minHeight: 56, padding: "0 24px", borderRadius: 14, background: "#4DA3FF", color: "#0A0B0D", fontSize: 16, fontWeight: 600, textDecoration: "none" }}>All fixes done · back to Home</Link>
            )}
          </div>
        ) : null}
      </div>

      {celebrate ? (
        <div role="dialog" aria-modal="true" aria-labelledby="win-h" style={{ position: "fixed", inset: 0, zIndex: 60, display: "grid", placeItems: "center", padding: 20, background: "rgba(10,11,13,.85)" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: 560, boxSizing: "border-box", borderRadius: 28, background: "#101215", border: "1.5px solid rgba(61,220,132,.6)", boxShadow: "0 0 60px rgba(61,220,132,.25)", padding: "40px 32px 30px", display: "flex", flexDirection: "column", alignItems: "center", gap: 18, textAlign: "center" }}>
            <div style={{ position: "relative", width: 100, height: 100, display: "grid", placeItems: "center" }}>
              <span aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid #3DDC84", animation: "sfy-ring 1.8s ease-out infinite" }} />
              <span aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid #3DDC84", animation: "sfy-ring 1.8s .6s ease-out infinite" }} />
              {BURST.map((dot, index) => (
                <span key={dot.anim + index} aria-hidden="true" style={{ position: "absolute", left: "50%", top: "50%", width: dot.size, height: dot.size, margin: -dot.size / 2, borderRadius: "50%", background: dot.color, animation: dot.anim }} />
              ))}
              <span style={{ position: "relative", width: 74, height: 74, borderRadius: "50%", background: "#3DDC84", display: "grid", placeItems: "center", animation: "sfy-pop .6s ease-out both" }}>
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#0A0B0D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" style={{ strokeDasharray: 30, strokeDashoffset: 0, animation: "sfy-draw .5s .35s ease-out forwards" }} /></svg>
              </span>
            </div>
            <h2 id="win-h" style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "clamp(24px, 3vw, 32px)", lineHeight: 1.12, letterSpacing: "-0.7px", fontWeight: 700 }}>Congratulations, your publish was made live successfully.</h2>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: "#D7DADE" }}>Your new Google title and description are now on {current.pageName}.</p>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", width: "100%", display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}>
              {[
                "Saved to your WordPress site",
                "Checked your live page: the new title is showing",
                `Tracking “${current.query}” from today. First result in about 4 weeks.`,
              ].map((line) => (
                <li key={line} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 14px", borderRadius: 12, background: "rgba(61,220,132,.07)", fontSize: 14 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3DDC84" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none", marginTop: 2 }}><path d="M20 6L9 17l-5-5" /></svg>
                  {line}
                </li>
              ))}
            </ul>
            <div style={{ width: "100%", boxSizing: "border-box", display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 16px", borderRadius: 14, background: "rgba(255,197,61,.08)", border: "1px solid rgba(255,197,61,.45)", textAlign: "left" }}>
              <span style={{ fontSize: 14, lineHeight: 1.55, color: "#D7DADE" }}><strong style={{ color: "#F2F4F5" }}>It&apos;s live on your website right now, and that&apos;s what matters.</strong> Google takes a little time to notice changes, usually a few days to a few weeks. You don&apos;t need to do anything.</span>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              {nextIndex >= 0 ? (
                <button type="button" onClick={() => { setCelebrate(false); load(nextIndex); }} style={{ minHeight: 52, padding: "0 24px", borderRadius: 14, border: 0, background: "#3DDC84", color: "#0A0B0D", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>Next fix: “{rows[nextIndex].query}” →</button>
              ) : (
                <Link href="/app" style={{ display: "inline-flex", alignItems: "center", minHeight: 52, padding: "0 24px", borderRadius: 14, background: "#3DDC84", color: "#0A0B0D", fontSize: 16, fontWeight: 600, textDecoration: "none" }}>All fixes done · back to Home</Link>
              )}
              <button type="button" onClick={() => setCelebrate(false)} style={{ minHeight: 52, padding: "0 18px", borderRadius: 14, border: "1px solid #262A31", background: "transparent", color: "#F2F4F5", fontSize: 15, cursor: "pointer" }}>Back to this page</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
