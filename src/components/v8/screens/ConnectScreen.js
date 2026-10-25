"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteCmsConnection, disconnectGoogle, previewSiteScan, runSiteScan, startGoogleOAuth } from "@/lib/v1Api";
import ConnectDialog, { useConnectionStatus } from "@/components/board/ConnectDialog";
import { activeSiteContext } from "@/lib/siteContext";
import { addReadyWebsite, loadJourney, readySites, selectJourneySite, websiteLabel } from "@/lib/journey";
import { getBillingAccount } from "@/lib/billingApi";
import { SkeletonCards } from "@/components/v8/SkeletonWave";

const TONE = { red: "#FF5A4E", yellow: "#FFC53D", green: "#3DDC84", blue: "#4DA3FF" };
import "@/styles/v8-screens.css";

const BLUE = "#4DA3FF";

export default function ConnectScreen() {
  const router = useRouter();
  const [status, refreshStatus, plugsReady] = useConnectionStatus();
  const [wpDialog, setWpDialog] = useState(false);
  const [siteLimit, setSiteLimit] = useState(null);
  const [siteUrl, setSiteUrl] = useState("");
  const [siteNote, setSiteNote] = useState("");
  const [freeScan, setFreeScan] = useState(null);
  const [freeBusy, setFreeBusy] = useState(false);
  const [sitesTick, setSitesTick] = useState(0);
  const [state, setState] = useState({
    gsc: "off",
    wp: "off",
    ga: "off",
    shopify: "soon",
    webflow: "soon",
  });
  const [rows, setRows] = useState({ gsc: 0, wp: 0, ga: 0 });
  const { href: siteHref } = activeSiteContext();
  const savedSites = sitesTick >= 0 ? readySites(loadJourney()) : [];
  const activeId = loadJourney().activeId;

  useEffect(() => {
    getBillingAccount().then((res) => {
      if (res.ok && Number(res.data?.siteLimit) > 0) setSiteLimit(Number(res.data.siteLimit));
    });
    const onSite = () => setSitesTick((n) => n + 1);
    window.addEventListener("sf-site", onSite);
    return () => window.removeEventListener("sf-site", onSite);
  }, []);

  useEffect(() => {
    // Sync state from actual connection status — no fake counters.
    setState((prev) => ({
      ...prev,
      gsc: status.gsc ? "live" : prev.gsc === "connecting" ? "connecting" : "off",
      wp: status.wordpress ? "live" : prev.wp === "connecting" ? "connecting" : "off",
      ga: status.ga ? "live" : prev.ga === "connecting" ? "connecting" : "off",
    }));
    setRows({
      gsc: status.gsc ? Number(status.gscRows || status.gscCount || 0) : 0,
      wp: status.wordpress ? Number(status.wpPages || status.pageCount || 0) : 0,
      ga: status.ga ? Number(status.gaSessions || status.gaCount || 0) : 0,
    });
  }, [status]);

  const setStatus = useCallback((id, v) => {
    setState((prev) => ({ ...prev, [id]: v }));
  }, []);

  const handlePlug = useCallback(
    async (id) => {
      if (id === "wp") {
        setWpDialog(true);
        return;
      }
      setStatus(id, "connecting");
      if (id === "gsc" || id === "ga") {
        try {
          const res = await startGoogleOAuth(id === "gsc" ? "gsc" : "ga4");
          if (res.data?.url) {
            window.location.href = res.data.url;
            return;
          }
          setStatus(id, "off");
          await refreshStatus();
        } catch {
          setStatus(id, "off");
        }
        return;
      }
      setStatus(id, "off");
    },
    [setStatus, refreshStatus]
  );

  const handleUnplug = useCallback(
    async (id) => {
      if (id === "wp" && status.wordpressId) {
        await deleteCmsConnection(status.wordpressId).catch(() => {});
        await refreshStatus();
        return;
      }
      if (id === "gsc" || id === "ga") {
        await disconnectGoogle().catch(() => {});
        await refreshStatus();
        return;
      }
      setStatus(id, "off");
    },
    [setStatus, refreshStatus, status.wordpressId]
  );

  const defs = [
    {
      id: "gsc",
      name: "Google Search Console",
      tag: "REQUIRED · READ-ONLY",
      desc: "What people search, and whether they click you",
      unit: "search rows",
    },
    {
      id: "wp",
      name: "WordPress",
      tag: "REQUIRED · SEARCHIFY PLUGIN",
      desc: "Where approved changes ship, with undo",
      unit: "pages mapped",
    },
    {
      id: "ga",
      name: "Google Analytics 4",
      tag: "OPTIONAL · READ-ONLY",
      desc: "Which pages turn visitors into calls and leads",
      unit: "sessions",
    },
    {
      id: "shopify",
      name: "Shopify",
      tag: "COMING SOON",
      desc: "Online stores: product and collection pages",
      unit: "",
    },
    {
      id: "webflow",
      name: "Webflow",
      tag: "COMING SOON",
      desc: "Webflow sites: pages and CMS collections",
      unit: "",
    },
  ];

  const plugs = defs.map((d) => {
    const s = state[d.id];
    const live = s === "live";
    const conn = s === "connecting";
    const locked = s === "soon";
    const n = rows[d.id] || 0;
    return {
      ...d,
      tagColor: d.tag.indexOf("REQUIRED") === 0 ? "#3DDC84" : "#9AA1AB",
      tagBorder: d.tag.indexOf("REQUIRED") === 0 ? "rgba(61,220,132,.65)" : "#262A31",
      tagGlow:
        d.tag.indexOf("REQUIRED") === 0
          ? "0 0 14px rgba(61,220,132,.35), inset 0 0 8px rgba(61,220,132,.12)"
          : "none",
      tagDot: live ? "#3DDC84" : "#5B616B",
      tagDotGlow: live ? "0 0 8px #3DDC84" : "none",
      canPlug: s === "off",
      isConnecting: conn,
      isLive: live,
      isLocked: locked,
      shift: live || conn ? "30px" : "0px",
      cable: live ? BLUE : locked ? "#1A1D22" : "#3A404A",
      body: live ? BLUE : locked ? "#1A1D22" : "#5B616B",
      prong: live ? "#CFE6FF" : locked ? "#262A31" : "#8A9099",
      socket: live ? BLUE : "#262A31",
      led: live ? BLUE : conn ? "#FFC53D" : "#262A31",
      ledGlow: live ? "drop-shadow(0 0 6px #4DA3FF)" : "none",
      glow: live ? "drop-shadow(0 0 10px rgba(77,163,255,.75))" : "none",
      flowOp: live ? "0.9" : "0",
      srvOp: live ? "1" : "0",
      border: live ? "rgba(77,163,255,.45)" : "#1A1D22",
      statusColor: live ? BLUE : "#7D848E",
      statusText: live
        ? n > 0
          ? `● LIVE · ${n.toLocaleString("en-US")} ${d.unit} synced`
          : "● LIVE · connected"
        : conn
        ? "Handshaking…"
        : locked
        ? "Coming soon"
        : "Not connected yet",
      aria: d.name + (live ? " connected, data flowing" : " not connected"),
      plug: () => handlePlug(d.id),
      unplug: () => handleUnplug(d.id),
    };
  });

  const reqLive = (state.gsc === "live" ? 1 : 0) + (state.wp === "live" ? 1 : 0);
  const missing = state.gsc !== "live" ? "Search Console" : "WordPress";
  const ready = reqLive === 2;
  const counterColor = reqLive === 2 ? BLUE : "#9AA1AB";
  const { hostname: siteHost } = activeSiteContext();

  return (
    <div
      style={{
        flex: "999 1 560px",
        minWidth: 0,
        minHeight: "min(100%, 720px)",
        background: "#0A0B0D",
        color: "#F2F4F5",
        fontFamily: "Geist, 'Helvetica Neue', sans-serif",
        boxSizing: "border-box",
        padding: "22px clamp(16px, 3vw, 40px) 40px",
        display: "flex",
        flexDirection: "column",
        gap: "28px",
      }}
    >
      {wpDialog ? (
        <ConnectDialog
          provider="wordpress"
          siteUrl={status.wordpressUrl || siteHref || ""}
          onClose={() => {
            setWpDialog(false);
            setStatus("wp", status.wordpress ? "live" : "off");
          }}
          onDone={async () => {
            setWpDialog(false);
            await refreshStatus();
          }}
        />
      ) : null}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ fontWeight: 600, fontSize: "17px", letterSpacing: "-0.3px" }}>
            {status.wordpressUrl || siteHost || "Your site"}
          </div>
        </div>
        <span
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: "13px",
            color: counterColor,
          }}
        >
          {reqLive} of 2 required live
        </span>
      </header>

      <div
        style={{
          maxWidth: "1180px",
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
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
          Handle the plug-ins, we'll do the rest.
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: "17px",
            color: "#9AA1AB",
            lineHeight: 1.5,
            maxWidth: "620px",
          }}
        >
          The two green tags are required. A grey light means not connected yet; it turns green, and
          the cable glows blue, once data is flowing into Searchify.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!siteLimit) {
              setSiteNote("Checking your plan…");
              return;
            }
            const added = addReadyWebsite(siteUrl, siteLimit);
            if (!added.ok && added.error === "limit") {
              setSiteNote(`This plan includes ${added.limit} website${added.limit === 1 ? "" : "s"}. Open Plan and billing to raise it.`);
              return;
            }
            if (!added.ok) {
              setSiteNote(added.error || "That website could not be added.");
              return;
            }
            setSiteUrl("");
            setFreeScan(null);
            setFreeBusy(true);
            setSiteNote(
              added.switched
                ? `Scanning ${websiteLabel(added.site)} free. Nothing on the site changes.`
                : `${websiteLabel(added.site)} added. Scanning it free now.`,
            );
            const address = added.site?.answers?.site || "";
            previewSiteScan(address).then((res) => {
              setFreeBusy(false);
              if (res.ok && res.data?.scan) setFreeScan(res.data.scan);
              else setSiteNote(typeof res.data?.detail === "string" ? res.data.detail : "The free scan could not read that site.");
            });
            runSiteScan({ site: added.site, force: false }).catch(() => {});
            setSitesTick((n) => n + 1);
            refreshStatus();
          }}
          style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginTop: "8px" }}
        >
          <input
            value={siteUrl}
            onChange={(event) => setSiteUrl(event.target.value)}
            placeholder="Add a website, like client.com"
            aria-label="Website address"
            style={{
              minHeight: "46px",
              flex: "1 1 240px",
              maxWidth: "420px",
              borderRadius: "12px",
              border: "1px solid #1A1D22",
              background: "#101215",
              color: "#F2F4F5",
              padding: "0 14px",
              fontSize: "15px",
            }}
          />
          <button
            type="submit"
            style={{
              minHeight: "46px",
              padding: "0 16px",
              borderRadius: "12px",
              border: 0,
              background: "#4DA3FF",
              color: "#0A0B0D",
              fontWeight: 600,
            }}
          >
            {freeBusy ? "Scanning…" : "Scan it free"}
          </button>
          <span style={{ fontSize: "13px", color: "#9AA1AB" }}>
            {siteLimit ? `${savedSites.length} of ${siteLimit} websites on this plan` : "Checking your plan…"}
          </span>
        </form>
        {savedSites.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {savedSites.map((site) => {
              const on = String(site.id) === String(activeId);
              return (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => {
                    selectJourneySite(site.id);
                    setSiteNote(`${websiteLabel(site)} is selected. Scan, keywords, and backlinks use this site.`);
                    setSitesTick((n) => n + 1);
                    refreshStatus();
                  }}
                  style={{
                    minHeight: "36px",
                    padding: "0 12px",
                    borderRadius: "999px",
                    border: on ? "1px solid #4DA3FF" : "1px solid #1A1D22",
                    background: on ? "rgba(77,163,255,.16)" : "#101215",
                    color: "#F2F4F5",
                    fontSize: "13px",
                  }}
                >
                  {websiteLabel(site)}
                </button>
              );
            })}
          </div>
        )}
        {siteNote ? (
          <p style={{ margin: 0, fontSize: "14px", color: "#D7DADE" }}>
            {siteNote}{" "}
            {siteNote.includes("Plan and billing") ? (
              <Link href="/app/billing" style={{ color: "#4DA3FF" }}>
                Plan and billing
              </Link>
            ) : null}
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: "14px", color: "#9AA1AB" }}>
            Pick a website here, or from All client sites. Scan it free reads a few live pages. Nothing on the site changes.
          </p>
        )}
        {freeBusy ? <SkeletonCards count={1} lines={3} /> : null}
        {freeScan ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 14, color: "#F2F4F5" }}>
              {freeScan.host} · {freeScan.pagesRead} pages · {freeScan.counts?.red || 0} dire · {freeScan.counts?.yellow || 0} medium · {freeScan.counts?.green || 0} in place
            </span>
            {(freeScan.findings || []).slice(0, 4).map((item) => (
              <span key={`${item.path}-${item.label}`} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 14, color: "#D7DADE" }}>
                <i style={{ width: 8, height: 8, marginTop: 6, borderRadius: "50%", background: TONE[item.color] || TONE.yellow, flex: "none" }} />
                {item.label} · {item.path}
              </span>
            ))}
            <Link href="/app/results" style={{ color: "#4DA3FF", fontSize: 14 }}>
              Open the full site scan
            </Link>
          </div>
        ) : null}
      </div>

      <div
        style={{
          maxWidth: "1180px",
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {plugsReady ? plugs.map((p) => (
          <div
            key={p.id}
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "20px",
              padding: "20px 24px",
              borderRadius: "22px",
              background: "#101215",
              border: `1px solid ${p.border}`,
              transition: "border-color .4s ease",
            }}
          >
            <div
              style={{
                flex: "1 1 240px",
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "18px", fontWeight: 600 }}>{p.name}</span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: "11px",
                    color: p.tagColor,
                    padding: "3px 9px",
                    borderRadius: "7px",
                    border: `1px solid ${p.tagBorder}`,
                    boxShadow: p.tagGlow,
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: p.tagDot,
                      boxShadow: p.tagDotGlow,
                    }}
                    aria-hidden="true"
                  ></span>
                  {p.tag}
                </span>
              </div>
              <span style={{ fontSize: "14px", color: "#9AA1AB" }}>{p.desc}</span>
              <span
                style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: "12px",
                  color: p.statusColor,
                  marginTop: "4px",
                }}
              >
                {p.statusText}
              </span>
            </div>

            <svg
              viewBox="0 0 600 100"
              role="img"
              aria-label={p.aria}
              style={{
                flex: "2 1 340px",
                minWidth: 0,
                height: "auto",
                maxHeight: "110px",
                overflow: "visible",
              }}
            >
              <g
                style={{
                  transform: `translateX(${p.shift})`,
                  transition: "transform .5s cubic-bezier(.3,1.4,.5,1)",
                  filter: p.glow,
                }}
              >
                <g
                  style={{
                    opacity: p.srvOp,
                    transition: "opacity .5s ease",
                    filter: "drop-shadow(0 0 8px rgba(61,220,132,.55))",
                  }}
                >
                  <rect
                    x="0"
                    y="20"
                    width="44"
                    height="60"
                    rx="7"
                    fill="#0E1A13"
                    stroke="#3DDC84"
                    strokeWidth="2"
                  ></rect>
                  <rect
                    x="6"
                    y="28"
                    width="32"
                    height="12"
                    rx="3"
                    fill="#13261A"
                    stroke="#2A7A4C"
                    strokeWidth="1"
                  ></rect>
                  <rect
                    x="6"
                    y="44"
                    width="32"
                    height="12"
                    rx="3"
                    fill="#13261A"
                    stroke="#2A7A4C"
                    strokeWidth="1"
                  ></rect>
                  <rect
                    x="6"
                    y="60"
                    width="32"
                    height="12"
                    rx="3"
                    fill="#13261A"
                    stroke="#2A7A4C"
                    strokeWidth="1"
                  ></rect>
                  <circle
                    cx="32"
                    cy="34"
                    r="2.2"
                    fill="#3DDC84"
                    style={{ animation: "sfy-breathe 1.2s ease-in-out infinite" }}
                  ></circle>
                  <circle
                    cx="32"
                    cy="50"
                    r="2.2"
                    fill="#3DDC84"
                    style={{ animation: "sfy-breathe 1.6s ease-in-out infinite" }}
                  ></circle>
                  <circle
                    cx="32"
                    cy="66"
                    r="2.2"
                    fill="#3DDC84"
                    style={{ animation: "sfy-breathe 0.9s ease-in-out infinite" }}
                  ></circle>
                  <rect x="11" y="32" width="14" height="2" rx="1" fill="#2A7A4C"></rect>
                  <rect x="11" y="48" width="14" height="2" rx="1" fill="#2A7A4C"></rect>
                  <rect x="11" y="64" width="14" height="2" rx="1" fill="#2A7A4C"></rect>
                </g>
                <path
                  d="M44 50 C 120 50, 150 18, 250 40 S 360 76, 422 50"
                  fill="none"
                  stroke={p.cable}
                  strokeWidth="7"
                  strokeLinecap="round"
                  style={{ transition: "stroke .4s ease" }}
                ></path>
                <path
                  d="M44 50 C 120 50, 150 18, 250 40 S 360 76, 422 50"
                  fill="none"
                  stroke="#CFE6FF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="3 16"
                  style={{
                    opacity: p.flowOp,
                    animation: "sfy-flow .7s linear infinite",
                    transition: "opacity .4s ease",
                  }}
                ></path>
                <rect
                  x="418"
                  y="30"
                  width="58"
                  height="40"
                  rx="9"
                  fill={p.body}
                  style={{ transition: "fill .4s ease" }}
                ></rect>
                <rect x="430" y="38" width="3" height="24" rx="1.5" fill="#0A0B0D" opacity=".35"></rect>
                <rect x="438" y="38" width="3" height="24" rx="1.5" fill="#0A0B0D" opacity=".35"></rect>
                <rect x="476" y="38" width="24" height="6" rx="2" fill={p.prong}></rect>
                <rect x="476" y="56" width="24" height="6" rx="2" fill={p.prong}></rect>
              </g>
              <rect
                x="506"
                y="18"
                width="80"
                height="64"
                rx="14"
                fill="#131519"
                stroke={p.socket}
                strokeWidth="2"
                style={{ transition: "stroke .4s ease" }}
              ></rect>
              <rect x="506" y="37" width="16" height="8" rx="2" fill="#0A0B0D"></rect>
              <rect x="506" y="55" width="16" height="8" rx="2" fill="#0A0B0D"></rect>
              <circle
                cx="564"
                cy="50"
                r="6"
                fill={p.led}
                style={{ filter: p.ledGlow, transition: "fill .3s ease" }}
              ></circle>
            </svg>

            <div style={{ flex: "0 0 132px", display: "flex", justifyContent: "flex-end" }}>
              {p.canPlug && (
                <button
                  type="button"
                  onClick={p.plug}
                  style={{
                    minHeight: "50px",
                    width: "132px",
                    borderRadius: "14px",
                    border: 0,
                    background: "#4DA3FF",
                    color: "#0A0B0D",
                    fontSize: "15px",
                    fontWeight: 600,
                    boxShadow: "0 0 22px rgba(77,163,255,.4)",
                  }}
                >
                  Plug in
                </button>
              )}
              {p.isConnecting && (
                <span
                  style={{
                    minHeight: "50px",
                    width: "132px",
                    borderRadius: "14px",
                    border: "1px solid #262A31",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "14px",
                    color: "#9AA1AB",
                    animation: "sfy-breathe 1s ease-in-out infinite",
                  }}
                >
                  Connecting…
                </span>
              )}
              {p.isLive && (
                <button
                  type="button"
                  onClick={p.unplug}
                  style={{
                    minHeight: "50px",
                    width: "132px",
                    borderRadius: "14px",
                    border: "1px solid #262A31",
                    background: "transparent",
                    color: "#9AA1AB",
                    fontSize: "14px",
                  }}
                >
                  Unplug
                </button>
              )}
              {p.isLocked && (
                <span
                  style={{
                    minHeight: "50px",
                    width: "132px",
                    boxSizing: "border-box",
                    borderRadius: "14px",
                    border: "1px dashed #262A31",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "13px",
                    color: "#9AA1AB",
                    textAlign: "center",
                  }}
                >
                  Coming soon
                </span>
              )}
            </div>
          </div>
        )) : (
          <SkeletonCards count={5} lines={2} />
        )}
      </div>

      <div
        style={{
          maxWidth: "1180px",
          width: "100%",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        {ready ? (
          <button
            type="button"
            onClick={() => router.push("/app/results")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: "58px",
              padding: "0 28px",
              borderRadius: "14px",
              background: "#4DA3FF",
              border: 0,
              color: "#0A0B0D",
              fontSize: "16px",
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 0 24px rgba(77,163,255,.45)",
            }}
          >
            See what it's costing you
          </button>
        ) : (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: "58px",
              padding: "0 28px",
              borderRadius: "14px",
              background: "#1A1D22",
              color: "#9AA1AB",
              fontSize: "16px",
            }}
          >
            Plug in {missing} to continue
          </span>
        )}
        <span
          style={{
            fontSize: "13px",
            color: "#7D848E",
            lineHeight: 1.5,
            maxWidth: "620px",
          }}
        >
          Search Console and Analytics are read-only. WordPress changes only ship after you approve
          them. Results from your changes are pooled anonymously with other sites so Searchify's
          predictions get sharper for everyone — no one else ever sees your site or your data.
        </span>
      </div>
    </div>
  );
}
