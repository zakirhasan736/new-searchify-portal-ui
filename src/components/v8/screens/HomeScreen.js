"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  listChanges,
  patchChange,
  executeChange,
  dismissChange,
  generateMetaCopy,
  changePath,
  proposeFromGsc,
  historyItems,
  loadFeature,
  featurePayload,
  getBusinessProfile,
} from "@/lib/v1Api";
import { useConnectionStatus } from "@/components/board/ConnectDialog";
import { activeSiteContext } from "@/lib/siteContext";
import { initials } from "@/lib/v8LiveData";
import { listingKept, listingStatus, pinKeptTitle, whyLines } from "@/lib/listingSuggestion";
import { Skel } from "@/components/v8/SkeletonWave";
import "@/styles/v8-screens.css";

const QUALITY = ["Poor", "Fair", "Good", "Strong", "Great", "Excellent"];

function kindFromChange(c) {
  const opp = String(c.opportunity || "").trim();
  if (opp) {
    const head = opp.split("·")[0].split("—")[0].trim();
    if (head.length <= 48) return head;
  }
  const ct = String(c.changeType || "meta").toLowerCase();
  const map = {
    meta: "Title rewrite",
    image: "Images",
    content: "Content refresh",
    link: "Internal links",
    links: "Internal links",
    schema: "Schema",
    assets: "Speed",
    redirect: "Redirect",
  };
  return map[ct] || "Page update";
}

function parseMid(gain) {
  const m = String(gain || "").match(/(\d+)/);
  return m ? Math.min(99, Number(m[1])) : 20;
}

function highlightHead(text) {
  const t = String(text || "").trim();
  if (!t) return "Review this *move* before it ships.";
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length <= 6) return `*${t}*`;
  return `${words.slice(0, 3).join(" ")} *${words.slice(3, 6).join(" ")}* ${words.slice(6).join(" ")}`.trim();
}

function starHighlight(text) {
  const t = String(text || "").trim();
  if (!t) return t;
  if (t.includes("*")) return t;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length <= 4) return `*${t}*`;
  const mid = Math.min(3, Math.max(1, Math.floor(words.length / 3)));
  return `${words.slice(0, mid).join(" ")} *${words.slice(mid, mid + 2).join(" ")}* ${words.slice(mid + 2).join(" ")}`.trim();
}

function choiceScore(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : 0;
}

function suggestionPairs(p) {
  const pairs = [];
  const push = (title, description, ctrFit, seoScore) => {
    const t = String(title || "").trim();
    const d = String(description || "").trim();
    if (!t && !d) return;
    const key = `${t} ${d}`.toLowerCase();
    if (pairs.some((row) => `${row.title} ${row.description}`.toLowerCase() === key)) return;
    pairs.push({
      title: t || "Updated title",
      description: d || "A clearer description for this page.",
      ctrFit: choiceScore(ctrFit),
      seoScore: choiceScore(seoScore),
    });
  };
  push(p.title, p.metaDescription || p.description, p.ctrFit, p.seoScore);
  (Array.isArray(p.aiAlternatives) ? p.aiAlternatives : []).forEach((alt) => {
    push(alt?.title, alt?.description || alt?.metaDescription, alt?.ctrFit, alt?.seoScore);
  });
  pairs.sort((a, b) => (b.ctrFit || 0) - (a.ctrFit || 0) || (b.seoScore || 0) - (a.seoScore || 0));
  pinKeptTitle(pairs, {
    keep: listingKept(p),
    liveTitle: p.liveTitle || p.beforeTitle || "",
    liveDescription: p.liveMetaDescription || p.beforeMetaDescription || p.beforeDescription || "",
    ctrFit: choiceScore(p.ctrFit),
    seoScore: choiceScore(p.seoScore),
  });
  return pairs.slice(0, 3);
}

function changeToMove(c) {
  const path = changePath(c);
  const p = c.proposed || {};
  const kind = kindFromChange(c);
  const before =
    p.liveTitle ||
    p.beforeTitle ||
    p.beforeMetaDescription ||
    p.beforeDescription ||
    p.before ||
    "(Not set on the live page.)";
  const gain = p.expectedGain || p.gain || "+10–30 clicks / mo";
  return {
    t: `${kind} · ${path}`,
    kind,
    head: highlightHead(p.title || c.opportunity || `Ship a clearer *${kind.toLowerCase()}* for this page.`),
    before,
    beforeTitle:
      p.liveTitle ||
      p.beforeTitle ||
      p.before ||
      "(Not set on the live page.)",
    beforeDescription: p.liveMetaDescription || p.beforeMetaDescription || p.beforeDescription || "",
    after: suggestionPairs(p),
    ogTitle: p.openGraphTitle || p.title || "",
    ogDescription: p.openGraphDescription || p.metaDescription || "",
    schemaLabel: (() => {
      const ld = p.jsonLd || {};
      const kind = ld["@type"] || (Array.isArray(p.schemaTypesPreserved) ? p.schemaTypesPreserved[0] : "") || "WebPage";
      const name = ld.name || ld.headline || "";
      return name ? `${kind} · ${name}` : String(kind);
    })(),
    gain,
    mid: parseMid(gain),
    ships:
      String(c.changeType || "").toLowerCase() === "meta"
        ? "Ships to WordPress · checked live · one-click undo"
        : "Ships to WordPress · checked live · one-click undo",
    proof: p.reason || "Based on Search Console and live reads for this site.",
    keepListing: listingKept(p),
    statusLine: listingStatus(p.liveTitle || p.beforeTitle || "", { keep: listingKept(p) }),
    why: whyLines(p),
    changeId: c.id,
  };
}

export default function HomeScreen() {
  const [col, setCol] = useState("red");
  const [cur, setCur] = useState({});
  const [done, setDone] = useState({});
  const [variant, setVariant] = useState({});
  const [gains, setGains] = useState([]);
  const [realChanges, setRealChanges] = useState([]);
  const [allChanges, setAllChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bootNote, setBootNote] = useState("");
  const [capturedNow, setCapturedNow] = useState(0);
  const [untappedTotal, setUntappedTotal] = useState(0);
  const [userInitials, setUserInitials] = useState("??");
  const [cmd, setCmd] = useState("");
  const [regenBusy, setRegenBusy] = useState(false);
  const [regenNote, setRegenNote] = useState("");
  const [hoverIdx, setHoverIdx] = useState(-1);
  const [connectionStatus] = useConnectionStatus();
  const seededOnce = useRef(false);
  const router = useRouter();

  const reloadChanges = async ({ seed = false } = {}) => {
    setLoading(true);
    try {
      let res = await listChanges({ force: true });
      let rows = Array.isArray(res.data) ? res.data : res.data?.changes || [];
      const open = rows.filter((c) =>
        ["proposed", "awaiting_approval", "approved", "failed", "needs_review"].includes(c.status),
      );
      // Design-source Home: queue is live opportunities — seed from GSC when empty.
      if (seed && open.length === 0 && (connectionStatus.gsc || connectionStatus.wordpress)) {
        setBootNote("Reading Search Console and drafting moves…");
        await proposeFromGsc({ breadth: "balanced", limit: 8, rescan: false });
        res = await listChanges({ force: true });
        rows = Array.isArray(res.data) ? res.data : res.data?.changes || [];
      }
      setAllChanges(rows);
      setRealChanges(
        rows.filter((c) =>
          ["proposed", "awaiting_approval", "approved", "failed", "needs_review"].includes(c.status),
        ),
      );
      const [organic, prof] = await Promise.all([loadFeature("organic-search"), getBusinessProfile()]);
      const gsc = featurePayload(organic);
      const weeks = (gsc.weekly || gsc.panels?.weeklyClicks || []).slice(-4);
      const clicks = weeks.reduce((s, w) => s + (Number(w[1]) || 0), 0);
      const impr = Number(String(gsc.kpis?.[1]?.[1] || "").replace(/[^\d.]/g, "")) || 0;
      const histGain = historyItems(rows).reduce((sum, c) => {
        const g = String(c.proposed?.expectedGain || c.proposed?.gain || "");
        const m = g.match(/(\d+)/);
        return sum + (m ? Number(m[1]) : 0);
      }, 0);
      setCapturedNow(clicks || histGain || 0);
      setUntappedTotal(impr || Math.max(clicks || histGain, 0) || 0);
      if (prof.ok && prof.data) {
        setUserInitials(initials(prof.data.displayName || prof.data.name || prof.data.email || ""));
      }
      setBootNote("");
    } catch {
      setBootNote("Could not load moves from the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadChanges({ seed: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When connections arrive after first paint, seed the queue once if still empty.
  useEffect(() => {
    if (loading || seededOnce.current) return;
    if (realChanges.length > 0) return;
    if (!(connectionStatus.gsc || connectionStatus.wordpress)) return;
    seededOnce.current = true;
    reloadChanges({ seed: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionStatus.gsc, connectionStatus.wordpress]);

  // Constants
  const COLORS = { red: "#FF5A4E", yellow: "#FFC53D", green: "#3DDC84", blue: "#4DA3FF" };
  const RGB = { red: "255,90,78", yellow: "255,197,61", green: "61,220,132", blue: "77,163,255" };
  const LABEL = { red: "Dire", yellow: "Medium", green: "Passes", blue: "Locked" };
  const TAG = { red: "DIRE", yellow: "MEDIUM", green: "PASSES", blue: "LOCKED" };
  const NOUN = { red: "reds", yellow: "yellows", green: "greens", blue: "blues" };

  // Live mode only — never inject Northline HTML sample into a signed-in workspace.
  const RED = useMemo(
    () =>
      realChanges
        .filter((c) => c.status !== "needs_review" && c.status !== "failed")
        .map(changeToMove),
    [realChanges],
  );
  const YELLOW = useMemo(
    () =>
      realChanges.filter((c) => c.status === "needs_review" || c.status === "failed").map(changeToMove),
    [realChanges],
  );
  const GREEN = useMemo(() => {
    const hist = historyItems(allChanges).slice(0, 28);
    if (!hist.length) return [];
    return hist.map((c) => ({ t: `${kindFromChange(c)} · ${changePath(c)}` }));
  }, [allChanges]);
  const BLUE = useMemo(() => {
    const locked = allChanges
      .filter((c) => c.status === "monitoring" || c.status === "applied")
      .slice(0, 13);
    return locked.map((c) => ({ t: `Winning — leave as is · ${changePath(c)}` }));
  }, [allChanges]);

  const Q = { red: RED, yellow: YELLOW, green: GREEN, blue: BLUE };

  const list = Q[col];
  const doneMap = done;

  let ci = cur[col];
  if (!(typeof ci === "number" && ci >= 0 && ci < list.length)) {
    const openIdx = list.findIndex((item) => !doneMap[item.t]);
    ci = list.length ? (openIdx >= 0 ? openIdx : 0) : -1;
  }
  const actionable = col === "red" || col === "yellow";
  const openCount = (c) => Q[c].filter((x) => !doneMap[x.t]).length;

  const chips = ["red", "yellow", "green", "blue"].map((k) => ({
    label: LABEL[k],
    count: k === "red" || k === "yellow" ? openCount(k) + " left" : String(Q[k].length),
    color: COLORS[k],
    tint: `rgba(${RGB[k]},.16)`,
    glow: `rgba(${RGB[k]},.55)`,
    on: col === k,
    off: col !== k,
    pick: () => {
      setHoverIdx(-1);
      setCol(k);
    },
  }));

  const stream = list.map((x, k) => {
    const st = doneMap[x.t];
    const isCur = ci >= 0 && k === ci;
    const fill = st === "shipped" ? COLORS.green : st === "skipped" ? "transparent" : COLORS[col];
    return {
      pick: () => setCur({ ...cur, [col]: k }),
      hover: () => setHoverIdx(k),
      label: x.t + (st ? " — " + st : ""),
      fill: fill,
      edge: st === "skipped" ? "#5B616B" : fill,
      shadow: isCur ? `0 0 16px ${COLORS[col]}` : st ? "none" : `0 0 8px rgba(${RGB[col]},.45)`,
      ring: isCur ? "2px solid #F2F4F5" : "none",
      op: st ? "0.55" : isCur ? "1" : "0.8",
      anim: isCur ? "sfy-flicker 1.4s ease-in-out infinite" : "none",
    };
  });

  const hasMove = actionable && ci >= 0 && !!list[ci] && !doneMap[list[ci].t];
  const waitingPick = list.length > 0 && !(ci >= 0 && list[ci]);
  const segs = (str) =>
    str
      .split("*")
      .map((t, k) => ({ t: t, hl: k % 2 === 1, plain: k % 2 === 0 }))
      .filter((x) => x.t !== "");

  let m = {
    tag: "",
    kind: "",
    page: "",
    head: [],
    afterSegs: [],
    afterDesc: "",
    before: "",
    beforeTitle: "",
    beforeDescription: "",
    ogTitle: "",
    ogDescription: "",
    schemaLabel: "",
    gain: "",
    ships: "",
    proof: "",
    opt: "1",
    optCount: 1,
    afterAll: [],
    color: COLORS[col],
    changeId: null,
  };

  if (hasMove) {
    const it = list[ci];
    const count = Math.max(it.after.length, 1);
    const v = (variant[it.t] || 0) % count;
    const pair = it.after[v] || { title: "", description: "", ctrFit: 0, seoScore: 0 };
    m = {
      tag: TAG[col] + " · " + (ci + 1) + " OF " + list.length,
      kind: it.kind,
      page: it.t.split(" · ")[1],
      head: segs(it.head),
      afterSegs: segs(starHighlight(pair.title)),
      afterDesc: pair.description,
      before: it.before,
      beforeTitle: it.beforeTitle || it.before,
      beforeDescription: it.beforeDescription || "",
      ogTitle: v === 0 ? it.ogTitle || "" : pair.title,
      ogDescription: v === 0 ? it.ogDescription || "" : pair.description,
      schemaLabel: v === 0 ? it.schemaLabel || "" : "",
      gain: it.gain,
      ships: it.ships,
      proof: it.proof,
      opt: String(v + 1),
      optCount: count,
      ctrFit: pair.ctrFit || 0,
      seoScore: pair.seoScore || 0,
      current: Boolean(pair.current),
      statusLine: it.keepListing && !pair.current ? `This is another option. ${it.statusLine || ""}` : it.statusLine || "",
      why: it.why || [],
      afterAll: it.after,
      color: COLORS[col],
      changeId: it.changeId ?? null,
    };
  }

  const it = list[Math.max(ci, 0)] || { t: "—", mid: 0 };
  const advance = (status) => {
    if (!list[Math.max(ci, 0)]) return;
    const d = { ...done, [it.t]: status };
    const g = status === "shipped" ? gains.concat([it.mid || 0]) : gains;
    setDone(d);
    setGains(g);
    setCur({ ...cur, [col]: undefined });
  };

  const handleShip = async () => {
    if (m.changeId) {
      const picked = (m.afterAll || [])[Number(m.opt) - 1];
      const primary = (m.afterAll || [])[0];
      if (
        picked &&
        primary &&
        (picked.title !== primary.title || picked.description !== primary.description)
      ) {
        await patchChange(m.changeId, { title: picked.title, metaDescription: picked.description });
      }
      await approveChange(m.changeId);
      await executeChange(m.changeId, { includeOpenGraph: true, includeJsonLd: true });
      await reloadChanges();
    }
    advance("shipped");
  };

  const handleSkip = async () => {
    if (m.changeId) {
      await dismissChange(m.changeId);
      await reloadChanges();
    }
    advance("skipped");
  };

  const handleRegen = async () => {
    if (!hasMove || regenBusy) return;
    const k = list[ci].t;
    if (!m.changeId) {
      setRegenNote("This card is not tied to a live page yet. Run a site scan, then regenerate.");
      setVariant({ ...variant, [k]: (variant[k] || 0) + 1 });
      return;
    }
    setRegenBusy(true);
    setRegenNote("Reading the live page, then Search Console, Analytics, and Speed Index. Searchify SEO is writing the title and description…");
    try {
      const res = await generateMetaCopy(m.changeId, { breadth: "balanced", objective: "balanced" });
      if (!res.ok) {
        const detail = res.data?.detail;
        setRegenNote(typeof detail === "string" ? detail : "Could not regenerate the title and description.");
        return;
      }
      const change = res.data?.change;
      const options = Array.isArray(res.data?.options) ? res.data.options : [];
      if (change?.id) {
        const merge = (rows) =>
          rows.map((row) => {
            if (String(row.id) !== String(change.id)) return row;
            const proposed = {
              ...(row.proposed || {}),
              ...(change.proposed || {}),
            };
            if (options.length) proposed.aiAlternatives = options;
            return { ...row, ...change, proposed };
          });
        setRealChanges(merge);
        setAllChanges(merge);
      }
      setVariant({ ...variant, [k]: 0 });
      const nextTitle = change?.proposed?.title || options[0]?.title || "";
      setRegenNote(nextTitle ? `New title ready: ${nextTitle}` : "New title and description are on this card.");
    } catch {
      setRegenNote("Regenerate did not finish. Try again in a moment.");
    } finally {
      setRegenBusy(false);
    }
  };

  const handleEdit = () => {
    if (m.changeId) {
      router.push(`/app/queue/${m.changeId}`);
    }
  };

  let info = {
    tag: "",
    title: "",
    sub: "",
    sel: "",
    hasNext: false,
    cta: "",
    go: () => {},
    color: COLORS[col],
    border: "#1A1D22",
    glow: "none",
  };

  const hasInfo = !hasMove;
  if (hasInfo) {
    const nextCol = col === "red" ? "yellow" : "red";
    if (actionable) {
      const sh = list.filter((x) => doneMap[x.t] === "shipped").length;
      const sk = list.filter((x) => doneMap[x.t] === "skipped").length;
      info = {
        tag: "ALL " + NOUN[col].toUpperCase() + " HANDLED · " + sh + " SHIPPED · " + sk + " SKIPPED",
        title: "That's every " + (col === "red" ? "red" : "yellow") + ".",
        sub: "Searchify is shipping and checking your changes. Skipped moves come back next week with a fresh suggestion.",
        sel: "Tap any dot above to reopen a move",
        hasNext: openCount(nextCol) > 0,
        cta: "Move on to the " + NOUN[nextCol],
        go: () => setCol(nextCol),
        color: COLORS[col],
        border: `rgba(${RGB[col]},.45)`,
        glow: `0 0 30px rgba(${RGB[col]},.12)`,
      };
    } else if (col === "green") {
      info = {
        tag: "PASSES · " + list.length + " CHECKS",
        title: "Nothing to ship here.",
        sub: "These pass Google's criteria. Searchify rechecks them every week — if one slips, it turns yellow and joins your queue.",
        sel: list.length ? "Selected: " + it.t : "No pass checks yet — run a site scan",
        hasNext: openCount("red") > 0,
        cta: "Back to the reds",
        go: () => setCol("red"),
        color: COLORS[col],
        border: `rgba(${RGB[col]},.45)`,
        glow: `0 0 30px rgba(${RGB[col]},.12)`,
      };
    } else {
      info = {
        tag: "LOCKED · " + list.length + " PAGES WINNING",
        title: "These are winning. Hands off.",
        sub: "Searchify never suggests changes to pages that are climbing. They unlock automatically if rankings drop for two weeks.",
        sel: list.length ? "Selected: " + String(it.t).split(" · ")[1] : "No locked pages yet",
        hasNext: openCount("red") > 0,
        cta: "Back to the reds",
        go: () => setCol("red"),
        color: COLORS[col],
        border: `rgba(${RGB[col]},.45)`,
        glow: `0 0 30px rgba(${RGB[col]},.12)`,
      };
    }
  }

  const streamLabel = hasMove
    ? "Working on " + (ci + 1) + " of " + list.length + " " + NOUN[col] + " · " + list[ci].t.split(" · ")[1]
    : waitingPick
    ? "Click a dot to open it"
    : actionable
    ? "All " + list.length + " " + NOUN[col] + " handled"
    : list.length + " " + NOUN[col] + " · nothing to ship";

  const hoveredMove = hoverIdx >= 0 && hoverIdx < list.length ? list[hoverIdx] : null;
  const nextLabel = hoveredMove
    ? hoveredMove.t
    : ci >= 0 && list[ci]
      ? list[ci].t
      : list.length
        ? "Hover a dot to read it. Click it to open the suggestion."
        : "No dots on this colour yet.";

  const pending = gains.reduce((a, b) => a + b, 0);
  const shippedN = gains.length;
  const histShipped = historyItems(allChanges).length;
  const resultsIn = allChanges.filter((c) => c.status === "monitoring" || c.status === "closed").length;
  const siteLevel = Math.min(6, Math.max(1, 2 + Math.floor((capturedNow || histShipped * 40) / 200)));
  const quality = QUALITY[siteLevel - 1] || "Fair";
  const toNext = Math.max(0, 2 - shippedN);
  const toLevel =
    siteLevel >= 6
      ? "Excellent"
      : shippedN >= 2
      ? `Level ${Math.min(6, siteLevel + 1)} unlocked`
      : shippedN === 1
      ? `1 move to Level ${Math.min(6, siteLevel + 1)}`
      : `${toNext} moves to Level ${Math.min(6, siteLevel + 1)}`;
  const streakWeeks = Math.max(1, Math.min(12, Math.ceil(histShipped / 3) || (connectionStatus.gsc ? 1 : 0)));
  const untapped = Math.max(untappedTotal, capturedNow + pending, 1);
  const capturedPct = Math.min(99, Math.round((capturedNow / untapped) * 100));
  const pendingWidth = `${((pending / untapped) * 100).toFixed(1)}%`;
  const pendingLabel =
    pending > 0 ? `+${pending} pending · banks once results are measured` : "Ship a move to start filling the bar";
  const resultsLabel =
    resultsIn === 0 ? "Results pending" : resultsIn === 1 ? "1 result is in" : `${resultsIn} results are in`;

  const connections = [
    {
      n: "1",
      name: "Google Search Console",
      sub: connectionStatus.gsc ? "Live · connected" : "Not connected",
      on: !!connectionStatus.gsc,
    },
    {
      n: "2",
      name: "WordPress",
      sub: connectionStatus.wordpress ? "Live · connected" : "Not connected",
      on: !!connectionStatus.wordpress,
    },
    {
      n: "3",
      name: "Searchify",
      sub: connectionStatus.wordpress || connectionStatus.gsc ? "Workspace active" : "Waiting for a connection",
      on: !!(connectionStatus.wordpress || connectionStatus.gsc),
    },
  ];

  const accent = "#D5F879";
  const { hostname: siteHostname } = activeSiteContext();
  const queueEmpty = !loading && RED.length + YELLOW.length === 0;
  const needsPlugIn = queueEmpty && !connectionStatus.gsc && !connectionStatus.wordpress;

  const submitCmd = (e) => {
    e?.preventDefault?.();
    const q = cmd.trim();
    router.push(q ? `/app/command?q=${encodeURIComponent(q)}` : "/app/command");
  };

  return (
    <div className="v8-home" style={{ flex: "999 1 560px", minWidth: 0, width: "100%", minHeight: "min(100%, 720px)", background: "#0A0B0D", color: "#F2F4F5", fontFamily: "Geist, 'Helvetica Neue', sans-serif", boxSizing: "border-box", padding: "22px clamp(16px, 4vw, 56px) 40px", display: "flex", flexDirection: "column", gap: 32 }}>
      {!loading && (bootNote || queueEmpty) && (
        <div
          style={{
            padding: "14px 16px",
            borderRadius: 12,
            border: "1px solid #262A31",
            background: "#131519",
            fontSize: 13,
            color: "#D7DADE",
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
          }}
        >
          <span style={{ flex: "1 1 220px" }}>
            {bootNote ||
              (needsPlugIn
                ? "Connect Search Console or WordPress to draft live moves for this site."
                : "No open moves yet. Run a site scan or wait for Search Console to propose the next batch.")}
          </span>
          {needsPlugIn && (
            <Link
              href="/app/connections"
              style={{ color: "#0A0B0D", background: accent, padding: "8px 12px", borderRadius: 999, fontWeight: 600, textDecoration: "none" }}
            >
              Add website
            </Link>
          )}
          {queueEmpty && !needsPlugIn && (
            <button
              type="button"
              onClick={() => reloadChanges({ seed: true })}
              style={{ color: "#0A0B0D", background: accent, padding: "8px 12px", borderRadius: 999, fontWeight: 600, border: 0, cursor: "pointer" }}
            >
              Draft moves
            </button>
          )}
        </div>
      )}
      <header className="v8-home-tools" style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginRight: "auto" }}>
          <Link
            href="/app/workspace"
            aria-label="Switch site"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              minHeight: "40px",
              padding: "0 10px",
              borderRadius: "10px",
              color: "#F2F4F5",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "17px",
              letterSpacing: "-0.3px",
            }}
          >
            {siteHostname}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9AA1AB" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M7 10l5 5 5-5"></path>
            </svg>
          </Link>
        </div>
        <Link
          href="/app/path"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            minHeight: "40px",
            padding: "0 14px",
            borderRadius: "999px",
            background: "#131519",
            border: "1px solid #262A31",
            color: "#F2F4F5",
            textDecoration: "none",
            fontSize: "13px",
          }}
        >
          <span style={{ fontWeight: 600 }}>
            Level {siteLevel} · {quality}
          </span>
          <span style={{ display: "inline-flex", gap: "3px" }} aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                style={{
                  width: "14px",
                  height: "4px",
                  borderRadius: "2px",
                  background: i < siteLevel - 1 ? accent : "#3A404A",
                }}
              />
            ))}
          </span>
          <span style={{ color: "#9AA1AB" }}>{toLevel}</span>
        </Link>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            minHeight: "40px",
            padding: "0 14px",
            borderRadius: "999px",
            background: "#131519",
            border: "1px solid #262A31",
            fontSize: "13px",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 2 1 3 3 3 5"></path>
          </svg>
          {streakWeeks ? `${streakWeeks}-week streak` : "Start a streak"}
        </span>
        <Link
          href="/app/outcomes"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            minHeight: "40px",
            padding: "0 14px",
            borderRadius: "999px",
            background: accent,
            color: "#0A0B0D",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#0A0B0D", animation: "sfy-breathe 1.4s ease-in-out infinite" }} />
          {resultsLabel}
        </Link>
        <Link
          href="/app/history"
          aria-label="Reports and change log"
          style={{ width: "40px", height: "40px", borderRadius: "50%", border: "1px solid #262A31", display: "grid", placeItems: "center", color: "#D7DADE" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 3-6.7"></path>
            <path d="M3 4v5h5"></path>
            <path d="M12 8v4l3 2"></path>
          </svg>
        </Link>
        <Link
          href="/app/settings"
          aria-label="Settings"
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "#262A31",
            display: "grid",
            placeItems: "center",
            color: "#F2F4F5",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          {userInitials}
        </Link>
      </header>

      <section aria-label="Captured so far" style={{ maxWidth: "1180px", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
            {loading ? (
              <Skel w={180} h={64} radius={16} />
            ) : (
              <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "clamp(48px, 6vw, 80px)", lineHeight: 0.9, letterSpacing: "-2.5px", fontWeight: 800 }}>
                {capturedNow.toLocaleString("en-US")}
              </span>
            )}
            {loading ? (
              <Skel w={260} h={16} />
            ) : (
              <span style={{ fontSize: "17px", color: "#9AA1AB" }}>
                of {untapped.toLocaleString("en-US")} untapped clicks / month captured
              </span>
            )}
          </div>
          {loading ? (
            <Skel w={180} h={14} />
          ) : (
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "13px", color: accent }}>{pendingLabel}</span>
          )}
        </div>
        {loading ? (
          <Skel w="100%" h={12} radius={7} />
        ) : (
        <div
          role="progressbar"
          aria-label="Captured so far"
          aria-valuemin="0"
          aria-valuemax={untapped}
          aria-valuenow={capturedNow}
          style={{ display: "flex", height: "12px", borderRadius: "7px", overflow: "hidden", background: "#1A1D22", gap: "2px" }}
        >
          <div
            style={{
              width: `${capturedPct}%`,
              position: "relative",
              overflow: "hidden",
              background: "#3DDC84",
              boxShadow: "0 0 18px rgba(61,220,132,.75)",
              animation: "sfy-fill 1.4s cubic-bezier(.2,.8,.2,1) both",
              ["--sfy-fill-to"]: `${capturedPct}%`,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                width: "35%",
                background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.6), rgba(255,255,255,0))",
                animation: "sfy-sheen 1.9s ease-in-out infinite",
              }}
            />
          </div>
          <div
            style={{
              width: pendingWidth,
              background: "repeating-linear-gradient(135deg, #3DDC84 0 4px, transparent 4px 8px)",
              backgroundSize: "22.6px 12px",
              opacity: 0.6,
              transition: "width .5s ease",
              animation: "sfy-march 1s linear infinite",
            }}
          />
        </div>
        )}
      </section>

      <main style={{ maxWidth: "1180px", width: "100%", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "32px", alignItems: "flex-start" }}>
        <section aria-label="Your moves" style={{ flex: "999 1 560px", minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "18px 20px", borderRadius: "20px", background: "#101215", border: "1px solid #1A1D22" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "13px", color: "#9AA1AB", marginRight: "4px" }}>Work on</span>
              {chips.map((ch, idx) =>
                ch.on ? (
                  <button
                    key={idx}
                    type="button"
                    aria-pressed="true"
                    onClick={ch.pick}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      minHeight: "38px",
                      padding: "0 14px",
                      borderRadius: "999px",
                      border: `1px solid ${ch.color}`,
                      background: ch.tint,
                      color: "#F2F4F5",
                      fontSize: "13px",
                      fontWeight: 600,
                      boxShadow: `0 0 22px ${ch.glow}`,
                    }}
                  >
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: ch.color, boxShadow: `0 0 10px ${ch.color}`, animation: "sfy-flicker 1.4s ease-in-out infinite" }}></span>
                    {ch.label}{" "}
                    {loading ? <Skel w={18} h={12} radius={6} /> : <span style={{ fontFamily: "'Geist Mono', monospace" }}>{ch.count}</span>}
                  </button>
                ) : (
                  <button
                    key={idx}
                    type="button"
                    aria-pressed="false"
                    onClick={ch.pick}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      minHeight: "38px",
                      padding: "0 14px",
                      borderRadius: "999px",
                      border: "1px solid #262A31",
                      background: "transparent",
                      color: "#D7DADE",
                      fontSize: "13px",
                    }}
                  >
                    <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: ch.color }}></span>
                    {ch.label}{" "}
                    {loading ? <Skel w={18} h={12} radius={6} /> : <span style={{ fontFamily: "'Geist Mono', monospace", color: "#9AA1AB" }}>{ch.count}</span>}
                  </button>
                )
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", letterSpacing: ".6px", color: "#7D848E" }}>INCOMING</span>
                {loading ? <Skel w={160} h={12} /> : <span style={{ fontSize: "13px", color: "#D7DADE" }}>{streamLabel}</span>}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "9px", alignItems: "center" }}>
                {loading
                  ? Array.from({ length: 10 }).map((_, idx) => <Skel key={idx} w={22} h={22} radius={999} />)
                  : stream.map((d, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={d.pick}
                    onMouseEnter={d.hover}
                    onMouseLeave={() => setHoverIdx(-1)}
                    aria-label={d.label}
                    aria-pressed={d.ring !== "none"}
                    title={d.label}
                    style={{
                      width: "22px",
                      height: "22px",
                      padding: 0,
                      borderRadius: "50%",
                      border: `2px solid ${d.edge}`,
                      background: d.fill,
                      boxShadow: d.shadow,
                      outline: d.ring,
                      outlineOffset: "3px",
                      opacity: d.op,
                      animation: d.anim,
                      transition: "opacity .3s ease",
                    }}
                  ></button>
                ))}
              </div>
              {loading ? <Skel w="52%" h={12} /> : <span style={{ fontSize: "12px", color: "#7D848E", lineHeight: 1.5 }}>{nextLabel}</span>}
            </div>
          </div>

          {loading ? (
            <article
              aria-busy="true"
              style={{
                background: "#131519",
                border: "1px solid #262A31",
                borderRadius: "24px",
                padding: "clamp(22px, 3vw, 36px)",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              <Skel w="28%" h={12} />
              <Skel w="74%" h={36} radius={14} />
              <Skel w="90%" h={14} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                <div style={{ borderRadius: "16px", background: "#0E1013", border: "1px solid #1A1D22", padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <Skel w="24%" h={12} />
                  <Skel w="100%" h={16} />
                  <Skel w="78%" h={12} />
                </div>
                <div style={{ borderRadius: "16px", background: "rgba(77,163,255,.07)", border: "1.5px solid #4DA3FF", padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <Skel w="24%" h={12} />
                  <Skel w="100%" h={16} />
                  <Skel w="82%" h={12} />
                </div>
              </div>
            </article>
          ) : null}

          {!loading && waitingPick ? (
            <div
              style={{
                borderRadius: "24px",
                border: "1px solid #262A31",
                background: "#101215",
                padding: "32px 28px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#9AA1AB" }}>No dot selected</span>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>Click a dot to open its suggestion</h2>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5, color: "#9AA1AB" }}>
                Hover a dot to read which page it is. The suggestion stays here until you click.
              </p>
            </div>
          ) : null}

          {hasMove ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <article
                style={{
                  background: "#131519",
                  border: "1px solid #262A31",
                  borderRadius: "24px",
                  padding: "clamp(22px, 3vw, 36px)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "22px",
                  animation: "sfy-rise .45s cubic-bezier(.2,.8,.2,1) both",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", fontSize: "13px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontFamily: "'Geist Mono', monospace", color: m.color }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: m.color, boxShadow: `0 0 8px ${m.color}` }}></span>
                    {m.tag}
                  </span>
                  <span style={{ color: "#3A404A" }}>·</span>
                  <span style={{ color: "#9AA1AB" }}>{m.kind}</span>
                  <span style={{ marginLeft: "auto", fontFamily: "'Geist Mono', monospace", color: "#9AA1AB" }}>{m.page}</span>
                </div>
                <div
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: "36px",
                    fontWeight: 700,
                    lineHeight: 1,
                    color: accent,
                    marginBottom: "-14px",
                    transform: "rotate(-2deg)",
                    transformOrigin: "left center",
                  }}
                >
                  We suggest…
                </div>
                <h1 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "clamp(30px, 3.6vw, 48px)", lineHeight: 1.12, letterSpacing: "-1.4px", fontWeight: 700 }}>
                  {m.head.map((s, idx) =>
                    s.hl ? (
                      <span
                        key={idx}
                        style={{
                          display: "inline-block",
                          lineHeight: 1.02,
                          padding: "0.02em 0.2em 0.06em",
                          margin: "0 0.02em",
                          color: "#0A0B0D",
                          borderRadius: "0.3em 0.85em 0.4em 0.75em",
                          transform: "rotate(-1.2deg)",
                          background:
                            "repeating-linear-gradient(178deg, rgba(10,11,13,0) 0 3px, rgba(10,11,13,.07) 3px 4px), linear-gradient(100deg, rgba(213,248,121,0) 0%, rgba(213,248,121,.92) 3%, rgba(213,248,121,.78) 12%, rgba(213,248,121,.68) 88%, rgba(213,248,121,.9) 96%, rgba(213,248,121,0) 100%)",
                          boxShadow: "0 0 22px rgba(213,248,121,.18)",
                        }}
                      >
                        {s.t}
                      </span>
                    ) : (
                      <span key={idx}>{s.t}</span>
                    )
                  )}
                </h1>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                  <div style={{ borderRadius: "16px", background: "#0E1013", border: "1px solid #1A1D22", padding: "18px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span style={{ fontSize: "12px", color: "#7D848E", fontFamily: "'Geist Mono', monospace" }}>NOW</span>
                    <span style={{ fontSize: "17px", lineHeight: 1.4, color: "#9AA1AB" }}>{m.beforeTitle || m.before}</span>
                    {m.beforeDescription ? (
                      <span style={{ fontSize: "14px", lineHeight: 1.45, color: "#7D848E" }}>{m.beforeDescription}</span>
                    ) : null}
                  </div>
                  <div
                    style={{
                      borderRadius: "16px",
                      background: "rgba(77,163,255,.07)",
                      border: "1.5px solid #4DA3FF",
                      boxShadow: "0 0 26px rgba(77,163,255,.35), inset 0 0 18px rgba(77,163,255,.08)",
                      padding: "18px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", fontSize: "12px", color: "#4DA3FF", fontFamily: "'Geist Mono', monospace" }}>
                      <span>AFTER</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
                        {m.optCount > 1 ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <button
                              type="button"
                              aria-label="Previous option"
                              disabled={Number(m.opt) <= 1}
                              onClick={() => setVariant({ ...variant, [it.t]: Number(m.opt) - 2 })}
                              style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "8px",
                                border: "1px solid #262A31",
                                background: "transparent",
                                color: "#F2F4F5",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 0,
                                cursor: Number(m.opt) <= 1 ? "default" : "pointer",
                                opacity: Number(m.opt) <= 1 ? 0.35 : 1,
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M15 6l-6 6 6 6"></path>
                              </svg>
                            </button>
                            <span style={{ color: "#9AA1AB", whiteSpace: "nowrap" }}>{m.opt} of {m.optCount}</span>
                            <button
                              type="button"
                              aria-label="Next option"
                              disabled={Number(m.opt) >= m.optCount}
                              onClick={() => setVariant({ ...variant, [it.t]: Number(m.opt) })}
                              style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "8px",
                                border: "1px solid #262A31",
                                background: "transparent",
                                color: "#F2F4F5",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 0,
                                cursor: Number(m.opt) >= m.optCount ? "default" : "pointer",
                                opacity: Number(m.opt) >= m.optCount ? 0.35 : 1,
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M9 6l6 6-6 6"></path>
                              </svg>
                            </button>
                          </span>
                        ) : (
                          <span style={{ color: "#9AA1AB", whiteSpace: "nowrap" }}>{m.opt} of {m.optCount}</span>
                        )}
                        <span style={{ color: "#F2F4F5", whiteSpace: "nowrap" }}>{`CTR ${m.ctrFit || "—"} · SEO ${m.seoScore || "—"}`}</span>
                      </span>
                    </span>
                    {m.statusLine ? <span style={{ fontSize: "13px", lineHeight: 1.45, color: "#D7DADE" }}>{m.statusLine}</span> : null}
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#F2F4F5" }}>{`Recommended SEO metadata for ${m.page || "/"}`}</span>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#9AA1AB" }}>{m.current ? "SEO title — current, kept" : "SEO title — recommended"}</span>
                    <span style={{ fontSize: "17px", lineHeight: 1.45 }}>{m.afterSegs.map((s) => s.t).join("")}</span>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#9AA1AB" }}>Meta description — recommended</span>
                    <span style={{ fontSize: "14px", lineHeight: 1.5, color: "#D7DADE" }}>{m.afterDesc || "(No description on this option.)"}</span>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#9AA1AB" }}>Open Graph title</span>
                    <span style={{ fontSize: "14px", lineHeight: 1.4 }}>{m.ogTitle || m.afterSegs.map((s) => s.t).join("")}</span>
                    {m.why?.length ? (
                      <>
                        <span style={{ fontSize: "13px", fontWeight: 600 }}>Why I recommend this version</span>
                        <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
                          {m.why.map((line) => (
                            <li key={line} style={{ fontSize: "13px", lineHeight: 1.45, color: "#D7DADE" }}>{line}</li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleRegen}
                    disabled={regenBusy}
                    aria-busy={regenBusy}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      minHeight: "44px",
                      padding: "0 16px",
                      borderRadius: "12px",
                      border: "1px solid #262A31",
                      background: "transparent",
                      color: "#F2F4F5",
                      fontSize: "14px",
                      opacity: regenBusy ? 0.7 : 1,
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 12a9 9 0 1 1-3-6.7"></path>
                      <path d="M21 4v5h-5"></path>
                    </svg>
                    {regenBusy ? "Regenerating…" : "Regenerate suggestion"}
                  </button>
                  {regenNote ? (
                    <span style={{ flex: "1 1 220px", fontSize: "13px", color: regenNote.startsWith("New title") ? "#3DDC84" : "#9AA1AB", lineHeight: 1.4 }}>{regenNote}</span>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleEdit}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      minHeight: "44px",
                      padding: "0 16px",
                      boxSizing: "border-box",
                      borderRadius: "12px",
                      border: "1px solid #262A31",
                      color: "#F2F4F5",
                      fontSize: "14px",
                      textDecoration: "none",
                      background: "transparent",
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"></path>
                    </svg>
                    Make manual edits
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", paddingTop: "18px", borderTop: "1px solid #1A1D22" }}>
                  <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "28px", fontWeight: 700, letterSpacing: "-0.6px", color: accent }}>{m.gain}</span>
                    <span style={{ fontSize: "13px", color: "#9AA1AB" }}>{m.ships}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "6px", fontSize: "13px", color: "#D7DADE" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ flex: "none" }}>
                        <path d="M4 19V5"></path>
                        <path d="M4 19h16"></path>
                        <path d="M8 15l4-4 3 3 5-6"></path>
                      </svg>
                      {m.proof}
                    </span>
                  </div>
                  <div className="v8-home-ship" style={{ flex: "none", display: "flex", gap: "10px", marginLeft: "auto" }}>
                    <button
                      type="button"
                      onClick={handleSkip}
                      style={{
                        minHeight: "52px",
                        padding: "0 22px",
                        borderRadius: "14px",
                        border: "1px solid #262A31",
                        background: "transparent",
                        color: "#F2F4F5",
                        fontSize: "16px",
                      }}
                    >
                      Skip it
                    </button>
                    <button
                      type="button"
                      onClick={handleShip}
                      style={{
                        minHeight: "52px",
                        padding: "0 28px",
                        borderRadius: "14px",
                        border: 0,
                        background: "#4DA3FF",
                        color: "#0A0B0D",
                        fontSize: "16px",
                        fontWeight: 600,
                        boxShadow: "0 0 24px rgba(77,163,255,.45)",
                      }}
                    >
                      Ship it
                    </button>
                  </div>
                </div>
              </article>
              <div aria-hidden="true" style={{ height: "12px", margin: "0 3%", background: "#101215", border: "1px solid #1A1D22", borderTop: 0, borderRadius: "0 0 20px 20px" }}></div>
              <div aria-hidden="true" style={{ height: "10px", margin: "0 6%", background: "#0D0F11", border: "1px solid #16181C", borderTop: 0, borderRadius: "0 0 18px 18px" }}></div>
            </div>
          ) : null}

          {hasInfo && !waitingPick ? (
            <div
              style={{
                borderRadius: "24px",
                border: `1px solid ${info.border}`,
                background: "#101215",
                boxShadow: info.glow,
                padding: "40px 32px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "14px",
                animation: "sfy-rise .45s ease both",
              }}
            >
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "13px", color: info.color }}>{info.tag}</span>
              <h1 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "clamp(30px, 3.6vw, 46px)", lineHeight: 1.04, letterSpacing: "-1.3px", fontWeight: 700 }}>{info.title}</h1>
              <p style={{ margin: 0, fontSize: "17px", color: "#9AA1AB", lineHeight: 1.5, maxWidth: "560px" }}>{info.sub}</p>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "13px", color: "#D7DADE", padding: "8px 12px", borderRadius: "10px", background: "#0A0B0D", border: "1px solid #1A1D22" }}>{info.sel}</span>
              {info.hasNext ? (
                <button
                  type="button"
                  onClick={info.go}
                  style={{
                    minHeight: "52px",
                    padding: "0 24px",
                    borderRadius: "14px",
                    border: 0,
                    background: "#4DA3FF",
                    color: "#0A0B0D",
                    fontSize: "16px",
                    fontWeight: 600,
                    boxShadow: "0 0 24px rgba(77,163,255,.45)",
                  }}
                >
                  {info.cta}
                </button>
              ) : null}
            </div>
          ) : null}
        </section>

        <aside aria-labelledby="conn-h" style={{ flex: "1 1 260px", minWidth: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "10px" }}>
            <h2 id="conn-h" style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>
              Connections active
            </h2>
            <Link href="/app/connections" style={{ fontSize: "13px", color: "#9AA1AB", textDecoration: "none" }}>
              Manage
            </Link>
          </div>
          <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
            {connections.map((c) => (
              <li key={c.n}>
                <Link
                  href="/app/connections"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    minHeight: "56px",
                    padding: "10px 14px",
                    borderRadius: "14px",
                    background: "#101215",
                    border: c.on ? "1px solid rgba(61,220,132,.35)" : "1px solid #262A31",
                    textDecoration: "none",
                    color: "#F2F4F5",
                  }}
                >
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "12px", color: "#7D848E", width: "14px" }}>{c.n}</span>
                  <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "1px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 500 }}>{c.name}</span>
                    {loading ? <Skel w="62%" h={12} /> : <span style={{ fontSize: "12px", color: "#9AA1AB" }}>{c.sub}</span>}
                  </span>
                  {c.on ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#3DDC84"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      role="img"
                      aria-label="Connected"
                      style={{ flex: "none", filter: "drop-shadow(0 0 6px rgba(61,220,132,.85))", animation: "sfy-breathe 2.2s ease-in-out infinite" }}
                    >
                      <path d="M9 2v6"></path>
                      <path d="M15 2v6"></path>
                      <path d="M6 8h12v3a6 6 0 0 1-12 0z"></path>
                      <path d="M12 17v5"></path>
                    </svg>
                  ) : (
                    <span style={{ fontSize: 12, color: "#7D848E", flex: "none" }}>Plug in</span>
                  )}
                </Link>
              </li>
            ))}
          </ol>
        </aside>
      </main>

      <form
        onSubmit={submitCmd}
        style={{ maxWidth: "1180px", width: "100%", margin: "0 auto", boxSizing: "border-box", display: "flex", alignItems: "center", gap: "12px", minHeight: "58px", padding: "0 18px", borderRadius: "16px", background: "#131519", border: "1px solid #262A31" }}
      >
        <label htmlFor="cmd" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
          Talk to Searchify
        </label>
        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: accent }} />
        <input
          id="cmd"
          type="text"
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          placeholder={'Talk to Searchify — “why did traffic drop?” or “write this month’s client report”'}
          style={{
            flex: 1,
            minWidth: 0,
            border: 0,
            outline: "none",
            background: "transparent",
            color: "#F2F4F5",
            font: "inherit",
            fontSize: "15px",
          }}
        />
        <button
          type="submit"
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: "12px",
            color: "#9AA1AB",
            border: "1px solid #262A31",
            borderRadius: "6px",
            padding: "2px 7px",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          ⌘K
        </button>
      </form>
    </div>
  );
}
