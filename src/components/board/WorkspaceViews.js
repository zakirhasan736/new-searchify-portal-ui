"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ConnectDialog, { useConnectionStatus } from "@/components/board/ConnectDialog";
import PropertyPicker from "@/components/board/PropertyPicker";
import { buildAuditFindings } from "@/lib/auditFindings";
import { breadthKey, BREADTH_LABELS, loadGuardrails, saveGuardrails } from "@/lib/guardrails";
import SampleQueue from "@/components/board/SampleQueue";
import SiteDrafts from "@/components/board/SiteDrafts";
import { useBusinessBrief, useWorkspaceSite } from "@/components/board/useBusinessBrief";
import { starterKeywords, starterPrompts } from "@/lib/businessBrief";
import { PLANS, activeJourneySite, assignGoogleAccount, beginAnotherWebsite, choosePlan, loadJourney, markConnection, planById, readySites, removeJourneySite, websiteLabel } from "@/lib/journey";
import { completionEntries, recordActivity } from "@/lib/previewQueue";
import {
  createChange,
  deleteCmsConnection,
  disconnectGoogle,
  generateMetaCopy,
  getGoogleStatus,
  listChanges,
  listCmsConnections,
  loadFeature,
  removeGoogleAccount,
  researchAudit,
  researchBacklinks,
  researchKeywords,
  researchVisibility,
  startGoogleOAuth,
  useGoogleAccount,
} from "@/lib/v1Api";

function providerNote(res, fallback) {
  return typeof res?.data?.detail === "string" ? res.data.detail : fallback;
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
  const [live, setLive] = useState(0);
  return (
    <section className="dash-view" id="view-approvals">
      <div className="subview-head">
        <div className="dash-eyebrow">YOUR NEXT DECISIONS</div>
        <h1>Needs human approval.</h1>
        <p>{brief.ready ? `These drafts follow ${brief.focus || brief.hostname || "your setup"}. Every live website change stays paused until you approve it.` : "Every live website change stays paused until you approve it."}</p>
      </div>
      <SiteDrafts site={site} brief={brief} onCount={setLive} />
      {live ? null : (
        <div id="approval-queue-home">
          <SampleQueue site={site} />
        </div>
      )}
    </section>
  );
}

export function ConnectionsView() {
  const params = useSearchParams();
  const [status, refresh] = useConnectionStatus();
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

  return (
    <section className="dash-view extension-view">
      <Head eyebrow="SETUP, AT YOUR PACE" title="Connect your evidence." text="Skipped a connection during setup? Finish it here. You control each website and property." />
      {message ? <p className="w-inset">{message}</p> : null}
      <div className="w-card-grid">
        {[
          ["wordpress", "W", "WordPress", status.wordpress, "Publish approved titles and descriptions."],
          ["gsc", "G", "Search Console", status.gsc, "Queries, pages, clicks, and impressions."],
          ["ga", "A", "Google Analytics", status.ga, "Organic traffic next to the work you approve."],
        ].map(([id, mark, title, on, body]) => (
          <article className="w-panel connector" key={id}>
            <span className="connector-mark">{mark}</span>
            <span className={`w-pill${on ? " good" : ""}`}>{on ? "Connected" : "Not connected"}</span>
            <h2>{title}</h2>
            <p>{body}</p>
            {id === "wordpress" && status.wordpressUrl ? <small>{status.wordpressUrl}</small> : null}
            {id === "gsc" && status.google?.gscSiteUrl ? <small>{status.google.gscSiteUrl}</small> : null}
            {id === "ga" && (status.google?.ga4PropertyName || status.google?.ga4PropertyId) ? <small>{status.google.ga4PropertyName || status.google.ga4PropertyId}</small> : null}
            <div className="w-actions">
              <button className="w-button primary" type="button" onClick={() => setDialog(id)}>{on ? "Manage" : `Connect ${title}`}</button>
              {on && id === "wordpress" ? <button className="w-button" type="button" onClick={disconnectWp}>Disconnect</button> : null}
              {on && id !== "wordpress" ? <button className="w-button" type="button" onClick={disconnectG}>Disconnect Google</button> : null}
            </div>
          </article>
        ))}
      </div>
      {status.google?.connected || params.get("google") === "connected" ? (
        <PropertyPicker
          google={status.google}
          cmsConnectionId={status.wordpressId}
          siteLabel={status.wordpressUrl}
          onSaved={(connection) => {
            if (connection?.gscSiteUrl) markConnection("gsc", "Connected");
            if (connection?.ga4PropertyId) markConnection("ga", "Connected");
            refresh();
          }}
        />
      ) : null}
      <LiveEvidence gsc={status.gsc} ga={status.ga} />
      <div className="w-panel below">
        <h2>What happens after connecting?</h2>
        <ol className="w-steps">
          <li>Choose your website or property.</li>
          <li>Review the requested permissions.</li>
          <li>Verify the connection, then gather a baseline.</li>
          <li>Review suggested improvements before any live change.</li>
        </ol>
      </div>
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
  const [allowance, setAllowance] = useState(25);
  const [form, setForm] = useState({ term: "", country: "Canada", device: "Mobile", page: "" });
  const [live, setLive] = useState(null);
  const [liveBusy, setLiveBusy] = useState(false);
  const [liveNote, setLiveNote] = useState("");

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
        live: true,
      };
    });
  };

  const fetchLive = async (rows, force = false) => {
    if (!brief.siteUrl) return;
    setLiveBusy(true);
    setLiveNote("");
    const res = await researchKeywords({ site: brief.siteUrl, terms: rows.map((row) => row.term), country: brief.market || rows[0]?.country || "", force });
    setLiveBusy(false);
    if (!res.ok) {
      setLiveNote(providerNote(res, "Live keyword data could not be loaded."));
      return;
    }
    setLive(res.data);
    setKeywords((current) => applyLive(current, res.data));
  };

  useEffect(() => {
    if (!key) return;
    setAllowance(planById(loadJourney().planId)?.keywords || 25);
    const saved = rowsFor("keywords", key).map((row) => ({
      id: row.id || Date.now(),
      term: row.term || "",
      rank: asNumber(row.rank),
      previous: asNumber(row.previous),
      volume: asNumber(row.volume),
      page: row.page || "",
      country: row.country || "Canada",
      device: row.device || "Mobile",
      sample: false,
    })).filter((row) => row.term);
    const rows = [...starterKeywords(brief), ...saved];
    setKeywords(rows);
    setLive(null);
    fetchLive(rows);
  }, [briefKey]);

  const trackIdea = (idea) => {
    if (keywords.some((item) => item.term.toLowerCase() === idea.keyword.toLowerCase())) return;
    if (keywords.length >= allowance) {
      setNotice("Keyword limit reached. Review subscription options.");
      return;
    }
    const next = [...keywords, {
      id: Date.now(),
      term: idea.keyword,
      country: live?.location || "United States",
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
    setForm({ term: "", country: "Canada", device: "Mobile", page: "" });
  };

  const removeKeyword = (id) => {
    const next = keywords.filter((item) => item.id !== id);
    setKeywords(next);
    persistExtras(next);
    setOpen(null);
  };

  return (
    <section className="dash-view extension-view">
      <Head eyebrow="SEARCH DEMAND" title="Know what to target." text={live ? `Google positions and monthly volume for ${live.host} in ${live.location}, from DataForSEO.` : brief.ready ? `Starting terms for ${brief.focus || brief.hostname}. Positions fill in when live keyword data loads.` : "Finish setup to fill this list from your offer and market. You can still add a term yourself."} action={<button className="w-button primary" type="button" onClick={() => { setNotice(""); setAdding(true); }}>Add keyword</button>} />
      <div className="w-metrics">
        <Metric label="Tracked" value={String(keywords.length)} note={`${allowance} included in the selected plan`} />
        <Metric label="Top 10" value={String(topTen)} note={live ? "Tracked terms in Google's top 10" : "Counted only when a position exists"} />
        <Metric label="Ranking now" value={live ? String(live.ranked?.length || 0) : "—"} note={live ? "Searches this site already appears for" : "Loads with live data"} />
        <Metric label="Improving" value={String(improving)} note="Moved up since the last update" />
      </div>
      {liveBusy ? <div className="audit-loading" role="status"><span className="audit-loading-mark" aria-hidden="true" /><strong>Loading live keyword data</strong><p>Positions, volume, and ideas for {brief.hostname || "this website"}.</p></div> : null}
      {liveNote ? <p className="w-inset" role="status">{liveNote}</p> : null}
      <div className="w-panel">
        <div className="w-toolbar">
          <label>Find a keyword<input id="keyword-filter" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tracked terms…" type="search" /></label>
          <span className="w-muted">{live ? `Updated ${fetchedLabel(live.fetchedAt)} · ${live.location}` : brief.market ? `Location from setup: ${brief.market}` : "Location: add it in setup"}</span>
          <button className="w-button" type="button" disabled={liveBusy || !brief.siteUrl} onClick={() => fetchLive(keywords, true)}>Refresh live data</button>
          <button className="w-button" type="button" onClick={() => exportKeywords(shown)}>Export CSV</button>
        </div>
        <div className="table-scroll" id="keyword-rows">
          <table className="w-table">
            <thead><tr><th>Keyword</th><th>Position</th><th>Change</th><th>Monthly volume</th><th>Target page</th><th>Action</th></tr></thead>
            <tbody>
              {shown.map((item) => {
                const change = keywordChange(item);
                return (
                  <tr key={item.id}>
                    <td data-label="Keyword"><strong>{item.term}</strong><small>{item.country} · {item.device}</small></td>
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
      </div>
      {live?.ranked?.length ? (
        <div className="w-panel below">
          <div className="w-toolbar"><strong>Already ranking</strong><span className="w-muted">Searches where {live.host} appears in Google today</span></div>
          <div className="table-scroll">
            <table className="w-table">
              <thead><tr><th>Search</th><th>Position</th><th>Monthly volume</th><th>Page</th><th>Action</th></tr></thead>
              <tbody>
                {live.ranked.slice(0, 20).map((row) => (
                  <tr key={`r-${row.keyword}`}>
                    <td data-label="Search"><strong>{row.keyword}</strong><small>{row.intent || "intent unknown"}</small></td>
                    <td data-label="Position">{row.position ?? "—"}</td>
                    <td data-label="Volume">{volumeLabel(row.volume)}</td>
                    <td data-label="Page">{row.page || "—"}</td>
                    <td data-label=""><button className="w-button" type="button" onClick={() => trackIdea(row)}>{keywords.some((k) => k.term.toLowerCase() === row.keyword.toLowerCase()) ? "Tracked" : "Track"}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      {live?.ideas?.length ? (
        <div className="w-panel below">
          <div className="w-toolbar"><strong>Keyword ideas</strong><span className="w-muted">Related searches with real monthly volume</span></div>
          <div className="table-scroll">
            <table className="w-table">
              <thead><tr><th>Idea</th><th>Monthly volume</th><th>Difficulty</th><th>Intent</th><th>Action</th></tr></thead>
              <tbody>
                {live.ideas.slice(0, 15).map((row) => (
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
        </div>
      ) : null}
      {notice ? <p className="w-footnote">{notice}</p> : null}
      <p className="w-footnote">{live ? `Positions, volume, difficulty, and ideas come from DataForSEO for ${live.location}. "Not in top 100" means the site does not rank for that search yet. Data is reused for 24 hours unless you refresh it.` : brief.ready ? `These starting terms come from your setup for ${brief.hostname || "this website"}. Rank and volume stay empty until live keyword data loads. Nothing here is invented.` : "No setup answers yet, so this list does not invent a sample business. Add your website, offer, and market, or type a term yourself."}</p>
      {adding ? (
        <Modal title="Track a keyword" onClose={() => setAdding(false)}>
          <form onSubmit={add}>
            <label>Search phrase<input value={form.term} onChange={(event) => setForm({ ...form, term: event.target.value })} maxLength={120} required placeholder={brief.market ? `e.g. ${brief.businessType || "service"} ${brief.market}` : "e.g. your service and city"} /></label>
            <div className="form-grid">
              <label>Country<select value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })}><option>Canada</option><option>United States</option><option>United Kingdom</option></select></label>
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

  useEffect(() => {
    if (!key) return undefined;
    let cancelled = false;
    setAllowance(planById(loadJourney().planId)?.prompts || 5);
    const saved = rowsFor("prompts", key).map((row, index) => ({ ...asPrompt({ ...row, mention: row.mention }, index), ...(row.live ? { live: true, sources: row.sources || [], checkedAt: row.checkedAt || "", modelName: row.modelName || "" } : {}) })).filter((row) => row.text);
    const savedTexts = new Set(saved.map((row) => row.text.toLowerCase()));
    const prepared = starterPrompts(brief).filter((row) => !savedTexts.has(row.text.toLowerCase()));
    setPrompts([...prepared, ...saved]);
    setSample(!saved.some((row) => row.live));
    loadFeature("ai-search").then((res) => {
      if (cancelled) return;
      const stored = rowsOf(res.data).map(asPrompt).filter(Boolean);
      if (stored.length) {
        setPrompts([...stored, ...saved]);
        setSample(false);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [briefKey]);

  const persistExtras = (next) => {
    saveRows("prompts", key, next.filter((item) => !item.sample));
  };

  const shown = prompts.filter((item) => model === "All engines" || item.model === model);
  const checked = prompts.filter((item) => item.mention !== null);
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
    let next = prompts;
    setNotice("");
    for (let index = 0; index < queue.length; index += 1) {
      const item = queue[index];
      setChecking(`Asking ${item.model} · ${index + 1} of ${queue.length}`);
      const res = await researchVisibility({
        site: brief.siteUrl,
        brand: (brief.hostname || "").split(".")[0],
        country: brief.market,
        prompts: [{ id: String(item.id), text: item.text, engine: item.model }],
        force,
      });
      if (!res.ok) {
        setNotice(providerNote(res, "The live check could not run."));
        break;
      }
      const hit = (res.data.results || [])[0];
      if (!hit) continue;
      next = next.map((row) => (row.id === item.id ? {
        ...row,
        mention: hit.mention,
        citation: hit.citation || "",
        snippet: hit.snippet || "",
        sources: hit.sources || [],
        modelName: hit.model || "",
        checkedAt: hit.fetchedAt || "",
        sample: false,
        live: true,
      } : row));
      setPrompts(next);
      persistExtras(next);
    }
    setChecking("");
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
      <Head eyebrow="ANSWER ENGINE MONITORING" title="Are you in the answer?" text={brief.ready ? `Questions a customer might ask about ${brief.focus || brief.hostname}. Run live checks to ask ChatGPT, Gemini, and Perplexity and see if ${brief.hostname || "the site"} is named or cited.` : "Finish setup and these questions follow your offer and market."} action={<button className="w-button primary" type="button" onClick={() => setAdding(true)}>Add prompt</button>} />
      <div className="w-metrics">
        <Metric label="Brand mentions" value={`${mentioned} / ${checked.length}`} note={sample ? "No live checks yet" : "Named in the live answers"} />
        <Metric label="Citations" value={String(citations)} note={sample ? "No live checks yet" : "Answers that link to the site"} />
        <Metric label="Prompt coverage" value={String(prompts.length)} note={`${allowance} included in the selected plan`} />
      </div>
      {checking ? <div className="audit-loading" role="status"><span className="audit-loading-mark" aria-hidden="true" /><strong>{checking}</strong><p>Each answer can take up to a minute. Keep this page open.</p></div> : null}
      {notice ? <p className="w-inset" role="status">{notice}</p> : null}
      <div className="w-panel">
        <div className="w-toolbar">
          <label>Answer engine
            <select id="model-filter" value={model} onChange={(event) => setModel(event.target.value)}>
              <option>All engines</option>
              <option>ChatGPT</option>
              <option>Gemini</option>
              <option>Perplexity</option>
            </select>
          </label>
          <button className="w-button primary" type="button" disabled={Boolean(checking)} onClick={() => runChecks(false)}>Run live checks</button>
          <button className="w-button" type="button" disabled={Boolean(checking)} onClick={() => runChecks(true)}>Check again</button>
        </div>
        <div className="table-scroll" id="visibility-rows">
          <table className="w-table">
            <thead><tr><th>Prompt</th><th>Engine</th><th>Mention</th><th>Citation</th><th>Evidence</th></tr></thead>
            <tbody>
              {shown.map((item) => (
                <tr key={item.id}>
                  <td data-label="Prompt">{item.text}</td>
                  <td data-label="Engine">{item.model}</td>
                  <td data-label="Mention"><span className={`w-pill ${item.mention ? "good" : ""}`.trim()}>{mentionLabel(item.mention)}</span></td>
                  <td data-label="Citation">{item.citation || "—"}</td>
                  <td data-label=""><button className="w-button" type="button" onClick={() => setOpen(item)}>View response</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="w-footnote">{sample ? `Prepared from your setup${brief.hostname ? ` for ${brief.hostname}` : ""}. "Not checked" means the question has not been asked yet. Each live check uses one lookup from today's research limit.` : "Live answers through DataForSEO, with web search on. Answers can change with the model, wording, location, and day. A check is reused for 7 days unless you check again."}</p>
      {adding ? (
        <Modal title="Add a visibility prompt" onClose={() => setAdding(false)}>
          <form onSubmit={add}>
            <label>Customer question<input value={text} onChange={(event) => setText(event.target.value)} maxLength={200} required placeholder="Who offers…?" /></label>
            <label>Answer engine<select value={engine} onChange={(event) => setEngine(event.target.value)}><option>ChatGPT</option><option>Gemini</option><option>Perplexity</option></select></label>
            <p className="w-footnote">New questions stay unchecked until you run live checks.</p>
            <button className="w-button primary" type="submit">Add prompt</button>
          </form>
        </Modal>
      ) : null}
      {open ? (
        <Modal title="Prompt evidence" onClose={() => setOpen(null)}>
          <blockquote>{open.text}</blockquote>
          <p>{open.model}{open.modelName ? ` · ${open.modelName}` : ""} · {open.live ? `Checked ${fetchedLabel(open.checkedAt)}` : open.mention === null ? "Not checked" : "Earlier sample"}</p>
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
  const [links, setLinks] = useState([]);
  const [sample, setSample] = useState(true);
  const [filter, setFilter] = useState("All links");
  const [open, setOpen] = useState(null);
  const [live, setLive] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const fetchLive = async (force = false) => {
    if (!brief.siteUrl) return;
    setBusy(true);
    setNote("");
    const res = await researchBacklinks({ site: brief.siteUrl, force });
    setBusy(false);
    if (!res.ok) {
      setNote(providerNote(res, "Live backlink data could not be loaded."));
      return;
    }
    setLive(res.data);
    setLinks((res.data.links || []).map((link, index) => ({ id: index + 1, ...link })));
    setSample(false);
  };

  useEffect(() => {
    setLive(null);
    setLinks([]);
    loadFeature("backlinks").then((res) => {
      const stored = rowsOf(res.data).map(asLink).filter((link) => link.domain);
      if (stored.length) {
        setLinks(stored);
        setSample(false);
      }
    }).catch(() => {});
    fetchLive();
  }, [brief.siteUrl]);
  const shown = links.filter((link) => filter === "All links" || link.state === filter);
  const domains = live?.summary?.referringDomains ?? new Set(links.map((link) => link.domain)).size;
  const newer = links.filter((link) => link.state === "New").length;
  const lost = links.filter((link) => link.state === "Lost").length;
  return (
    <section className="dash-view extension-view">
      <Head eyebrow="OFF-SITE SIGNALS" title="See who points to you." text={live ? `Links pointing to ${live.host}, from the DataForSEO link index.` : brief.hostname ? `Links that point to ${brief.hostname} show up here when live link data loads. None are invented from the setup answers.` : "Links show up here after a link source is connected. Setup answers do not invent referring domains."} action={<button className="w-button" type="button" onClick={() => exportLinks(shown)}>Export CSV</button>} />
      <div className="w-metrics">
        <Metric label="Referring domains" value={Number(domains || 0).toLocaleString("en-US")} note={live ? "Whole link index" : links.length ? "Unique domains in this list" : "None stored yet"} />
        <Metric label="Backlinks" value={live?.summary?.backlinks == null ? "—" : Number(live.summary.backlinks).toLocaleString("en-US")} note={live ? "All links to the site" : "Loads with live data"} />
        <Metric label="New links" value={String(newer)} note={links.length ? "In the list below" : "Waiting for a link source"} />
        <Metric label="Lost links" value={String(lost)} note="Verify before outreach" />
      </div>
      {busy ? <div className="audit-loading" role="status"><span className="audit-loading-mark" aria-hidden="true" /><strong>Loading live backlink data</strong><p>Referring domains for {brief.hostname || "this website"}.</p></div> : null}
      {note ? <p className="w-inset" role="status">{note}</p> : null}
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
          <span className="w-muted">{live ? `One link per domain · updated ${fetchedLabel(live.fetchedAt)}` : links.length ? (sample ? "Stored list" : "Stored provider snapshot") : `No links stored${brief.hostname ? ` for ${brief.hostname}` : ""}`}</span>
          <button className="w-button" type="button" disabled={busy || !brief.siteUrl} onClick={() => fetchLive(true)}>Refresh live data</button>
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
              {shown.map((link) => (
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
      </div>
      <div className="w-inset below">A lost link is a review cue. Searchify should verify the source page before suggesting outreach or a redirect; it should not automatically disavow links.</div>
      {open ? (
        <Modal title="Inspect backlink" onClose={() => setOpen(null)}>
          <dl className="detail-list">
            <dt>Source · {live ? "live index" : sample ? "example" : "stored"}</dt><dd>{open.source || open.domain}</dd>
            <dt>Target</dt><dd>{open.target}</dd>
            <dt>Anchor</dt><dd>{open.anchor}</dd>
            <dt>Relationship</dt><dd>{open.follow}</dd>
            <dt>Status</dt><dd>{open.state}</dd>
          </dl>
          <p>{open.state === "Lost" ? "Recheck the source page before contacting the publisher." : "Review the source page and relevance before making an outreach decision."}</p>
          {live && open.source ? <a className="w-button" href={open.source} target="_blank" rel="noopener noreferrer">Open the linking page</a> : null}
          <p className="w-footnote">{sample ? "The .example domains are reserved sample names; there is no live link to open." : open.seen || "Stored from the link index. Confirm the source page before outreach."}</p>
        </Modal>
      ) : null}
    </section>
  );
}

function severityClass(severity) {
  if (severity === "Critical") return "danger";
  if (severity === "Warning") return "warn";
  return "";
}

export function AuditView() {
  const router = useRouter();
  const brief = useBusinessBrief();
  const [filter, setFilter] = useState("All severities");
  const [findings, setFindings] = useState([]);
  const [report, setReport] = useState(null);
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [base, setBase] = useState(null);
  const [crawl, setCrawl] = useState(null);
  const [crawlNote, setCrawlNote] = useState("");
  const [crawlBusy, setCrawlBusy] = useState(false);
  const poll = useRef(null);
  const alive = useRef(true);

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

  const runCrawl = async (force = false) => {
    if (!brief.siteUrl) return;
    clearTimeout(poll.current);
    setCrawlBusy(true);
    setCrawlNote("");
    const res = await researchAudit({ site: brief.siteUrl, force });
    setCrawlBusy(false);
    if (!res.ok) {
      setCrawlNote(providerNote(res, "The site crawl could not run."));
      return;
    }
    if (!alive.current) return;
    setCrawl(res.data);
    if (res.data.state === "crawling") poll.current = setTimeout(() => runCrawl(false), 10000);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    alive.current = true;
    setCrawl(null);
    runCrawl(false);
    return () => {
      alive.current = false;
      clearTimeout(poll.current);
    };
  }, [brief.siteUrl]);
  useEffect(() => {
    if (!base) return;
    const next = buildAuditFindings({ ...base, crawl });
    setFindings(next.findings);
    setReport(next.report);
  }, [base, crawl]);

  const crawling = crawl?.state === "crawling";

  const shown = findings.filter((item) => filter === "All severities" || item.severity === filter);
  const critical = findings.filter((item) => item.severity === "Critical").length;

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
          <Metric label="Site health" value={report?.health == null ? "—" : String(Math.round(report.health))} note={report?.health == null ? "Loads with the site crawl" : "DataForSEO, out of 100"} />
          <Metric label="SEO score" value={report?.seoScore || "—"} note="PageSpeed, home page" />
          <Metric label="Pages crawled" value={report?.crawled ? String(report.crawled) : "—"} note={report?.crawled ? "Whole site" : "Loads with the site crawl"} />
          <Metric label="Critical findings" value={String(critical)} note={`${findings.length} findings in total`} />
        </div>
      )}
      <p className="w-footnote">
        {loading
          ? "Loading audit data for the selected website."
          : report?.sources?.length
            ? `This report uses ${report.sources.join(", ")}. A score is context. The action is the suggested title and description.`
            : "Connect Search Console, Analytics, PageSpeed, and Places, then sync. Findings appear here from those sources."}
      </p>
      {crawling ? (
        <div className="audit-loading" role="status">
          <span className="audit-loading-mark" aria-hidden="true" />
          <strong>Crawling {crawl.host} · {crawl.crawled || 0} of up to {crawl.maxPages} pages</strong>
          <p>A full crawl usually takes a few minutes. You can leave this page; it keeps running.{crawl.report ? " The findings below are from the last crawl." : ""}</p>
        </div>
      ) : null}
      {crawlNote ? <p className="w-inset" role="status">{crawlNote}</p> : null}
      {note ? <p className="w-inset">{note}</p> : null}
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
              <option>Critical</option>
              <option>Warning</option>
              <option>Notice</option>
            </select>
          </label>
          <span className="w-muted">{crawl?.fetchedAt ? `Site crawled ${fetchedLabel(crawl.fetchedAt)}` : findings.length ? "Live findings from the connected sources" : "No findings stored yet"}</span>
          <button className="w-button" type="button" disabled={crawlBusy || crawling || !brief.siteUrl} onClick={() => runCrawl(true)}>{crawling ? "Crawling…" : "Crawl the site again"}</button>
        </div>
        <div className="table-scroll">
          <table className="w-table">
            <thead><tr><th>Severity</th><th>Finding</th><th>Affected pages / items</th><th>Action</th></tr></thead>
            <tbody>
              {shown.length ? shown.map((item) => (
                <tr key={item.id}>
                  <td data-label="Severity"><span className={`w-pill ${severityClass(item.severity)}`.trim()}>{item.severity}</span></td>
                  <td data-label="Finding"><strong>{item.name}</strong><small>{item.manual ? "Manual investigation" : "Metadata draft supported"}</small></td>
                  <td data-label="Pages">{item.count}</td>
                  <td data-label=""><button className="w-button" type="button" onClick={() => setOpen(item)}>{item.changeId ? "View queued finding" : "View finding"}</button></td>
                </tr>
              )) : <tr><td className="app-span" colSpan={4} data-label="">No findings for this filter. Sync Google, then generate titles from the overview.</td></tr>}
            </tbody>
          </table>
        </div>
        </>
        )}
      </div>
      {open ? (
        <Modal title={open.name} onClose={() => setOpen(null)}>
          <span className={`w-pill ${severityClass(open.severity)}`.trim()}>{open.severity}</span>
          <p>{open.fix}</p>
          <div className="w-inset"><strong>Evidence</strong><p>{open.evidence}</p></div>
          {open.suggestion ? (
            <div className="change-pair">
              <div className="change-cell"><small>Current title</small><span>{open.suggestion.beforeTitle}</span></div>
              <div className="change-cell suggested"><small>Suggested title</small><span>{open.suggestion.title}</span></div>
              <div className="change-cell"><small>Current description</small><span>{open.suggestion.beforeDescription}</span></div>
              <div className="change-cell suggested"><small>Suggested description</small><span>{open.suggestion.description || "Not written yet"}</span></div>
            </div>
          ) : null}
          <h3>Affected paths</h3>
          <ul className="path-list">{open.pages.map((page) => <li key={page}><code>{page}</code></li>)}</ul>
          <p className="w-footnote">{open.manual ? "This stays an investigation until you decide it needs a draft." : "A person still reviews the title and description before publishing."}</p>
          <button className="w-button primary" type="button" disabled={busy} onClick={() => sendToQueue(open)}>{busy ? "Preparing the draft…" : open.changeId ? "Open approval queue" : "Send to approval queue"}</button>
        </Modal>
      ) : null}
    </section>
  );
}

export function CompletionView() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const read = (event) => {
      if (event?.detail?.local && event.detail.scope !== "history") return;
      setItems(completionEntries("history"));
    };
    read();
    window.addEventListener("sf-preview-queue", read);
    window.addEventListener("sf-site", read);
    return () => {
      window.removeEventListener("sf-preview-queue", read);
      window.removeEventListener("sf-site", read);
    };
  }, []);
  return (
    <section className="dash-view" id="view-completion">
      <div className="subview-head">
        <div className="dash-eyebrow">YOUR AUDIT TRAIL</div>
        <h1>Completion log.</h1>
        <p>This log is for the website selected above. Choosing it here does not change Overview or Settings. Nothing here changes a live website.</p>
      </div>
      <div className="completion-log" id="completion-list" aria-live="polite">
        {items.length ? items.map((item, index) => (
          <article className="log-item" key={`${item.title}-${item.detail}-${index}`}>
            <span className="log-check">✓</span>
            <div><strong>{item.title}</strong><p>{item.detail}</p></div>
            {item.time ? <time>{item.time}</time> : null}
          </article>
        )) : <p className="empty-log">Finish setup or take an action, and it will show up here.</p>}
      </div>
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
  const [breadth, setBreadth] = useState(1);
  const [mode, setMode] = useState("review");
  const [note, setNote] = useState("");
  const [sheet, setSheet] = useState("");
  useEffect(() => {
    const saved = loadGuardrails();
    setBreadth(saved.breadth);
    setMode(saved.mode);
  }, []);
  useEffect(() => {
    if (!sheet) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setSheet("");
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [sheet]);
  const apply = (next) => {
    const saved = saveGuardrails({ breadth, mode, ...next });
    setBreadth(saved.breadth);
    setMode(saved.mode);
    setNote("Saved. The overview uses the same choice. Nothing is published from here.");
  };
  const label = BREADTH_LABELS[breadth] || BREADTH_LABELS[1];
  const approval = mode === "drafts" ? "Prepare drafts" : "Review every change";
  const close = () => setSheet("");
  const sheetTitle = sheet === "brief" ? "From your setup" : sheet === "approval" ? "Approval" : "Working style";
  return (
    <section className="dash-view" id="view-settings">
      <div className="subview-head">
        <div className="dash-eyebrow">YOUR GUARDRAILS</div>
        <h1>Settings.</h1>
        <p>Choose how tightly Searchify should stay within your brief. Human approval remains required.</p>
      </div>
      <div className="settings-rows">
        <button type="button" className="settings-row" onClick={() => setSheet("brief")}>
          <span>From your setup</span>
          <small>{brief.hostname || brief.businessType || "Not filled in yet"}</small>
          <i aria-hidden="true">›</i>
        </button>
        <button type="button" className="settings-row" onClick={() => setSheet("style")}>
          <span>Working style</span>
          <small>{label}</small>
          <i aria-hidden="true">›</i>
        </button>
        <button type="button" className="settings-row" onClick={() => setSheet("approval")}>
          <span>Approval</span>
          <small>{approval}</small>
          <i aria-hidden="true">›</i>
        </button>
        {note ? <p className="settings-saved" role="status">{note}</p> : null}
      </div>
      {sheet ? (
        <>
          <button className="settings-sheet-backdrop" type="button" aria-label="Close settings" onClick={close} />
          <div className="settings-sheet" role="dialog" aria-modal="true" aria-label={sheetTitle}>
            <div className="mobile-more-handle" aria-hidden="true" />
            <div className="settings-sheet-head">
              <h2>{sheetTitle}</h2>
              <button type="button" onClick={close}>Done</button>
            </div>
            {sheet === "brief" ? (
              <>
                <SetupFacts brief={brief} />
                <p className="w-footnote">Overview, approval drafts, keywords, and prompts read this brief. Add a website to answer the questions for another site.</p>
              </>
            ) : null}
            {sheet === "style" ? <WorkingStyleControls breadth={breadth} mode={mode} label={label} note={note} apply={apply} idPrefix="sheet-style" part="style" /> : null}
            {sheet === "approval" ? <WorkingStyleControls breadth={breadth} mode={mode} label={label} note={note} apply={apply} idPrefix="sheet-approval" part="approval" /> : null}
          </div>
        </>
      ) : null}
      <div className="settings-desk">
        <section className="w-panel below">
          <div className="dash-eyebrow">FROM YOUR SETUP</div>
          <h2>What the reports are using.</h2>
          <SetupFacts brief={brief} />
          <p className="w-footnote">Overview, approval drafts, keywords, and prompts read this brief. Changing it does not need a developer. Add a website to answer the questions for another site.</p>
        </section>
        <div id="settings-panel-home">
          <section className="control-card" aria-labelledby="control-title">
            <div className="dash-eyebrow">YOUR GUARDRAILS</div>
            <h2 id="control-title">Set the working style.</h2>
            <WorkingStyleControls breadth={breadth} mode={mode} label={label} note={note} apply={apply} idPrefix="settings" />
          </section>
        </div>
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
  useEffect(() => {
    const state = loadJourney();
    setCurrent(state.planId);
    setBilling(state.billing || "monthly");
    setUsed(readySites(state).length);
  }, []);
  const select = (plan) => {
    if (used > plan.sites) {
      setNote(`${plan.name} includes ${plan.sites} websites. This workspace already has ${used}.`);
      return;
    }
    choosePlan(plan.id, billing);
    setCurrent(plan.id);
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
              <li>{plan.audits} audits</li>
            </ul>
            <button className="w-button primary" type="button" onClick={() => select(plan)}>{current === plan.id ? "Current plan" : `Choose ${plan.name}`}</button>
          </article>
        ))}
      </div>
      <div className="w-panel below">
        <h2>Your usage</h2>
        <div className="usage-row"><span>Websites</span><strong>{used} / {planById(current)?.sites || "—"}</strong></div>
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
  const [cms, setCms] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [activeEmail, setActiveEmail] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = () => {
    const state = loadJourney();
    setSites(readySites(state));
    setPlan(planById(state.planId));
    listCmsConnections({ force: true }).then((res) => setCms(res.data?.connections || [])).catch(() => setCms([]));
    getGoogleStatus({ force: true }).then((res) => {
      const connection = res.data?.connection || {};
      setAccounts(connection.accounts || (connection.googleEmail ? [{ email: connection.googleEmail, active: true }] : []));
      setActiveEmail(connection.googleEmail || "");
    }).catch(() => {});
  };

  useEffect(() => { reload(); }, []);

  const wordpressFor = (site) => {
    const host = hostOf(site.answers?.site);
    return cms.find((item) => item.provider === "wordpress" && item.status === "connected" && host && hostOf(item.siteUrl || item.site_url) === host);
  };

  const pickAccount = async (site, email) => {
    assignGoogleAccount(site.id, email);
    setSites(readySites(loadJourney()));
    if (email && String(activeJourneySite()?.id) === String(site.id) && email.toLowerCase() !== activeEmail.toLowerCase()) {
      setBusy(true);
      const res = await useGoogleAccount(email);
      setBusy(false);
      if (!res.ok) {
        setNote(typeof res.data?.detail === "string" ? res.data.detail : "That Google account could not be selected.");
        return;
      }
      setActiveEmail(email);
      setNote(`${email} is now the Google account for ${websiteLabel(site)}. Choose its Search Console property on Connections.`);
    } else {
      setNote(email ? `${websiteLabel(site)} will use ${email} when that website is selected.` : `${websiteLabel(site)} is no longer tied to a Google account.`);
    }
  };

  const addAccount = async () => {
    setBusy(true);
    const res = await startGoogleOAuth("gsc,ga4", { add: true });
    setBusy(false);
    const url = res.data?.url || res.data?.authUrl;
    if (url) window.location.assign(url);
    else setNote(typeof res.data?.detail === "string" ? res.data.detail : "Google sign-in could not start.");
  };

  const removeAccount = async (email) => {
    if (!email || !window.confirm(`Remove ${email}? Websites using it can be linked to another Google account. Saved reports stay.`)) return;
    setBusy(true);
    const res = await removeGoogleAccount(email);
    setBusy(false);
    if (!res.ok) {
      setNote(typeof res.data?.detail === "string" ? res.data.detail : "The Google account could not be removed.");
      return;
    }
    const state = loadJourney();
    state.sites.forEach((site) => {
      if ((site.answers?.googleEmail || "").toLowerCase() === email.toLowerCase()) assignGoogleAccount(site.id, "");
    });
    setNote(`${email} was removed. Other saved Google accounts are still in the list.`);
    reload();
  };

  const disconnectWp = async (site) => {
    const match = wordpressFor(site);
    const label = websiteLabel(site);
    if (!match?.id) return;
    if (!window.confirm(`Disconnect WordPress for ${label}? The website stays in this workspace.`)) return;
    setBusy(true);
    await deleteCmsConnection(match.id);
    setBusy(false);
    setNote(`WordPress was disconnected for ${label}. The website is still here.`);
    reload();
  };

  const unlink = async (site) => {
    const label = websiteLabel(site);
    if (!window.confirm(`Unlink ${label}? It leaves this workspace. A WordPress connection for the same address is disconnected too.`)) return;
    const match = wordpressFor(site);
    removeJourneySite(site.id);
    if (match?.id) await deleteCmsConnection(match.id);
    const left = readySites(loadJourney());
    setNote(`${label} was unlinked.`);
    if (!left.length) {
      router.push("/app/start");
      return;
    }
    reload();
  };

  return (
    <section className="dash-view extension-view">
      <Head eyebrow="WORKSPACE MANAGEMENT" title="Keep your sites together." text="Each website can use its own Google account for Search Console and Analytics. Unlink a site when it should leave this workspace." action={<button className="w-button primary" type="button" onClick={() => router.push(beginAnotherWebsite())}>Add website</button>} />
      {note ? <p className="w-inset">{note}</p> : null}
      <div className="w-panel">
        <div className="w-panel-title"><h2>Websites</h2><span className="w-pill">{sites.length} / {plan?.sites || "—"} used</span></div>
        <div className="site-manage-list">
          {sites.length ? sites.map((site) => {
            const linked = wordpressFor(site);
            const chosen = site.answers?.googleEmail || "";
            return (
              <article className="site-manage-card" key={site.id}>
                <div>
                  <strong>{websiteLabel(site)}</strong>
                  <small>{site.answers?.businessType || "Setup complete"}</small>
                </div>
                <label htmlFor={`google-${site.id}`}>
                  Google account
                  <select id={`google-${site.id}`} className="site-google-select" value={chosen} disabled={busy} onChange={(event) => pickAccount(site, event.target.value)}>
                    <option value="">Not linked</option>
                    {accounts.map((account) => <option key={account.email} value={account.email}>{account.email}{account.active ? " · in use" : ""}</option>)}
                    {chosen && !accounts.some((account) => account.email.toLowerCase() === chosen.toLowerCase()) ? <option value={chosen}>{chosen}</option> : null}
                  </select>
                </label>
                <div className="w-actions">
                  {linked ? <button className="w-button" type="button" disabled={busy} onClick={() => disconnectWp(site)}>Disconnect WordPress</button> : <span className="w-pill">WordPress not linked</span>}
                  <button className="w-button" type="button" disabled={busy} onClick={() => unlink(site)}>Unlink website</button>
                </div>
              </article>
            );
          }) : <p className="w-footnote">No websites yet. Add one to start a setup.</p>}
        </div>
        <h3 className="manage-subhead">Google accounts</h3>
        {accounts.length ? accounts.map((account) => (
          <div className="google-account-row" key={account.email}>
            <span>{account.email}{account.active ? " · in use" : ""}</span>
            <button className="w-button" type="button" disabled={busy} onClick={() => removeAccount(account.email)}>Remove</button>
          </div>
        )) : <p className="w-footnote">No Google account yet. Add one, then choose it on each website.</p>}
        <div className="w-actions below">
          <button className="w-button primary" type="button" disabled={busy} onClick={addAccount}>Add Google account</button>
          <Link className="w-button" href="/app/connections">Choose Search Console property</Link>
        </div>
        <p className="w-footnote">Each website keeps its own Google account in the menu above. Searchify uses one of those accounts at a time, and switches when you open that website. Add a second or third account when Search Console lives in a different Google login. Unlink removes the website from this workspace. Disconnect WordPress only drops publishing for that site.</p>
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
