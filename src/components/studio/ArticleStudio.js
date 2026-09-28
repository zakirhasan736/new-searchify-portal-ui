"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { approveDraft, createAiDraft, loadFeatures, queueDraftForCms, saveFeature } from "@/lib/clientApi";
import { groupFor } from "@/lib/tools";
import Link from "next/link";

const TEMPLATES = {
  "1": { title: "Google ad copy", type: "Ads", hint: "Benefit bullets for a Google Ads listing." },
  "2": { title: "Headline variations", type: "Ads", hint: "Short headline options for a campaign." },
  "3": { title: "Grammar pass", type: "Grammar", hint: "A cleaner rewrite of the draft." },
  "4": { title: "Blog outline", type: "Blog", hint: "H2 outline for a blog post." },
  "5": { title: "Meta description", type: "Meta", hint: "A short meta description." },
  default: { title: "AI Article Generator", type: "Article", hint: "A draft from the topic and keywords. A person still publishes." },
};

export default function ArticleStudio({ kind = "ai-article", title, description }) {
  const params = useParams();
  const template = TEMPLATES[params?.id] || TEMPLATES.default;
  const [type, setType] = useState(template.type);
  const [topic, setTopic] = useState(template.title);
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState("Clear");
  const [tokens, setTokens] = useState("800");
  const [drafts, setDrafts] = useState([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadFeatures(kind).then((records) => {
      const saved = records
        .filter((record) => record.payload?.draft)
        .map((record) => ({
          id: record.id,
          draftId: record.payload.draftId || null,
          type: record.payload.type || "Article",
          topic: record.title,
          keywords: record.payload.keywords || "",
          tone: record.payload.tone || "Clear",
          tokens: record.payload.tokens || "800",
          draft: record.payload.draft,
          status: record.status || "waiting_for_writer",
          model: record.payload.model || "",
          role: record.payload.role || "",
          jev: record.payload.jev || null,
        }));
      setDrafts(saved);
    });
  }, [kind]);

  const generate = async () => {
    if (!topic.trim() || !keywords.trim()) {
      setMessage("Add a topic and keywords first.");
      return;
    }
    setBusy(true);
    setMessage("Generating with OpenAI…");

    const brief = [
      `Topic: ${topic.trim()}`,
      `Keywords: ${keywords.trim()}`,
      `Tone: ${tone}`,
      `Target length: about ${tokens} tokens`,
      `Writing type: ${type}`,
      "",
      description || template.hint,
    ].join("\n");

    const aiResponse = await createAiDraft({
      kind,
      brief,
      writingType: type,
      tokens,
    });

    let aiPayload = null;
    try {
      aiPayload = await aiResponse.json();
    } catch {
      aiPayload = null;
    }

    if (!aiResponse.ok || !aiPayload?.body) {
      setBusy(false);
      if (aiResponse.status === 401) {
        setMessage("Sign in to generate with OpenAI.");
      } else if (aiResponse.status === 503) {
        setMessage("API offline — start Searchify backend on :8000.");
      } else {
        const err = aiPayload?.detail?.error || aiPayload?.detail || aiPayload?.error;
        setMessage(typeof err === "string" ? err : "OpenAI draft failed. Check API key / model access.");
      }
      return;
    }

    const draft = aiPayload.body;
    const model = aiPayload.model || "openai";
    const role = aiPayload.role || "";
    const jev = aiPayload.jev || aiPayload.score || null;
    const status = aiPayload.status || (jev?.band === "auto" ? "approved" : "waiting_for_writer");
    const draftId = aiPayload.id || null;

    const saveResponse = await saveFeature(kind, topic.trim(), {
      summary: description || template.hint,
      columns: ["Topic", "Status", "JEV", "Model"],
      rows: [[topic.trim(), status, jev?.score != null ? String(jev.score) : "—", model]],
      type,
      keywords: keywords.trim(),
      tone,
      tokens,
      draft,
      draftId,
      model,
      role,
      jev,
      status,
    });

    const entry = {
      id: `tmp-${Date.now()}`,
      draftId,
      type,
      topic: topic.trim(),
      keywords: keywords.trim(),
      tone,
      tokens,
      draft,
      status,
      model,
      role,
      jev,
    };

    if (saveResponse.ok) {
      const record = await saveResponse.json();
      entry.id = record.id;
      const band = jev?.band || "inbox";
      setMessage(
        band === "auto"
          ? `JEV auto-safe (${jev?.score}) · ${model}. Person still publishes.`
          : `JEV ${band} (${jev?.score ?? "—"}) · ${model}. Approve before publish.`,
      );
    } else {
      setMessage(`Draft ready · ${model}. Sign in to persist on the project.`);
    }

    setDrafts((current) => [entry, ...current]);
    setBusy(false);
  };

  const approve = async (item) => {
    if (!item.draftId) {
      setMessage("This saved feature has no draft id — regenerate to enable approve.");
      return;
    }
    setBusy(true);
    const response = await approveDraft(item.draftId);
    if (!response.ok) {
      setBusy(false);
      setMessage("Approve failed.");
      return;
    }
    const queue = await queueDraftForCms({ draftId: item.draftId, execute: false });
    const queued = await queue.json().catch(() => ({}));
    setBusy(false);
    setDrafts((current) => current.map((row) => (row.id === item.id ? { ...row, status: "approved", changeId: queued.change?.id } : row)));
    setMessage(
      queued.change?.id
        ? `Approved · site change #${queued.change.id} queued for CMS. Open SEO Operator to execute.`
        : "Approved for CMS queue.",
    );
  };

  return (
    <section className="mx-auto max-w-6xl">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">{groupFor(kind)}</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-sans text-3xl font-semibold tracking-tight">{title || template.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">{description || template.hint}</p>
          <p className="mt-2 text-xs text-white/40">
            Router: Astra for articles/briefs/long work · Luna for short ads/meta · auto-upgrades to Astra when needed
          </p>
        </div>
        <button type="button" onClick={() => setDrafts([])} className="h-10 rounded-full border border-line px-4 text-sm text-white/70">
          Clear view
        </button>
        <Link href="/operator" className="inline-flex h-10 items-center rounded-full border border-brand/40 px-4 text-sm text-brand">
          SEO Operator
        </Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            generate();
          }}
          className="grid gap-3 rounded-2xl border border-line bg-panel p-5"
        >
          <label className="grid gap-1 text-sm">
            <span className="text-white/50">Type of writing</span>
            <select value={type} onChange={(event) => setType(event.target.value)} className="h-11 rounded-xl border border-line bg-ink px-3">
              {["Ads", "Blog", "Grammar", "Article", "Brief", "Meta"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-white/50">Topic / domain title</span>
            <input value={topic} onChange={(event) => setTopic(event.target.value)} className="h-11 rounded-xl border border-line bg-ink px-3" placeholder="Homepage SEO brief" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-white/50">Keywords</span>
            <input value={keywords} onChange={(event) => setKeywords(event.target.value)} className="h-11 rounded-xl border border-line bg-ink px-3" placeholder="seo audit, rank tracker" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-white/50">Tone</span>
              <select value={tone} onChange={(event) => setTone(event.target.value)} className="h-11 rounded-xl border border-line bg-ink px-3">
                {["Clear", "Expert", "Friendly", "Direct"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-white/50">Tokens</span>
              <input value={tokens} onChange={(event) => setTokens(event.target.value)} className="h-11 rounded-xl border border-line bg-ink px-3" />
            </label>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setTopic("");
                setKeywords("");
                setMessage("");
              }}
              className="h-11 rounded-full border border-line px-4 text-sm"
            >
              Clear
            </button>
            <button type="submit" disabled={busy} className="h-11 rounded-full bg-gradient-to-r from-blush to-brand px-5 font-semibold disabled:opacity-50">
              {busy ? "Generating…" : "Generate with AI"}
            </button>
          </div>
          {message ? <p className="text-sm text-brand">{message}</p> : null}
        </form>

        <div className="rounded-2xl border border-line bg-panel p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-white/45">Outputs</p>
          <ul className="studio-scroll mt-4 max-h-[34rem] space-y-3 overflow-y-auto">
            {drafts.map((item) => (
              <li key={item.id} className="rounded-2xl border border-line bg-ink p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-sans text-lg">{item.topic}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-brand/20 px-3 py-1 text-xs">{item.status}</span>
                    {item.jev?.score != null ? (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                        JEV {item.jev.score} · {item.jev.band}
                      </span>
                    ) : null}
                    {item.status === "waiting_for_writer" && item.draftId ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => approve(item)}
                        className="h-8 rounded-full border border-brand/40 px-3 text-xs text-brand disabled:opacity-50"
                      >
                        Approve
                      </button>
                    ) : null}
                  </div>
                </div>
                <p className="mt-1 text-xs text-white/45">
                  {item.type} · {item.tone} · {item.tokens} tokens
                  {item.model ? ` · ${item.model}` : ""}
                </p>
                {item.jev?.reasons?.length ? (
                  <p className="mt-1 text-[11px] text-white/40">{item.jev.reasons.join(" · ")}</p>
                ) : null}
                <pre className="mt-3 whitespace-pre-wrap font-body text-sm leading-6 text-white/75">{item.draft}</pre>
              </li>
            ))}
            {!drafts.length ? (
              <li className="py-10 text-sm text-white/50">Generate a draft to see it here. JEV gates auto / inbox / reject — a person still publishes.</li>
            ) : null}
          </ul>
        </div>
      </div>
    </section>
  );
}
