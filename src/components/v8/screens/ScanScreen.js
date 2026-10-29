"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Skel } from "@/components/v8/SkeletonWave";
import { buildAuditFindings } from "@/lib/auditFindings";
import { activeSiteContext } from "@/lib/siteContext";
import { findingsToScanTasks } from "@/lib/v8LiveData";
import {
  approveChange,
  createChange,
  errorText,
  patchChange,
  changePath,
  executeChange,
  featurePayload,
  generateMetaCopy,
  getSiteScan,
  historyItems,
  listChanges,
  loadFeature,
  proposeFromGsc,
  researchAudit,
  runSiteScan,
  undoChange,
} from "@/lib/v1Api";
import { useConnectionStatus } from "@/components/board/ConnectDialog";
import { loadJourney } from "@/lib/journey";
import ProblemNotice from "@/components/v8/ProblemNotice";
import { problemsFrom } from "@/lib/problems";
import "@/styles/v8-screens.css";

const COLORS = { red: "#FF5A4E", yellow: "#FFC53D", green: "#3DDC84", blue: "#4DA3FF" };
const RGB = {
  red: "255,90,78",
  yellow: "255,197,61",
  green: "61,220,132",
  blue: "77,163,255",
};

const META = {
  all: {
    label: "All",
    title: "Every task, colour-coded",
    sub: "Pick a colour to make those tasks glow. Hover any dot to see the task.",
  },
  red: {
    label: "Dire",
    title: "Needs dire improvement",
    sub: "Fix these first — they cost you the most visitors.",
  },
  yellow: {
    label: "Medium",
    title: "Medium priority",
    sub: "Worth doing once the reds are done.",
  },
  green: {
    label: "Passes",
    title: "Passes the criteria",
    sub: "Nothing to do. Searchify rechecks these weekly.",
  },
  blue: {
    label: "Locked",
    title: "Successful — do not change",
    sub: "These are winning. Searchify will not touch them.",
  },
};

export default function ScanScreen() {
  const router = useRouter();
  const [connectionStatus] = useConnectionStatus();
  const [stage, setStage] = useState("reveal");
  const [pct, setPct] = useState(100);
  const [hover, setHover] = useState(-1);
  const [filter, setFilter] = useState("red");
  const [order, setOrder] = useState("scan");
  const [page, setPage] = useState(0);
  const [board, setBoard] = useState("desk");
  const swipeX = useRef(null);
  const [sel, setSel] = useState(null);
  const [variant, setVariant] = useState({});
  const [pub, setPub] = useState({});
  const [scanData, setScanData] = useState(null);
  const [scanHost, setScanHost] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [untappedVisitors, setUntappedVisitors] = useState(0);
  const [liveTasks, setLiveTasks] = useState(null);
  const [changeByPath, setChangeByPath] = useState({});
  const [liveChanges, setLiveChanges] = useState([]);
  const [scanLoading, setScanLoading] = useState(true);
  const [regenBusy, setRegenBusy] = useState(false);
  const [pubBusy, setPubBusy] = useState(false);
  const [regenNote, setRegenNote] = useState("");
  const [problems, setProblems] = useState([]);
  const timerRef = useRef(null);

  const reloadLive = useCallback(async () => {
    const { hostname, href } = activeSiteContext(loadJourney());
    const host = hostname || "your site";
    setScanHost(host);
    if (!urlInput) setUrlInput(href || host || "");
    setScanLoading(true);
    try {
      const [scanRes, chRes, audit, pages, queries, landings, auditRes] = await Promise.all([
        getSiteScan(href || ""),
        listChanges({ force: true }),
        loadFeature("site-audit"),
        loadFeature("top-pages"),
        loadFeature("organic-search"),
        loadFeature("ga4-landing-pages"),
        href ? researchAudit({ site: href, force: false }).catch(() => ({ ok: false })) : Promise.resolve({ ok: false }),
      ]);
      let scan = scanRes.data?.scan || scanRes.data;
      let scanProblems = problemsFrom(scanRes, "site_scan");
      if (href && !scan?.pagesRead) {
        const started = await runSiteScan({ force: false }).catch(() => ({ ok: false }));
        scan = started?.data?.scan || (started?.ok ? started?.data : null) || scan;
        scanProblems = problemsFrom(started, "site_scan");
      }
      setProblems(href ? [...scanProblems, ...problemsFrom(auditRes, "site_audit")] : []);
      if (scan) setScanData(scan);
      const gsc = featurePayload(queries);
      const impr = Number(String(gsc.kpis?.[1]?.[1] || "").replace(/[^\d.]/g, ""));
      if (impr) setUntappedVisitors(Math.round(impr));
      else if (scan?.draftable) setUntappedVisitors(Math.max(scan.draftable * 40, 0));
      else setUntappedVisitors(0);
      const changes = Array.isArray(chRes.data) ? chRes.data : chRes.data?.changes || [];
      const byPath = {};
      changes.forEach((c) => {
        const p = changePath(c);
        if (p && p !== "—" && !byPath[p]) byPath[p] = c;
      });
      setChangeByPath(byPath);
      setLiveChanges(changes);
      const crawl = auditRes?.ok ? auditRes.data : null;
      const built = buildAuditFindings({ audit, pages, queries, landings, changes, crawl });
      const locked = historyItems(changes)
        .filter((c) => c.status === "monitoring" || c.status === "closed" || c.status === "applied")
        .slice(0, 13)
        .map((c) => {
          try {
            return new URL(c.targetUrl).pathname;
          } catch {
            return c.targetUrl || "/";
          }
        });
      const bundle = findingsToScanTasks(built.findings, { lockedPaths: locked });
      setLiveTasks(bundle);
      return bundle;
    } catch {
      setLiveTasks({ red: [], yellow: [], green: [], blue: [] });
      return { red: [], yellow: [], green: [], blue: [] };
    } finally {
      setScanLoading(false);
    }
  }, [urlInput]);

  useEffect(() => {
    const phone = window.matchMedia("(max-width: 700px)");
    const tablet = window.matchMedia("(max-width: 1100px)");
    const apply = () => setBoard(phone.matches ? "phone" : tablet.matches ? "tablet" : "desk");
    apply();
    phone.addEventListener("change", apply);
    tablet.addEventListener("change", apply);
    return () => {
      phone.removeEventListener("change", apply);
      tablet.removeEventListener("change", apply);
    };
  }, []);

  useEffect(() => {
    reloadLive().then((bundle) => {
      const total =
        (bundle?.red?.length || 0) +
        (bundle?.yellow?.length || 0) +
        (bundle?.green?.length || 0) +
        (bundle?.blue?.length || 0);
      if (total === 0 && !activeSiteContext(loadJourney()).hostname) {
        setStage("input");
        setPct(0);
      } else {
        setStage("reveal");
        setPct(100);
      }
    });
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runScan = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStage("scanning");
    setPct(0);
    setPage(0);
    setFilter("red");
    setOrder("scan");
    // Presentation timing: ~3.5s to 100%, then connect or reveal.
    timerRef.current = setInterval(() => {
      setPct((prev) => {
        const next = Math.min(100, prev + 2);
        if (next >= 100) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return next;
      });
    }, 70);
    try {
      const { href } = activeSiteContext(loadJourney());
      const scanRun = await runSiteScan({ force: true }).catch(() => ({ ok: false }));
      const auditRun = href ? await researchAudit({ site: href, force: true }).catch(() => ({ ok: false })) : null;
      if (connectionStatus.gsc) {
        await proposeFromGsc({ breadth: "balanced", limit: 8, rescan: true });
      }
      await reloadLive();
      const runProblems = [...problemsFrom(scanRun, "site_scan"), ...(auditRun ? problemsFrom(auditRun, "site_audit") : [])];
      if (runProblems.some((p) => p.severity === "error")) setProblems(runProblems);
    } catch {
      /* keep animation; empty board if APIs fail */
    }
    // Finish animation then advance stage.
    const finish = () => {
      setPct(100);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setStage(connectionStatus.gsc ? "reveal" : "connect");
    };
    setTimeout(finish, 3600);
  }, [connectionStatus.gsc, reloadLive]);

  // Live scan only — no Northline HTML sample when the workspace has no findings yet.
  const red = liveTasks?.red || [];
  const yellow = liveTasks?.yellow || [];
  const green = liveTasks?.green || [];
  const blue = liveTasks?.blue || [];

  const all = [];
  red.forEach((t) => all.push({ c: "red", t: t }));
  yellow.forEach((t) => all.push({ c: "yellow", t: t }));
  green.forEach((t) => all.push({ c: "green", t: t }));
  blue.forEach((t) => all.push({ c: "blue", t: t }));

  const N = all.length;
  const rank = { red: 0, yellow: 1, green: 2, blue: 3 };
  let tasks;
  if (order === "priority") {
    tasks = all.slice();
    tasks.sort((a, b) => rank[a.c] - rank[b.c]);
  } else {
    tasks = [];
    for (let i = 0; i < N; i++) tasks.push(all[(i * 37) % N]);
  }

  const PER = board === "phone" ? 18 : board === "tablet" ? 24 : 48;
  const pagesCount = Math.max(1, Math.ceil(N / PER) || 1);
  const pg = Math.min(page, pagesCount - 1);
  const slice = tasks.slice(pg * PER, pg * PER + PER);
  const lit = stage === "input" ? 0 : stage === "scanning" ? Math.round((pct / 100) * slice.length) : slice.length;
  const f = filter;
  const brand =
    (scanHost || "")
      .replace(/^www\./, "")
      .split(".")[0]
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) || "Your site";
  const emptyTask = { c: "green", t: "No findings yet · /" };
  const dots = slice.map((task, i) => {
    const on = i < lit;
    const scanning = stage === "scanning";
    const match = scanning || f === task.c;
    const published = !!pub[task.t];
    const col = published ? COLORS.green : COLORS[task.c];
    const selected = sel === task.t;
    return {
      pick: () => setSel(task.t),
      ring: selected ? "2px solid #F2F4F5" : "none",
      selStr: String(selected),
      color: on ? col : "#1A1D22",
      op: !on ? "1" : match ? "1" : "0.14",
      shadow: on && !scanning && match ? "0 0 22px " + col : "none",
      anim: on && !scanning && match && !published && !selected ? "sfy-flicker 1.4s ease-in-out infinite" : "none",
      label: task.t + " — " + META[task.c].title.toLowerCase(),
      hover: () => setHover(i),
    };
  });

  const counts = { all: N, red: red.length, yellow: yellow.length, green: green.length, blue: blue.length };
  const chips = ["red", "yellow", "green", "blue"].map((k) => ({
    label: META[k].label,
    count: String(counts[k]),
    color: COLORS[k],
    tint: "rgba(" + RGB[k] + ",.16)",
    glow: "rgba(" + RGB[k] + ",.55)",
    on: f === k,
    off: f !== k,
    pick: () => setFilter(k),
  }));

  const orders = [
    { id: "scan", label: "Scan order" },
    { id: "priority", label: "By priority" },
  ].map((o) => ({
    label: o.label,
    on: order === o.id,
    off: order !== o.id,
    pick: () => {
      setOrder(o.id);
      setPage(0);
    },
  }));

  const hv = hover;
  const hovered = hv >= 0 && hv < lit ? slice[hv] : null;

  const log = [];
  if (pct > 4) log.push(`→ reading ${scanHost || "your site"}`);
  if (pct > 25) log.push("→ titles, headings and meta from the crawl");
  if (pct > 50) log.push(connectionStatus.wordpress ? "→ WordPress / CMS signals" : "→ page structure and links");
  if (pct > 72) log.push("→ mapping opportunities into the colour map");
  if (pct > 90) log.push(`→ ${N || "…"} tasks · ${red.length} dire · ${yellow.length} medium`);

  const callsEstimate = Math.max(0, Math.round(untappedVisitors / 50));

  const clickedTask = sel ? tasks.find((x) => x.t === sel) || null : null;
  const selTask = clickedTask || emptyTask;
  const waitingForClick = N > 0 && !scanLoading && !clickedTask;
  const parts = String(selTask.t || "").split(" · ");
  const action = parts[0] || "No findings";
  const path = parts.slice(1).join(" · ") || "/";
  const norm = (value) => {
    const raw = String(value || "/").split("?")[0];
    return raw.length > 1 ? raw.replace(/\/+$/, "") : raw || "/";
  };
  const matchedChange =
    liveChanges.find((c) => {
      if (norm(changePath(c)) !== norm(path)) return false;
      const opp = String(c.opportunity || "").toLowerCase();
      return opp && action && opp.includes(action.toLowerCase().slice(0, 24));
    }) ||
    liveChanges.find((c) => norm(changePath(c)) === norm(path)) ||
    changeByPath[path] ||
    null;
  const pagePath = norm(path);
  const isBlog = pagePath.indexOf("/blog") === 0;
  const seg = pagePath === "/" ? "" : pagePath.split("/").filter(Boolean).pop() || "";
  const topic = seg
    ? seg
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : brand;
  const crumb = pagePath === "/" ? "" : " › " + pagePath.split("/").filter(Boolean).join(" › ");
  const nowT =
    pagePath === "/"
      ? brand
      : topic + (isBlog ? ` | ${brand} Blog` : ` | ${brand}`);
  const nowD =
    action.indexOf("description") >= 0 && action.indexOf("Add") === 0
      ? "(No description. Google shows a random sentence from the page.)"
      : isBlog
      ? "Read our latest post about " + topic.toLowerCase() + "."
      : "Learn more about our " + topic.toLowerCase() + " services.";

  const isFillerListing = (title, description) => {
    const blob = `${title || ""} ${description || ""}`.toLowerCase();
    return (
      blob.includes("so the page says what it offers") ||
      blob.includes("obvious in the title") ||
      blob.includes("written so searchers know they found the right page") ||
      blob.includes("fix “") ||
      blob.includes('fix "')
    );
  };

  const isPub = !!pub[selTask.t];
  const actionable = N > 0 && (selTask.c === "red" || selTask.c === "yellow");
  const STATUS = {
    red: "Needs dire improvement",
    yellow: "Medium priority",
    green: "Passes the criteria",
    blue: "Winning · locked",
  };
  const p = matchedChange?.proposed || {};
  const choiceRows = [];
  if (p.title || p.metaDescription) choiceRows.push({ title: p.title, description: p.metaDescription, ctrFit: p.ctrFit, seoScore: p.seoScore, judgeScore: p.judgeScore });
  (Array.isArray(p.aiAlternatives) ? p.aiAlternatives : []).forEach((alt) => {
    choiceRows.push({ title: alt?.title, description: alt?.description || alt?.metaDescription, ctrFit: alt?.ctrFit, seoScore: alt?.seoScore, judgeScore: alt?.judgeScore });
  });
  const choices = [];
  choiceRows.forEach((row) => {
    const title = String(row.title || "").trim();
    const description = String(row.description || "").trim();
    if (!title && !description) return;
    if (isFillerListing(title, description)) return;
    const key = `${title} ${description}`.toLowerCase();
    if (choices.some((item) => `${item.title} ${item.description}`.toLowerCase() === key)) return;
    const fit = Number(row.ctrFit);
    const seo = Number(row.seoScore);
    const judge = Number(row.judgeScore);
    choices.push({
      judgeScore: Number.isFinite(judge) && judge > 0 ? Math.round(judge) : 0,
      title: title || "Updated title",
      description,
      ctrFit: Number.isFinite(fit) && fit > 0 ? Math.round(fit) : 0,
      seoScore: Number.isFinite(seo) && seo > 0 ? Math.round(seo) : 0,
    });
  });
  choices.sort((a, b) => (b.judgeScore || 0) - (a.judgeScore || 0) || (b.ctrFit || 0) - (a.ctrFit || 0) || (b.seoScore || 0) - (a.seoScore || 0));
  const choiceCount = Math.max(Math.min(choices.length, 3), 1);
  const shownChoices = choices.slice(0, 3);
  const v = (variant[selTask.t] || 0) % choiceCount;
  const picked = shownChoices[v] || { title: "", description: "" };
  const liveNowT = p.liveTitle || p.beforeTitle || nowT;
  const liveNowD = p.liveMetaDescription || p.beforeMetaDescription || p.beforeDescription || nowD;
  const liveSugT = picked.title || "";
  const liveSugD = picked.description || "";

  const insp = {
    task: waitingForClick
      ? "Click a dot to open its suggestion"
      : N === 0
        ? scanLoading
          ? "Loading scan…"
          : "No findings yet"
        : action,
    topic: waitingForClick ? "Hover a dot to read it. Nothing is selected until you click." : N === 0 ? "" : selTask.t,
    page: waitingForClick ? "" : pagePath,
    crumb: crumb,
    nowT: liveNowT,
    nowD: liveNowD,
    sugT: liveSugT,
    sugD: liveSugD,
    ogTitle: v === 0 ? p.openGraphTitle || liveSugT : liveSugT,
    schemaLabel: v === 0
      ? (() => {
          const ld = p.jsonLd || {};
          const kind = ld["@type"] || (Array.isArray(p.schemaTypesPreserved) ? p.schemaTypesPreserved[0] : "") || "";
          const name = ld.name || ld.headline || "";
          if (!kind && !name) return "";
          return name ? `${kind || "WebPage"} · ${name}` : String(kind);
        })()
      : "",
    optNo: String(v + 1),
    optCount: Math.max(shownChoices.length, 1),
    ctrFit: picked.ctrFit || 0,
    seoScore: picked.seoScore || 0,
    judgeScore: picked.judgeScore || 0,
    liveScore: Math.round(Number(p.liveScore) || 0),
    color: waitingForClick ? "#9AA1AB" : isPub ? COLORS.green : COLORS[selTask.c] || COLORS.green,
    status: waitingForClick ? "No dot selected" : N === 0 ? (scanLoading ? "Loading" : "Empty") : isPub ? "Published" : STATUS[selTask.c],
    border: waitingForClick
      ? "#262A31"
      : isPub
        ? "rgba(61,220,132,.5)"
        : "rgba(" + (RGB[selTask.c] || RGB.green) + ",.5)",
    glow: waitingForClick
      ? "none"
      : "0 0 26px rgba(" +
        (isPub ? "61,220,132" : RGB[selTask.c] || RGB.green) +
        ",.15)",
    hasSug: actionable && !waitingForClick,
    canAct: actionable && !isPub && !waitingForClick,
    isPublished: isPub,
    hasNote: waitingForClick || !actionable,
    note: waitingForClick
      ? "Hover shows what the dot is. Click it to put that page in the suggestion."
      : N === 0
        ? scanLoading
          ? "Pulling audit and Search Console signals for this site."
          : "Connect Search Console or run an audit to fill this colour map."
        : selTask.c === "blue"
        ? "This page is winning. Searchify has locked it and won't suggest changes."
        : "This passes. Nothing to change; Searchify rechecks it every week.",
    publish: async () => {
      if (pubBusy || regenBusy) return;
      if (!connectionStatus.wordpress) {
        setRegenNote("Connect WordPress first. Publish writes this title, description, Open Graph, and schema onto that site. The page name stays the same.");
        return;
      }
      const title = String(picked.title || "").trim();
      const description = String(picked.description || "").trim();
      if (!title || !description) {
        setRegenNote("This dot needs a title and a description before it can go to WordPress.");
        return;
      }
      setPubBusy(true);
      setRegenNote("Publishing the title, description, Open Graph, and schema to WordPress…");
      try {
        let id = matchedChange?.id;
        if (!id) {
          const siteHref = activeSiteContext(loadJourney()).href || (scanHost ? `https://${scanHost}` : "");
          const origin = String(siteHref || "").replace(/\/$/, "");
          const targetUrl = origin
            ? pagePath === "/"
              ? `${origin}/`
              : `${origin}${pagePath.startsWith("/") ? pagePath : `/${pagePath}`}`
            : "";
          const created = await createChange({
            opportunity: selTask.t,
            target_url: targetUrl,
            change_type: "meta",
            source: "scan",
            draft_with_ai: false,
            resource: "page",
            title,
            meta_description: description,
          });
          if (!created.ok || !created.data?.id) {
            setRegenNote(errorText(created, "Could not prepare this page for WordPress."));
            return;
          }
          id = created.data.id;
        } else {
          const storedTitle = String(p.title || "").trim();
          const storedDesc = String(p.metaDescription || "").trim();
          if (title !== storedTitle || description !== storedDesc) {
            const patched = await patchChange(id, { title, metaDescription: description });
            if (!patched.ok) {
              setRegenNote(errorText(patched, "Could not save the wording you picked."));
              return;
            }
          }
        }
        const approved = await approveChange(id);
        if (!approved.ok) {
          setRegenNote(errorText(approved, "This wording could not be approved."));
          return;
        }
        const executed = await executeChange(id, { includeOpenGraph: true, includeJsonLd: true });
        if (!executed.ok) {
          setRegenNote(errorText(executed, "WordPress did not accept the update. Nothing on the live page was changed."));
          return;
        }
        setPub({ ...pub, [selTask.t]: true });
        setRegenNote("Published to WordPress. The page name was not changed. Undo puts the previous title and description back.");
        await reloadLive();
      } catch {
        setRegenNote("Publish did not finish. The live page was not changed.");
      } finally {
        setPubBusy(false);
      }
    },
    undo: async () => {
      if (matchedChange?.id) await undoChange(matchedChange.id).catch(() => {});
      const nx = { ...pub };
      delete nx[selTask.t];
      setPub(nx);
      await reloadLive();
    },
    regen: async () => {
      if (regenBusy) return;
      if (matchedChange?.id) {
        setRegenBusy(true);
        setRegenNote("Reading the live page, then Search Console, Analytics, and Speed Index. Searchify SEO is writing the title and description…");
        try {
          const res = await generateMetaCopy(matchedChange.id, { breadth: "balanced", objective: "balanced" });
          if (!res.ok) {
            const detail = res.data?.detail;
            setRegenNote(typeof detail === "string" ? detail : "Could not regenerate the title and description.");
            return;
          }
          await reloadLive();
          setVariant({ ...variant, [selTask.t]: 0 });
          const nextTitle = res.data?.change?.proposed?.title || res.data?.options?.[0]?.title || "";
          setRegenNote(nextTitle ? `New title ready: ${nextTitle}` : "New title and description are ready.");
        } catch {
          setRegenNote("Regenerate did not finish. Try again in a moment.");
        } finally {
          setRegenBusy(false);
        }
        return;
      }
      setVariant({ ...variant, [selTask.t]: v + 1 });
    },
  };

  const moreToWrite = Boolean(matchedChange?.id) && shownChoices.length < 3;
  const nextLocked = regenBusy || (v >= Math.max(shownChoices.length, 1) - 1 && !moreToWrite);
  const showOptionNav = shownChoices.length > 1 || Boolean(matchedChange?.id);

  const goNext = async () => {
    if (regenBusy) return;
    if (v < shownChoices.length - 1) {
      setVariant({ ...variant, [selTask.t]: v + 1 });
      return;
    }
    if (!matchedChange?.id || shownChoices.length >= 3) return;
    setRegenBusy(true);
    setRegenNote("Searchify SEO is writing the next title and description…");
    try {
      const res = await generateMetaCopy(matchedChange.id, { breadth: "balanced", objective: "balanced" });
      if (!res.ok) {
        setRegenNote(errorText(res, "Could not write the next title and description."));
        return;
      }
      const options = Array.isArray(res.data?.options) ? res.data.options : [];
      const realCount = options.filter(
        (row) => row?.title && row?.description && !isFillerListing(row.title, row.description),
      ).length;
      await reloadLive();
      if (realCount < 2) {
        setVariant({ ...variant, [selTask.t]: 0 });
        setRegenNote("One listing is ready. A second distinct title did not pass the checks.");
        return;
      }
      setVariant({ ...variant, [selTask.t]: 1 });
      setRegenNote("");
    } catch {
      setRegenNote("The next title and description did not finish. Try again in a moment.");
    } finally {
      setRegenBusy(false);
    }
  };

  return (
    <div
      className="v8-scan"
      style={{
        flex: "999 1 560px",
        minWidth: 0,
        minHeight: 960,
        background: "#0A0B0D",
        color: "#F2F4F5",
        fontFamily: "Geist, 'Helvetica Neue', sans-serif",
        boxSizing: "border-box",
        padding: "28px clamp(16px, 4vw, 56px) 56px",
        display: "flex",
        flexDirection: "column",
        gap: "40px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}></div>
        <button
          type="button"
          onClick={() => {
            if (timerRef.current) clearInterval(timerRef.current);
            setStage("input");
            setPct(0);
            setPage(0);
          }}
          style={{
            minHeight: "40px",
            padding: "0 14px",
            borderRadius: "999px",
            border: "1px solid #262A31",
            background: "transparent",
            color: "#9AA1AB",
            fontSize: "13px",
          }}
        >
          Replay the scan
        </button>
      </div>

      <ProblemNotice problems={problems} onRetry={() => reloadLive()} style={{ maxWidth: "1180px", width: "100%", margin: "0 auto" }} />

      <div
        style={{
          maxWidth: "1180px",
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: "48px",
          alignItems: "flex-start",
        }}
      >
        <section
          style={{
            flex: "1 1 440px",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {stage === "input" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "22px", animation: "sfy-rise .5s ease both" }}>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                  fontSize: "clamp(40px, 5.4vw, 72px)",
                  lineHeight: 0.98,
                  letterSpacing: "-2px",
                  fontWeight: 700,
                }}
              >
                How much is your website leaving on the table?
              </h1>
              <p style={{ margin: 0, fontSize: 17, color: "#9AA1AB", lineHeight: 1.5, maxWidth: 480 }}>
                Paste your address. In about a minute you&apos;ll know, task by task.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <label
                  htmlFor="scan-url"
                  style={{
                    flex: "1 1 280px",
                    display: "flex",
                    alignItems: "center",
                    minHeight: 58,
                    padding: "0 18px",
                    borderRadius: 14,
                    background: "#131519",
                    border: "1px solid #262A31",
                  }}
                >
                  <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                    Website address
                  </span>
                  <input
                    id="scan-url"
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://your-site.com"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      border: 0,
                      outline: "none",
                      background: "transparent",
                      color: "#F2F4F5",
                      font: "inherit",
                      fontSize: 18,
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={runScan}
                  style={{
                    minHeight: 58,
                    padding: "0 26px",
                    borderRadius: 14,
                    border: 0,
                    background: "#4DA3FF",
                    color: "#0A0B0D",
                    fontSize: 16,
                    fontWeight: 600,
                    boxShadow: "0 0 24px rgba(77,163,255,.45)",
                  }}
                >
                  Scan it
                </button>
              </div>
              <div style={{ fontSize: 13, color: "#7D848E" }}>Uses your workspace site and live backend scan.</div>
            </div>
          )}

          {stage === "scanning" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div
                style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 13,
                  color: "#D5F879",
                  letterSpacing: "0.5px",
                  animation: "sfy-breathe 1.2s ease-in-out infinite",
                  textTransform: "uppercase",
                }}
              >
                READING {scanHost || "YOUR SITE"}
              </div>
              <div
                style={{
                  fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                  fontSize: "clamp(64px, 8vw, 112px)",
                  lineHeight: 0.9,
                  letterSpacing: "-3px",
                  fontWeight: 800,
                }}
              >
                {pct}%
              </div>
              <div style={{ height: 4, borderRadius: 4, background: "#1A1D22", overflow: "hidden" }}>
                <div style={{ height: 4, background: "#D5F879", width: `${pct}%`, transition: "width .08s linear" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontFamily: "'Geist Mono', monospace", fontSize: 14, color: "#9AA1AB" }}>
                {log.map((line) => (
                  <div key={line} style={{ animation: "sfy-rise .3s ease both" }}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

          {stage === "connect" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 22, animation: "sfy-rise .5s ease both" }}>
              <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 13, color: "#9AA1AB", letterSpacing: "0.5px" }}>
                {N} TASKS FOUND · <span style={{ color: "#FF5A4E" }}>{red.length} DIRE</span> ·{" "}
                <span style={{ color: "#FFC53D" }}>{yellow.length} MEDIUM</span> ·{" "}
                <span style={{ color: "#4DA3FF" }}>{blue.length} LOCKED</span>
              </div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                  fontSize: "clamp(36px, 4.6vw, 60px)",
                  lineHeight: 1,
                  letterSpacing: "-1.6px",
                  fontWeight: 700,
                }}
              >
                Now let&apos;s see what it&apos;s costing you.
              </h1>
              <p style={{ margin: 0, fontSize: 17, color: "#9AA1AB", lineHeight: 1.5, maxWidth: 480 }}>
                Search Console shows how many people see each page in Google but don&apos;t click. Read-only access.
              </p>
              <button
                type="button"
                onClick={() => router.push("/app/connections")}
                style={{
                  alignSelf: "flex-start",
                  minHeight: 58,
                  padding: "0 26px",
                  borderRadius: 14,
                  border: 0,
                  background: "#4DA3FF",
                  color: "#0A0B0D",
                  fontSize: 16,
                  fontWeight: 600,
                  boxShadow: "0 0 24px rgba(77,163,255,.45)",
                }}
              >
                Connect Search Console
              </button>
              <button
                type="button"
                onClick={() => setStage("reveal")}
                style={{
                  alignSelf: "flex-start",
                  minHeight: 44,
                  padding: 0,
                  border: 0,
                  background: "transparent",
                  color: "#9AA1AB",
                  fontSize: 14,
                  textDecoration: "underline",
                }}
              >
                Skip for now — show the board
              </button>
            </div>
          )}

          {stage === "reveal" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "sfy-rise .6s ease both" }}>
              <div
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: "40px",
                  fontWeight: 700,
                  lineHeight: 1,
                  color: "#FF5A4E",
                  transform: "rotate(-2deg)",
                  transformOrigin: "left center",
                  textShadow: "0 0 22px rgba(255,90,78,.35)",
                }}
              >
                You're missing this every month ↓
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "14px", flexWrap: "wrap" }}>
                <span
                  style={{
                    fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                    fontSize: "clamp(88px, 11vw, 150px)",
                    lineHeight: 0.85,
                    letterSpacing: "-5px",
                    fontWeight: 800,
                    color: "#D5F879",
                  }}
                >
                  {untappedVisitors.toLocaleString("en-US")}
                </span>
                <span style={{ fontSize: "20px", color: "#F2F4F5", lineHeight: 1.2 }}>
                  visitors
                  <br />
                  from Google
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "19px", lineHeight: 1.45, maxWidth: "520px" }}>
                That&apos;s roughly{" "}
                <strong style={{ color: "#D5F879" }}>
                  {callsEstimate || "—"} calls or quote requests a month
                </strong>{" "}
                you&apos;re not getting. These people already see your site in Google — they pick someone else.
              </p>

              <section
                aria-live="polite"
                aria-label="Selected task"
                style={{
                  borderRadius: "22px",
                  background: "#101215",
                  border: `1px solid ${insp.border}`,
                  boxShadow: insp.glow,
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  transition: "border-color .3s ease, box-shadow .3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: insp.color,
                      boxShadow: `0 0 10px ${insp.color}`,
                    }}
                  ></span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: insp.color }}>
                    {insp.status}
                  </span>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: "12px",
                      color: "#9AA1AB",
                    }}
                  >
                    {insp.page}
                  </span>
                </div>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600, letterSpacing: "-0.3px" }}>
                  {scanLoading ? <Skel w="72%" h={22} radius={8} /> : insp.task}
                </h2>
                {insp.topic ? (
                  <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.45, color: "#9AA1AB" }}>
                    {insp.topic}
                  </p>
                ) : null}
                {!waitingForClick ? (
                <div
                  style={{
                    borderRadius: "14px",
                    background: "#F7F8FA",
                    color: "#202124",
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "3px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: "11px",
                      color: "#5F6368",
                      marginBottom: "4px",
                    }}
                  >
                    IN GOOGLE NOW
                  </span>
                  <span style={{ fontSize: "12px", color: "#3C4043" }}>{scanHost}{insp.crumb}</span>
                  <span
                    style={{
                      fontSize: "18px",
                      color: "#1A0DAB",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {insp.nowT}
                  </span>
                  <span style={{ fontSize: "13px", color: "#4D5156", lineHeight: 1.45 }}>
                    {insp.nowD}
                  </span>
                </div>
                ) : null}
                {insp.hasSug && (
                  <div
                    style={{
                      borderRadius: "14px",
                      background: "#F7F8FA",
                      color: "#202124",
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px",
                      outline: "2px solid #4DA3FF",
                      outlineOffset: "2px",
                      boxShadow: "0 0 26px rgba(77,163,255,.35)",
                    }}
                  >
                    <span
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr) auto",
                        columnGap: "16px",
                        rowGap: "8px",
                        alignItems: "center",
                        width: "100%",
                        marginBottom: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Geist Mono', monospace",
                          fontSize: "12px",
                          color: "#1A5FB4",
                          lineHeight: 1.4,
                        }}
                      >
                        {insp.topic || "THIS DOT"}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", justifySelf: "end" }}>
                        {showOptionNav ? (
                          <button
                            type="button"
                            aria-label="Previous option"
                            disabled={v === 0}
                            onClick={() => setVariant({ ...variant, [selTask.t]: v - 1 })}
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "8px",
                              border: "1px solid #D7DADE",
                              background: "#fff",
                              color: "#202124",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: 0,
                              cursor: v === 0 ? "default" : "pointer",
                              opacity: v === 0 ? 0.35 : 1,
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M15 6l-6 6 6 6"></path>
                            </svg>
                          </button>
                        ) : null}
                        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", color: "#3C4043", whiteSpace: "nowrap" }}>
                          {insp.optNo} of {insp.optCount}
                        </span>
                        {showOptionNav ? (
                          <button
                            type="button"
                            aria-label="Next option"
                            disabled={nextLocked}
                            onClick={goNext}
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "8px",
                              border: "1px solid #D7DADE",
                              background: "#fff",
                              color: "#202124",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: 0,
                              cursor: nextLocked ? "default" : "pointer",
                              opacity: nextLocked ? 0.35 : 1,
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M9 6l6 6-6 6"></path>
                            </svg>
                          </button>
                        ) : null}
                      </span>
                      <span style={{ fontSize: "12px", color: "#3C4043", lineHeight: 1.4 }}>
                        {scanHost || "your.site"}
                        {insp.crumb}
                      </span>
                      {(insp.judgeScore || insp.ctrFit || insp.seoScore) ? (
                        <span style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: "6px", justifySelf: "end" }}>
                          {insp.judgeScore ? (
                            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", color: "#1A5FB4", whiteSpace: "nowrap", padding: "3px 8px", borderRadius: "999px", background: "rgba(77,163,255,.12)" }}>
                              {`Score ${insp.judgeScore}${insp.liveScore ? ` vs live ${insp.liveScore}` : ""}`}
                            </span>
                          ) : null}
                          {insp.ctrFit ? (
                            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", color: "#1A5FB4", whiteSpace: "nowrap", padding: "3px 8px", borderRadius: "999px", background: "rgba(77,163,255,.12)" }}>
                              {`CTR ${insp.ctrFit}`}
                            </span>
                          ) : null}
                          {insp.seoScore ? (
                            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", color: "#1A5FB4", whiteSpace: "nowrap", padding: "3px 8px", borderRadius: "999px", background: "rgba(77,163,255,.12)" }}>
                              {`SEO ${insp.seoScore}`}
                            </span>
                          ) : null}
                        </span>
                      ) : null}
                    </span>
                    <span
                      style={{
                        fontSize: "18px",
                        color: "#1A0DAB",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {scanLoading ? (
                        <Skel light w="84%" h={18} radius={8} />
                      ) : (
                        insp.sugT || (regenBusy ? "Searchify SEO is writing the title and description…" : "Next writes another title and description for this page.")
                      )}
                    </span>
                    <span style={{ fontSize: "13px", color: "#4D5156", lineHeight: 1.45 }}>
                      {scanLoading ? <Skel light w="100%" h={12} /> : insp.sugD}
                    </span>
                    {insp.ogTitle ? (
                      <span style={{ fontSize: "12px", color: "#3C4043", lineHeight: 1.4 }}>Open Graph · {insp.ogTitle}</span>
                    ) : null}
                    {insp.schemaLabel ? (
                      <span style={{ fontSize: "12px", color: "#3C4043", lineHeight: 1.4 }}>Schema · {insp.schemaLabel}</span>
                    ) : null}
                  </div>
                )}
                {insp.canAct && (
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={insp.publish}
                      disabled={pubBusy}
                      aria-busy={pubBusy}
                      style={{
                        minHeight: "50px",
                        padding: "0 22px",
                        borderRadius: "13px",
                        border: 0,
                        background: "#4DA3FF",
                        color: "#0A0B0D",
                        fontSize: "15px",
                        fontWeight: 600,
                        boxShadow: "0 0 22px rgba(77,163,255,.45)",
                        opacity: pubBusy ? 0.7 : 1,
                      }}
                    >
                      {pubBusy ? "Publishing…" : "Publish change"}
                    </button>
                    <button
                      type="button"
                      onClick={insp.regen}
                      disabled={regenBusy}
                      aria-busy={regenBusy}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        minHeight: "50px",
                        padding: "0 18px",
                        borderRadius: "13px",
                        border: "1px solid #262A31",
                        background: "transparent",
                        color: "#F2F4F5",
                        fontSize: "15px",
                        opacity: regenBusy ? 0.7 : 1,
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M21 12a9 9 0 1 1-3-6.7"></path>
                        <path d="M21 4v5h-5"></path>
                      </svg>
                      {regenBusy ? "Regenerating…" : "Regenerate suggestion"}
                    </button>
                  </div>
                )}
                {regenNote ? (
                  <span style={{ fontSize: "13px", color: regenNote.startsWith("Published") || regenNote.startsWith("New title") ? "#3DDC84" : "#FFC53D", lineHeight: 1.45 }}>{regenNote}</span>
                ) : null}
                {insp.isPublished && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        minHeight: "46px",
                        padding: "0 16px",
                        borderRadius: "12px",
                        background: "rgba(61,220,132,.1)",
                        border: "1px solid rgba(61,220,132,.5)",
                        fontSize: "14px",
                      }}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "#3DDC84",
                          boxShadow: "0 0 8px #3DDC84",
                          animation: "sfy-breathe 1.2s ease-in-out infinite",
                        }}
                      ></span>
                      Published to WordPress
                    </span>
                    <button
                      type="button"
                      onClick={insp.undo}
                      style={{
                        minHeight: "46px",
                        padding: "0 12px",
                        border: 0,
                        background: "transparent",
                        color: "#9AA1AB",
                        fontSize: "13px",
                        textDecoration: "underline",
                      }}
                    >
                      Undo
                    </button>
                  </div>
                )}
                {insp.hasNote && (
                  <p style={{ margin: 0, fontSize: "14px", color: "#9AA1AB", lineHeight: 1.5 }}>
                    {insp.note}
                  </p>
                )}
                <span style={{ fontSize: "12px", color: "#7D848E" }}>
                  Click any dot on the board to load it here.
                </span>
              </section>

              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <a
                  href="/app"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    minHeight: "50px",
                    padding: "0 20px",
                    borderRadius: "14px",
                    border: "1px solid #262A31",
                    background: "transparent",
                    color: "#F2F4F5",
                    fontSize: "15px",
                    fontWeight: 500,
                    textDecoration: "none",
                  }}
                >
                  Work through them one at a time in Today's moves <span aria-hidden="true">→</span>
                </a>
                <span style={{ fontSize: "13px", color: "#7D848E" }}>
                  Pick reds, yellows, greens or blues there.
                </span>
              </div>
            </div>
          )}
        </section>

        <section
          aria-label="Every task Searchify found"
          style={{
            flex: "1 1 440px",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              background: "#101215",
              border: "1px solid #1A1D22",
              borderRadius: "24px",
              padding: "clamp(20px, 3vw, 32px)",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                fontSize: "16px",
                fontWeight: 800,
                letterSpacing: "1.6px",
                color: "#F2F4F5",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#F2F4F5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 3l14 7-6 2-2 6z"></path>
              </svg>
              <span className="v8-scan-hint-hover">HOVER TO READ · CLICK TO OPEN</span>
              <span className="v8-scan-hint-tap">TAP A DOT TO OPEN</span>
            </div>
            <div
              className="v8-scan-chips"
              role="group"
              aria-label="Show tasks by colour"
              style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}
            >
              {chips.map((ch) =>
                ch.on ? (
                  <button
                    key={ch.label}
                    type="button"
                    aria-pressed="true"
                    onClick={ch.pick}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      minHeight: "40px",
                      padding: "0 14px",
                      borderRadius: "999px",
                      border: `1px solid ${ch.color}`,
                      background: ch.tint,
                      color: "#F2F4F5",
                      fontSize: "13px",
                      fontWeight: 600,
                      boxShadow: `0 0 22px ${ch.glow}`,
                      transition: "box-shadow .3s ease",
                    }}
                  >
                    <span
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: ch.color,
                        boxShadow: `0 0 10px ${ch.color}`,
                        animation: "sfy-flicker 1.4s ease-in-out infinite",
                      }}
                    ></span>
                    {ch.label} <span style={{ fontFamily: "'Geist Mono', monospace" }}>{ch.count}</span>
                  </button>
                ) : (
                  <button
                    key={ch.label}
                    type="button"
                    aria-pressed="false"
                    onClick={ch.pick}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      minHeight: "40px",
                      padding: "0 14px",
                      borderRadius: "999px",
                      border: "1px solid #262A31",
                      background: "transparent",
                      color: "#D7DADE",
                      fontSize: "13px",
                    }}
                  >
                    <span
                      style={{
                        width: "9px",
                        height: "9px",
                        borderRadius: "50%",
                        background: ch.color,
                      }}
                    ></span>
                    {ch.label}{" "}
                    <span style={{ fontFamily: "'Geist Mono', monospace", color: "#9AA1AB" }}>
                      {ch.count}
                    </span>
                  </button>
                )
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <div
                role="group"
                aria-label="Order"
                style={{
                  display: "inline-flex",
                  padding: "3px",
                  borderRadius: "10px",
                  background: "#0A0B0D",
                  border: "1px solid #1A1D22",
                }}
              >
                {orders.map((o) =>
                  o.on ? (
                    <button
                      key={o.label}
                      type="button"
                      aria-pressed="true"
                      onClick={o.pick}
                      style={{
                        minHeight: "30px",
                        padding: "0 10px",
                        borderRadius: "7px",
                        border: 0,
                        background: "#262A31",
                        color: "#F2F4F5",
                        fontSize: "12px",
                      }}
                    >
                      {o.label}
                    </button>
                  ) : (
                    <button
                      key={o.label}
                      type="button"
                      aria-pressed="false"
                      onClick={o.pick}
                      style={{
                        minHeight: "30px",
                        padding: "0 10px",
                        borderRadius: "7px",
                        border: 0,
                        background: "transparent",
                        color: "#9AA1AB",
                        fontSize: "12px",
                      }}
                    >
                      {o.label}
                    </button>
                  )
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "12px", color: "#9AA1AB" }}>
                  Tasks {pg * PER + 1}–{pg * PER + slice.length} of {N}
                </span>
                <button
                  type="button"
                  aria-label="Previous tasks"
                  onClick={() => setPage(Math.max(0, pg - 1))}
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "9px",
                    border: "1px solid #262A31",
                    background: "transparent",
                    color: pg > 0 ? "#F2F4F5" : "#3A404A",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M15 6l-6 6 6 6"></path>
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Next tasks"
                  onClick={() => setPage(Math.min(pagesCount - 1, pg + 1))}
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "9px",
                    border: "1px solid #262A31",
                    background: "transparent",
                    color: pg < pagesCount - 1 ? "#F2F4F5" : "#3A404A",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M9 6l6 6-6 6"></path>
                  </svg>
                </button>
              </div>
            </div>

            <div
              className="v8-scan-dots"
              style={
                board === "desk"
                  ? undefined
                  : {
                      minHeight: Math.ceil((dots.length || 1) / (board === "phone" ? 6 : 8)) * (board === "phone" ? 62 : 74),
                    }
              }
              onTouchStart={(e) => {
                swipeX.current = e.changedTouches[0]?.clientX ?? null;
              }}
              onTouchEnd={(e) => {
                if (swipeX.current == null || board === "desk") return;
                const dx = (e.changedTouches[0]?.clientX ?? swipeX.current) - swipeX.current;
                swipeX.current = null;
                if (dx <= -48) setPage((p) => Math.min(pagesCount - 1, p + 1));
                else if (dx >= 48) setPage((p) => Math.max(0, p - 1));
              }}
            >
              {dots.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={d.pick}
                  onMouseEnter={d.hover}
                  onMouseLeave={() => setHover(-1)}
                  aria-label={d.label}
                  aria-pressed={d.selStr}
                  style={{
                    aspectRatio: "1",
                    display: "grid",
                    placeItems: "center",
                    padding: 0,
                    border: 0,
                    background: "transparent",
                    borderRadius: "50%",
                    cursor: "pointer",
                    outline: d.ring,
                    outlineOffset: "1px",
                  }}
                >
                  <div
                    className="v8-scan-dot"
                    style={{
                      width: "58%",
                      aspectRatio: "1",
                      borderRadius: "50%",
                      background: d.color,
                      opacity: d.op,
                      boxShadow: d.shadow,
                      animation: d.anim,
                      transition: "opacity .3s ease, box-shadow .3s ease, transform .2s ease",
                    }}
                  ></div>
                </button>
              ))}
            </div>

            <div
              style={{
                minHeight: "44px",
                paddingTop: "14px",
                borderTop: "1px solid #1A1D22",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: 600 }}>
                {hovered ? hovered.t : clickedTask ? clickedTask.t : "Hover a dot to read it"}
              </span>
              <span style={{ fontSize: "13px", color: "#9AA1AB" }}>
                {hovered
                  ? META[hovered.c]?.title || META[f].sub
                  : clickedTask
                    ? META[clickedTask.c]?.title || META[f].sub
                    : "Click a dot to open its suggestion"}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
