"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

function num(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return null;
  return Math.round(v).toLocaleString("en-US");
}

function pathOf(url) {
  if (!url) return "";
  try {
    return new URL(String(url).includes("://") ? url : `https://${url}`).pathname || "/";
  } catch {
    return String(url).startsWith("/") ? String(url) : "";
  }
}

function volumeOf(row) {
  const v = Number(row?.localVolume ?? row?.volume);
  return Number.isFinite(v) && v > 0 ? v : 0;
}

function winOf(difficulty) {
  const n = Number(difficulty);
  if (!Number.isFinite(n)) return { label: "Not scored", color: "#9AA1AB", bg: "#1A1D22" };
  if (n < 20) return { label: "Easy win", color: "#3DDC84", bg: "rgba(61,220,132,.12)" };
  if (n <= 30) return { label: "Doable", color: "#FFC53D", bg: "rgba(255,197,61,.12)" };
  return { label: "Hard", color: "#FF5A4E", bg: "rgba(255,90,78,.12)" };
}

function roundVisits(vol) {
  if (!vol) return null;
  return Math.round((vol * 0.2) / 10) * 10;
}

function rising(row) {
  const trend = row?.localTrend || row?.trend;
  const nums = Array.isArray(trend) ? trend.map(Number).filter((n) => Number.isFinite(n)) : [];
  if (nums.length < 4) return false;
  const early = nums.slice(0, 3).reduce((sum, n) => sum + n, 0) / 3;
  const late = nums.slice(-3).reduce((sum, n) => sum + n, 0) / 3;
  return late > early * 1.1 && late > 0;
}

function rankScore(row) {
  const volume = volumeOf(row);
  const difficulty = Number(row?.difficulty);
  const kd = Number.isFinite(difficulty) ? difficulty : 50;
  const weight = row?.fit === "related" ? 0.6 : 1;
  let score = (weight * volume) / (10 + kd);
  const pos = Number(row?.position);
  if (Number.isFinite(pos) && pos >= 4 && pos <= 20) score *= 1.8;
  else if (Number.isFinite(pos) && pos > 20) score *= 1.25;
  if (rising(row)) score *= 1.35;
  const impressions = Number(row?.impressions);
  if (Number.isFinite(impressions) && impressions > 0) score += Math.min(impressions, 5000) * 0.02;
  if (Number(row?.analyticsSessions) > 0) score *= 1.15;
  return score;
}

function sourceLine(items) {
  const kinds = new Set(items.map((row) => row.kind));
  const parts = [];
  if ([...kinds].some((kind) => kind && kind !== "console")) parts.push("DataForSEO keyword and organic data");
  if (items.some((row) => row.kind === "console" || row.alsoInSearchConsole)) parts.push("Search Console queries");
  if (items.some((row) => Number(row.analyticsSessions) > 0)) parts.push("Analytics landing pages");
  if (items.some(rising)) parts.push("searches that are rising");
  return parts.length ? parts.join(", ") : "the keyword data stored for this website";
}

function clustersFrom(suggestions) {
  const rows = (suggestions || []).filter((row) => row?.keyword && row.kind !== "gap");
  const groups = new Map();
  rows.forEach((row) => {
    const page = pathOf(row.page || row.url);
    const key = String(row.concept || page || "Other searches").trim() || "Other searches";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });
  return [...groups.entries()]
    .map(([topic, items]) => {
      const sorted = [...items].sort((a, b) => rankScore(b) - rankScore(a)).slice(0, 8);
      const page = pathOf(sorted.find((row) => pathOf(row.page || row.url) && pathOf(row.page || row.url) !== "/")?.page || sorted.find((row) => pathOf(row.url))?.url || "");
      const questions = sorted.filter((row) => row.question || String(row.intent || "").includes("inform")).length;
      return {
        id: topic,
        topic,
        page: page || "No page yet",
        isNew: !page,
        intent: questions > sorted.length / 2 ? "research" : "buying",
        items: sorted,
        vol: sorted.reduce((sum, row) => sum + volumeOf(row), 0),
        source: sourceLine(sorted),
      };
    })
    .sort((a, b) => b.items.reduce((sum, row) => sum + rankScore(row), 0) - a.items.reduce((sum, row) => sum + rankScore(row), 0));
}

function rowMeta(row) {
  const vol = num(volumeOf(row));
  const rivals = Number(row?.localRivals);
  const rivalBit = Number.isFinite(rivals) && rivals >= 0
    ? (rivals ? `${rivals} local rival${rivals === 1 ? "" : "s"} on page one` : "no local rivals on page one")
    : "";
  const you = row?.position != null && row.position !== "" && Number(row.position) > 0 ? `#${Math.round(Number(row.position))}` : "not found";
  return [vol ? `${vol} a month` : "", rivalBit, `you: ${you}`].filter(Boolean).join(" · ");
}

function aiRowsFrom(checks, clusters) {
  const live = (checks || []).filter((row) => row?.prompt).slice(0, 3);
  if (live.length) return live.map((row) => ({ ...row, live: true }));
  const keywords = [];
  (clusters || []).forEach((group) => {
    group.items.forEach((row) => {
      if (keywords.length < 3 && row?.keyword) keywords.push(row.keyword);
    });
  });
  return keywords.map((keyword) => ({
    prompt: keyword,
    engine: "ChatGPT, Google AI Overview",
    live: false,
  }));
}

function mentionBadge(check) {
  if (check?.observed && check?.mention) return { text: "You: mentioned", color: "#3DDC84", bg: "rgba(61,220,132,.12)" };
  if (check?.observed || check?.mention === false) return { text: "You: not mentioned", color: "#FF5A4E", bg: "rgba(255,90,78,.12)" };
  return { text: "Not checked yet", color: "#FFC53D", bg: "rgba(255,197,61,.12)" };
}

function rivalCards(competitors, suggestions, total) {
  const gaps = (suggestions || []).filter((row) => row?.keyword && (row.kind === "gap" || row.gapDomain));
  const by = new Map();
  (competitors || []).forEach((row) => {
    const domain = String(row?.domain || "").trim();
    if (!domain) return;
    by.set(domain, { domain, name: row.name || domain, gaps: [], positions: [] });
  });
  gaps.forEach((row) => {
    const domain = String(row.gapDomain || "").trim();
    if (!domain) return;
    if (!by.has(domain)) by.set(domain, { domain, name: domain, gaps: [], positions: [] });
    const card = by.get(domain);
    if (card.gaps.length < 6) card.gaps.push(row);
    const pos = Number(row.gapPosition);
    if (Number.isFinite(pos)) card.positions.push(pos);
  });
  return [...by.values()]
    .filter((card) => card.gaps.length || card.positions.length)
    .slice(0, 3)
    .map((card) => {
      const shows = card.gaps.length || card.positions.length;
      const avg = card.positions.length
        ? `#${Math.round(card.positions.reduce((sum, n) => sum + n, 0) / card.positions.length)}`
        : "—";
      return {
        ...card,
        shows: `${shows} of ${total || shows}`,
        avg,
        bar: `${Math.min(100, Math.round((shows / Math.max(total, shows, 1)) * 100))}%`,
      };
    });
}

const MONO = { fontFamily: '"Open Sans", sans-serif', fontWeight: 700 };

export default function KeywordGuide({
  suggestions = [],
  competitors = [],
  localVolume = null,
  trackedTerms = new Set(),
  tracking = "",
  onTrack,
  onUntrack,
  onSeeTracked,
  aiChecks = [],
}) {
  const clusters = useMemo(() => clustersFrom(suggestions), [suggestions]);
  const walk = clusters;
  const area = localVolume?.location ? String(localVolume.location).split(",")[0] : "";
  const place = area || "your area";
  const [view, setView] = useState("guide");
  const [step, setStep] = useState(0);
  const [why, setWhy] = useState(false);
  const [chk, setChk] = useState({});
  const [typed, setTyped] = useState(0);
  const [filter, setFilter] = useState("all");
  const [gapOpen, setGapOpen] = useState(null);
  const [session, setSession] = useState([]);

  const board = view === "all" ? clusters : walk;
  const totalVol = board.reduce((sum, group) => sum + group.vol, 0);
  const count = board.reduce((sum, group) => sum + group.items.length, 0);
  const appear = board.reduce(
    (sum, group) => sum + group.items.filter((row) => row.position != null && row.position !== "").length,
    0
  );
  const onPageOne = board.some((group) => group.items.some((row) => Number(row.position) > 0 && Number(row.position) <= 10));
  const rivals = useMemo(() => rivalCards(competitors, suggestions, count), [competitors, suggestions, count]);
  const topic = walk[step - 1] || null;
  const done = step > walk.length;

  useEffect(() => {
    if (!topic) return undefined;
    setTyped(0);
    setWhy(false);
    const id = window.setInterval(() => {
      setTyped((n) => (n >= topic.topic.length ? n : n + 1));
    }, 85);
    return () => window.clearInterval(id);
  }, [topic?.topic]);

  const isChk = (row) => {
    if (chk[row.keyword] !== undefined) return chk[row.keyword];
    const kd = Number(row.difficulty);
    return !Number.isFinite(kd) || kd <= 30;
  };

  const trackRows = async (rows) => {
    const fresh = rows.filter((row) => row?.keyword && !trackedTerms.has(String(row.keyword).toLowerCase()));
    if (!fresh.length || tracking) return;
    for (const row of fresh) {
      await onTrack?.(row.keyword, {
        page: pathOf(row.page),
        concept: row.concept || "",
        source: "suggestion",
        apply: false,
      });
    }
    setSession((prev) => [...new Set([...prev, ...fresh.map((row) => row.keyword)])]);
  };

  const sessionVol = session.reduce((sum, term) => {
    const row = (suggestions || []).find((item) => item.keyword === term);
    return sum + volumeOf(row);
  }, 0);

  if (!clusters.length) {
    return (
      <section style={{ maxWidth: 720, width: "100%", margin: "0 auto", borderRadius: 24, background: "#101215", border: "1px solid #1A1D22", padding: "clamp(24px, 4vw, 44px)", display: "flex", flexDirection: "column", gap: 18 }}>
        <span style={{ ...MONO, fontSize: 12, color: "#4DA3FF", letterSpacing: ".5px" }}>YOUR STARTING POINT</span>
        <h2 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "clamp(30px, 3.6vw, 44px)", lineHeight: 1.08, letterSpacing: "-1.2px", fontWeight: 700 }}>No suggestions yet.</h2>
        <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: "#D7DADE" }}>
          Searchify looks up searches that match this website. Nothing is filled in until that data comes back.
        </p>
      </section>
    );
  }

  const filters = [
    ["all", "All topics"],
    ["easy", "Easy wins"],
    ["buying", "Ready to hire"],
    ["new", "Needs a new page"],
  ];
  const visible = clusters.filter((group) => {
    if (filter === "buying") return group.intent === "buying";
    if (filter === "new") return group.isNew;
    if (filter === "easy") return group.items.some((row) => Number(row.difficulty) < 20);
    return true;
  });

  return (
    <div className="kw-guide">
      <style>{`
        @keyframes sfy-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes sfy-caret{0%,49%{opacity:1}50%,100%{opacity:0}}
        @keyframes sfy-breathe{0%,100%{opacity:1}50%{opacity:.5}}
        .kw-guide button{font-family:inherit;cursor:pointer}
        .kw-guide button:focus-visible,.kw-guide a:focus-visible{outline:2px solid #4DA3FF;outline-offset:2px}
        .v8-app-main .kw-guide a.kw-link,.kw-guide a.kw-link{color:#4DA3FF !important;text-decoration:none}
        .v8-app-main .kw-guide a.kw-link:hover,.kw-guide a.kw-link:hover{color:#8CC4FF !important}
        .kw-all{box-sizing:border-box;width:100%}
        .kw-all article,.kw-all section{box-sizing:border-box}
        @media (prefers-reduced-motion: reduce){.kw-guide *{animation:none !important;transition:none !important}}
      `}</style>

      {view === "guide" ? (
        <div style={{ maxWidth: 720, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 18, paddingTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <div aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {walk.map((group, i) => {
                const current = i === step - 1;
                const past = done || i < step - 1;
                return (
                  <span
                    key={group.id}
                    style={{
                      width: current ? 28 : 10,
                      height: 10,
                      borderRadius: 999,
                      background: past ? "#4DA3FF" : current ? "#F2F4F5" : "#262A31",
                      transition: "width .25s ease, background .25s ease",
                    }}
                  />
                );
              })}
            </div>
            <span style={{ ...MONO, fontSize: 12, color: "#9AA1AB" }}>
              {step === 0 ? "Getting started" : done ? "All done" : `Topic ${step} of ${walk.length}`}
            </span>
            <button type="button" onClick={() => setView("all")} style={{ marginLeft: "auto", minHeight: 40, padding: "0 4px", border: 0, background: "transparent", color: "#9AA1AB", fontSize: 13, textDecoration: "underline" }}>
              See everything at once
            </button>
          </div>

          {step === 0 ? (
            <section style={{ borderRadius: 24, background: "#101215", border: "1px solid #1A1D22", padding: "clamp(24px, 4vw, 44px)", display: "flex", flexDirection: "column", gap: 18, animation: "sfy-rise .3s ease both" }}>
              <span style={{ ...MONO, fontSize: 12, color: "#4DA3FF", letterSpacing: ".5px" }}>YOUR STARTING POINT</span>
              <h2 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "clamp(30px, 3.6vw, 44px)", lineHeight: 1.08, letterSpacing: "-1.2px", fontWeight: 700 }}>
                {`People around ${place} search for what you do about ${num(totalVol) || "0"} times a month.`}
              </h2>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: "#D7DADE" }}>
                {appear
                  ? `Google shows you for ${appear} of them${onPageOne ? "." : ", none on page one yet."}`
                  : "Google doesn’t show your site for any of these yet. That’s normal for a new site."}{" "}
                We found {walk.length} topics you could win. Let’s go through them one at a time.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <button type="button" onClick={() => setStep(1)} style={{ minHeight: 54, padding: "0 26px", borderRadius: 14, border: 0, background: "#4DA3FF", color: "#0A0B0D", fontSize: 16, fontWeight: 600, boxShadow: "0 0 22px rgba(77,163,255,.45)" }}>
                  Show me the first one
                </button>
                <span style={{ fontSize: 13, color: "#7D848E" }}>About 2 minutes</span>
              </div>
            </section>
          ) : null}

          {topic ? (
            <TopicCard
              topic={topic}
              typed={topic.topic.slice(0, typed)}
              place={place}
              aiChecks={aiChecks}
              why={why}
              onWhy={() => setWhy((open) => !open)}
              isChk={isChk}
              onToggle={(keyword, on) => setChk((prev) => ({ ...prev, [keyword]: !on }))}
              tracking={tracking}
              onTrack={async () => {
                if (tracking) return;
                await trackRows(topic.items.filter(isChk));
                setStep((n) => n + 1);
              }}
              onSkip={() => setStep(step + 1)}
              rivals={rivals}
            />
          ) : null}

          {done ? (
            <section style={{ borderRadius: 24, background: "#101215", border: "1px solid rgba(61,220,132,.45)", boxShadow: "0 0 30px rgba(61,220,132,.1)", padding: "clamp(24px, 4vw, 44px)", display: "flex", flexDirection: "column", gap: 18, animation: "sfy-rise .3s ease both" }}>
              <span style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(61,220,132,.14)", display: "grid", placeItems: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3DDC84" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
              </span>
              <h2 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "clamp(30px, 3.6vw, 44px)", lineHeight: 1.08, letterSpacing: "-1.2px", fontWeight: 700 }}>
                {session.length ? `You’re tracking ${session.length} searches.` : "Nothing tracked yet."}
              </h2>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: "#D7DADE" }}>
                {session.length
                  ? `Worth about ${num(sessionVol) || "—"} searches a month. First readings within 7 days, then we’ll show you your first move.`
                  : "Go through the topics again and pick the ones that fit your business."}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <button type="button" onClick={onSeeTracked} style={{ minHeight: 54, padding: "0 26px", borderRadius: 14, border: 0, background: "#4DA3FF", color: "#0A0B0D", fontSize: 16, fontWeight: 600 }}>
                  See what we&apos;re tracking
                </button>
                <button type="button" onClick={() => setStep(1)} style={{ minHeight: 54, padding: "0 12px", border: 0, background: "transparent", color: "#9AA1AB", fontSize: 14, textDecoration: "underline" }}>
                  Go through the topics again
                </button>
              </div>
            </section>
          ) : null}
        </div>
      ) : (
        <div className="kw-all" style={{ maxWidth: 1120, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 22, animation: "sfy-rise .3s ease both" }}>
          <button type="button" onClick={() => setView("guide")} style={{ alignSelf: "flex-start", minHeight: 40, padding: 0, border: 0, background: "transparent", color: "#4DA3FF", fontSize: 14, fontWeight: 600 }}>
            ← Back to one at a time
          </button>

          {!appear ? (
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "16px 18px", borderRadius: 16, background: "rgba(77,163,255,.06)", border: "1px solid rgba(77,163,255,.4)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4DA3FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none", marginTop: 1 }}>
                <circle cx="12" cy="12" r="9" /><path d="M12 11v6" /><path d="M12 7.5h.01" />
              </svg>
              <span style={{ fontSize: 15, lineHeight: 1.55, color: "#D7DADE" }}>
                <strong style={{ color: "#F2F4F5" }}>Your site is new, so Google hasn&apos;t sent much data yet. That&apos;s normal.</strong> Here&apos;s what people around {place} already search for that matches what you do. Tap Track on the ones you want and we start measuring today.
              </span>
            </div>
          ) : null}

          <section aria-label="What's up for grabs" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <Stat kicker="SEARCHES A MONTH IN YOUR AREA" value={totalVol ? `~${num(totalVol)}` : "—"} note={`for the ${count} searches below`} />
            <Stat kicker="IF YOU REACH THE TOP 3" value={roundVisits(totalVol) ? `~${num(roundVisits(totalVol))}` : "—"} valueColor="#3DDC84" note="visitors a month, roughly" />
            <Stat
              kicker="YOU SHOW UP FOR"
              value={`${appear} of ${count}`}
              valueColor={appear ? "#FFC53D" : "#FF5A4E"}
              note={appear ? (onPageOne ? "including some already on page one" : "and none of them on page one yet") : "Google hasn’t shown you for any of them yet"}
            />
          </section>

          {session.length ? (
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", padding: "14px 18px", borderRadius: 16, background: "rgba(61,220,132,.07)", border: "1px solid rgba(61,220,132,.45)", animation: "sfy-rise .3s ease both" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3DDC84", boxShadow: "0 0 10px #3DDC84", animation: "sfy-breathe 1.6s ease-in-out infinite" }} />
              <span style={{ flex: "1 1 300px", fontSize: 15, lineHeight: 1.5 }}>
                Tracking {session.length} new search{session.length === 1 ? "" : "es"} worth about {num(sessionVol) || "—"} searches a month. First readings land within 7 days.
              </span>
              <button type="button" onClick={onSeeTracked} style={{ minHeight: 46, padding: "0 18px", borderRadius: 12, border: "1px solid #3A404A", background: "#1A1D22", color: "#F2F4F5", fontSize: 14, fontWeight: 600 }}>
                See them in Tracked →
              </button>
            </div>
          ) : null}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <h2 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 26, letterSpacing: "-0.5px", fontWeight: 700 }}>Searches you could win</h2>
                <span style={{ fontSize: 14, color: "#9AA1AB" }}>Grouped by the page that should own them.</span>
              </div>
              <div role="group" aria-label="Filter suggestions" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {filters.map(([id, label]) => {
                  const on = filter === id;
                  return (
                    <button key={id} type="button" aria-pressed={on} onClick={() => setFilter(id)} style={{ minHeight: 40, padding: "0 14px", borderRadius: 999, border: `1px solid ${on ? "#4DA3FF" : "#262A31"}`, background: on ? "rgba(77,163,255,.1)" : "transparent", color: on ? "#F2F4F5" : "#D7DADE", fontSize: 13, fontWeight: 600 }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 14, alignItems: "start" }}>
              {visible.map((group) => {
                const rows = filter === "easy" ? group.items.filter((row) => Number(row.difficulty) < 20) : group.items;
                const vol = rows.reduce((sum, row) => sum + volumeOf(row), 0);
                const allOn = rows.every((row) => trackedTerms.has(String(row.keyword).toLowerCase()));
                const visits = roundVisits(vol);
                return (
                  <article key={group.id} style={{ borderRadius: 20, background: "#101215", border: "1px solid #1A1D22", padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 999, color: group.intent === "buying" ? "#3DDC84" : "#D7DADE", background: group.intent === "buying" ? "rgba(61,220,132,.12)" : "#1A1D22" }}>
                        {group.intent === "buying" ? "People ready to hire" : "People researching"}
                      </span>
                      <span style={{ ...MONO, fontSize: 11, padding: "4px 10px", borderRadius: 999, color: group.isNew ? "#FFC53D" : "#D7DADE", border: `1px solid ${group.isNew ? "rgba(255,197,61,.45)" : "#262A31"}` }}>
                        {(group.isNew ? "NEW PAGE · " : "YOUR PAGE · ") + group.page}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <h3 style={{ margin: 0, fontSize: 19, fontWeight: 600 }}>{group.topic}</h3>
                      <span style={{ fontSize: 14, color: "#9AA1AB" }}>
                        <strong style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 22, color: "#F2F4F5" }}>{vol ? `~${num(vol)}` : "—"}</strong>{" "}
                        searches a month · about {num(visits) || "0"} visitors if you reach the top 3
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {rows.map((row) => {
                        const on = trackedTerms.has(String(row.keyword).toLowerCase());
                        const win = winOf(row.difficulty);
                        return (
                          <div key={row.keyword} style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 56, padding: "6px 0", borderTop: "1px solid #1A1D22" }}>
                            <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                              <span style={{ fontSize: 14, lineHeight: 1.3 }}>{row.keyword}</span>
                              <span style={{ fontSize: 12, color: "#7D848E", lineHeight: 1.35 }}>{rowMeta(row)}</span>
                            </span>
                            <span style={{ flex: "none", fontSize: 11, fontWeight: 600, padding: "4px 8px", borderRadius: 8, color: win.color, background: win.bg, whiteSpace: "nowrap" }}>{win.label}</span>
                            <button
                              type="button"
                              aria-pressed={on}
                              aria-label={`${on ? "Stop tracking" : "Track"} ${row.keyword}`}
                              disabled={Boolean(tracking)}
                              onClick={() => (on ? onUntrack?.(row.keyword) : trackRows([row]))}
                              style={{ flex: "none", minWidth: 92, minHeight: 40, padding: "0 12px", borderRadius: 10, border: `1px solid ${on ? "rgba(61,220,132,.5)" : "#4DA3FF"}`, background: on ? "rgba(61,220,132,.12)" : "#4DA3FF", color: on ? "#3DDC84" : "#0A0B0D", fontSize: 13, fontWeight: 600 }}
                            >
                              {tracking === String(row.keyword).toLowerCase() ? "…" : on ? "✓ Tracking" : "Track"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <button type="button" disabled={Boolean(tracking)} onClick={() => (allOn ? rows.forEach((row) => onUntrack?.(row.keyword)) : trackRows(rows))} style={{ minHeight: 46, padding: "0 16px", borderRadius: 12, border: "1px solid #3A404A", background: "#1A1D22", color: "#F2F4F5", fontSize: 14, fontWeight: 600 }}>
                        {allOn ? `✓ All ${rows.length} tracked` : `Track all ${rows.length}`}
                      </button>
                      {group.isNew ? (
                        <Link href="/app/queue" className="kw-link" style={{ display: "inline-flex", alignItems: "center", minHeight: 46, padding: "0 12px", fontSize: 14, fontWeight: 600 }}>
                          Plan this page →
                        </Link>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <section aria-labelledby="comp-h" style={{ borderRadius: 22, background: "#101215", border: "1px solid #1A1D22", padding: "clamp(18px, 2.4vw, 24px)", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <h2 id="comp-h" style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 26, letterSpacing: "-0.5px", fontWeight: 700 }}>Who&apos;s winning these searches near you</h2>
                <span style={{ fontSize: 14, color: "#9AA1AB" }}>The sites Google shows most often for the {count} searches above.</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 12, alignItems: "start" }}>
                {rivals.map((card) => {
                  const open = gapOpen === card.domain;
                  return (
                    <div key={card.domain} style={{ borderRadius: 16, background: "#0A0B0D", border: `1px solid ${open ? "#3A404A" : "#1A1D22"}`, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 16, fontWeight: 600 }}>{card.name}</span>
                        <span style={{ ...MONO, fontSize: 12, color: "#7D848E" }}>{card.domain}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#D7DADE" }}>
                        <span>Shows up for {card.shows}</span>
                        <span>Average spot {card.avg}</span>
                      </div>
                      <div aria-hidden="true" style={{ height: 8, borderRadius: 999, background: "#1A1D22", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: card.bar, borderRadius: 999, background: "#FF5A4E" }} />
                      </div>
                      <button type="button" aria-expanded={open} onClick={() => setGapOpen(open ? null : card.domain)} style={{ minHeight: 42, padding: "0 12px", borderRadius: 10, border: "1px solid #262A31", background: "transparent", color: "#F2F4F5", fontSize: 13, fontWeight: 600, textAlign: "left" }}>
                        {open ? "Hide" : `See the ${card.gaps.length} they win and you don’t →`}
                      </button>
                      {open ? (
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          {card.gaps.map((row) => {
                            const on = trackedTerms.has(String(row.keyword).toLowerCase());
                            const theirs = row.gapPosition != null ? `#${Math.round(Number(row.gapPosition))}` : "ranked";
                            const yours = row.position != null && row.position !== "" ? `#${Math.round(Number(row.position))}` : "not found";
                            return (
                              <div key={row.keyword} style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 50, borderTop: "1px solid #1A1D22" }}>
                                <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                                  <span style={{ fontSize: 13 }}>{row.keyword}</span>
                                  <span style={{ fontSize: 12, color: "#7D848E" }}>They’re {theirs} · you: {yours}</span>
                                </span>
                                <button type="button" aria-pressed={on} disabled={Boolean(tracking)} onClick={() => (on ? onUntrack?.(row.keyword) : trackRows([row]))} style={{ flex: "none", minWidth: 86, minHeight: 38, padding: "0 10px", borderRadius: 10, border: `1px solid ${on ? "rgba(61,220,132,.5)" : "#4DA3FF"}`, background: on ? "rgba(61,220,132,.12)" : "#4DA3FF", color: on ? "#3DDC84" : "#0A0B0D", fontSize: 12, fontWeight: 600 }}>
                                  {on ? "✓ Tracking" : "Track"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              {!rivals.length ? (
                <span style={{ fontSize: 14, color: "#9AA1AB" }}>No competitor ranks are stored for these searches yet.</span>
              ) : null}
            </section>

            <section aria-labelledby="ai-h" style={{ borderRadius: 22, background: "#101215", border: "1px solid #1A1D22", padding: "clamp(18px, 2.4vw, 24px)", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <h2 id="ai-h" style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 26, letterSpacing: "-0.5px", fontWeight: 700 }}>What AI assistants recommend</h2>
                <span style={{ fontSize: 14, color: "#9AA1AB" }}>Questions your customers ask ChatGPT and Google&apos;s AI answers, and who gets named.</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {aiRowsFrom(aiChecks, board).map((check, index) => {
                  const badge = check.live ? mentionBadge(check) : { text: "Not checked yet", color: "#FFC53D", bg: "rgba(255,197,61,.12)" };
                  const who = (check.sources || []).map((source) => source.title || source.url).filter(Boolean).slice(0, 3).join(", ");
                  return (
                    <div key={check.id || check.prompt || index} style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", minHeight: 64, padding: "10px 0", borderTop: "1px solid #1A1D22" }}>
                      <span style={{ flex: "1 1 320px", minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                        <span style={{ fontSize: 15 }}>{`“${check.prompt}”`}</span>
                        <span style={{ fontSize: 12, color: "#7D848E" }}>{check.engine || "ChatGPT, Google AI Overview"} · names: {who || "not stored"}</span>
                      </span>
                      <span style={{ flex: "none", fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 8, color: badge.color, background: badge.bg }}>{badge.text}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "12px 14px", borderRadius: 12, background: "#0A0B0D", border: "1px solid #262A31" }}>
                <span style={{ flex: "1 1 320px", fontSize: 14, color: "#D7DADE", lineHeight: 1.5 }}>AI tends to name businesses whose pages answer plainly: prices, timelines, service areas. Your suggested pages are planned that way.</span>
                <Link href="/app/queue" className="kw-link" style={{ fontSize: 14, fontWeight: 600 }}>See how →</Link>
              </div>
            </section>
        </div>
      )}
    </div>
  );
}

function Stat({ kicker, value, note, valueColor = "#F2F4F5" }) {
  return (
    <div style={{ borderRadius: 18, background: "#101215", border: "1px solid #1A1D22", padding: 18, display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ ...MONO, fontSize: 11, color: "#9AA1AB" }}>{kicker}</span>
      <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 40, lineHeight: 1, fontWeight: 800, color: valueColor }}>{value}</span>
      <span style={{ fontSize: 13, color: "#9AA1AB" }}>{note}</span>
    </div>
  );
}

function aiAnswerLine(topic, checks) {
  const words = String(topic?.topic || "")
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3);
  const hit = (checks || []).find((check) => {
    const text = `${check.prompt || ""} ${(check.sources || []).map((source) => source.title || source.url || "").join(" ")}`.toLowerCase();
    return words.some((word) => text.includes(word));
  });
  if (!hit) return "No live AI answer check is stored for this topic yet.";
  const where = hit.engine || "an AI assistant";
  if (hit.observed && hit.mention) return `A live ${where} check named you for “${hit.prompt}”.`;
  if (hit.observed || hit.mention === false) return `A live ${where} check did not name you for “${hit.prompt}”.`;
  return `“${hit.prompt}” is queued. It has not been checked live yet.`;
}

function TopicCard({ topic, typed, place, why, onWhy, isChk, onToggle, tracking, onTrack, onSkip, rivals, aiChecks = [] }) {
  const selected = topic.items.filter(isChk);
  const buying = topic.intent === "buying";
  const vol = num(topic.vol);
  const winner = rivals[0]?.name;
  return (
    <section aria-labelledby="g-h" style={{ borderRadius: 24, background: "#101215", border: "1px solid #1A1D22", padding: "clamp(22px, 3.4vw, 36px)", display: "flex", flexDirection: "column", gap: 18, animation: "sfy-rise .3s ease both" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h2 id="g-h" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>People search for: {topic.topic}</h2>
        <span aria-hidden="true" style={{ ...MONO, fontSize: 12, color: "#4DA3FF", letterSpacing: ".8px" }}>OUR ANALYSIS RECOMMENDS, PEOPLE ARE SEARCHING FOR:</span>
        <div aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: 14, minHeight: 72, padding: "0 24px", borderRadius: 999, background: "#0A0B0D", border: "1.5px solid #4DA3FF", boxShadow: "0 0 26px rgba(77,163,255,.25)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4DA3FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.5-4.5" /></svg>
          <span style={{ minWidth: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "clamp(26px, 3vw, 36px)", fontWeight: 700, letterSpacing: "-0.6px", whiteSpace: "nowrap", overflow: "hidden" }}>
            {typed}
            <span style={{ display: "inline-block", width: 3, height: "1em", marginLeft: 3, verticalAlign: "-0.14em", background: "#4DA3FF", animation: "sfy-caret 1s infinite" }} />
          </span>
        </div>
        <span style={{ fontSize: 17, color: "#D7DADE" }}>
          <strong style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 24, color: "#F2F4F5" }}>{vol ? `~${vol}` : "—"}</strong>
          {vol ? ` times a month around ${place}` : " Search volume was not returned for this topic."}
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
          <InfoCard
            icon={buying ? "M13 2L4 14h7l-1 8 9-12h-7z" : "M9 9a3 3 0 1 1 4 2.8c-.6.3-1 .9-1 1.6V14 M12 17.5h.01"}
            color={buying ? "#3DDC84" : "#D7DADE"}
            bg={buying ? "rgba(61,220,132,.12)" : "#1A1D22"}
            kicker="SEARCH INTENT"
            title={buying ? "Ready to hire" : "Looking for answers"}
            sub={buying ? "People typing this want a provider now, not advice." : "Researching today, customers later. Best answered by a helpful article."}
          />
          <InfoCard
            icon={topic.isNew ? "M14 3H6v18h12V7z M12 11v6 M9 14h6" : "M14 3H6v18h12V7z M9 14l2 2 4-4"}
            color={topic.isNew ? "#FFC53D" : "#D7DADE"}
            bg={topic.isNew ? "rgba(255,197,61,.12)" : "#1A1D22"}
            kicker="ON YOUR WEBSITE"
            title={topic.isNew ? "No page for this yet" : topic.page}
            sub={topic.isNew ? "We’ll draft one for you to approve." : "We’ll suggest improvements to this page."}
          />
        </div>
      </div>

      <div role="group" aria-labelledby="sk-h" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px 16px", borderRadius: 14, background: "rgba(77,163,255,.06)", border: "1px solid rgba(77,163,255,.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h3 id="sk-h" style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Suggested keywords</h3>
            <span aria-live="polite" style={{ ...MONO, fontSize: 12, padding: "3px 10px", borderRadius: 999, background: "#4DA3FF", color: "#0A0B0D" }}>
              {selected.length} of {topic.items.length} selected
            </span>
          </div>
          <span style={{ fontSize: 14, lineHeight: 1.55, color: "#D7DADE" }}>These are keywords we&apos;re suggesting to you, pre-selected based on our expertise. Check or uncheck any you prefer.</span>
          <span style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#9AA1AB" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: "#4DA3FF", display: "grid", placeItems: "center" }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#0A0B0D" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
              </span>
              Checked: we&apos;ll track it
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 14, height: 14, boxSizing: "border-box", borderRadius: 4, border: "2px solid #3A404A" }} />
              Unchecked: skipped
            </span>
          </span>
        </div>
        <div aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: 14, padding: "4px 16px 0", ...MONO, fontSize: 10, letterSpacing: ".5px", color: "#7D848E" }}>
          <span style={{ width: 22 }}>TRACK</span>
          <span style={{ flex: 1 }}>KEYWORD</span>
          <span>HOW HARD TO WIN</span>
          <span style={{ minWidth: 64, textAlign: "right" }}>SEARCHES</span>
        </div>
        {topic.items.map((row) => {
          const on = isChk(row);
          const win = winOf(row.difficulty);
          return (
            <button key={row.keyword} type="button" role="checkbox" aria-checked={on} onClick={() => onToggle(row.keyword, on)} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", minHeight: 64, padding: "8px 16px", borderRadius: 14, border: `1px solid ${on ? "rgba(77,163,255,.5)" : "#1A1D22"}`, background: on ? "rgba(77,163,255,.06)" : "#0A0B0D", color: "#F2F4F5", textAlign: "left", transition: "border-color .15s ease, background .15s ease" }}>
              <span style={{ width: 22, height: 22, flex: "none", boxSizing: "border-box", borderRadius: 7, border: `2px solid ${on ? "#4DA3FF" : "#3A404A"}`, background: on ? "#4DA3FF" : "transparent", display: "grid", placeItems: "center" }}>
                {on ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0A0B0D" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg> : null}
              </span>
              <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 16, lineHeight: 1.3, color: on ? "#F2F4F5" : "#9AA1AB" }}>{row.keyword}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: on ? "#4DA3FF" : "#7D848E" }}>{on ? "✓ We’ll track this" : "Skipped"}</span>
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9AA1AB", whiteSpace: "nowrap" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: win.color }} />
                {win.label}
              </span>
              <span style={{ ...MONO, fontSize: 13, color: "#D7DADE", minWidth: 64, textAlign: "right", whiteSpace: "nowrap" }}>{num(volumeOf(row)) ? `${num(volumeOf(row))} / mo` : "—"}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button type="button" onClick={onTrack} disabled={!selected.length || Boolean(tracking)} style={{ minHeight: 54, padding: "0 26px", borderRadius: 14, border: 0, background: selected.length ? "#4DA3FF" : "#3A404A", color: "#0A0B0D", fontSize: 16, fontWeight: 600 }}>
          {tracking ? "Tracking…" : selected.length ? `Track ${selected.length} search${selected.length === 1 ? "" : "es"}` : "Pick at least one"}
        </button>
        <button type="button" onClick={onSkip} style={{ minHeight: 54, padding: "0 18px", borderRadius: 14, border: "1px solid #262A31", background: "transparent", color: "#F2F4F5", fontSize: 15 }}>
          Skip this topic
        </button>
      </div>

      <div style={{ borderTop: "1px solid #1A1D22", paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        <button type="button" aria-expanded={why} onClick={onWhy} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 8, minHeight: 40, padding: 0, border: 0, background: "transparent", color: "#D7DADE", fontSize: 14, fontWeight: 600 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v6" /><path d="M12 7.5h.01" /></svg>
          {why ? "Hide details" : "Why this topic?"}
        </button>
        {why ? (
          <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: 10, animation: "sfy-rise .2s ease both" }}>
            {[
              ["Who wins it now", winner ? `${winner} shows up on these searches.` : "Competitor ranks were not returned for this topic."],
              ["In AI answers", aiAnswerLine(topic, aiChecks)],
              ["What it takes", topic.isNew ? "A new page. We draft it, you approve it." : `Edits to ${topic.page}.`],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "grid", gridTemplateColumns: "140px minmax(0, 1fr)", gap: 12, fontSize: 14, lineHeight: 1.5 }}>
                <dt style={{ color: "#7D848E" }}>{k}</dt>
                <dd style={{ margin: 0, color: "#D7DADE" }}>{v}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  );
}

function InfoCard({ icon, color, bg, kicker, title, sub }) {
  return (
    <div style={{ borderRadius: 14, background: "#0A0B0D", border: "1px solid #1A1D22", padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
      <span style={{ width: 34, height: 34, flex: "none", borderRadius: 10, background: bg, display: "grid", placeItems: "center" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icon} /></svg>
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
        <span style={{ ...MONO, fontSize: 11, color: "#7D848E", letterSpacing: ".5px" }}>{kicker}</span>
        <span style={{ fontSize: 15, fontWeight: 600, color, overflowWrap: "anywhere" }}>{title}</span>
        <span style={{ fontSize: 13, color: "#9AA1AB", lineHeight: 1.45 }}>{sub}</span>
      </span>
    </div>
  );
}
