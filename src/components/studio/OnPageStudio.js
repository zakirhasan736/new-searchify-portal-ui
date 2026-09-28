"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { approveDraft, crawlOnPageFix, loadFeatures, operatorApproveChange, operatorExecuteChange } from "@/lib/clientApi";
import { groupFor } from "@/lib/tools";

export default function OnPageStudio({
  kind = "on-page-seo",
  title = "On Page SEO Checker",
  description = "Own crawl + OpenAI fix drafts. No third-party SEO volume.",
}) {
  const [url, setUrl] = useState("https://");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [findings, setFindings] = useState([]);
  const [crawlMeta, setCrawlMeta] = useState(null);
  const [draft, setDraft] = useState(null);
  const [change, setChange] = useState(null);
  const [links, setLinks] = useState([]);

  useEffect(() => {
    loadFeatures(kind).then((records) => {
      const live = records.find((r) => r.payload?.seedVersion === "google-live-v1" || r.payload?.crawl);
      if (!live?.payload) return;
      const p = live.payload;
      setFindings(p.rows || p.crawl?.findings || []);
      setCrawlMeta(p.crawl?.current || { url: p.url });
      setLinks(p.crawl?.internalResources || []);
      if (p.url) setUrl(p.url);
    });
  }, [kind]);

  const run = async () => {
    const link = url.trim();
    if (!/^https?:\/\//i.test(link)) {
      setMessage("Enter a full http(s) URL.");
      return;
    }
    setBusy(true);
    setMessage("Crawling page + drafting fixes…");
    const response = await crawlOnPageFix(link);
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setMessage(data.detail || "Crawl failed.");
      return;
    }
    const crawl = data.crawl || {};
    setFindings(crawl.findings || []);
    setCrawlMeta(crawl.current || null);
    setLinks(crawl.internalResources || []);
    setDraft(data.draft || null);
    setChange(data.change || null);
    const jev = data.draft?.jev;
    setMessage(
      data.draft
        ? `Crawl + fix ready · JEV ${jev?.score ?? "—"} (${jev?.band || "—"}) · queued as change #${data.change?.id || "—"}`
        : `Crawl saved · ${data.detail || "OpenAI off — findings only"}`,
    );
  };

  const approve = async () => {
    if (!draft?.id) return;
    setBusy(true);
    const response = await approveDraft(draft.id);
    if (!response.ok) {
      setBusy(false);
      setMessage("Approve failed.");
      return;
    }
    setDraft({ ...draft, status: "approved" });
    if (change?.id) {
      await operatorApproveChange(change.id);
      setChange({ ...change, status: "approved" });
    }
    setBusy(false);
    setMessage("Approved — execute on CMS from here or SEO Operator.");
  };

  const executeCms = async (dry = true) => {
    if (!change?.id) {
      setMessage("No site change queued — run crawl again.");
      return;
    }
    if (change.status === "awaiting_approval") {
      await approve();
    }
    setBusy(true);
    setMessage(dry ? "Dry-run on CMS…" : "Executing on CMS…");
    const response = await operatorExecuteChange(change.id, { forceDryRun: dry });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setMessage(data.detail || "Connect a CMS on /operator first.");
      return;
    }
    setChange(data.change || { ...change, status: data.change?.status || "applied" });
    const ex = data.execution || {};
    setMessage(ex.dryRun ? `Dry-run recorded · ${ex.provider}` : `Applied on ${ex.provider} · monitoring started`);
  };

  return (
    <section className="mx-auto max-w-6xl pb-10">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">{groupFor(kind)}</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-sans text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">{description}</p>
        </div>
        <Link href="/operator" className="inline-flex h-10 items-center rounded-full border border-brand/40 px-4 text-sm text-brand">
          SEO Operator
        </Link>
        <Link href="/site/audit" className="inline-flex h-10 items-center rounded-full border border-brand/40 px-4 text-sm text-brand">
          Site Audit
        </Link>
      </div>

      <form
        className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-line bg-panel p-4"
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="h-11 min-w-[16rem] flex-1 rounded-xl border border-line bg-ink px-3 text-sm"
          placeholder="https://example.com/page"
        />
        <button type="submit" disabled={busy} className="h-11 rounded-full bg-gradient-to-r from-blush to-brand px-5 text-sm font-semibold disabled:opacity-50">
          {busy ? "Working…" : "Crawl + AI fixes"}
        </button>
      </form>
      {message ? <p className="mt-3 text-sm text-brand">{message}</p> : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-panel p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-white/45">Crawl findings</p>
          {crawlMeta ? (
            <p className="mt-2 text-xs text-white/40">
              {crawlMeta.url || url}
              {crawlMeta.status != null ? ` · HTTP ${crawlMeta.status}` : ""}
              {crawlMeta.title ? ` · ${crawlMeta.title}` : ""}
            </p>
          ) : null}
          <ul className="studio-scroll mt-4 max-h-[28rem] space-y-2 overflow-y-auto">
            {findings.map((row, i) => (
              <li key={`${row[0]}-${i}`} className="rounded-xl border border-line bg-ink px-3 py-2 text-sm">
                <span className="font-medium">{row[0]}</span>
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-[10px] uppercase ${
                    row[1] === "Fail" ? "bg-blush/20 text-blush" : row[1] === "Warn" ? "bg-amber-400/15 text-amber-200" : "bg-emerald-400/15 text-emerald-200"
                  }`}
                >
                  {row[1]}
                </span>
                <p className="mt-1 text-white/55">{row[2]}</p>
              </li>
            ))}
            {!findings.length ? <li className="py-8 text-sm text-white/45">Run a crawl to see title, meta, and link checks.</li> : null}
          </ul>
          {links.length ? (
            <p className="mt-3 text-xs text-white/35">{links.length} internal links sampled</p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-line bg-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.12em] text-white/45">OpenAI fix draft · JEV · CMS</p>
            <div className="flex flex-wrap gap-2">
              {(draft?.status === "waiting_for_writer" || change?.status === "awaiting_approval") && draft?.id ? (
                <button type="button" disabled={busy} onClick={approve} className="h-9 rounded-full border border-brand/40 px-3 text-xs text-brand disabled:opacity-50">
                  Approve
                </button>
              ) : null}
              {change?.id ? (
                <>
                  <button type="button" disabled={busy} onClick={() => executeCms(true)} className="h-9 rounded-full border border-line px-3 text-xs disabled:opacity-50">
                    Dry-run CMS
                  </button>
                  <button type="button" disabled={busy} onClick={() => executeCms(false)} className="h-9 rounded-full bg-brand/30 px-3 text-xs text-brand disabled:opacity-50">
                    Execute on CMS
                  </button>
                </>
              ) : null}
            </div>
          </div>
          {change?.id ? <p className="mt-2 text-xs text-white/40">Site change #{change.id} · {change.status}</p> : null}
          {draft ? (
            <>
              <p className="mt-2 text-xs text-white/45">
                Status {draft.status}
                {draft.jev ? ` · JEV ${draft.jev.score} (${draft.jev.band})` : ""}
                {draft.model ? ` · ${draft.model}` : ""}
              </p>
              {draft.jev?.reasons?.length ? (
                <ul className="mt-2 flex flex-wrap gap-1">
                  {draft.jev.reasons.map((r) => (
                    <li key={r} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/50">
                      {r}
                    </li>
                  ))}
                </ul>
              ) : null}
              <pre className="studio-scroll mt-4 max-h-[28rem] overflow-y-auto whitespace-pre-wrap font-body text-sm leading-6 text-white/75">{draft.body}</pre>
            </>
          ) : (
            <p className="mt-8 text-sm text-white/45">Fix recommendations appear here after crawl + OpenAI.</p>
          )}
        </div>
      </div>
    </section>
  );
}
