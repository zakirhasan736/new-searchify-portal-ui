"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { authHeaders } from "@/utils/users/Helpers";

const PROVIDERS = [
  { id: "wordpress", label: "WordPress", hint: "Site URL + username + Application Password + post/page id" },
  { id: "shopify", label: "Shopify", hint: "Shop subdomain + Admin API token + page id" },
  { id: "webflow", label: "Webflow", hint: "API token + collection id + item id" },
  { id: "custom", label: "Custom website", hint: "Webhook URL (+ optional shared secret)" },
];

const STEPS = [
  ["Sense", "GSC · crawl · AI"],
  ["Decide", "Opportunity + draft"],
  ["Approve", "Human · JEV"],
  ["Execute", "CMS connector"],
  ["Record", "Change history"],
  ["Monitor", "GSC outcome"],
];

export default function OperatorStudio() {
  const [connections, setConnections] = useState([]);
  const [changes, setChanges] = useState([]);
  const [provider, setProvider] = useState("wordpress");
  const [siteUrl, setSiteUrl] = useState("https://");
  const [label, setLabel] = useState("");
  const [creds, setCreds] = useState({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("pipeline");

  const load = useCallback(async () => {
    try {
      const [cRes, chRes] = await Promise.all([
        fetch("/api/v1/operator/connections", { headers: authHeaders() }),
        fetch("/api/v1/operator/changes", { headers: authHeaders() }),
      ]);
      if (cRes.ok) {
        const data = await cRes.json();
        setConnections(data.connections || []);
      }
      if (chRes.ok) {
        setChanges(await chRes.json());
      }
      await fetch("/api/v1/operator/sync-features", { method: "POST", headers: authHeaders() });
    } catch {
      setMessage("Sign in to use the SEO Operator.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveConnection = async () => {
    setBusy(true);
    setMessage("Saving CMS connector…");
    const response = await fetch("/api/v1/operator/connections", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        provider,
        label: label || provider,
        site_url: siteUrl,
        credentials: creds,
      }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setMessage(data.detail || "Could not save connector.");
      return;
    }
    setMessage(`${data.connection?.provider} connected. Credentials stay on the server.`);
    setCreds({});
    load();
  };

  const fromGsc = async () => {
    setBusy(true);
    setMessage("Reading GSC → proposing site changes…");
    const response = await fetch("/api/v1/operator/changes/from-gsc", { method: "POST", headers: authHeaders() });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setMessage(data.detail || "Sync Google first, then try again.");
      return;
    }
    setMessage(`Opened ${data.created} opportunities from Search Console.`);
    setTab("changes");
    load();
  };

  const approve = async (id) => {
    setBusy(true);
    await fetch(`/api/v1/operator/changes/${id}/approve`, { method: "POST", headers: authHeaders() });
    setBusy(false);
    setMessage(`Change #${id} approved.`);
    load();
  };

  const execute = async (id, dry = false) => {
    setBusy(true);
    setMessage(dry ? "Dry-run execute…" : "Executing on CMS…");
    const response = await fetch(`/api/v1/operator/changes/${id}/execute`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ force_dry_run: dry }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setMessage(data.detail || "Execute failed.");
      return;
    }
    const ex = data.execution || {};
    setMessage(
      ex.dryRun
        ? `Recorded dry-run on ${ex.provider} — add live CMS credentials to push for real.`
        : `Applied on ${ex.provider}. Monitoring started.`,
    );
    load();
  };

  const monitor = async (id) => {
    setBusy(true);
    await fetch(`/api/v1/operator/changes/${id}/monitor`, { method: "POST", headers: authHeaders() });
    setBusy(false);
    setMessage(`Monitored change #${id} against latest GSC.`);
    load();
  };

  const fieldFor = (key, placeholder) => (
    <input
      key={key}
      value={creds[key] || ""}
      onChange={(e) => setCreds({ ...creds, [key]: e.target.value })}
      className="h-11 rounded-xl border border-line bg-ink px-3 text-sm"
      placeholder={placeholder}
    />
  );

  return (
    <section className="mx-auto max-w-6xl pb-10">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">USP · SEO Operator</p>
      <h1 className="mt-2 font-sans text-3xl font-semibold tracking-tight">Opportunity → approve → execute → monitor</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-white/65">
        Searchify does not stop at identifying SEO opportunities. It prepares the change, gets human approval where needed,
        executes on WordPress, Shopify, Webflow, or a custom website connector, records the action, then watches the
        outcome in Search Console.
      </p>

      <div className="mt-6 grid gap-2 sm:grid-cols-6">
        {STEPS.map(([title, sub]) => (
          <div key={title} className="rounded-2xl border border-line bg-panel px-3 py-3">
            <p className="text-xs font-semibold text-brand">{title}</p>
            <p className="mt-1 text-[11px] text-white/45">{sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {[
          ["pipeline", "Pipeline"],
          ["connectors", "CMS connectors"],
          ["changes", "Change queue"],
        ].map(([id, name]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-2 text-sm ${tab === id ? "bg-brand text-white" : "bg-white/5 text-white/70"}`}
          >
            {name}
          </button>
        ))}
        <button type="button" disabled={busy} onClick={fromGsc} className="rounded-full border border-brand/40 px-4 py-2 text-sm text-brand disabled:opacity-50">
          Propose from GSC
        </button>
        <Link href="/market/google-services" className="inline-flex items-center rounded-full border border-line px-4 py-2 text-sm text-white/70">
          Google connect
        </Link>
      </div>
      {message ? <p className="mt-3 text-sm text-brand">{message}</p> : null}

      {tab === "pipeline" ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-panel p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-white/45">Loop</p>
            <ol className="mt-4 space-y-3 text-sm text-white/75">
              <li>1. Search Console / crawl surfaces an opportunity.</li>
              <li>2. Astra prepares the on-site change (title, meta, content).</li>
              <li>3. JEV + a person approve when needed.</li>
              <li>4. The CMS connector applies it on the real site.</li>
              <li>5. Searchify stores the change and monitors GSC.</li>
            </ol>
            <p className="mt-4 text-xs text-white/40">
              Architecture is provider-agnostic: add Shopify, Webflow, or a custom webhook without changing the product
              loop.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-panel p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-white/45">Stack that makes it possible</p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>Google Search Console → real search performance</li>
              <li>Website / CMS → actual pages and content</li>
              <li>
                DataForSEO → keywords, SERPs, backlinks{" "}
                <span className="text-white/35">(connector slot — waiting_for_provider)</span>
              </li>
              <li>AI → analysis, reasoning, generation</li>
              <li>WordPress / Shopify / Webflow / custom → execution</li>
              <li>Searchify → approval, automation, history, monitoring</li>
            </ul>
            <div className="mt-4 rounded-xl border border-dashed border-line bg-ink/50 px-3 py-3 text-xs text-white/45">
              DataForSEO is part of the operator architecture for competitive intelligence. Until keys are connected,
              Searchify uses owned GSC/GA4 + crawl facts only — no invented ranks or volumes.
            </div>
          </div>
        </div>
      ) : null}

      {tab === "connectors" ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <form
            className="grid gap-3 rounded-2xl border border-line bg-panel p-5"
            onSubmit={(e) => {
              e.preventDefault();
              saveConnection();
            }}
          >
            <label className="grid gap-1 text-sm">
              <span className="text-white/50">Provider</span>
              <select value={provider} onChange={(e) => setProvider(e.target.value)} className="h-11 rounded-xl border border-line bg-ink px-3">
                {PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-white/40">{PROVIDERS.find((p) => p.id === provider)?.hint}</p>
            <label className="grid gap-1 text-sm">
              <span className="text-white/50">Label</span>
              <input value={label} onChange={(e) => setLabel(e.target.value)} className="h-11 rounded-xl border border-line bg-ink px-3" placeholder="Production site" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-white/50">Site / webhook URL</span>
              <input value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} className="h-11 rounded-xl border border-line bg-ink px-3" />
            </label>
            {provider === "wordpress" ? (
              <>
                {fieldFor("username", "WP username")}
                {fieldFor("applicationPassword", "Application Password")}
                {fieldFor("defaultPostId", "Default post/page ID")}
              </>
            ) : null}
            {provider === "shopify" ? (
              <>
                {fieldFor("shop", "your-store (myshopify subdomain)")}
                {fieldFor("accessToken", "Admin API access token")}
                {fieldFor("defaultPageId", "Page ID")}
              </>
            ) : null}
            {provider === "webflow" ? (
              <>
                {fieldFor("accessToken", "Webflow API token")}
                {fieldFor("collectionId", "Collection ID")}
                {fieldFor("defaultItemId", "Item ID")}
              </>
            ) : null}
            {provider === "custom" ? (
              <>
                {fieldFor("webhookUrl", "https://your-site.com/searchify-hook")}
                {fieldFor("secret", "Shared secret (optional)")}
              </>
            ) : null}
            <button type="submit" disabled={busy} className="h-11 rounded-full bg-gradient-to-r from-blush to-brand px-5 text-sm font-semibold disabled:opacity-50">
              Save connector
            </button>
          </form>
          <ul className="space-y-3">
            {connections.map((c) => (
              <li key={c.id} className="rounded-2xl border border-line bg-panel p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-sans text-lg capitalize">{c.provider}</p>
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs text-emerald-200">{c.status}</span>
                </div>
                <p className="mt-1 text-sm text-white/55">{c.label}</p>
                <p className="mt-1 text-xs text-white/35">{c.siteUrl || "—"}</p>
              </li>
            ))}
            {!connections.length ? <li className="rounded-2xl border border-dashed border-line p-8 text-sm text-white/45">No CMS yet — connect one to execute approved changes.</li> : null}
          </ul>
        </div>
      ) : null}

      {tab === "changes" ? (
        <ul className="mt-6 space-y-3">
          {changes.map((c) => (
            <li key={c.id} className="rounded-2xl border border-line bg-panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-white/40">
                    #{c.id} · {c.source} · {c.changeType}
                  </p>
                  <p className="mt-1 font-medium">{c.opportunity}</p>
                  <p className="mt-1 text-xs text-white/40">{c.targetUrl || "URL TBD"}</p>
                  {c.proposed?.draftBody ? (
                    <pre className="studio-scroll mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap text-xs text-white/60">{c.proposed.draftBody}</pre>
                  ) : null}
                  {c.execution?.detail ? <p className="mt-2 text-xs text-brand">{c.execution.detail}</p> : null}
                  {c.monitoring?.note ? (
                    <p className="mt-1 text-xs text-white/40">
                      Monitor · baseline {c.monitoring.baselinePosition ?? "—"} · latest {c.monitoring.latestPosition ?? "—"} · {c.monitoring.note}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="rounded-full bg-brand/20 px-3 py-1 text-xs">{c.status}</span>
                  <div className="flex flex-wrap justify-end gap-2">
                    {c.status === "awaiting_approval" ? (
                      <button type="button" disabled={busy} onClick={() => approve(c.id)} className="h-9 rounded-full border border-brand/40 px-3 text-xs text-brand">
                        Approve
                      </button>
                    ) : null}
                    {c.status === "approved" || c.status === "failed" ? (
                      <>
                        <button type="button" disabled={busy} onClick={() => execute(c.id, true)} className="h-9 rounded-full border border-line px-3 text-xs">
                          Dry-run
                        </button>
                        <button type="button" disabled={busy} onClick={() => execute(c.id, false)} className="h-9 rounded-full bg-brand/30 px-3 text-xs text-brand">
                          Execute on CMS
                        </button>
                      </>
                    ) : null}
                    {["applied", "monitoring", "closed"].includes(c.status) ? (
                      <button type="button" disabled={busy} onClick={() => monitor(c.id)} className="h-9 rounded-full border border-line px-3 text-xs">
                        Refresh monitor
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          ))}
          {!changes.length ? <li className="py-10 text-sm text-white/45">No site changes yet. Propose from GSC or create from an on-page fix.</li> : null}
        </ul>
      ) : null}
    </section>
  );
}
