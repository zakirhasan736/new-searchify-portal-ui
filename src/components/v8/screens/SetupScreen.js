"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import SearchifyMarkSvg from "@/components/v8/SearchifyMarkSvg";
import ConnectDialog, { useConnectionStatus } from "@/components/board/ConnectDialog";
import {
  completeDraft,
  draftForSetup,
  hydrateJourney,
  markConnection,
  normalizeSiteUrl,
  peekPendingSite,
  saveDraft,
  seedDraftSite,
  syncJourneyNow,
} from "@/lib/journey";

import {
  errorText,
  getBusinessProfile,
  getSiteScan,
  previewSiteScan,
  runSiteScan,
  saveBusinessProfile,
  startGoogleOAuth,
} from "@/lib/v1Api";
import { userIsAuthenticated } from "@/utils/users/Helpers";
import { SkeletonCards } from "@/components/v8/SkeletonWave";
import "@/styles/v8-screens.css";

const ACCENT = "#D5F879";

const GOAL_DEFS = [
  { id: "repair", label: "More repair calls" },
  { id: "replace", label: "More replacement quotes" },
  { id: "both", label: "Both equally" },
];

function validUrl(value) {
  try {
    const u = new URL(normalizeUrl(value));
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeUrl(raw) {
  const v = String(raw || "").trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}

function goalIdFromLabel(label) {
  const hit = GOAL_DEFS.find((g) => g.label === label);
  return hit?.id || "both";
}

function briefFromScan(scan) {
  const offers = Array.isArray(scan?.offers) ? scan.offers.filter(Boolean) : [];
  const places = Array.isArray(scan?.places) ? scan.places.filter(Boolean) : [];
  const proof = Array.isArray(scan?.proof) ? scan.proof.filter(Boolean) : [];
  return {
    business: scan?.business || offers.slice(0, 2).join(", ") || "",
    areas: places.slice(0, 4).join(", ") || "",
    different: proof.slice(0, 2).join(", ") || "",
    moneyPages: "",
  };
}

export default function SetupScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const isNew = params.get("new") === "1";
  const googleBack = params.get("google");
  const [status, refreshStatus] = useConnectionStatus();

  const [ready, setReady] = useState(false);
  const [url, setUrl] = useState("");
  const [showBrief, setShowBrief] = useState(false);
  const [reading, setReading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [err, setErr] = useState("");
  const [scanMeta, setScanMeta] = useState({ pages: 0, seconds: 0, host: "" });
  const [freePreview, setFreePreview] = useState(null);
  const [goal, setGoal] = useState("both");
  const [brief, setBrief] = useState({ business: "", areas: "", different: "", moneyPages: "" });
  const [wpOpen, setWpOpen] = useState(false);
  const wantAutoScan = useRef(false);
  const autoScanStarted = useRef(false);

  useEffect(() => {
    if (!userIsAuthenticated()) {
      const siteQ = params.get("site");
      const next = siteQ ? `/login?next=${encodeURIComponent(`/app/start?site=${encodeURIComponent(siteQ)}`)}&site=${encodeURIComponent(siteQ)}` : "/login?next=/app/start";
      router.replace(next);
      return;
    }
    let cancelled = false;
    (async () => {
      await hydrateJourney();
      if (cancelled) return;
      const pending = normalizeSiteUrl(params.get("site") || peekPendingSite() || "");
      if (pending) {
        seedDraftSite(pending);
        wantAutoScan.current = true;
      }
      const draft = draftForSetup(isNew);
      if (!draft && !isNew) {
        /* already have ready sites — still allow setup if they navigated here */
      }
      const answers = { ...(draft?.answers || {}) };
      if (pending && !answers.site) answers.site = pending;
      if (googleBack === "connected") {
        answers.gsc = "Connected";
        markConnection("gsc", "Connected");
      }
      if (answers.site) setUrl(answers.site);
      if (answers.shortGoal) setGoal(goalIdFromLabel(answers.shortGoal));
      if (answers.businessType || answers.market) {
        setBrief((b) => ({
          ...b,
          business: answers.businessType || b.business,
          areas: answers.market || b.areas,
          different: answers.claims || b.different,
          moneyPages: answers.moneyPages || b.moneyPages,
        }));
        setShowBrief(true);
      }

      const [bp, scanRes] = await Promise.all([
        getBusinessProfile({ force: true }).catch(() => ({ ok: false })),
        getSiteScan(answers.site || "").catch(() => ({ ok: false })),
      ]);
      if (cancelled) return;
      const profile = bp.data?.profile || {};
      if (profile.business || profile.areas) {
        setBrief((b) => ({
          business: profile.business || b.business,
          areas: profile.areas || profile.locations || b.areas,
          different: profile.claims || b.different,
          moneyPages: profile.services || b.moneyPages,
        }));
      }
      const scan = scanRes.data?.scan;
      if (scan?.pagesRead) {
        setScanMeta({
          pages: Number(scan.pagesRead) || 0,
          seconds: 0,
          host: scan.host || "",
        });
        setBrief((b) => {
          const from = briefFromScan(scan);
          return {
            business: b.business || from.business,
            areas: b.areas || from.areas,
            different: b.different || from.different,
            moneyPages: b.moneyPages || from.moneyPages,
          };
        });
        setShowBrief(true);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [googleBack, isNew, router, params]);

  const goals = useMemo(
    () =>
      GOAL_DEFS.map((d) => ({
        ...d,
        on: d.id === goal,
        pick: () => setGoal(d.id),
      })),
    [goal],
  );

  const buildAnswers = useCallback(() => {
    const site = normalizeUrl(url);
    const goalLabel = GOAL_DEFS.find((g) => g.id === goal)?.label || "";
    return {
      site,
      businessType: brief.business.trim(),
      market: brief.areas.trim(),
      claims: brief.different.trim(),
      moneyPages: brief.moneyPages.trim(),
      shortGoal: goalLabel,
      gsc: status.gsc ? "Connected" : "",
      wordpress: status.wordpress ? "Connected" : "",
    };
  }, [url, brief, goal, status.gsc, status.wordpress]);

  const readSite = async () => {
    setErr("");
    const site = normalizeUrl(url);
    if (!validUrl(site)) {
      setErr("Enter a full website address, including https://");
      return;
    }
    setUrl(site);
    setReading(true);
    setFreePreview(null);
    const started = Date.now();
    const answers = { ...buildAnswers(), site };
    saveDraft(answers, 1);
    try {
      const preview = await previewSiteScan(site);
      const seconds = Math.max(1, Math.round((Date.now() - started) / 1000));
      const look = preview.ok ? preview.data?.scan : null;
      if (look?.pagesRead) {
        setFreePreview(look);
        setScanMeta({
          pages: Number(look.pagesRead) || 0,
          seconds,
          host: look.host || "",
        });
        setShowBrief(true);
      }
      const res = await runSiteScan({
        site: { answers },
        force: false,
      });
      if (!res.ok) {
        if (!look?.pagesRead) {
          setErr(errorText(res, errorText(preview, "Could not read that site. Check the address and try again.")));
        }
        setReading(false);
        return;
      }
      const scan = res.data?.scan || {};
      const from = briefFromScan(scan);
      if (scan.pagesRead) {
        setScanMeta({
          pages: Number(scan.pagesRead) || look?.pagesRead || 0,
          seconds: Math.max(seconds, Math.round((Date.now() - started) / 1000)),
          host: scan.host || look?.host || "",
        });
      }
      setBrief((b) => ({
        business: b.business || from.business,
        areas: b.areas || from.areas,
        different: b.different || from.different,
        moneyPages: b.moneyPages || from.moneyPages,
      }));
      setShowBrief(true);
    } catch {
      setErr("Could not reach Searchify. Try again in a moment.");
    }
    setReading(false);
  };

  useEffect(() => {
    if (!ready || !wantAutoScan.current || autoScanStarted.current || !url) return;
    autoScanStarted.current = true;
    readSite();
  }, [ready, url]);

  const connectGsc = async () => {
    setErr("");
    const res = await startGoogleOAuth("gsc,ga4", { add: false });
    if (res.data?.url) {
      window.location.href = res.data.url;
      return;
    }
    setErr(errorText(res, "Could not start Google sign-in."));
  };

  const finish = async () => {
    setErr("");
    const answers = buildAnswers();
    if (!validUrl(answers.site)) {
      setErr("Enter a website address first.");
      return;
    }
    if (!answers.businessType.trim()) {
      setErr("Add what the business does before continuing.");
      return;
    }
    setFinishing(true);
    saveDraft(answers, 2);
    await saveBusinessProfile({
      business: answers.businessType,
      services: answers.moneyPages || answers.businessType,
      areas: answers.market,
      locations: answers.market,
      claims: answers.claims || "Only facts that are visible on the live page.",
      voice: "",
      restrictions: answers.shortGoal ? `Primary goal: ${answers.shortGoal}` : "",
    });
    if (status.gsc) markConnection("gsc", "Connected");
    if (status.wordpress) markConnection("wordpress", "Connected");
    const path = completeDraft(answers);
    const sync = await syncJourneyNow();
    setFinishing(false);
    if (!sync.ok) {
      setErr(`Saved on this device, but not to your account yet. ${sync.error || ""} Try again.`);
      return;
    }
    router.push(path);
  };

  if (!ready) {
    return (
      <div
        style={{
          minHeight: 240,
          background: "#F5F6F7",
          color: "#5B616B",
          fontFamily: "Geist, 'Helvetica Neue', sans-serif",
          padding: 28,
        }}
      >
        <SkeletonCards count={2} lines={3} light />
      </div>
    );
  }

  const stepLabel = showBrief ? "2" : "1";
  const readLine =
    scanMeta.pages > 0
      ? `Read ${scanMeta.pages.toLocaleString("en-US")} page${scanMeta.pages === 1 ? "" : "s"}${
          scanMeta.seconds ? ` in ${scanMeta.seconds} second${scanMeta.seconds === 1 ? "" : "s"}` : ""
        }`
      : "Site brief ready";

  return (
    <div
      style={{
        minHeight: "auto",
        background: "#F5F6F7",
        color: "#121417",
        fontFamily: "Geist, 'Helvetica Neue', sans-serif",
        boxSizing: "border-box",
        padding: "28px 16px 64px",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 36 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <SearchifyMarkSvg size={30} />
            <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.4px" }}>searchify</div>
          </div>
          <span style={{ fontSize: 13, color: "#5B616B" }}>Step {stepLabel} of 3</span>
        </div>

        <header style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(32px, 5vw, 48px)",
              lineHeight: 1.05,
              letterSpacing: "-1.4px",
              fontWeight: 600,
            }}
          >
            Paste your site. We{"'"}ll learn the rest.
          </h1>
          <p style={{ margin: 0, fontSize: 17, color: "#5B616B", lineHeight: 1.5, maxWidth: 600 }}>
            Searchify reads your pages and drafts a business brief. You correct anything it got wrong — no questionnaire.
          </p>
        </header>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <label
            htmlFor="site"
            style={{
              flex: "1 1 360px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              minHeight: 54,
              padding: "0 16px",
              background: "#FFFFFF",
              border: "1px solid #C9CDD2",
              borderRadius: 12,
            }}
          >
            <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
              Website address
            </span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B616B" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18" />
              <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z" />
            </svg>
            <input
              id="site"
              type="url"
              placeholder="https://your-site.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  readSite();
                }
              }}
              style={{
                flex: 1,
                minWidth: 0,
                border: 0,
                outline: "none",
                font: "inherit",
                fontSize: 16,
                background: "transparent",
                color: "#121417",
              }}
            />
          </label>
          <button
            type="button"
            disabled={reading}
            onClick={readSite}
            style={{
              minHeight: 54,
              padding: "0 22px",
              borderRadius: 12,
              border: 0,
              background: "#121417",
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: 600,
              opacity: reading ? 0.6 : 1,
            }}
          >
            {reading ? "Scanning…" : "Scan it free"}
          </button>
        </div>

        {err ? (
          <p role="alert" style={{ margin: 0, color: "#B42318", fontSize: 14 }}>
            {err}
          </p>
        ) : null}
        {reading ? <SkeletonCards count={1} lines={3} light /> : null}
        {freePreview?.findings?.length ? (
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            {freePreview.findings.slice(0, 4).map((item) => (
              <li key={`${item.path}-${item.label}`} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, color: "#3A3F46" }}>
                <i style={{ width: 10, height: 10, marginTop: 5, borderRadius: "50%", background: item.color === "red" ? "#FF5A4E" : "#FFC53D", flex: "none" }} />
                <span>
                  <strong>{item.label}</strong>
                  <span style={{ display: "block", color: "#5B616B" }}>{item.path} · {item.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {showBrief ? (
          <section aria-labelledby="brief-h" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#127A45", fontWeight: 500 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12l5 5L20 7" />
              </svg>
              {readLine}
            </div>
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E3E5E8",
                borderRadius: 16,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                <h2 id="brief-h" style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                  Here{"'"}s what we think you do
                </h2>
                <span style={{ fontSize: 13, color: "#5B616B" }}>Edit anything that{"'"}s off</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
                {[
                  ["business", "Business"],
                  ["areas", "Service area"],
                  ["different", "What makes you different"],
                  ["moneyPages", "Pages that make money"],
                ].map(([key, label]) => (
                  <label key={key} style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#5B616B" }}>
                    {label}
                    <input
                      type="text"
                      value={brief[key]}
                      onChange={(e) => setBrief((b) => ({ ...b, [key]: e.target.value }))}
                      style={{
                        minHeight: 44,
                        padding: "0 12px",
                        border: "1px solid #E3E5E8",
                        borderRadius: 9,
                        font: "inherit",
                        fontSize: 15,
                        color: "#121417",
                      }}
                    />
                  </label>
                ))}
              </div>
              <div style={{ padding: "12px 14px", borderRadius: 10, background: "#FFF6DB", color: "#5C4400", fontSize: 14, lineHeight: 1.5 }}>
                One question we couldn{"'"}t always answer from your site: what should Searchify prioritise first? It changes which pages get worked on first.
              </div>
              <div role="group" aria-label="Main goal" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {goals.map((g) =>
                  g.on ? (
                    <button
                      key={g.id}
                      type="button"
                      aria-pressed="true"
                      onClick={g.pick}
                      style={{
                        minHeight: 42,
                        padding: "0 14px",
                        borderRadius: 999,
                        border: "1px solid #121417",
                        background: "#121417",
                        color: "#FFFFFF",
                        fontSize: 14,
                      }}
                    >
                      {g.label}
                    </button>
                  ) : (
                    <button
                      key={g.id}
                      type="button"
                      aria-pressed="false"
                      onClick={g.pick}
                      style={{
                        minHeight: 42,
                        padding: "0 14px",
                        borderRadius: 999,
                        border: "1px solid #E3E5E8",
                        background: "#FFFFFF",
                        color: "#3A3F46",
                        fontSize: 14,
                      }}
                    >
                      {g.label}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E3E5E8",
                borderRadius: 16,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                Connect two things
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <button
                  type="button"
                  onClick={connectGsc}
                  style={{
                    flex: "1 1 260px",
                    textAlign: "left",
                    minHeight: 64,
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: `1px solid ${status.gsc ? "#127A45" : "#C9CDD2"}`,
                    background: "#FFFFFF",
                    color: "#121417",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 600 }}>
                    Google Search Console{status.gsc ? " · connected" : ""}
                  </span>
                  <span style={{ fontSize: 13, color: "#5B616B" }}>So we can see what people search for</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWpOpen(true)}
                  style={{
                    flex: "1 1 260px",
                    textAlign: "left",
                    minHeight: 64,
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: `1px solid ${status.wordpress ? "#127A45" : "#C9CDD2"}`,
                    background: "#FFFFFF",
                    color: "#121417",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 600 }}>
                    WordPress{status.wordpress ? " · connected" : ""}
                  </span>
                  <span style={{ fontSize: 13, color: "#5B616B" }}>So approved changes can ship</span>
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  paddingTop: 6,
                }}
              >
                <span style={{ fontSize: 13, color: "#5B616B" }}>
                  Nothing goes live without your approval.{" "}
                  <Link href="/app/connections" style={{ color: "#127A45" }}>
                    Full connections
                  </Link>
                </span>
                <button
                  type="button"
                  disabled={finishing}
                  onClick={finish}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    minHeight: 46,
                    padding: "0 20px",
                    borderRadius: 11,
                    border: 0,
                    background: ACCENT,
                    color: "#121417",
                    fontSize: 15,
                    fontWeight: 600,
                    opacity: finishing ? 0.6 : 1,
                  }}
                >
                  {finishing ? "Saving…" : "See my first moves"}
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </div>

      {wpOpen ? (
        <ConnectDialog
          provider="wordpress"
          siteUrl={normalizeUrl(url)}
          onClose={() => setWpOpen(false)}
          onDone={async () => {
            setWpOpen(false);
            markConnection("wordpress", "Connected");
            await refreshStatus();
          }}
        />
      ) : null}
    </div>
  );
}
