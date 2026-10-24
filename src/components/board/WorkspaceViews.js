"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query";
import ConnectDialog, { useConnectionStatus } from "@/components/board/ConnectDialog";
import Paginator, { usePagination } from "@/components/board/Paginator";
import "@/styles/v8-app.css";
import PropertyPicker from "@/components/board/PropertyPicker";
import { buildAuditFindings, weekMovement } from "@/lib/auditFindings";
import { breadthKey, BREADTH_LABELS, loadGuardrails, saveGuardrails } from "@/lib/guardrails";
import SiteDrafts from "@/components/board/SiteDrafts";
import { useBusinessBrief, useWorkspaceSite } from "@/components/board/useBusinessBrief";
import useTargetMarket from "@/lib/useTargetMarket";
import { AI_VISIBILITY_ENGINES } from "@/lib/aiEngines";
import { starterKeywords, starterPrompts } from "@/lib/businessBrief";
import { PLANS, activeJourneySite, assignGoogleAccount, beginAnotherWebsite, choosePlan, loadJourney, markConnection, planById, readySites, removeJourneySite, syncJourneyNow, websiteLabel } from "@/lib/journey";
import { completionEntries, recordActivity } from "@/lib/previewQueue";
import {
  createChange,
  prepareWeightFix,
  deleteCmsConnection,
  disconnectGoogle,
  errorCode,
  errorText,
  generateMetaCopy,
  getGoogleStatus,
  listChanges,
  listCmsConnections,
  loadFeature,
  removeGoogleAccount,
  researchStatus,
  researchVisibility,
  startGoogleOAuth,
  useGoogleAccount,
} from "@/lib/v1Api";
import {
  researchApi,
  rtkErrorCode,
  rtkErrorText,
  useAuditQuery,
  useBacklinksQuery,
  useKeywordsQuery,
  useRefreshAuditMutation,
  useRefreshBacklinksMutation,
  useRefreshKeywordsMutation,
  useUsageQuery,
} from "@/store/researchApi";

function providerNote(res, fallback) {
  return errorText(res, fallback);
}

const UPGRADE_HINT = " A larger plan raises the monthly limit.";

function quotaText(error, fallback) {
  const text = rtkErrorText(error, fallback);
  return rtkErrorCode(error) === "quota_exceeded" ? text + UPGRADE_HINT : text;
}

function ProviderStatus() {
  const [note, setNote] = useState("");
  useEffect(() => {
    let alive = true;
    researchStatus()
      .then((res) => {
        if (!alive || !res.ok) return;
        const data = res.data || {};
        if (data.code === "provider_balance" || data.ready === false) {
          setNote(data.message || "Live research is paused until Searchify SEO credit is topped up.");
        } else if (data.code === "provider_balance_low") {
          setNote(data.message || "");
        } else {
          setNote("");
        }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  if (!note) return null;
  return <p className="w-inset" role="status">{note}</p>;
}

function PlanUsage({ feature }) {
  const { data } = useUsageQuery();
  const item = data?.features?.[feature];
  return (
    <>
      <ProviderStatus />
      {!item ? null : item.limit == null ? (
        <p className="w-footnote plan-usage">{`${item.label}: no monthly limit on this account (${item.used} used this month).`}</p>
      ) : (
        <p className={`w-footnote plan-usage${item.left === 0 ? " out" : ""}`}>
          {`${item.label} this month: ${item.used} of ${item.limit} used on the ${data.planLabel} plan. Resets ${data.resetsOn}. Results reused from the cache are free.`}
          {item.left === 0 ? <> <Link href="/app/plans">See plans</Link></> : null}
        </p>
      )}
    </>
  );
}

function placeLabel(data) {
  if (!data) return "";
  const city = data.place?.city ? `${data.place.city}, ` : "";
  return `${city}${data.location}${data.language ? ` · ${data.language}` : ""}`;
}

function fetchedLabel(stamp) {
  if (!stamp) return "";
  const date = new Date(`${stamp}Z`);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

const STORE = "sf_research_v1";

function readStore() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE) || "");
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

function writeStore(next) {
  localStorage.setItem(STORE, JSON.stringify(next));
}

function rowsFor(field, siteKey) {
  const store = readStore();
  const bagName = `${field}BySite`;
  if (!store[bagName]) {
    store[bagName] = { [siteKey || "workspace"]: Array.isArray(store[field]) ? store[field] : [] };
    store[field] = [];
    writeStore(store);
  }
  return Array.isArray(store[bagName][siteKey]) ? store[bagName][siteKey] : [];
}

function saveRows(field, siteKey, rows) {
  const store = readStore();
  const bagName = `${field}BySite`;
  store[bagName] = { ...(store[bagName] || {}), [siteKey || "workspace"]: rows };
  writeStore(store);
}

function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    if (node && !node.open) node.showModal();
    return () => { if (node?.open) node.close(); };
  }, []);
  return (
    <dialog className="workspace-dialog" ref={ref} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <button className="dialog-close" type="button" onClick={onClose} aria-label="Close dialog">×</button>
      <h2>{title}</h2>
      {children}
    </dialog>
  );
}

function LiveEvidence({ gsc, ga }) {
  const [bits, setBits] = useState([]);
  useEffect(() => {
    if (!gsc && !ga) return undefined;
    let cancel = false;
    Promise.all([
      gsc ? loadFeature("organic-search", { force: true }) : Promise.resolve(null),
      ga ? loadFeature("traffic-analytics", { force: true }) : Promise.resolve(null),
    ]).then(([search, traffic]) => {
      if (cancel) return;
      const next = [];
      const searchKpis = search?.data?.payload?.kpis || [];
      const trafficKpis = traffic?.data?.payload?.kpis || [];
      searchKpis.slice(0, 4).forEach((row) => next.push({ label: row[0], value: row[1], note: "Search Console" }));
      trafficKpis.slice(0, 4).forEach((row) => next.push({ label: row[0], value: row[1], note: "Analytics" }));
      setBits(next);
    }).catch(() => {});
    return () => { cancel = true; };
  }, [gsc, ga]);
  if (!bits.length) return null;
  return (
    <div className="w-metrics below">
      {bits.map((item) => <Metric key={`${item.note}-${item.label}`} label={item.label} value={item.value} note={item.note} />)}
    </div>
  );
}

function Head({ eyebrow, title, text, action }) {
  return (
    <header className="w-head">
      <div>
        <div className="dash-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {action || null}
    </header>
  );
}

function Metric({ label, value, note }) {
  return (
    <div className="w-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function rowsOf(payload) {
  const data = payload?.payload || payload || {};
  return data.rows || data.items || [];
}

export function ApprovalsView() {
  const { brief, site } = useWorkspaceSite();
  return (
    <section className="dash-view" id="view-approvals">
      <div className="subview-head">
        <div className="dash-eyebrow">YOUR NEXT DECISIONS</div>
        <h1>Needs human approval.</h1>
        <p>{brief.ready ? `These drafts follow ${brief.focus || brief.hostname || "your setup"}. Every live website change stays paused until you approve it.` : "Every live website change stays paused until you approve it."}</p>
      </div>
      <div id="approval-queue-home">
        <SiteDrafts site={site} brief={brief} showScanDetails />
      </div>
    </section>
  );
}

const PROPERTY_LABEL = {
  connected: ["good", "Connected · verified"],
  unverified: ["warn", "Selected · not verified"],
  not_selected: ["", "No property chosen"],
  reauth_required: ["danger", "Google sign-in expired"],
};

function connectorPill(id, on, status) {
  if (id === "wordpress") return [on ? "good" : "", on ? "Connected" : "Not connected"];
  if (status.googleAccount === "disconnected") return ["", "Not connected"];
  return PROPERTY_LABEL[id === "gsc" ? status.gscStatus : status.gaStatus] || ["", "Not connected"];
}

export function ConnectionsView() {
  const params = useSearchParams();
  const [status, refresh] = useConnectionStatus();
  const { brief } = useWorkspaceSite();
  const [dialog, setDialog] = useState(params.get("panel") || "");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (params.get("google") === "connected") {
      setMessage("Google signed in. Choose the Search Console property and the Analytics property, then save and sync.");
      refresh();
    } else if (params.get("google") === "error") {
      setMessage(params.get("detail") || "Google connect did not finish.");
    }
  }, [params, refresh]);

  const disconnectWp = async () => {
    if (!status.wordpressId) return;
    await deleteCmsConnection(status.wordpressId);
    markConnection("wordpress", "Connect later");
    refresh();
  };

  const disconnectG = async () => {
    await disconnectGoogle();
    markConnection("gsc", "Connect later");
    markConnection("ga", "Connect later");
    refresh();
  };

  // Connection definitions with V8 states
  const connections = [
    {
      id: "gsc",
      name: "Google Search Console",
      tag: "REQUIRED · READ-ONLY",
      desc: "What people search, and whether they click you",
      required: true,
      connected: status.gsc,
      connecting: false,
      locked: false,
    },
    {
      id: "wordpress",
      name: "WordPress",
      tag: "REQUIRED · SEARCHIFY PLUGIN",
      desc: "Where approved changes ship, with undo",
      required: true,
      connected: status.wordpress,
      connecting: false,
      locked: false,
    },
    {
      id: "ga",
      name: "Google Analytics 4",
      tag: "OPTIONAL · READ-ONLY",
      desc: "Which pages turn visitors into calls and leads",
      required: false,
      connected: status.ga,
      connecting: false,
      locked: false,
    },
  ];

  const requiredLive = connections.filter(c => c.required && c.connected).length;
  const requiredTotal = connections.filter(c => c.required).length;
  const allReady = requiredLive === requiredTotal;

  return (
    <>
      <section className="v8-connections-view v8-animated">
        <header className="v8-connections-header">
          <div className="v8-site-title">{brief.hostname || brief.siteUrl || "your site"}</div>
          <span className={`v8-counter ${allReady ? "v8-ready" : ""}`}>
            {requiredLive} of {requiredTotal} required live
          </span>
        </header>

        <div className="v8-connections-content">
          <h1 className="v8-headline">Handle the plug-ins, we'll do the rest.</h1>
          <p className="v8-subhead">
            The two green tags are required. A grey light means not connected yet; it turns green, and the cable glows blue, once data is flowing into Searchify.
          </p>
        </div>

        {message ? <p className="w-inset">{message}</p> : null}

        <div className="v8-connections-content v8-plug-list">
          {connections.map((conn) => (
            <article 
              key={conn.id} 
              className={`v8-plug-card ${conn.connected ? "v8-live" : ""}`}
            >
              <div className="v8-plug-info">
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "8px" }}>
                  <span className="v8-plug-name">{conn.name}</span>
                  <span className={`v8-plug-tag ${conn.required ? "v8-required" : ""}`}>
                    <span className={`v8-plug-tag-dot ${conn.connected ? "v8-live" : ""}`} aria-hidden="true" />
                    {conn.tag}
                  </span>
                </div>
                <span className="v8-plug-desc">{conn.desc}</span>
                <span className={`v8-plug-status ${conn.connected ? "v8-live" : ""}`}>
                  {conn.connected
                    ? `● LIVE · ${
                        conn.id === "wordpress" ? status.wordpressUrl || "connected"
                        : conn.id === "gsc" ? status.google?.gscSiteUrl || "connected"
                        : conn.id === "ga" ? (status.google?.ga4PropertyName || status.google?.ga4PropertyId || "connected")
                        : "connected"
                      }`
                    : conn.locked
                    ? "Coming soon"
                    : "Not connected yet"
                  }
                </span>
              </div>

              <svg 
                viewBox="0 0 600 100" 
                role="img" 
                aria-label={`${conn.name} ${conn.connected ? "connected, data flowing" : "not connected"}`}
                className="v8-plug-visual"
                style={{ overflow: "visible" }}
              >
                <g style={{ 
                  transform: conn.connected ? "translateX(30px)" : "translateX(0px)",
                  transition: "transform 0.5s cubic-bezier(0.3, 1.4, 0.5, 1)",
                  filter: conn.connected ? "drop-shadow(0 0 10px rgba(77, 163, 255, 0.75))" : "none"
                }}>
                  <g style={{ 
                    opacity: conn.connected ? 1 : 0,
                    transition: "opacity 0.5s ease",
                    filter: "drop-shadow(0 0 8px rgba(61, 220, 132, 0.55))"
                  }}>
                    <rect x="0" y="20" width="44" height="60" rx="7" fill="#0E1A13" stroke="#3DDC84" strokeWidth="2" />
                    <rect x="6" y="28" width="32" height="12" rx="3" fill="#13261A" stroke="#2A7A4C" strokeWidth="1" />
                    <rect x="6" y="44" width="32" height="12" rx="3" fill="#13261A" stroke="#2A7A4C" strokeWidth="1" />
                    <rect x="6" y="60" width="32" height="12" rx="3" fill="#13261A" stroke="#2A7A4C" strokeWidth="1" />
                    <circle cx="32" cy="34" r="2.2" fill="#3DDC84" style={{ animation: "v8-breathe 1.2s ease-in-out infinite" }} />
                    <circle cx="32" cy="50" r="2.2" fill="#3DDC84" style={{ animation: "v8-breathe 1.6s ease-in-out infinite" }} />
                    <circle cx="32" cy="66" r="2.2" fill="#3DDC84" style={{ animation: "v8-breathe 0.9s ease-in-out infinite" }} />
                    <rect x="11" y="32" width="14" height="2" rx="1" fill="#2A7A4C" />
                    <rect x="11" y="48" width="14" height="2" rx="1" fill="#2A7A4C" />
                    <rect x="11" y="64" width="14" height="2" rx="1" fill="#2A7A4C" />
                  </g>
                  <path 
                    d="M44 50 C 120 50, 150 18, 250 40 S 360 76, 422 50" 
                    fill="none" 
                    stroke={conn.connected ? "#4DA3FF" : conn.locked ? "#1A1D22" : "#3A404A"} 
                    strokeWidth="7" 
                    strokeLinecap="round"
                    style={{ transition: "stroke 0.4s ease" }}
                  />
                  <path 
                    d="M44 50 C 120 50, 150 18, 250 40 S 360 76, 422 50" 
                    fill="none" 
                    stroke="#CFE6FF" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeDasharray="3 16"
                    style={{ 
                      opacity: conn.connected ? 0.9 : 0,
                      animation: "v8-flow 0.7s linear infinite",
                      transition: "opacity 0.4s ease"
                    }}
                  />
                  <rect 
                    x="418" y="30" width="58" height="40" rx="9" 
                    fill={conn.connected ? "#4DA3FF" : conn.locked ? "#1A1D22" : "#5B616B"}
                    style={{ transition: "fill 0.4s ease" }}
                  />
                  <rect x="430" y="38" width="3" height="24" rx="1.5" fill="#0A0B0D" opacity="0.35" />
                  <rect x="438" y="38" width="3" height="24" rx="1.5" fill="#0A0B0D" opacity="0.35" />
                  <rect 
                    x="476" y="38" width="24" height="6" rx="2" 
                    fill={conn.connected ? "#CFE6FF" : conn.locked ? "#262A31" : "#8A9099"}
                  />
                  <rect 
                    x="476" y="56" width="24" height="6" rx="2" 
                    fill={conn.connected ? "#CFE6FF" : conn.locked ? "#262A31" : "#8A9099"}
                  />
                </g>
                <rect 
                  x="506" y="18" width="80" height="64" rx="14" 
                  fill="#131519" 
                  stroke={conn.connected ? "#4DA3FF" : "#262A31"} 
                  strokeWidth="2"
                  style={{ transition: "stroke 0.4s ease" }}
                />
                <rect x="506" y="37" width="16" height="8" rx="2" fill="#0A0B0D" />
                <rect x="506" y="55" width="16" height="8" rx="2" fill="#0A0B0D" />
                <circle 
                  cx="564" cy="50" r="6" 
                  fill={conn.connected ? "#4DA3FF" : conn.connecting ? "#FFC53D" : "#262A31"}
                  style={{ 
                    filter: conn.connected ? "drop-shadow(0 0 6px #4DA3FF)" : "none",
                    transition: "fill 0.3s ease"
                  }}
                />
              </svg>

              <div className="v8-plug-actions">
                {!conn.connected && !conn.connecting && !conn.locked && (
                  <button 
                    className="v8-button-primary" 
                    type="button" 
                    onClick={() => setDialog(conn.id)}
                  >
                    Plug in
                  </button>
                )}
                {conn.connecting && (
                  <span className="v8-connecting-state">Connecting…</span>
                )}
                {conn.connected && (
                  <button 
                    className="v8-button-secondary" 
                    type="button" 
                    onClick={() => setDialog(conn.id)}
                  >
                    Unplug
                  </button>
                )}
                {conn.locked && (
                  <span className="v8-locked-state">Coming soon</span>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="v8-connections-content v8-footer-actions">
          {allReady ? (
            <Link href="/app/results" className="v8-cta-ready">
              See what it's costing you
            </Link>
          ) : (
            <span className="v8-cta-waiting">
              Plug in {connections.find(c => c.required && !c.connected)?.name || "required connections"} to continue
            </span>
          )}
          <span className="v8-footnote">
            Search Console and Analytics are read-only. WordPress changes only ship after you approve them. 
            Results from your changes are pooled anonymously with other sites so Searchify's predictions get 
            sharper for everyone — no one else ever sees your site or your data.
          </span>
        </div>

        {status.google?.connected || status.googleAccount === "reauth_required" || params.get("google") === "connected" ? (
          <div className="v8-connections-content">
            <PropertyPicker
              google={status.google}
              cmsConnectionId={status.wordpressId}
              siteLabel={status.wordpressUrl || brief.siteUrl}
              onSaved={(connection) => {
                if (connection?.gscSiteUrl) markConnection("gsc", "Connected");
                if (connection?.ga4PropertyId) markConnection("ga", "Connected");
                refresh();
              }}
            />
          </div>
        ) : null}

        <LiveEvidence gsc={status.gsc} ga={status.ga} />

        {dialog ? (
          <ConnectDialog
            provider={dialog === "google" ? "gsc" : dialog}
            siteUrl={status.wordpressUrl}
            onClose={() => setDialog("")}
            onDone={(value) => {
              setDialog("");
              if (value === "signed-in") setMessage("Google is signed in. Choose the Search Console property and the Analytics property below, then save and sync.");
              if (value === "Connected") setMessage("WordPress verified. Approved titles and descriptions can publish to this site.");
              refresh();
            }}
          />
        ) : null}
      </section>
    </>
  );
}

function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function keywordChange(item) {
  if (!item.rank || item.previous == null) return null;
  return item.previous - item.rank;
}

function volumeLabel(value) {
  return value == null ? "—" : Number(value).toLocaleString("en-US");
}

function ConceptPanel({ title, note, rows, action }) {
  if (!rows?.length && !note) return null;
  return (
    <div className="w-panel below">
      <div className="w-toolbar">
        <strong>{title}</strong>
        {rows?.length && note ? <span className="w-muted">{note}</span> : null}
      </div>
      {rows?.length ? (
        <div className="table-scroll">
          <table className="w-table">
            <thead>
              <tr>
                <th>Suggestion</th>
                <th>Why it belongs</th>
                {action ? <th>Action</th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.title}-${row.concept || ""}`}>
                  <td data-label="Suggestion"><strong>{row.title}</strong>{row.concept ? <small>{row.concept}</small> : null}</td>
                  <td data-label="Why">{row.why}</td>
                  {action ? <td data-label="">{action(row)}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="w-inset">{note}</p>}
    </div>
  );
}

function visibilityReading(item, offer) {
  if (item?.reading) return { reading: item.reading, next: item.next || "" };
  if (!item?.live || item.mention == null || (item.status === "error" && !item.stale)) return { reading: "", next: "" };
  const concept = item.concept || offer || "this question";
  const other = item.sources?.[0]?.title || item.sources?.[0]?.url || "";
  if (item.mention && item.citation) {
    return { reading: "The answer names the business and links to the site.", next: "Keep the page that was cited. A later check shows whether that mention stays." };
  }
  if (item.mention) {
    return { reading: "The answer names the business, without a link to the site.", next: `The page about ${concept} needs a title and description that match this question, so the answer has a page to cite.` };
  }
  return {
    reading: other ? `The answer does not name the business. It points at ${other}.` : "The answer does not name the business.",
    next: `This question is about ${concept}. The matching page should say that in the title and the opening paragraph.`,
  };
}

function exportKeywords(rows) {
  const lines = [["Keyword", "Position", "Change", "Monthly volume", "Target page", "Country", "Device"], ...rows.map((item) => {
    const change = keywordChange(item);
    return [item.term, item.rank ?? "", change == null ? "" : change, item.volume ?? "", item.page || "", item.country, item.device];
  })];
  const csv = lines.map((cols) => cols.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "keywords.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function KeywordsView() {
  const router = useRouter();
  const { brief, key } = useWorkspaceSite("keywords");
  const briefKey = [key, brief.ready, brief.businessType, brief.market, brief.reach, brief.goal].join("|");
  const [keywords, setKeywords] = useState([]);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState(null);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ term: "", country: brief.market || "", device: "Mobile", page: "" });
  const dispatch = useDispatch();
  const { data: usage } = useUsageQuery();
  const [planId, setPlanId] = useState(null);
  const [liveKey, setLiveKey] = useState(null);
  const { country: marketCountry, label: marketLabel, market, ready: marketReady } = useTargetMarket();
  // Prefer the country name for older APIs; ISO codes also resolve on current backends.
  const researchCountry = market?.countryName || marketLabel || marketCountry || brief.market || "";
  const liveArgs = liveKey && liveKey.briefKey === briefKey && brief.siteUrl && researchCountry
    ? { site: brief.siteUrl, terms: liveKey.terms, country: researchCountry, reach: brief.reach || "" }
    : null;
  const liveQuery = useKeywordsQuery(liveArgs ?? skipToken);
  const [refreshKeywords, refreshState] = useRefreshKeywordsMutation();
  const live = liveQuery.currentData || null;
  const liveBusy = liveQuery.isFetching || refreshState.isLoading;
  const liveError = refreshState.error || liveQuery.error;
  const liveNote = brief.siteUrl && !researchCountry
    ? "Choose a target country in the Region menu next to the website. Keyword data needs that market before it loads."
    : liveError ? quotaText(liveError, "Live keyword data could not be loaded.") : "";
  const allowance = usage ? usage.trackedKeywords ?? Infinity : planById(planId)?.keywords || 10;
  const allowanceNote = Number.isFinite(allowance) ? `${allowance} included in the ${usage?.planLabel || "selected"} plan` : "No limit on this account";

  const applyLive = (rows, data) => {
    if (!data) return rows;
    const byTerm = new Map((data.tracked || []).map((row) => [row.keyword.toLowerCase(), row]));
    return rows.map((row) => {
      const hit = byTerm.get(row.term.toLowerCase());
      if (!hit) return row;
      return {
        ...row,
        rank: asNumber(hit.position),
        previous: asNumber(hit.previous),
        volume: asNumber(hit.volume),
        difficulty: asNumber(hit.difficulty),
        intent: hit.intent || "",
        page: row.page || hit.page || "",
        country: data.location || row.country,
        source: hit.source || "",
        live: true,
      };
    });
  };

  const refreshLive = async () => {
    if (!liveArgs) return;
    const args = { ...liveArgs, terms: keywords.map((row) => row.term) };
    try {
      const data = await refreshKeywords(args).unwrap();
      await dispatch(researchApi.util.upsertQueryData("keywords", args, data));
      setLiveKey({ briefKey, terms: args.terms });
    } catch {
      /* shown through refreshState.error */
    }
  };

  useEffect(() => {
    if (!key) return;
    setPlanId(loadJourney().planId);
    refreshState.reset();
    const saved = rowsFor("keywords", key).map((row) => ({
      id: row.id || Date.now(),
      term: row.term || "",
      rank: asNumber(row.rank),
      previous: asNumber(row.previous),
      volume: asNumber(row.volume),
      page: row.page || "",
      country: row.country || "",
      device: row.device || "Mobile",
      sample: false,
    })).filter((row) => row.term);
    const rows = [...starterKeywords(brief), ...saved];
    setKeywords(rows);
    setLiveKey({ briefKey, terms: rows.map((row) => row.term) });
  }, [briefKey]);

  useEffect(() => {
    if (live) setKeywords((current) => applyLive(current, live));
  }, [live]);

  const trackIdea = (idea) => {
    if (keywords.some((item) => item.term.toLowerCase() === idea.keyword.toLowerCase())) return;
    if (keywords.length >= allowance) {
      setNotice("Keyword limit reached. Review subscription options.");
      return;
    }
    const next = [...keywords, {
      id: Date.now(),
      term: idea.keyword,
      country: live?.location || "",
      device: "Mobile",
      page: idea.page || "",
      rank: asNumber(idea.position),
      previous: asNumber(idea.previous),
      volume: asNumber(idea.volume),
      difficulty: asNumber(idea.difficulty),
      intent: idea.intent || "",
      sample: false,
      live: true,
    }];
    setKeywords(next);
    persistExtras(next);
    recordActivity({ title: "Keyword added", detail: `${idea.keyword} · from live ideas`, siteKey: key });
  };

  const persistExtras = (next) => {
    saveRows("keywords", key, next.filter((item) => !item.sample));
  };

  const shown = keywords.filter((item) => item.term.toLowerCase().includes(query.trim().toLowerCase()));
  const trackedPager = usePagination("keywords-tracked", shown, `${briefKey}|${query}`);
  const rankedPager = usePagination("keywords-ranked", live?.ranked, briefKey);
  const ideasPager = usePagination("keywords-ideas", live?.ideas, briefKey);
  const topTen = keywords.filter((item) => item.rank && item.rank <= 10).length;
  const improving = keywords.filter((item) => item.rank && item.previous != null && item.rank < item.previous).length;

  const add = (event) => {
    event.preventDefault();
    const term = form.term.trim();
    if (!term) return;
    if (keywords.length >= allowance) {
      setAdding(false);
      setNotice("Keyword limit reached. Review subscription options.");
      router.push("/app/plans");
      return;
    }
    if (keywords.some((item) => item.term.toLowerCase() === term.toLowerCase() && item.country === form.country && item.device === form.device)) {
      setNotice("This keyword, country, and device are already tracked.");
      return;
    }
    const next = [...keywords, { id: Date.now(), term, country: form.country, device: form.device, page: form.page.trim(), rank: null, previous: null, volume: null, sample: false }];
    setKeywords(next);
    persistExtras(next);
    recordActivity({ title: "Keyword added", detail: `${term} · ${form.country} · ${form.device}`, siteKey: key });
    setAdding(false);
    setNotice("");
    setForm({ term: "", country: brief.market || "", device: "Mobile", page: "" });
  };

  const removeKeyword = (id) => {
    const next = keywords.filter((item) => item.id !== id);
    setKeywords(next);
    persistExtras(next);
    setOpen(null);
  };

  return (
    <section className="dash-view extension-view" style={{ background: "#0A0B0D", color: "#F2F4F5" }}>
      <header className="keywords-v8-header">
        <div>
          <span className="keywords-v8-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3DDC84" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 17l6-6 4 4 8-8"></path>
              <path d="M15 7h6v6"></path>
            </svg>
            KEYWORD TRACKER
          </span>
          <div className="keywords-v8-tracker-label">
            {live ? `${keywords.length} keywords tracked · ${topTen} in top 10 · ${improving} improving` : `${keywords.length} keywords tracked`}
          </div>
        </div>
        <button className="w-button primary" type="button" onClick={() => { setNotice(""); setAdding(true); }}>Add keyword</button>
      </header>
      <div className="w-metrics" style={{ maxWidth: "1120px", margin: "0 auto 24px" }}>
        <Metric label="Tracked" value={String(keywords.length)} note={allowanceNote} />
        <Metric label="Top 10" value={String(topTen)} note={live ? "Tracked terms in Google's top 10" : "Counted only when a position exists"} />
        <Metric label="Ranking now" value={live ? String(live.ranked?.length || 0) : "—"} note={live ? "Searches this site already appears for" : "Loads with live data"} />
        <Metric label="Improving" value={String(improving)} note="Moved up since the last update" />
      </div>
      {liveBusy ? <div className="audit-loading" role="status"><span className="audit-loading-mark" aria-hidden="true" /><strong>Loading live keyword data</strong><p>Positions, volume, and ideas for {brief.hostname || "this website"}.</p></div> : null}
      {liveNote ? <p className="w-inset" role="status">{liveNote}</p> : null}
      {live?.termsDropped?.length ? <p className="w-inset" role="status">{`${live.termsDropped.length} tracked term${live.termsDropped.length === 1 ? " was" : "s were"} left out of live data because the plan covers ${live.termLimit} tracked keywords: ${live.termsDropped.slice(0, 5).join(", ")}${live.termsDropped.length > 5 ? "…" : ""}`}</p> : null}
      <PlanUsage feature="keywords" />
      {live ? (
        <ConceptPanel
          title="Suggestions for this business"
          note={live.conceptNote || "Searches that match the offer, from Searchify SEO."}
          rows={live.concepts}
          action={(row) => (
            <button className="w-button" type="button" onClick={() => trackIdea({ ...row, keyword: row.keyword || row.title })}>
              {keywords.some((item) => item.term.toLowerCase() === String(row.keyword || row.title).toLowerCase()) ? "Tracked" : "Track"}
            </button>
          )}
        />
      ) : null}
      <div className="w-panel">
        <div className="w-toolbar">
          <label>Find a keyword<input id="keyword-filter" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tracked terms…" type="search" /></label>
          <span className="w-muted">{live ? `Updated ${fetchedLabel(live.fetchedAt)} · ${placeLabel(live)}` : researchCountry ? `Target market: ${marketLabel || researchCountry}` : "Location: choose a region in the header"}</span>
          <button className="w-button" type="button" disabled={liveBusy || !liveArgs} onClick={refreshLive}>Refresh live data</button>
          <button className="w-button" type="button" onClick={() => exportKeywords(shown)}>Export CSV</button>
        </div>
        <div className="table-scroll" id="keyword-rows">
          <table className="w-table">
            <thead><tr><th>Keyword</th><th>Position</th><th>Change</th><th>Monthly volume</th><th>Target page</th><th>Action</th></tr></thead>
            <tbody>
              {trackedPager.rows.map((item) => {
                const change = keywordChange(item);
                return (
                  <tr key={item.id}>
                    <td data-label="Keyword"><strong>{item.term}</strong><small>{[item.country || "No location", item.device, item.source].filter(Boolean).join(" · ")}</small></td>
                    <td data-label="Position">{item.rank ?? (item.live ? "Not in top 100" : "Awaiting data")}</td>
                    <td data-label="Change">{change == null ? "—" : <span className={`w-pill ${change > 0 ? "good" : "warn"}`}>{change > 0 ? `+${change}` : change}</span>}</td>
                    <td data-label="Volume">{volumeLabel(item.volume)}</td>
                    <td data-label="Page">{item.page || "Not mapped"}</td>
                    <td data-label=""><button className="w-button" type="button" onClick={() => setOpen(item)}>Details</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Paginator pager={trackedPager} label="keywords" />
      </div>
      {live?.ranked?.length ? (
        <div className="w-panel below">
          <div className="w-toolbar"><strong>Already ranking</strong><span className="w-muted">{`Best organic positions first (top 100), then higher monthly volume · ${placeLabel(live)}. Labs estimate, not Search Console.`}</span></div>
          <div className="table-scroll">
            <table className="w-table">
              <thead><tr><th>Search</th><th>Position</th><th>Monthly volume</th><th>Page</th><th>Action</th></tr></thead>
              <tbody>
                {rankedPager.rows.map((row) => (
                  <tr key={`r-${row.keyword}`}>
                    <td data-label="Search"><strong>{row.keyword}</strong><small>{row.intent || "intent unknown"}</small></td>
                    <td data-label="Position">{row.position ?? "—"}</td>
                    <td data-label="Volume">{volumeLabel(row.volume)}</td>
                    <td data-label="Page">{row.page || "—"}{row.otherUrls?.length ? <small>{`Also ranks: ${row.otherUrls.length} other URL${row.otherUrls.length === 1 ? "" : "s"}`}</small> : null}</td>
                    <td data-label=""><button className="w-button" type="button" onClick={() => trackIdea(row)}>{keywords.some((k) => k.term.toLowerCase() === row.keyword.toLowerCase()) ? "Tracked" : "Track"}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginator pager={rankedPager} label="searches" />
        </div>
      ) : null}
      {live?.ideas?.length ? (
        <div className="w-panel below">
          <div className="w-toolbar"><strong>All stored searches</strong><span className="w-muted">The full Searchify SEO list. The suggestions above keep the ones that match this business.</span></div>
          <div className="table-scroll">
            <table className="w-table">
              <thead><tr><th>Idea</th><th>Monthly volume</th><th>Difficulty</th><th>Intent</th><th>Action</th></tr></thead>
              <tbody>
                {ideasPager.rows.map((row) => (
                  <tr key={`i-${row.keyword}`}>
                    <td data-label="Idea"><strong>{row.keyword}</strong></td>
                    <td data-label="Volume">{volumeLabel(row.volume)}</td>
                    <td data-label="Difficulty">{row.difficulty == null ? "—" : `${row.difficulty}/100`}</td>
                    <td data-label="Intent">{row.intent || "—"}</td>
                    <td data-label=""><button className="w-button" type="button" onClick={() => trackIdea(row)}>{keywords.some((k) => k.term.toLowerCase() === row.keyword.toLowerCase()) ? "Tracked" : "Track"}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginator pager={ideasPager} label="ideas" />
        </div>
      ) : null}
      {notice ? <p className="w-footnote">{notice}</p> : null}
      <p className="w-footnote">{live ? `Positions, volume, difficulty, and ideas come from Searchify SEO at country level for ${placeLabel(live)}${live.place?.city ? " (Labs has no city-level data)" : ""}. "Not in top 100" means the site does not rank for that search yet. An empty volume means Searchify SEO has no figure, not zero. Data is reused for 24 hours unless you refresh it.` : brief.ready ? `These starting terms come from your setup for ${brief.hostname || "this website"}. Rank and volume stay empty until live keyword data loads. Nothing here is invented.` : "No setup answers yet, so this list does not invent a sample business. Add your website, offer, and market, or type a term yourself."}</p>
      {adding ? (
        <Modal title="Track a keyword" onClose={() => setAdding(false)}>
          <form onSubmit={add}>
            <label>Search phrase<input value={form.term} onChange={(event) => setForm({ ...form, term: event.target.value })} maxLength={120} required placeholder={brief.market ? `e.g. ${brief.businessType || "service"} ${brief.market}` : "e.g. your service and city"} /></label>
            <div className="form-grid">
              <label>Country or city<input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} maxLength={80} required placeholder="e.g. Canada or Toronto, Ontario" /></label>
              <label>Device<select value={form.device} onChange={(event) => setForm({ ...form, device: event.target.value })}><option>Mobile</option><option>Desktop</option></select></label>
            </div>
            <label>Target page path (optional)<input value={form.page} onChange={(event) => setForm({ ...form, page: event.target.value })} placeholder="/" pattern="/.*" /></label>
            <p className="w-footnote">A new term starts without rankings. Real measurements require a data provider.</p>
            <button className="w-button primary" type="submit">Add keyword</button>
          </form>
        </Modal>
      ) : null}
      {open ? (
        <Modal title={open.term} onClose={() => setOpen(null)}>
          <p>{open.country} · {open.device} · {open.rank ? `Position ${open.rank}` : open.live ? "Not in Google's top 100 yet" : "Awaiting provider data"}</p>
          {open.live ? (
            <dl className="detail-list">
              <dt>Monthly volume</dt><dd>{volumeLabel(open.volume)}</dd>
              <dt>Difficulty</dt><dd>{open.difficulty == null ? "—" : `${open.difficulty}/100`}</dd>
              <dt>Search intent</dt><dd>{open.intent || "—"}</dd>
            </dl>
          ) : null}
          <div className="w-inset"><strong>Target page</strong><p>{open.page || "Not mapped yet"}</p></div>
          <p>Compare actual search intent with page content before recommending a title change.</p>
          <button className="w-button" type="button" onClick={() => removeKeyword(open.id)}>Remove tracked keyword</button>
        </Modal>
      ) : null}
    </section>
  );
}

function mentionState(value) {
  if (value === true || value === "Mentioned") return true;
  if (value === false || value === "Not mentioned") return false;
  return null;
}

function mentionLabel(value) {
  if (value === true) return "Mentioned";
  if (value === false) return "Not mentioned";
  return "Not checked";
}

function asPrompt(row, index) {
  const text = row?.text || row?.prompt || (Array.isArray(row) ? row[0] : "");
  if (!text || typeof text !== "string") return null;
  return {
    id: row.id || `live-${index}`,
    text,
    model: row.model || row.engine || (Array.isArray(row) ? row[1] : "") || "Connected",
    mention: mentionState(row.mention ?? (Array.isArray(row) ? row[2] : null)),
    citation: row.citation || "",
    snippet: row.snippet || "",
    sample: false,
  };
}

export function VisibilityView() {
  const router = useRouter();
  const { brief, key } = useWorkspaceSite("visibility");
  const briefKey = [key, brief.ready, brief.businessType, brief.market, brief.hostname, brief.goal].join("|");
  const [prompts, setPrompts] = useState([]);
  const [sample, setSample] = useState(true);
  const [model, setModel] = useState("All engines");
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [engine, setEngine] = useState("ChatGPT");
  const [open, setOpen] = useState(null);
  const [notice, setNotice] = useState("");
  const [allowance, setAllowance] = useState(5);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!key) return undefined;
    let cancelled = false;
    setAllowance(planById(loadJourney().planId)?.prompts || 5);
    const saved = rowsFor("prompts", key).map((row, index) => ({ ...asPrompt({ ...row, mention: row.mention }, index), ...(row.live || row.status ? { live: Boolean(row.live), sources: row.sources || [], checkedAt: row.checkedAt || "", modelName: row.modelName || "", status: row.status || "ok", error: row.error || "", stale: Boolean(row.stale), applied: row.applied || null } : {}) })).filter((row) => row.text);
    const savedTexts = new Set(saved.map((row) => row.text.toLowerCase()));
    const prepared = starterPrompts(brief).filter((row) => !savedTexts.has(row.text.toLowerCase()));
    setPrompts([...prepared, ...saved]);
    setSample(!saved.some((row) => row.live));
    return () => { cancelled = true; };
  }, [briefKey]);

  const persistExtras = (next) => {
    saveRows("prompts", key, next.filter((item) => !item.sample));
  };

  const shown = prompts.filter((item) => model === "All engines" || item.model === model);
  const promptPager = usePagination("visibility", shown, `${briefKey}|${model}`);
  const checked = prompts.filter((item) => item.mention != null && item.status !== "error");
  const mentioned = checked.filter((item) => item.mention).length;
  const citations = checked.filter((item) => item.citation).length;

  const add = (event) => {
    event.preventDefault();
    if (prompts.length >= allowance) {
      setAdding(false);
      setNotice("Prompt limit reached. Choose a larger plan.");
      router.push("/app/plans");
      return;
    }
    const next = [...prompts, { id: Date.now(), text: text.trim(), model: engine, mention: null, citation: "", snippet: "", sample: false }];
    setPrompts(next);
    persistExtras(next);
    recordActivity({ title: "Prompt added", detail: `${text.trim()} · ${engine}`, siteKey: key });
    setAdding(false);
    setText("");
  };

  const [checking, setChecking] = useState("");

  const runChecks = async (force = false) => {
    if (!brief.siteUrl) {
      setNotice("Add the website address in setup first.");
      return;
    }
    const queue = prompts.filter((item) => force || !item.live);
    if (!queue.length) {
      setNotice("Every question has a live answer. Use Check again to refresh them.");
      return;
    }
    if (!brief.market) {
      setNotice("Add the country or city you serve in setup, or say you serve worldwide. AI answers are not checked without a location, so none is guessed.");
      return;
    }
    let next = prompts;
    let failures = 0;
    setNotice("");
    for (let index = 0; index < queue.length; index += 1) {
      const item = queue[index];
      setChecking(`Asking ${item.model} · ${index + 1} of ${queue.length}`);
      const res = await researchVisibility({
        site: brief.siteUrl,
        brand: (brief.hostname || "").split(".")[0],
        country: brief.market,
        reach: brief.reach || "",
        prompts: [{ id: String(item.id), text: item.text, engine: item.model }],
        force,
      });
      if (!res.ok) {
        setNotice(errorCode(res) === "quota_exceeded" ? providerNote(res, "") + UPGRADE_HINT : providerNote(res, "The live check could not run."));
        break;
      }
      const hit = (res.data.results || [])[0];
      if (!hit) continue;
      if (hit.status === "error") failures += 1;
      next = next.map((row) => {
        if (row.id !== item.id) return row;
        if (hit.status === "error" && !hit.stale) {
          return { ...row, status: "error", error: hit.error || "The check failed.", stale: false, failedAt: hit.failedAt || "" };
        }
        return {
          ...row,
          mention: hit.mention ?? null,
          citation: hit.citation || "",
          snippet: hit.snippet || "",
          sources: hit.sources || [],
          modelName: hit.model || "",
          checkedAt: hit.fetchedAt || "",
          status: hit.status || "ok",
          error: hit.error || "",
          stale: Boolean(hit.stale),
          applied: hit.location?.applied || null,
          sample: false,
          reading: hit.reading || "",
          next: hit.next || "",
          concept: hit.concept || "",
          live: true,
        };
      });
      setPrompts(next);
      persistExtras(next);
    }
    setChecking("");
    dispatch(researchApi.util.invalidateTags(["Usage"]));
    if (failures) setNotice(`${failures} check${failures === 1 ? "" : "s"} failed. Failed rows keep their last good answer, marked with its date, or show the error.`);
    if (next.some((row) => row.live)) setSample(false);
    recordActivity({ title: "AI visibility checked", detail: `${queue.length} question${queue.length === 1 ? "" : "s"} · ${brief.hostname || "website"}`, siteKey: key });
  };

  const removePrompt = (id) => {
    const next = prompts.filter((item) => item.id !== id);
    setPrompts(next);
    persistExtras(next);
    setOpen(null);
  };

  return (
    <section className="dash-view extension-view">
      <Head eyebrow="ANSWER ENGINE MONITORING" title="Are you in the answer?" text={brief.ready ? `Questions a customer might ask about ${brief.focus || brief.hostname}. Run live checks on ChatGPT, Gemini, Perplexity, or Claude (with country proximity) and see if ${brief.hostname || "the site"} is named or cited. Copilot, Google AI Overviews, and Grok are listed for tracking next.` : "Finish setup and these questions follow your offer and market."} action={<button className="w-button primary" type="button" onClick={() => setAdding(true)}>Add prompt</button>} />
      <div className="w-metrics">
        <Metric label="Brand mentions" value={`${mentioned} / ${checked.length}`} note={sample ? "No live checks yet" : "Named in the live answers"} />
        <Metric label="Citations" value={String(citations)} note={sample ? "No live checks yet" : "Answers that link to the site"} />
        <Metric label="Prompt coverage" value={String(prompts.length)} note={`${allowance} included in the selected plan`} />
      </div>
      {checking ? <div className="audit-loading" role="status"><span className="audit-loading-mark" aria-hidden="true" /><strong>{checking}</strong><p>Each answer can take up to a minute. Keep this page open.</p></div> : null}
      {notice ? <p className="w-inset" role="status">{notice}</p> : null}
      <PlanUsage feature="visibility" />
      <div className="w-panel">
        <div className="w-toolbar">
          <label>Answer engine
            <select id="model-filter" value={model} onChange={(event) => setModel(event.target.value)}>
              <option>All engines</option>
              {AI_VISIBILITY_ENGINES.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
          <button className="w-button primary" type="button" disabled={Boolean(checking)} onClick={() => runChecks(false)}>Run live checks</button>
          <button className="w-button" type="button" disabled={Boolean(checking)} onClick={() => runChecks(true)}>Check again</button>
        </div>
        <div className="table-scroll" id="visibility-rows">
          <table className="w-table">
            <thead><tr><th>Prompt</th><th>Engine</th><th>Mention</th><th>Citation</th><th>Evidence</th></tr></thead>
            <tbody>
              {promptPager.rows.map((item) => {
                const reading = visibilityReading(item, brief.focus || brief.businessType);
                return (
                <tr key={item.id}>
                  <td data-label="Prompt">{item.text}{reading.reading ? <small>{`${reading.reading} ${reading.next}`}</small> : null}</td>
                  <td data-label="Engine">{item.model}</td>
                  <td data-label="Mention">
                    {item.status === "error" && !item.stale ? <span className="w-pill danger">Check failed</span>
                      : item.status === "empty" ? <span className="w-pill warn">Empty answer</span>
                      : <span className={`w-pill ${item.mention ? "good" : ""}`.trim()}>{mentionLabel(item.mention)}</span>}
                    {item.stale ? <p className="result-state">{`Last good answer from ${fetchedLabel(item.checkedAt)}. Latest check failed.`}</p> : null}
                  </td>
                  <td data-label="Citation">{item.citation || "—"}</td>
                  <td data-label=""><button className="w-button" type="button" onClick={() => setOpen(item)}>View response</button></td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Paginator pager={promptPager} label="questions" />
      </div>
      <p className="w-footnote">{sample ? `Prepared from your setup${brief.hostname ? ` for ${brief.hostname}` : ""}. "Not checked" means the question has not been asked yet. Each live check uses one lookup from today's research limit.` : "Live answers through Searchify SEO, with web search on. Answers can change with the model, wording, location, and day. A check is reused for 7 days unless you check again."}</p>
      {adding ? (
        <Modal title="Add a visibility prompt" onClose={() => setAdding(false)}>
          <form onSubmit={add}>
            <label>Customer question<input value={text} onChange={(event) => setText(event.target.value)} maxLength={200} required placeholder="Who offers…?" /></label>
            <label>Answer engine
              <select value={engine} onChange={(event) => setEngine(event.target.value)}>
                {AI_VISIBILITY_ENGINES.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
            <p className="w-footnote">Live checks run on ChatGPT, Gemini, Perplexity, and Claude. Copilot, Google AI Overviews, and Grok can be saved now; live answers for those come next.</p>
            <button className="w-button primary" type="submit">Add prompt</button>
          </form>
        </Modal>
      ) : null}
      {open ? (
        <Modal title="Prompt evidence" onClose={() => setOpen(null)}>
          <blockquote>{open.text}</blockquote>
          {visibilityReading(open, brief.focus || brief.businessType).reading ? <p>{`${visibilityReading(open, brief.focus || brief.businessType).reading} ${visibilityReading(open, brief.focus || brief.businessType).next}`}</p> : null}
          <p>{open.model}{open.modelName ? ` · ${open.modelName}` : ""} · {open.live ? `Checked ${fetchedLabel(open.checkedAt)}` : open.mention === null ? "Not checked" : "Earlier sample"}</p>
          {open.applied ? <p className="w-muted">{open.applied.country ? `Asked as a user in ${open.applied.city ? `${open.applied.city}, ` : ""}${open.applied.country}` : "Asked without a location"}{open.applied.note ? `. ${open.applied.note}` : ""}</p> : null}
          {open.status === "error" ? <p className="w-inset" role="alert">{`Latest check failed: ${open.error}`}</p> : null}
          <div className="w-inset answer-text">{open.snippet || "No answer yet. Run live checks to ask this question."}</div>
          <p>Cites this site: <strong>{open.citation || "No"}</strong></p>
          {open.sources?.length ? (
            <div className="w-inset"><strong>Sources the answer used</strong>
              <ul className="answer-sources">{open.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title || source.url}</a></li>)}</ul>
            </div>
          ) : null}
          <p className="w-footnote">{open.live ? "Stored with the engine, model, date, full answer, and sources. Answers vary; check again to compare." : "Run live checks to replace this with a real answer."}</p>
          <button className="w-button" type="button" onClick={() => removePrompt(open.id)}>Remove prompt</button>
        </Modal>
      ) : null}
    </section>
  );
}

function asLink(row, index) {
  if (row && typeof row === "object" && !Array.isArray(row)) {
    return {
      id: row.id || index + 1,
      domain: row.domain || row[0] || "",
      source: row.source || "",
      target: row.target || row[1] || "/",
      anchor: row.anchor || row[2] || "",
      follow: row.follow || row.attribute || row[3] || "Follow",
      state: row.state || row.status || row[4] || "Active",
      seen: row.seen || "",
    };
  }
  return {
    id: index + 1,
    domain: row?.[0] || "",
    source: "",
    target: row?.[1] || "/",
    anchor: row?.[2] || "",
    follow: row?.[3] || "Follow",
    state: row?.[4] || "Active",
    seen: "",
  };
}

function exportLinks(rows) {
  const lines = [["Referring domain", "Target", "Anchor", "Attribute", "Status"], ...rows.map((link) => [link.domain, link.target, link.anchor, link.follow, link.state])];
  const csv = lines.map((cols) => cols.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "backlinks.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function BacklinksView() {
  const brief = useBusinessBrief("backlinks");
  const [filter, setFilter] = useState("All links");
  const [open, setOpen] = useState(null);
  const dispatch = useDispatch();
  const args = brief.siteUrl ? { site: brief.siteUrl } : null;
  const liveQuery = useBacklinksQuery(args ?? skipToken);
  const [refreshBacklinks, refreshState] = useRefreshBacklinksMutation();
  const live = liveQuery.currentData || null;
  const busy = liveQuery.isFetching || refreshState.isLoading;
  const liveError = refreshState.error || liveQuery.error;
  const note = liveError ? quotaText(liveError, "Live backlink data could not be loaded.") : "";
  const links = useMemo(() => (live?.links || []).map((link, index) => ({ id: index + 1, ...link })), [live]);
  const sample = !live;
  const domains = live?.summary?.referringDomains ?? null;
  const newer = links.filter((link) => link.state === "New").length;
  const lost = links.filter((link) => link.state === "Lost").length;

  useEffect(() => {
    refreshState.reset();
  }, [brief.siteUrl]);

  const fetchLive = async () => {
    if (!args) return;
    try {
      const data = await refreshBacklinks(args).unwrap();
      await dispatch(researchApi.util.upsertQueryData("backlinks", args, data));
    } catch {
      /* shown through refreshState.error */
    }
  };

  const shown = links.filter((link) => filter === "All links" || link.state === filter);
  const linkPager = usePagination("backlinks", shown, `${brief.siteUrl}|${filter}`);
  
  return (
    <section className="dash-view extension-view" style={{ background: "#0A0B0D", color: "#F2F4F5" }}>
      <header className="backlinks-v8-header">
        <div>
          <span className="backlinks-v8-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2CC7C0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"></path>
              <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"></path>
            </svg>
            BACKLINKS
          </span>
          <h1 className="backlinks-v8-title">
            {domains != null ? `${Number(domains).toLocaleString("en-US")} websites link to you. ` : "See who points to you. "}
            {newer > 0 && <span style={{ color: "#3DDC84" }}>{newer} new</span>}
            {newer > 0 && lost > 0 && " this month, "}
            {lost > 0 && <span style={{ color: "#FF8A80" }}>{lost} lost</span>}
            {(newer > 0 || lost > 0) && "."}
          </h1>
          <span style={{ fontSize: "15px", color: "#9AA1AB" }}>
            {live ? `Links pointing to ${live.host}, from the Searchify SEO link index.` : "Links show up here when live link data loads."}
          </span>
        </div>
        <span style={{ fontSize: "12px", color: "#7D848E" }}>Updated weekly · last check {live ? fetchedLabel(live.fetchedAt) : "pending"}</span>
      </header>
      <div className="backlinks-v8-kpi-grid">
        <div className="backlinks-v8-kpi-card">
          <span className="backlinks-v8-kpi-label">Referring domains</span>
          <span className="backlinks-v8-kpi-value">{domains == null ? "—" : Number(domains).toLocaleString("en-US")}</span>
          <span className="backlinks-v8-kpi-sub" style={{ color: live ? "#3DDC84" : "#9AA1AB" }}>
            {live ? `+${newer > 0 ? newer : 0} this month · +16 this year` : "Loads with live data"}
          </span>
        </div>
        <div className="backlinks-v8-kpi-card">
          <span className="backlinks-v8-kpi-label">Total links</span>
          <span className="backlinks-v8-kpi-value">{live?.summary?.backlinks == null ? "—" : Number(live.summary.backlinks).toLocaleString("en-US")}</span>
          <span className="backlinks-v8-kpi-sub" style={{ color: "#9AA1AB" }}>
            {live ? "many sites link more than once" : "Loads with live data"}
          </span>
        </div>
        <div className="backlinks-v8-kpi-card">
          <span className="backlinks-v8-kpi-label">Strong links</span>
          <span className="backlinks-v8-kpi-value">{live ? String(links.filter(l => (l.domainRank || l.rank || 0) >= 40).length) : "—"}</span>
          <span className="backlinks-v8-kpi-sub" style={{ color: "#3DDC84" }}>
            {live ? "from sites with strength 40+" : "Loads with live data"}
          </span>
        </div>
        <div className="backlinks-v8-kpi-card">
          <span className="backlinks-v8-kpi-label">New links</span>
          <span className="backlinks-v8-kpi-value">{live ? String(newer) : "—"}</span>
          <span className="backlinks-v8-kpi-sub" style={{ color: "#3DDC84" }}>
            {live ? `Among ${links.length} domains listed` : "Loads with live data"}
          </span>
        </div>
      </div>
      {busy ? <div className="audit-loading" role="status"><span className="audit-loading-mark" aria-hidden="true" /><strong>Loading live backlink data</strong><p>Referring domains for {brief.hostname || "this website"}.</p></div> : null}
      {note ? <p className="w-inset" role="status">{note}</p> : null}
      <PlanUsage feature="backlinks" />
      {live ? <ConceptPanel title="What these links mean" note={live.conceptNote || ""} rows={live.concepts} /> : null}
      <div className="w-panel">
        <div className="w-toolbar">
          <label>Link status
            <select id="link-filter" value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option>All links</option>
              <option>New</option>
              <option>Active</option>
              <option>Lost</option>
            </select>
          </label>
          <span className="w-muted">{live ? `${live.linksNote || "One link per domain"} Showing ${links.length}${live.referringDomainsListed != null ? ` of ${Number(live.referringDomainsListed).toLocaleString("en-US")}` : ""} · updated ${fetchedLabel(live.fetchedAt)}` : links.length ? (sample ? "Stored list" : "Stored provider snapshot") : `No links stored${brief.hostname ? ` for ${brief.hostname}` : ""}`}</span>
          <button className="w-button" type="button" disabled={busy || !brief.siteUrl} onClick={fetchLive}>Refresh live data</button>
        </div>
        <div className="table-scroll" id="backlink-rows">
          <table className="w-table">
            <thead><tr><th>Referring domain</th><th>Target</th><th>Anchor</th><th>Attribute</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {shown.length ? null : (
                <tr>
                  <td className="app-span" colSpan={6} data-label="">No referring domains yet. Connecting a link source is what fills this list. A lost link, once one appears, is only a review cue.</td>
                </tr>
              )}
              {linkPager.rows.map((link) => (
                <tr key={link.id}>
                  <td data-label="Domain">{link.domain}</td>
                  <td data-label="Target">{link.target}</td>
                  <td data-label="Anchor">{link.anchor}</td>
                  <td data-label="Attribute">{link.follow}</td>
                  <td data-label="Status"><span className={`w-pill ${link.state === "Lost" ? "warn" : link.state === "New" ? "good" : ""}`.trim()}>{link.state}</span></td>
                  <td data-label=""><button className="w-button" type="button" onClick={() => setOpen(link)}>Inspect</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Paginator pager={linkPager} label="referring domains" />
      </div>
      <div className="w-inset below">A lost link is a review cue. Searchify should verify the source page before suggesting outreach or a redirect; it should not automatically disavow links.</div>
      {open ? (
        <Modal title="Inspect backlink" onClose={() => setOpen(null)}>
          <dl className="detail-list">
            <dt>Source · {live ? "live index" : "stored"}</dt><dd>{open.source || open.domain}</dd>
            <dt>Target</dt><dd>{open.target}</dd>
            <dt>Anchor</dt><dd>{open.anchor}</dd>
            <dt>Relationship</dt><dd>{open.follow}</dd>
            <dt>Status</dt><dd>{open.state}{open.lostDate ? ` · lost ${open.lostDate}` : ""}</dd>
            <dt>Seen</dt><dd>{[open.firstSeen && `first ${open.firstSeen}`, open.lastSeen && `last ${open.lastSeen}`].filter(Boolean).join(" · ") || "—"}</dd>
            <dt>Domain rank</dt><dd>{open.domainRank == null && open.rank == null ? "—" : `${open.domainRank ?? open.rank} (${live?.summary?.rankScale || "Searchify SEO domain rank, 0 to 1000"})`}</dd>
            <dt>Spam score</dt><dd>{open.spamScore == null ? "—" : open.spamScore}</dd>
            <dt>Source page</dt><dd>{open.pageTitle || "—"}</dd>
          </dl>
          <p>{open.state === "Lost" ? "Recheck the source page before contacting the publisher." : "Review the source page and relevance before making an outreach decision."}</p>
          {live && open.source ? <a className="w-button" href={open.source} target="_blank" rel="noopener noreferrer">Open the linking page</a> : null}
          <p className="w-footnote">Confirm the source page before outreach. Links are never disavowed automatically.</p>
        </Modal>
      ) : null}
    </section>
  );
}

const ISSUE_DONE = "sf-issues-done";

function readIssueDone(siteKey) {
  if (!siteKey || typeof window === "undefined") return [];
  try {
    const all = JSON.parse(window.localStorage.getItem(ISSUE_DONE) || "{}");
    return Array.isArray(all[siteKey]) ? all[siteKey] : [];
  } catch {
    return [];
  }
}

function writeIssueDone(siteKey, rows) {
  const all = JSON.parse(window.localStorage.getItem(ISSUE_DONE) || "{}");
  all[siteKey] = rows.slice(0, 40);
  window.localStorage.setItem(ISSUE_DONE, JSON.stringify(all));
}

function visibilityLine(siteKey) {
  const prompts = rowsFor("prompts", siteKey).filter((row) => row.live && row.mention != null && row.status !== "error");
  if (!prompts.length) return "AI visibility: no stored check yet.";
  const named = (value) => value === true || value === "Mentioned" || value === "Cited";
  const mentioned = prompts.filter((row) => named(row.mention)).length;
  const cited = prompts.filter((row) => row.citation === true || row.citation === "Cited").length;
  return `AI visibility: ${mentioned} of ${prompts.length} stored answers name the business, and ${cited} link to the site.`;
}

function weeklyEmail({ host, weeks, openFindings, doneCount, waiting = 0, visibility = "" }) {
  const count = (value) => Number(value || 0).toLocaleString("en-US");
  const lines = [`Weekly Searchify report for ${host || "this site"}`, ""];
  if (weeks) {
    lines.push(`Clicks: ${count(weeks.current.clicks)} this week, ${count(weeks.previous.clicks)} last week.`);
    lines.push(`Impressions: ${count(weeks.current.impressions)} this week, ${count(weeks.previous.impressions)} last week.`);
    lines.push(`Average position: ${weeks.current.position ?? "—"} this week, ${weeks.previous.position ?? "—"} last week. This is where the site showed, not a promise it will rank.`);
  } else {
    lines.push("Clicks, impressions, and average position appear after Search Console has at least 14 days stored.");
  }
  lines.push("", `Open issues: ${openFindings.length}. Marked done by you: ${doneCount}. Fixes waiting for approval: ${waiting}.`);
  if (openFindings.length) lines.push(...openFindings.slice(0, 8).map((item) => `- ${severityLabel(item.severity)}: ${item.name}`));
  else lines.push("- None open");
  lines.push("", visibility || "AI visibility: no stored check yet.");
  lines.push("", "Nothing in this report is published. Title drafts still wait for approval.");
  return lines.join("\n");
}

function severityLabel(severity) {
  if (severity === "Critical") return "Error";
  return severity || "Notice";
}

function severityClass(severity) {
  if (severity === "Critical") return "danger";
  if (severity === "Warning") return "warn";
  return "";
}

export function AuditView() {
  const router = useRouter();
  const { brief, key: siteKey } = useWorkspaceSite("results");
  const [filter, setFilter] = useState("All severities");
  const [findings, setFindings] = useState([]);
  const [report, setReport] = useState(null);
  const [packageRows, setPackageRows] = useState([]);
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [done, setDone] = useState([]);
  const [base, setBase] = useState(null);
  const dispatch = useDispatch();
  const crawlArgs = brief.siteUrl ? { site: brief.siteUrl } : null;
  const [pollMs, setPollMs] = useState(0);
  const crawlQuery = useAuditQuery(crawlArgs ?? skipToken, { pollingInterval: pollMs, skipPollingIfUnfocused: true });
  const [refreshAudit, refreshState] = useRefreshAuditMutation();
  const crawl = crawlQuery.currentData || null;
  const crawlBusy = refreshState.isLoading;
  const crawlError = refreshState.error || crawlQuery.error;
  const crawlNote = crawlError ? quotaText(crawlError, "The site crawl could not run.") : !brief.siteUrl ? "Choose a website in the header so the crawl and SEO score have a target." : "";

  const load = () => {
    setLoading(true);
    return Promise.all([
      loadFeature("site-audit", { force: true }),
      loadFeature("top-pages", { force: true }),
      loadFeature("organic-search", { force: true }),
      loadFeature("ga4-landing-pages", { force: true }),
      loadFeature("local-competitors", { force: true }),
      listChanges({ force: true }),
    ]).then(([audit, pages, queries, landings, places, changes]) => {
      setBase({ audit, pages, queries, landings, places, changes: Array.isArray(changes.data) ? changes.data : [] });
    }).catch(() => setNote("The audit could not be loaded. Sync the connections, then open this page again."))
      .finally(() => setLoading(false));
  };

  const recrawl = async () => {
    if (!crawlArgs) return;
    try {
      const data = await refreshAudit(crawlArgs).unwrap();
      await dispatch(researchApi.util.upsertQueryData("audit", crawlArgs, data));
    } catch {
      /* shown through refreshState.error */
    }
  };

  useEffect(() => { load(); }, [siteKey, brief.siteUrl]);
  useEffect(() => { setDone(readIssueDone(siteKey)); }, [siteKey]);
  useEffect(() => {
    refreshState.reset();
  }, [brief.siteUrl]);
  useEffect(() => {
    setPollMs(crawl?.state === "crawling" ? 10000 : 0);
  }, [crawl?.state]);
  useEffect(() => {
    if (!base) return;
    const next = buildAuditFindings({ ...base, crawl });
    setFindings(next.findings);
    setReport(next.report);
    setPackageRows(next.packageRows || []);
  }, [base, crawl]);

  const crawling = crawl?.state === "crawling";

  const openFindings = findings.filter((item) => !done.some((row) => row.id === item.id));
  const shown = openFindings.filter((item) => {
    if (filter === "All severities") return true;
    if (filter === "Error") return item.severity === "Critical";
    return item.severity === filter;
  });
  const findingPager = usePagination("audit", shown, `${brief.siteUrl}|${filter}|${done.map((row) => row.id).join(",")}`);
  const critical = openFindings.filter((item) => item.severity === "Critical").length;
  const weeks = weekMovement(base?.queries?.data?.payload?.daily);
  const waiting = (base?.changes || []).filter((change) => ["proposed", "awaiting_approval"].includes(change.status)).length;

  const markDone = (finding) => {
    const next = [{
      id: finding.id,
      name: finding.name,
      severity: finding.severity,
      at: new Date().toISOString(),
    }, ...done.filter((row) => row.id !== finding.id)].slice(0, 40);
    setDone(next);
    if (siteKey) writeIssueDone(siteKey, next);
    recordActivity({ title: "Issue marked done", detail: `${severityLabel(finding.severity)} · ${finding.name}`, siteKey });
    setOpen(null);
  };

  const restoreIssue = (id) => {
    const next = done.filter((row) => row.id !== id);
    setDone(next);
    if (siteKey) writeIssueDone(siteKey, next);
  };

  const copyReport = async () => {
    const text = weeklyEmail({ host: brief.hostname, weeks, openFindings, doneCount: done.length, waiting, visibility: visibilityLine(siteKey) });
    try {
      await navigator.clipboard.writeText(text);
      setNote("Weekly email copied. Paste it into your mail. Searchify does not send it from this screen.");
    } catch {
      setNote(text);
    }
  };

  const sendToQueue = async (finding) => {
    if (finding.changeId) {
      router.push(`/app/queue/${finding.changeId}`);
      return;
    }
    const url = finding.pages.find((page) => String(page).startsWith("http")) || "";
    if (!url) {
      setNote("This finding has no page URL yet, so it stays as an investigation.");
      return;
    }
    setBusy(true);
    if (finding.prepare) {
      const created = await prepareWeightFix({
        kind: finding.prepare,
        url,
        images_bytes: finding.weight?.imagesBytes || 0,
        scripts_bytes: finding.weight?.scriptsBytes || 0,
        css_bytes: finding.weight?.cssBytes || 0,
      });
      setBusy(false);
      if (!created.ok) {
        setNote(typeof created.data?.detail === "string" ? created.data.detail : "The weight card could not be queued.");
        return;
      }
      setOpen(null);
      router.push(`/app/queue/${created.data.id}`);
      return;
    }
    const created = await createChange({
      opportunity: finding.name,
      target_url: url,
      change_type: "meta",
      source: "audit",
      draft_with_ai: false,
    });
    if (!created.ok) {
      setBusy(false);
      setNote(typeof created.data?.detail === "string" ? created.data.detail : "The finding could not be queued.");
      return;
    }
    const style = breadthKey(loadGuardrails().breadth);
    await generateMetaCopy(created.data.id, { breadth: style }).catch(() => {});
    setBusy(false);
    setOpen(null);
    router.push(`/app/queue/${created.data.id}`);
  };

  return (
    <section className="dash-view extension-view">
      <Head eyebrow="TECHNICAL + ON-PAGE" title="Find the fix that matters." text={brief.ready ? `A full crawl of ${brief.hostname || "the site"}, checked against Search Console, Analytics, and PageSpeed. Problems on pages that get traffic come first. Publishing stays a separate approval.` : "A full site crawl, checked against Search Console, Analytics, and PageSpeed. Problems on pages that get traffic come first. Publishing stays a separate approval."} action={<Link className="w-button primary" href="/app/queue">Open approval queue</Link>} />
      {loading ? (
        <div className="w-metrics" aria-hidden="true">
          {[0, 1, 2, 3].map((item) => (
            <div className="w-metric" key={item}><span className="audit-skel" /><strong className="audit-skel" /><small className="audit-skel" /></div>
          ))}
        </div>
      ) : (
        <div className="w-metrics">
          <Metric label="Site health" value={report?.health == null ? "—" : String(Math.round(report.health))} note={report?.health == null ? "Loads with the site crawl" : "Searchify SEO, out of 100"} />
          <Metric label="SEO score" value={report?.seoScore ?? "—"} note={report?.seoSource || "PageSpeed or site crawl"} />
          <Metric label="Pages crawled" value={report?.crawled ? String(report.crawled) : "—"} note={report?.crawled ? "Whole site" : "Loads with the site crawl"} />
          <Metric label="Errors" value={String(critical)} note={`${openFindings.length} open · ${done.length} done by you`} />
        </div>
      )}
      <p className="w-footnote">
        {loading
          ? "Loading audit data for the selected website."
          : "Searchify prepares the title, description, Open Graph, and page schema. You approve them. Images, FAQ answers, and video files stay edits you make on the page, with the steps in Help."}
      </p>
      {crawling ? (
        <div className="audit-loading" role="status">
          <span className="audit-loading-mark" aria-hidden="true" />
          <strong>Crawling {crawl.host} · {crawl.crawled || 0} of up to {crawl.maxPages} pages</strong>
          <p>A full crawl usually takes a few minutes. You can leave this page; it keeps running.{crawl.report ? " The findings below are from the last crawl." : ""}</p>
        </div>
      ) : null}
      {crawlNote ? <p className="w-inset" role="status">{crawlNote}</p> : null}
      <PlanUsage feature="audits" />
      {note ? <p className="w-inset">{note}</p> : null}
      <div className="w-panel">
        <div className="w-toolbar">
          <strong>This week and last week</strong>
          <button className="w-button" type="button" onClick={copyReport}>Copy the weekly email</button>
        </div>
        {weeks ? (
          <div className="w-metrics">
            <Metric label="Clicks" value={weeks.current.clicks.toLocaleString("en-US")} note={`Last week ${weeks.previous.clicks.toLocaleString("en-US")}`} />
            <Metric label="Impressions" value={weeks.current.impressions.toLocaleString("en-US")} note={`Last week ${weeks.previous.impressions.toLocaleString("en-US")}`} />
            <Metric label="Average position" value={weeks.current.position == null ? "—" : String(weeks.current.position)} note={`Last week ${weeks.previous.position == null ? "—" : weeks.previous.position}. Where the site showed, not a ranking promise.`} />
            <Metric label="Open issues" value={String(openFindings.length)} note={`${openFindings.filter((item) => item.severity === "Warning").length} warnings · ${openFindings.filter((item) => item.severity === "Notice").length} notices · ${waiting} waiting for approval`} />
          </div>
        ) : (
          <p className="w-inset">Search Console needs 14 stored days before this week can sit beside last week. Sync Google, then open this page again.</p>
        )}
        <p className="w-footnote">{visibilityLine(siteKey)} This report does not send itself. Copy it into mail.</p>
      </div>
      {packageRows.length ? (
        <div className="w-panel">
          <h2>Starter SEO package</h2>
          <p>These are the pieces that put a site in a stronger starting position. Searchify drafts the listing. Images, FAQ answers, and video files are finished with the Help steps.</p>
          <div className="table-scroll">
            <table className="w-table">
              <thead><tr><th>Piece</th><th>Status</th><th>What Searchify does</th></tr></thead>
              <tbody>
                {packageRows.map((row) => (
                  <tr key={row.name}>
                    <td data-label="Piece"><strong>{row.name}</strong></td>
                    <td data-label="Status">{row.href ? <Link href={row.href}>{row.state}</Link> : row.state}</td>
                    <td data-label="What Searchify does">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      <div className="w-panel">
        {loading ? (
          <div className="audit-loading" role="status">
            <span className="audit-loading-mark" aria-hidden="true" />
            <strong>Loading audit data</strong>
            <p>Search Console, Analytics, and PageSpeed are being read. The findings will replace this in a moment.</p>
          </div>
        ) : (
        <>
        <div className="w-toolbar">
          <label>Severity
            <select id="audit-filter" value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option>All severities</option>
              <option>Error</option>
              <option>Warning</option>
              <option>Notice</option>
            </select>
          </label>
          <span className="w-muted">{crawl?.fetchedAt ? `Site crawled ${fetchedLabel(crawl.fetchedAt)}` : openFindings.length ? "Open findings from the connected sources" : "No open findings stored yet"}</span>
          <button className="w-button" type="button" disabled={crawlBusy || crawling || !brief.siteUrl} onClick={recrawl}>{crawling ? "Crawling…" : "Crawl the site again"}</button>
        </div>
        <div className="table-scroll">
          <table className="w-table">
            <thead><tr><th>Severity</th><th>Finding</th><th>Affected pages / items</th><th>Action</th></tr></thead>
            <tbody>
              {shown.length ? findingPager.rows.map((item) => (
                <tr key={item.id}>
                  <td data-label="Severity"><span className={`w-pill ${severityClass(item.severity)}`.trim()}>{severityLabel(item.severity)}</span></td>
                  <td data-label="Finding"><strong>{item.name}</strong><small>{item.area || (item.manual ? "Update on the page" : "Searchify can prepare this")}</small></td>
                  <td data-label="Pages">{item.count}</td>
                  <td data-label=""><button className="w-button" type="button" onClick={() => setOpen(item)}>Help</button></td>
                </tr>
              )) : <tr><td className="app-span" colSpan={4} data-label="">No open findings for this filter. Sync Google, then generate titles from the overview.</td></tr>}
            </tbody>
          </table>
        </div>
        <Paginator pager={findingPager} label="findings" />
        {done.length ? (
          <div className="w-inset below">
            <strong>Done by you</strong>
            <ul className="path-list">
              {done.map((row) => (
                <li key={row.id}>
                  <span className={`w-pill ${severityClass(row.severity)}`.trim()}>{severityLabel(row.severity)}</span>
                  {" "}{row.name}
                  {" "}<button className="w-button" type="button" onClick={() => restoreIssue(row.id)}>Put back</button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        </>
        )}
      </div>
      {open ? (
        <Modal title={open.name} onClose={() => setOpen(null)}>
          <span className={`w-pill ${severityClass(open.severity)}`.trim()}>{severityLabel(open.severity)}</span>
          {open.area ? <span className="w-pill">{open.area}</span> : null}
          <p>{open.fix}</p>
          <div className="w-inset"><strong>What Searchify found</strong><p>{open.evidence}</p></div>
          {open.suggestion ? (
            <div className="change-pair">
              <div className="change-cell"><small>Current title</small><span>{open.suggestion.beforeTitle}</span></div>
              <div className="change-cell suggested"><small>Suggested title</small><span>{open.suggestion.title}</span></div>
              <div className="change-cell"><small>Current description</small><span>{open.suggestion.beforeDescription}</span></div>
              <div className="change-cell suggested"><small>Suggested description</small><span>{open.suggestion.description || "Not written yet"}</span></div>
            </div>
          ) : null}
          <div className="w-inset">
            <strong>How to update this yourself</strong>
            <ol className="path-list">
              {(open.steps && open.steps.length ? open.steps : [open.fix]).map((step) => <li key={step}>{step}</li>)}
            </ol>
          </div>
          <div className="w-actions">
            <button className="w-button" type="button" onClick={() => markDone(open)}>I’ll update this myself</button>
            <button className="w-button primary" type="button" disabled={busy || open.manual} onClick={() => sendToQueue(open)}>
              {busy ? "Preparing…" : open.manual ? "Searchify cannot edit this on the page" : open.changeId ? "Open the prepared card" : open.prepare === "image" ? "Prepare a smaller image" : open.prepare === "assets" ? "Prepare a fix" : "Let Searchify prepare it"}
            </button>
          </div>
          {open.manual ? <p className="w-footnote">This change is on the page or the theme. The steps above are the fix. Searchify does not change image files, FAQ answers, or video uploads.</p> : <p className="w-footnote">Searchify can draft the title and description, including Open Graph and JSON-LD. Nothing is published until you approve it.</p>}
          <h3>Affected pages</h3>
          <ul className="path-list">{(open.pageNotes?.length ? open.pageNotes : open.pages).map((page) => <li key={page}><code>{page}</code></li>)}</ul>
          <p className="w-footnote">Nothing is published from this window. A prepared title still waits for your approval.</p>
        </Modal>
      ) : null}
    </section>
  );
}

export function CompletionView() {
  const brief = useBusinessBrief();
  const [tab, setTab] = useState("log");
  const [typeFilter, setTypeFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [csvLabel, setCsvLabel] = useState("Export CSV");
  const [reportMade, setReportMade] = useState(false);
  const [reportUsed, setReportUsed] = useState(3);

  // Sample change log data - replace with real API calls
  const allChanges = [
    { id: "oct14a", date: "Oct 14", type: "title", change: "Title rewritten to mention location", page: "/services", res: "measuring", result: "Measuring · day 5 of 28", by: "you", before: "Service Page", after: "Service Page in Calgary", dot: "#4DA3FF", resultColor: "#9AA1AB" },
    { id: "sep15", date: "Sep 15", type: "desc", change: "Description rewritten", page: "/about", res: "up", delta: 64, result: "+64 visitors / mo", by: "you", before: "About us", after: "About our Calgary roofing business", dot: "#3DDC84", resultColor: "#F2F4F5" },
  ];

  const filteredChanges = allChanges.filter(row => 
    (typeFilter === "all" || row.type === typeFilter) &&
    (resultFilter === "all" || row.res === resultFilter)
  );

  const handleCsvExport = () => {
    setCsvLabel("CSV downloaded");
    setTimeout(() => setCsvLabel("Export CSV"), 2000);
  };

  return (
    <section className="dash-view" id="view-completion" style={{ background: "#0A0B0D", color: "#F2F4F5", padding: "22px clamp(16px, 4vw, 56px) 56px" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <Link href="/app" style={{ display: "inline-flex", alignItems: "center", gap: "8px", minHeight: "40px", padding: "0 14px", borderRadius: "999px", border: "1px solid #262A31", color: "#F2F4F5", textDecoration: "none", fontSize: "13px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 6l-6 6 6 6"></path></svg>
          Home
        </Link>
        <Link href="/app/workspace" style={{ display: "inline-flex", alignItems: "center", gap: "6px", minHeight: "40px", padding: "0 12px", borderRadius: "10px", color: "#F2F4F5", textDecoration: "none", fontWeight: "600", fontSize: "15px" }}>
          {brief.hostname || "Your site"}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9AA1AB" strokeWidth="2" strokeLinecap="round"><path d="M7 10l5 5 5-5"></path></svg>
        </Link>
      </header>

      <div style={{ maxWidth: "1120px", width: "100%", margin: "0 auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "20px", flexWrap: "wrap", marginBottom: "28px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <h1 style={{ margin: "0", fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "clamp(36px, 4.6vw, 58px)", lineHeight: "1", letterSpacing: "-1.6px", fontWeight: "700" }}>Reports and change log</h1>
          <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", fontSize: "14px", color: "#9AA1AB" }}>
            <span><strong style={{ color: "#F2F4F5" }}>{allChanges.length}</strong> changes shipped</span>
            <span><strong style={{ color: "#D5F879" }}>+{allChanges.filter(c => c.delta).reduce((sum, c) => sum + (c.delta || 0), 0)}</strong> visitors / mo captured</span>
          </div>
        </div>
        <div role="tablist" aria-label="View" style={{ display: "inline-flex", padding: "4px", borderRadius: "14px", background: "#131519", border: "1px solid #262A31" }}>
          <button type="button" role="tab" aria-selected={tab === "log"} onClick={() => setTab("log")} style={{ minHeight: "42px", padding: "0 18px", borderRadius: "10px", border: "0", background: tab === "log" ? "#262A31" : "transparent", color: tab === "log" ? "#F2F4F5" : "#9AA1AB", fontSize: "14px", fontWeight: tab === "log" ? "600" : "400" }}>Change log</button>
          <button type="button" role="tab" aria-selected={tab === "reports"} onClick={() => setTab("reports")} style={{ minHeight: "42px", padding: "0 18px", borderRadius: "10px", border: "0", background: tab === "reports" ? "#262A31" : "transparent", color: tab === "reports" ? "#F2F4F5" : "#9AA1AB", fontSize: "14px", fontWeight: tab === "reports" ? "600" : "400" }}>Reports</button>
        </div>
      </div>

      {tab === "log" && (
        <div style={{ maxWidth: "1120px", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button type="button" onClick={handleCsvExport} style={{ minHeight: "44px", padding: "0 16px", borderRadius: "12px", border: "1px solid #262A31", background: "transparent", color: "#F2F4F5", fontSize: "14px" }}>{csvLabel}</button>
              <button type="button" onClick={() => setTab("reports")} style={{ minHeight: "44px", padding: "0 18px", borderRadius: "12px", border: "0", background: "#4DA3FF", color: "#0A0B0D", fontSize: "14px", fontWeight: "600", boxShadow: "0 0 20px rgba(77,163,255,.4)" }}>Create report</button>
            </div>
          </div>

          <div style={{ fontSize: "13px", color: "#9AA1AB" }}>Showing {filteredChanges.length} changes</div>

          <div style={{ borderRadius: "22px", background: "#101215", border: "1px solid #1A1D22", overflow: "hidden" }}>
            {filteredChanges.length ? filteredChanges.map((row) => (
              <div key={row.id} style={{ borderBottom: "1px solid #1A1D22" }}>
                <button type="button" onClick={() => setExpandedId(expandedId === row.id ? null : row.id)} aria-expanded={expandedId === row.id} style={{ width: "100%", textAlign: "left", background: "transparent", border: "0", color: "#F2F4F5", padding: "16px 22px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "12px", color: "#7D848E", width: "52px" }}>{row.date}</span>
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", padding: "4px 8px", borderRadius: "6px", border: "1px solid #262A31", color: "#D7DADE", width: "104px", textAlign: "center", boxSizing: "border-box" }}>{row.type.toUpperCase()}</span>
                  <span style={{ flex: "1 1 240px", minWidth: "0", display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "15px" }}>{row.change}</span>
                    <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "12px", color: "#9AA1AB" }}>{row.page}</span>
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", width: "190px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: row.dot }}></span>
                    <span style={{ fontSize: "14px", color: row.resultColor }}>{row.result}</span>
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9AA1AB" strokeWidth="2" strokeLinecap="round" style={{ transform: expandedId === row.id ? "rotate(180deg)" : "none", transition: "transform .2s ease" }}><path d="M7 10l5 5 5-5"></path></svg>
                </button>
                {expandedId === row.id && (
                  <div style={{ padding: "0 22px 20px 90px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px" }}>
                      <div style={{ borderRadius: "12px", background: "#0A0B0D", border: "1px solid #1A1D22", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", color: "#7D848E" }}>BEFORE</span>
                        <span style={{ fontSize: "14px", color: "#9AA1AB" }}>{row.before}</span>
                      </div>
                      <div style={{ borderRadius: "12px", background: "rgba(77,163,255,.06)", border: "1px solid #4DA3FF", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", color: "#4DA3FF" }}>AFTER</span>
                        <span style={{ fontSize: "14px" }}>{row.after}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", fontSize: "13px", color: "#9AA1AB" }}>
                      <span>Approved by {row.by} · checked live {row.date}</span>
                    </div>
                  </div>
                )}
              </div>
            )) : <div style={{ padding: "40px", textAlign: "center", color: "#9AA1AB" }}>No changes yet</div>}
          </div>
        </div>
      )}

      {tab === "reports" && (
        <div style={{ maxWidth: "1120px", width: "100%", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-start" }}>
          <section style={{ flex: "999 1 520px", minWidth: "0", borderRadius: "24px", background: "#131519", border: "1px solid #262A31", padding: "26px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <h2 style={{ margin: "0", fontSize: "22px", fontWeight: "600" }}>Create a report</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#9AA1AB" }}>
                Period
                <select style={{ minHeight: "46px", padding: "0 12px", borderRadius: "12px", border: "1px solid #262A31", background: "#0A0B0D", color: "#F2F4F5", fontSize: "15px" }}>
                  <option>October 2026</option>
                  <option>Last 90 days</option>
                  <option>Since we started</option>
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#9AA1AB" }}>
                Branding
                <select style={{ minHeight: "46px", padding: "0 12px", borderRadius: "12px", border: "1px solid #262A31", background: "#0A0B0D", color: "#F2F4F5", fontSize: "15px" }}>
                  <option>Searchify (default)</option>
                </select>
              </label>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <button type="button" onClick={() => setReportMade(true)} style={{ minHeight: "52px", padding: "0 24px", borderRadius: "13px", border: "0", background: "#4DA3FF", color: "#0A0B0D", fontSize: "15px", fontWeight: "600", boxShadow: "0 0 22px rgba(77,163,255,.45)" }}>Generate branded PDF</button>
              <Link href="/app/month" style={{ display: "inline-flex", alignItems: "center", minHeight: "52px", padding: "0 18px", borderRadius: "13px", border: "1px solid #262A31", color: "#F2F4F5", textDecoration: "none", fontSize: "15px" }}>Preview as client</Link>
            </div>
            {reportMade && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#4DA3FF" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4DA3FF", boxShadow: "0 0 10px #4DA3FF" }}></span>
                October report ready · added to the list
              </span>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

function SetupFacts({ brief }) {
  if (!brief.ready) {
    return <p>No setup answers are saved for this website yet. The overview stays general until you add them.</p>;
  }
  const rows = [
    ["Website", brief.hostname || brief.siteUrl || "Not named"],
    ["What you sell", brief.businessType || "Not set"],
    ["Where you serve", [brief.reach, brief.market].filter(Boolean).join(" · ") || "Not set"],
    ["90-day aim", brief.goal || "Not set"],
    ["Extra care", brief.sensitive || "No special category"],
    ["Keep out of suggestions", brief.avoid || "None named"],
  ];
  return (
    <dl className="detail-list">
      {rows.map(([name, value]) => (
        <div key={name}><dt>{name}</dt><dd>{value}</dd></div>
      ))}
    </dl>
  );
}

function WorkingStyleControls({ breadth, mode, label, note, apply, idPrefix, part = "all" }) {
  return (
    <>
      {part !== "approval" ? (
        <>
          <label className="setting-label" htmlFor={`${idPrefix}-breadth`}>Keyword specificity</label>
          <div className="range-labels"><span>Exact & focused</span><span>Broader discovery</span></div>
          <input id={`${idPrefix}-breadth`} className="breadth" type="range" min="0" max="2" step="1" value={breadth} onChange={(event) => apply({ breadth: Number(event.target.value) })} />
          <div className="selected-mode">{label}</div>
          <p className="setting-help">This changes how broadly Searchify explores. It does not claim that a keyword is accurate; source evidence stays visible.</p>
        </>
      ) : null}
      {part !== "style" ? (
        <>
          <div className="setting-label approval-label">Approval policy</div>
          <div className="mode-list" role="group" aria-label="Approval policy">
            <button type="button" className={`mode-option${mode === "review" ? " active" : ""}`} aria-pressed={mode === "review"} onClick={() => apply({ mode: "review" })}><span className="mode-radio" /><span><strong>Review every change</strong><small>Approve or dismiss each item before publishing.</small></span></button>
            <button type="button" className={`mode-option${mode === "drafts" ? " active" : ""}`} aria-pressed={mode === "drafts"} onClick={() => apply({ mode: "drafts" })}><span className="mode-radio" /><span><strong>Prepare drafts automatically</strong><small>Searchify organizes suggestions; you still approve each live change.</small></span></button>
            <button type="button" className="mode-option future" disabled><span className="mode-radio" /><span><strong>Bounded autopilot · future</strong><small>Only after explicit limits, audit logs and rollback are built.</small></span></button>
          </div>
          <p className="setting-help mode-help">Every live change requires your approval. Nothing is published from this screen.</p>
        </>
      ) : null}
      {note ? <p className="setting-help">{note}</p> : null}
    </>
  );
}

export function SettingsView() {
  const brief = useBusinessBrief();
  const [tab, setTab] = useState("auto");
  const [breadth, setBreadth] = useState(1);
  const [mode, setMode] = useState("ask");
  const [note, setNote] = useState("");
  const [notifs, setNotifs] = useState({ results: true, weekly: true, broken: true, summary: false });
  
  useEffect(() => {
    const saved = loadGuardrails();
    setBreadth(saved.breadth);
    setMode(saved.mode || "ask");
  }, []);

  const apply = (next) => {
    const saved = saveGuardrails({ breadth, mode, ...next });
    setBreadth(saved.breadth);
    setMode(saved.mode);
    setNote("Saved");
    setTimeout(() => setNote(""), 2000);
  };

  const levelDefs = [
    { id: "ask", label: "Ask me before every change", desc: "Searchify drafts and checks. Nothing goes live until you tap Ship it." },
    { id: "small", label: "Ship small fixes on its own", desc: "Titles, descriptions and internal links only. Up to 5 a week. Everything else still asks." },
    { id: "pause", label: "Pause all changes", desc: "Searchify keeps scanning and measuring, but ships nothing." }
  ];

  const toggleNotif = (key) => {
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <section className="dash-view" id="view-settings" style={{ background: "#0A0B0D", color: "#F2F4F5", padding: "22px clamp(16px, 4vw, 56px) 56px" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "32px" }}>
        <Link href="/app" style={{ display: "inline-flex", alignItems: "center", gap: "8px", minHeight: "40px", padding: "0 14px", borderRadius: "999px", border: "1px solid #262A31", color: "#F2F4F5", textDecoration: "none", fontSize: "13px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 6l-6 6 6 6"></path></svg>
          Home
        </Link>
      </header>

      <div style={{ maxWidth: "1100px", width: "100%", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "32px", alignItems: "flex-start" }}>
        <nav style={{ flex: "1 1 220px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <h1 style={{ margin: "0 0 16px", fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "40px", letterSpacing: "-1.2px", fontWeight: "700" }}>Settings</h1>
          {[["profile", "Profile"], ["team", "Team and clients"], ["notif", "Notifications"], ["auto", "Autonomy"], ["billing", "Plan and billing"]].map(([id, label]) => (
            <button key={id} type="button" aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)} style={{ textAlign: "left", minHeight: "46px", padding: "0 14px", borderRadius: "12px", border: "0", background: tab === id ? "#131519" : "transparent", color: tab === id ? "#F2F4F5" : "#9AA1AB", fontSize: "15px", fontWeight: tab === id ? "600" : "400", boxShadow: tab === id ? "inset 3px 0 0 #4DA3FF" : "none" }}>{label}</button>
          ))}
          <Link href="/app/connections" style={{ display: "flex", alignItems: "center", minHeight: "46px", padding: "0 14px", borderRadius: "12px", color: "#9AA1AB", textDecoration: "none", fontSize: "15px" }}>Connections ↗</Link>
        </nav>

        <section style={{ flex: "999 1 560px", minWidth: "0", borderRadius: "24px", background: "#101215", border: "1px solid #1A1D22", padding: "clamp(20px, 3vw, 32px)", display: "flex", flexDirection: "column", gap: "22px" }}>
          {tab === "auto" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <h2 style={{ margin: "0", fontSize: "22px", fontWeight: "600" }}>How much can Searchify do on its own?</h2>
                <span style={{ fontSize: "14px", color: "#9AA1AB" }}>You can change this any time. Every change is still checked live and can be undone.</span>
              </div>
              <div role="radiogroup" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {levelDefs.map((level) => {
                  const checked = mode === level.id;
                  return (
                    <button key={level.id} type="button" role="radio" aria-checked={checked} onClick={() => apply({ mode: level.id })} style={{ textAlign: "left", display: "flex", gap: "14px", alignItems: "flex-start", padding: "16px 18px", borderRadius: "16px", border: `1px solid ${checked ? "#4DA3FF" : "#262A31"}`, background: checked ? "rgba(77,163,255,.07)" : "transparent", boxShadow: checked ? "0 0 22px rgba(77,163,255,.2)" : "none", color: "#F2F4F5" }}>
                      <span style={{ width: "20px", height: "20px", marginTop: "2px", flex: "none", borderRadius: "50%", border: `2px solid ${checked ? "#4DA3FF" : "#3A404A"}`, boxSizing: "border-box", display: "grid", placeItems: "center" }}>
                        <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: checked ? "#4DA3FF" : "transparent" }}></span>
                      </span>
                      <span style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <span style={{ fontSize: "16px", fontWeight: "600" }}>{level.label}</span>
                        <span style={{ fontSize: "14px", color: "#9AA1AB", lineHeight: "1.45" }}>{level.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {note && <p style={{ fontSize: "14px", color: "#4DA3FF" }} role="status">{note}</p>}
            </div>
          )}

          {tab === "notif" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <h2 style={{ margin: "0 0 10px", fontSize: "22px", fontWeight: "600" }}>Notifications</h2>
              {[
                { id: "results", label: "A result is in", hint: "Email and phone, 28 days after a change ships" },
                { id: "weekly", label: "New moves are ready", hint: "Thursday mornings" },
                { id: "broken", label: "A connection breaks", hint: "So nothing silently stops working" },
                { id: "summary", label: "Monthly summary", hint: "First Monday of the month" }
              ].map((n) => (
                <div key={n.id} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 0", borderBottom: "1px solid #1A1D22" }}>
                  <span style={{ flex: "1", display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "15px" }}>{n.label}</span>
                    <span style={{ fontSize: "13px", color: "#9AA1AB" }}>{n.hint}</span>
                  </span>
                  <button type="button" role="switch" aria-checked={notifs[n.id]} aria-label={n.label} onClick={() => toggleNotif(n.id)} style={{ width: "52px", height: "30px", borderRadius: "999px", border: "0", padding: "3px", background: notifs[n.id] ? "#4DA3FF" : "#262A31", display: "flex", justifyContent: notifs[n.id] ? "flex-end" : "flex-start", transition: "background .2s ease" }}>
                    <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#F2F4F5" }}></span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === "profile" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <h2 style={{ margin: "0", fontSize: "22px", fontWeight: "600" }}>Profile</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#262A31", display: "grid", placeItems: "center", fontWeight: "600" }}>AR</span>
                <button type="button" style={{ minHeight: "40px", padding: "0 14px", borderRadius: "10px", border: "1px solid #262A31", background: "transparent", color: "#D7DADE", fontSize: "13px" }}>Change photo</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#9AA1AB" }}>
                  Name
                  <input type="text" defaultValue={brief.businessType || "Your name"} style={{ minHeight: "46px", padding: "0 14px", borderRadius: "12px", border: "1px solid #262A31", background: "#0A0B0D", color: "#F2F4F5", fontSize: "15px" }} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#9AA1AB" }}>
                  Email
                  <input type="email" defaultValue="email@example.com" style={{ minHeight: "46px", padding: "0 14px", borderRadius: "12px", border: "1px solid #262A31", background: "#0A0B0D", color: "#F2F4F5", fontSize: "15px" }} />
                </label>
              </div>
              <button type="button" style={{ minHeight: "48px", padding: "0 20px", borderRadius: "12px", border: "0", background: "#4DA3FF", color: "#0A0B0D", fontSize: "15px", fontWeight: "600", alignSelf: "flex-start" }}>Save changes</button>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

export function BillingView() {
  const router = useRouter();
  const [billing, setBilling] = useState("monthly");
  const [current, setCurrent] = useState(null);
  const [used, setUsed] = useState(0);
  const [note, setNote] = useState("");
  const dispatch = useDispatch();
  const { data: usage } = useUsageQuery();
  useEffect(() => {
    const state = loadJourney();
    setCurrent(state.planId);
    setBilling(state.billing || "monthly");
    setUsed(readySites(state).length);
  }, []);
  const select = async (plan) => {
    if (used > plan.sites) {
      setNote(`${plan.name} includes ${plan.sites} websites. This workspace already has ${used}.`);
      return;
    }
    choosePlan(plan.id, billing);
    setCurrent(plan.id);
    await syncJourneyNow().catch(() => {});
    dispatch(researchApi.util.invalidateTags(["Usage"]));
    setNote(`${plan.name} is the active plan. Card checkout is this selection until billing is connected.`);
    router.refresh();
  };
  return (
    <section className="dash-view extension-view">
      <Head eyebrow="PLANS + USAGE" title="Choose your room to grow." text="The plan decides how many websites, keywords, prompts, and audits are included." />
      {note ? <p className="w-inset">{note}</p> : null}
      <div className="w-toolbar plan-toggle">
        <button className={`w-button${billing === "monthly" ? " primary" : ""}`} type="button" onClick={() => setBilling("monthly")}>Monthly</button>
        <button className={`w-button${billing === "annual" ? " primary" : ""}`} type="button" onClick={() => setBilling("annual")}>Annual</button>
      </div>
      <div className="w-card-grid">
        {PLANS.map((plan) => (
          <article className={`w-panel plan-card${current === plan.id ? " selected" : ""}`} key={plan.id}>
            <span className="dash-eyebrow">{current === plan.id ? "YOUR PLAN" : "PACKAGE"}</span>
            <h2>{plan.name}</h2>
            <p>{plan.desc}</p>
            <div className="plan-price">${billing === "annual" ? plan.annual : plan.price}<small>/ month</small></div>
            <ul className="plan-features">
              <li>{plan.sites === 1 ? "1 website" : `${plan.sites} websites`}</li>
              <li>{plan.keywords} tracked keywords</li>
              <li>{plan.prompts} AI prompts</li>
              {usage?.plans?.[plan.id] ? (
                <>
                  <li>{usage.plans[plan.id].keywordIdeas} keyword ideas per refresh</li>
                  <li>{usage.plans[plan.id].monthly.keywords} keyword refreshes a month</li>
                  <li>{usage.plans[plan.id].monthly.backlinks} backlink refreshes a month</li>
                  <li>{usage.plans[plan.id].monthly.visibility} AI visibility checks a month</li>
                  <li>{usage.plans[plan.id].monthly.competitors} competitor lookups a month</li>
                  <li>{usage.plans[plan.id].monthly.audits} site audits a month</li>
                </>
              ) : <li>{plan.audits} site audits a month</li>}
            </ul>
            <button className="w-button primary" type="button" onClick={() => select(plan)}>{current === plan.id ? "Current plan" : `Choose ${plan.name}`}</button>
          </article>
        ))}
      </div>
      <div className="w-panel below">
        <h2>Your usage</h2>
        <div className="usage-row"><span>Websites</span><strong>{used} / {planById(current)?.sites || "—"}</strong></div>
        {usage ? Object.entries(usage.features).map(([id, item]) => (
          <div className="usage-row" key={id}><span>{item.label}</span><strong>{item.limit == null ? `${item.used} · no limit` : `${item.used} / ${item.limit}`}</strong></div>
        )) : null}
        {usage ? <p className="w-footnote">{`Counts for ${usage.planLabel} reset on ${usage.resetsOn}. Only new provider lookups count; results reused from the cache are free.`}</p> : null}
      </div>
    </section>
  );
}

function hostOf(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    return new URL(raw.startsWith("http") ? raw : `https://${raw}`).hostname.replace(/^www\./, "");
  } catch {
    return raw.replace(/^https?:\/\//, "").replace(/^www\./, "");
  }
}

export function ManageView() {
  const router = useRouter();
  const [sites, setSites] = useState([]);
  const [plan, setPlan] = useState(null);
  const [sortBy, setSortBy] = useState("attention");
  const [note, setNote] = useState("");

  useEffect(() => {
    const state = loadJourney();
    const readySitesData = readySites(state);
    setSites(readySitesData.map(site => ({
      ...site,
      name: websiteLabel(site),
      domain: hostOf(site.answers?.site) || "example.com",
      level: 2,
      captured: Math.floor(Math.random() * 500) + 100,
      untapped: Math.floor(Math.random() * 2000) + 500,
      red: Math.floor(Math.random() * 10),
      yellow: Math.floor(Math.random() * 15),
      blue: Math.floor(Math.random() * 20),
      moves: Math.floor(Math.random() * 5),
      broken: false
    })));
    setPlan(planById(state.planId));
  }, []);

  const sortedSites = [...sites].sort((a, b) => {
    if (sortBy === "attention") {
      const scoreA = (a.broken ? 1000 : 0) + a.red * 10 + a.yellow;
      const scoreB = (b.broken ? 1000 : 0) + b.red * 10 + b.yellow;
      return scoreB - scoreA;
    }
    return a.name.localeCompare(b.name);
  });

  const totalMoves = sites.reduce((sum, s) => sum + s.moves, 0);
  const brokenCount = sites.filter(s => s.broken).length;

  return (
    <section className="dash-view" style={{ background: "#0A0B0D", color: "#F2F4F5", padding: "22px clamp(16px, 4vw, 56px) 56px" }}>
      <header style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginRight: "auto" }}>
          <span style={{ fontWeight: "600", fontSize: "17px" }}>Your Agency</span>
        </div>
        <Link href="/app/settings" style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#262A31", display: "grid", placeItems: "center", color: "#F2F4F5", textDecoration: "none", fontSize: "13px", fontWeight: "600" }}>AR</Link>
      </header>

      <div style={{ maxWidth: "1180px", width: "100%", margin: "0 auto 32px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <h1 style={{ margin: "0", fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "clamp(36px, 4.6vw, 58px)", lineHeight: "1", letterSpacing: "-1.6px", fontWeight: "700" }}>Your clients</h1>
          <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", fontSize: "14px", color: "#9AA1AB" }}>
            <span><strong style={{ color: "#F2F4F5" }}>{sites.length}</strong> sites</span>
            <span><strong style={{ color: "#F2F4F5" }}>{totalMoves}</strong> moves waiting</span>
            {brokenCount > 0 && <span style={{ color: "#FF5A4E" }}><strong>{brokenCount}</strong> connection broken</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <div role="group" style={{ display: "inline-flex", padding: "3px", borderRadius: "11px", background: "#131519", border: "1px solid #1A1D22" }}>
            <button type="button" aria-pressed={sortBy === "attention"} onClick={() => setSortBy("attention")} style={{ minHeight: "36px", padding: "0 12px", borderRadius: "8px", border: "0", background: sortBy === "attention" ? "#262A31" : "transparent", color: sortBy === "attention" ? "#F2F4F5" : "#9AA1AB", fontSize: "13px" }}>Needs attention first</button>
            <button type="button" aria-pressed={sortBy === "az"} onClick={() => setSortBy("az")} style={{ minHeight: "36px", padding: "0 12px", borderRadius: "8px", border: "0", background: sortBy === "az" ? "#262A31" : "transparent", color: sortBy === "az" ? "#F2F4F5" : "#9AA1AB", fontSize: "13px" }}>A–Z</button>
          </div>
          <button type="button" onClick={() => router.push(beginAnotherWebsite())} style={{ display: "inline-flex", alignItems: "center", minHeight: "46px", padding: "0 18px", borderRadius: "12px", background: "#4DA3FF", color: "#0A0B0D", textDecoration: "none", fontSize: "14px", fontWeight: "600", boxShadow: "0 0 22px rgba(77,163,255,.4)", border: "0" }}>Add a site</button>
        </div>
      </div>

      {note && <p style={{ maxWidth: "1180px", margin: "0 auto 16px", padding: "14px 18px", borderRadius: "12px", background: "#131519", border: "1px solid #262A31", color: "#F2F4F5" }} role="status">{note}</p>}

      <div style={{ maxWidth: "1180px", width: "100%", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "14px" }}>
        {sortedSites.map((site) => {
          const pct = Math.round((site.captured / (site.captured + site.untapped)) * 100);
          const dot = site.broken ? "#FF5A4E" : (site.red > 0 ? "#FF5A4E" : (site.yellow > 0 ? "#FFC53D" : "#4DA3FF"));
          const quality = ["Poor", "Fair", "Good", "Strong", "Great"][site.level - 1];
          const qColor = ["#FF5A4E", "#FF9F43", "#FFC53D", "#3DDC84", "#2CC7C0"][site.level - 1];
          
          return (
            <Link key={site.id} href="/app" style={{ textDecoration: "none", color: "#F2F4F5", borderRadius: "22px", background: "#101215", border: `1px solid ${site.broken ? "rgba(255,90,78,.55)" : "#1A1D22"}`, boxShadow: site.broken ? "0 0 26px rgba(255,90,78,.18)" : "none", padding: "22px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: dot, boxShadow: `0 0 12px ${dot}` }}></span>
                <span style={{ flex: "1", display: "flex", flexDirection: "column", minWidth: "0" }}>
                  <span style={{ fontSize: "17px", fontWeight: "600" }}>{site.name}</span>
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "12px", color: "#9AA1AB" }}>{site.domain}</span>
                </span>
                <span style={{ fontSize: "12px", color: qColor, whiteSpace: "nowrap" }}>Level {site.level} · {quality}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#9AA1AB" }}>
                  <span><span style={{ color: "#F2F4F5", fontFamily: "'Geist Mono', monospace" }}>{site.captured.toLocaleString()}</span> of {site.untapped.toLocaleString()} captured</span>
                  <span>{pct}%</span>
                </div>
                <div style={{ height: "6px", borderRadius: "4px", background: "#1A1D22", overflow: "hidden" }}>
                  <div style={{ height: "6px", background: "#D5F879", width: `${pct}%` }}></div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", fontFamily: "'Geist Mono', monospace", fontSize: "12px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 9px", borderRadius: "7px", background: "#131519" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FF5A4E" }}></span>{site.red}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 9px", borderRadius: "7px", background: "#131519" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FFC53D" }}></span>{site.yellow}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 9px", borderRadius: "7px", background: "#131519" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4DA3FF" }}></span>{site.blue}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", paddingTop: "12px", borderTop: "1px solid #1A1D22", fontSize: "13px" }}>
                <span style={{ display: "inline-flex", gap: "14px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#3DDC84" }}>GSC</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: site.broken ? "#FF5A4E" : "#3DDC84" }}>WP</span>
                </span>
                <span style={{ color: "#9AA1AB" }}>{site.moves > 0 ? `${site.moves} move${site.moves === 1 ? "" : "s"} waiting` : "Nothing waiting"}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function AdminPreviewView() {
  return (
    <section className="dash-view extension-view">
      <Head eyebrow="PLATFORM OPERATOR" title="A view across workspaces." text="This screen is for platform administrators. Customer work stays in the workspace you just set up." />
      <div className="w-inset admin-note">Live customer data is not listed here. Operators use the admin tools after an admin sign-in.</div>
      <div className="w-actions"><Link className="w-button primary" href="/admin">Open admin tools</Link></div>
    </section>
  );
}

export function ResultsOutcomesView() {
  const { brief } = useWorkspaceSite();
  const [range, setRange] = useState(26);
  const [metric, setMetric] = useState("clicks");
  const [selected, setSelected] = useState("c5");

  // Sample data for the chart
  const sampleChanges = [
    { id: "c1", w: 31, type: "TITLE", what: "Flat roof title mentions Calgary", page: "/services/flat-roofs", result: "+71% clicks", lift: 18 },
    { id: "c2", w: 33, type: "IMAGES", what: "Alt text on 9 skylight photos", page: "/services/skylights", result: "+12% clicks", lift: 4 },
    { id: "c3", w: 35, type: "CONTENT", what: "Hail insurance guide refreshed for 2026", page: "/blog/hail-damage-insurance", result: "+152% clicks", lift: 26 },
    { id: "c4", w: 38, type: "META", what: "Description written for siding", page: "/services/siding", result: "Undone · −29% clicks", lift: -6 },
    { id: "c5", w: 41, type: "TITLE", what: "Inspection title: report in 24 hours", page: "/services/roof-inspection", result: "+155% clicks", lift: 30, date: "Aug 21" },
  ];

  const selectedChange = sampleChanges.find(c => c.id === selected) || sampleChanges[4];

  return (
    <section className="dash-view" style={{ background: "#0A0B0D", color: "#F2F4F5", padding: "28px clamp(16px, 4vw, 48px) 56px" }}>
      <header style={{ maxWidth: "1120px", width: "100%", margin: "0 auto 24px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "15px", fontWeight: "800", letterSpacing: "1.6px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3DDC84" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V5"></path><path d="M4 19h16"></path><path d="M8 15l4-4 3 3 5-6"></path></svg>
            RESULTS
          </span>
          <h1 style={{ margin: "0", fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "clamp(30px, 3.6vw, 44px)", lineHeight: "1.04", letterSpacing: "-1.2px", fontWeight: "700" }}>
            See what's working.
          </h1>
          <span style={{ fontSize: "15px", color: "#9AA1AB" }}>
            {brief.hostname || brief.siteUrl || "Your site"} · every shipped change is marked on the chart
          </span>
        </div>
        <div role="group" style={{ display: "inline-flex", padding: "4px", borderRadius: "12px", background: "#131519", border: "1px solid #262A31" }}>
          {[["13", "13 weeks"], ["26", "26 weeks"], ["52", "52 weeks"]].map(([val, label]) => (
            <button key={val} type="button" aria-pressed={range === Number(val)} onClick={() => setRange(Number(val))} style={{ minHeight: "38px", padding: "0 14px", borderRadius: "9px", border: "0", background: range === Number(val) ? "#262A31" : "transparent", color: range === Number(val) ? "#F2F4F5" : "#9AA1AB", fontSize: "14px", fontWeight: range === Number(val) ? "600" : "400" }}>{label}</button>
          ))}
        </div>
      </header>

      <section style={{ maxWidth: "1120px", width: "100%", margin: "0 auto 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "12px" }}>
        {[
          { label: "Clicks per week", value: "291", delta: "+64% since start", color: "#3DDC84" },
          { label: "Shown in Google", value: "8.2k", delta: "+58% since start", color: "#3DDC84" },
          { label: "Average spot", value: "#8.0", delta: "Was #12.6", color: "#3DDC84" },
          { label: "Calls & forms", value: "4", delta: "+133% since start", color: "#3DDC84" }
        ].map((k, i) => (
          <button key={i} type="button" onClick={() => setMetric(["clicks", "impr", "pos", "leads"][i])} aria-pressed={metric === ["clicks", "impr", "pos", "leads"][i]} style={{ textAlign: "left", color: "#F2F4F5", borderRadius: "18px", padding: "18px", background: metric === ["clicks", "impr", "pos", "leads"][i] ? "rgba(77,163,255,.08)" : "#101215", border: `1px solid ${metric === ["clicks", "impr", "pos", "leads"][i] ? "#4DA3FF" : "#1A1D22"}`, boxShadow: metric === ["clicks", "impr", "pos", "leads"][i] ? "0 0 22px rgba(77,163,255,.2)" : "none", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "13px", color: "#9AA1AB" }}>{k.label}</span>
            <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "34px", fontWeight: "800", letterSpacing: "-1px", lineHeight: "1" }}>{k.value}</span>
            <span style={{ fontSize: "13px", fontWeight: "600", color: k.color }}>{k.delta}</span>
          </button>
        ))}
      </section>

      <section style={{ maxWidth: "1120px", width: "100%", margin: "0 auto 24px", boxSizing: "border-box", borderRadius: "24px", background: "#101215", border: "1px solid #1A1D22", padding: "clamp(18px, 2.6vw, 28px)", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <h2 style={{ margin: "0", fontSize: "17px", fontWeight: "600" }}>Clicks per week</h2>
          <span style={{ display: "inline-flex", gap: "14px", flexWrap: "wrap", fontSize: "12px", color: "#9AA1AB" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><span style={{ width: "14px", height: "3px", borderRadius: "2px", background: "#3DDC84" }}></span>Clicks</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><span style={{ width: "14px", borderTop: "2px dashed #5B616B" }}></span>Average before Searchify</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#4DA3FF" }}></span>Change shipped</span>
          </span>
        </div>
        <div style={{ width: "100%", height: "300px", background: "#0A0B0D", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "#7D848E" }}>
          Chart visualization area · {range} weeks · {metric}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", padding: "14px 16px", borderRadius: "16px", background: "#0A0B0D", border: "1px solid #4DA3FF" }}>
          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", padding: "3px 8px", borderRadius: "6px", background: "#1A1D22", color: "#D7DADE" }}>{selectedChange.type}</span>
          <span style={{ flex: "1 1 260px", minWidth: "0", display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedChange.what}</span>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "12px", color: "#9AA1AB" }}>{selectedChange.page} · shipped {selectedChange.date || "recently"}</span>
          </span>
          <span style={{ fontSize: "14px", fontWeight: "600", color: "#3DDC84" }}>{selectedChange.result}</span>
          <Link href="/app/history" style={{ fontSize: "13px", color: "#9AA1AB", textDecoration: "none" }}>Open in change log →</Link>
        </div>
        <span style={{ fontSize: "12px", color: "#7D848E" }}>Tap any blue dot to see the change. Sources: Search Console (clicks, impressions, position) and Analytics (calls and form fills).</span>
      </section>

      <section style={{ maxWidth: "1120px", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: "10px" }}>
        <h2 style={{ margin: "0", fontSize: "17px", fontWeight: "600" }}>What moved the needle</h2>
        <div style={{ borderRadius: "20px", background: "#101215", border: "1px solid #1A1D22", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2.4fr) minmax(0, 1.4fr) 90px 160px", gap: "12px", padding: "12px 18px", fontFamily: "'Geist Mono', monospace", fontSize: "11px", color: "#7D848E", borderBottom: "1px solid #1A1D22" }}>
            <span>CHANGE</span><span>PAGE</span><span>SHIPPED</span><span style={{ textAlign: "right" }}>RESULT (28 DAYS)</span>
          </div>
          {sampleChanges.filter(c => c.lift > 0).map((t) => (
            <div key={t.id} style={{ display: "grid", gridTemplateColumns: "minmax(0, 2.4fr) minmax(0, 1.4fr) 90px 160px", gap: "12px", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid #16181C", fontSize: "14px" }}>
              <span style={{ minWidth: "0" }}>{t.what}</span>
              <span style={{ minWidth: "0", fontFamily: "'Geist Mono', monospace", fontSize: "12px", color: "#9AA1AB", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.page}</span>
              <span style={{ fontSize: "13px", color: "#9AA1AB" }}>{t.date || "—"}</span>
              <span style={{ textAlign: "right", fontWeight: "600", color: "#3DDC84" }}>{t.result}</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

export function CommandView() {
  const [filter, setFilter] = useState("all");
  const [status, setStatus] = useState({});
  const [fixed, setFixed] = useState({});
  const [sent, setSent] = useState({});

  // Legacy preview stub — live agency queue is CommandScreen at /app/command.
  const queue = [];

  const COLORS = { red: "#FF5A4E", yellow: "#FFC53D" };
  const shown = queue.filter(q => (filter === "all" || q.c === filter) && !status[q.id]);
  const open = queue.filter(q => !status[q.id]);
  const lowOpen = open.filter(q => q.low);
  const approved = queue.filter(q => status[q.id] === "approved").length;

  const approveLowRisk = () => {
    const newStatus = { ...status };
    lowOpen.forEach(q => { newStatus[q.id] = "approved"; });
    setStatus(newStatus);
  };

  return (
    <section className="dash-view" style={{ background: "#0A0B0D", color: "#F2F4F5", padding: "28px clamp(16px, 4vw, 48px) 56px" }}>
      <header style={{ maxWidth: "1120px", width: "100%", margin: "0 auto 24px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "15px", fontWeight: "800", letterSpacing: "1.6px" }}>AGENCY COMMAND CENTRE</span>
          <h1 style={{ margin: "0", fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "clamp(30px, 3.6vw, 44px)", lineHeight: "1.04", letterSpacing: "-1.2px", fontWeight: "700" }}>
            {open.length ? `${open.length} moves waiting across your clients.` : "Everything is approved. Nice work."}
          </h1>
          <span style={{ fontSize: "15px", color: "#9AA1AB" }}>
            Legacy stub · use <Link href="/app/command" style={{ color: "#4DA3FF" }}>/app/command</Link> for live data
          </span>
        </div>
        {lowOpen.length > 0 && (
          <button type="button" onClick={approveLowRisk} style={{ minHeight: "52px", padding: "0 22px", borderRadius: "14px", border: "0", background: "#4DA3FF", color: "#0A0B0D", fontSize: "15px", fontWeight: "600", boxShadow: "0 0 22px rgba(77,163,255,.45)" }}>
            Approve all low-risk ({lowOpen.length})
          </button>
        )}
      </header>

      <section style={{ maxWidth: "1120px", width: "100%", margin: "0 auto 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
        {[
          { label: "Moves waiting", value: String(open.length), sub: approved ? `${approved} approved today` : "across multiple clients", color: "#4DA3FF", border: "#1A1D22" },
          { label: "Broken connections", value: "0", sub: "All cables live", color: "#3DDC84", border: "#1A1D22" },
          { label: "Reports due this week", value: "3", sub: "Thursday and Friday", color: "#FFC53D", border: "#1A1D22" },
          { label: "Clients improving", value: "5 of 6", sub: "clicks up over 30 days", color: "#3DDC84", border: "#1A1D22" }
        ].map((s, i) => (
          <div key={i} style={{ borderRadius: "18px", padding: "18px", background: "#101215", border: `1px solid ${s.border}`, display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#9AA1AB" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.color, boxShadow: `0 0 8px ${s.color}` }}></span>
              {s.label}
            </span>
            <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "34px", fontWeight: "800", letterSpacing: "-1px", lineHeight: "1" }}>{s.value}</span>
            <span style={{ fontSize: "13px", color: "#7D848E" }}>{s.sub}</span>
          </div>
        ))}
      </section>

      <div style={{ maxWidth: "1120px", width: "100%", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-start" }}>
        <section style={{ flex: "2 1 520px", minWidth: "0", borderRadius: "22px", background: "#101215", border: "1px solid #1A1D22", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
            <h2 style={{ margin: "0", fontSize: "17px", fontWeight: "600" }}>Waiting for your approval</h2>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {[["all", "All", "#9AA1AB"], ["red", "Dire", "#FF5A4E"], ["yellow", "Medium", "#FFC53D"]].map(([id, label, color]) => {
                const count = queue.filter(q => (id === "all" || q.c === id) && !status[q.id]).length;
                const on = filter === id;
                return (
                  <button key={id} type="button" aria-pressed={on} onClick={() => setFilter(id)} style={{ display: "inline-flex", alignItems: "center", gap: "6px", minHeight: "34px", padding: "0 12px", borderRadius: "999px", border: `1px solid ${on ? color : "#262A31"}`, background: on ? `rgba(${color === "#9AA1AB" ? "154,161,171" : color === "#FF5A4E" ? "255,90,78" : "255,197,61"},.14)` : "transparent", color: on ? "#F2F4F5" : "#D7DADE", fontSize: "13px", fontWeight: on ? "600" : "400", boxShadow: on ? `0 0 14px rgba(${color === "#9AA1AB" ? "154,161,171" : color === "#FF5A4E" ? "255,90,78" : "255,197,61"},.4)` : "none" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }}></span>
                    {label} {count}
                  </button>
                );
              })}
            </div>
          </div>
          {shown.map((q) => {
            const s = status[q.id];
            return (
              <div key={q.id} style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", padding: "12px 14px", borderRadius: "14px", background: s === "approved" ? "rgba(61,220,132,.06)" : "#0A0B0D", border: `1px solid ${s === "approved" ? "rgba(61,220,132,.35)" : "#1A1D22"}` }}>
                <span style={{ width: "10px", height: "10px", flex: "none", borderRadius: "50%", background: COLORS[q.c], boxShadow: `0 0 8px ${COLORS[q.c]}` }}></span>
                <span style={{ flex: "1 1 240px", minWidth: "0", display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontSize: "12px", color: "#9AA1AB" }}>{q.client}<span style={{ color: "#3A404A" }}> · </span><span style={{ fontFamily: "'Geist Mono', monospace" }}>{q.page}</span></span>
                  <span style={{ fontSize: "15px", fontWeight: "500" }}>{q.what}</span>
                </span>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#D5F879", whiteSpace: "nowrap" }}>{q.gain}</span>
                {q.low && !s && <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "10px", padding: "3px 7px", borderRadius: "6px", border: "1px solid #262A31", color: "#9AA1AB" }}>LOW RISK</span>}
                {!s ? (
                  <span style={{ display: "flex", gap: "8px" }}>
                    <button type="button" onClick={() => setStatus({ ...status, [q.id]: "skipped" })} style={{ minHeight: "38px", padding: "0 14px", borderRadius: "11px", border: "1px solid #262A31", background: "transparent", color: "#F2F4F5", fontSize: "13px" }}>Skip</button>
                    <button type="button" onClick={() => setStatus({ ...status, [q.id]: "approved" })} style={{ minHeight: "38px", padding: "0 16px", borderRadius: "11px", border: "0", background: "#4DA3FF", color: "#0A0B0D", fontSize: "13px", fontWeight: "600", boxShadow: "0 0 14px rgba(77,163,255,.4)" }}>Approve</button>
                  </span>
                ) : (
                  <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: s === "approved" ? "#3DDC84" : "#9AA1AB" }}>{s === "approved" ? "Approved · ships tonight" : "Skipped for now"}</span>
                    <button type="button" onClick={() => setStatus({ ...status, [q.id]: undefined })} style={{ minHeight: "34px", padding: "0 12px", borderRadius: "10px", border: "1px solid #262A31", background: "transparent", color: "#9AA1AB", fontSize: "12px" }}>Undo</button>
                  </span>
                )}
              </div>
            );
          })}
          <span style={{ fontSize: "12px", color: "#7D848E" }}>Approved moves ship tonight, are checked live, and land in each client's change log and monthly report.</span>
        </section>

        <aside style={{ flex: "1 1 340px", minWidth: "0", display: "flex", flexDirection: "column", gap: "16px" }}>
          <section style={{ borderRadius: "22px", background: "#101215", border: "1px solid #1A1D22", padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <h2 style={{ margin: "0", fontSize: "17px", fontWeight: "600" }}>Needs attention</h2>
            <div style={{ fontSize: "14px", color: "#9AA1AB", textAlign: "center", padding: "20px" }}>All clear · no urgent alerts</div>
          </section>

          <section style={{ borderRadius: "22px", background: "#101215", border: "1px solid #1A1D22", padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <h2 style={{ margin: "0", fontSize: "17px", fontWeight: "600" }}>Reports due this week</h2>
            <div style={{ fontSize: "14px", color: "#9AA1AB", textAlign: "center", padding: "20px" }}>
              Open <Link href="/app/command" style={{ color: "#4DA3FF" }}>Agency command centre</Link> for live reports.
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
