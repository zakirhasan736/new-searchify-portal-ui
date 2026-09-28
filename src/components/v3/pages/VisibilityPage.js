"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Btn, Hero, Pill, useV3Toast } from "@/components/v3/V3Shell";
import PageSkeleton from "@/components/v3/PageSkeleton";
import { createAiDraft } from "@/lib/clientApi";
import { usePageBoot } from "@/lib/usePageBoot";
import { getBusinessProfile, loadFeature } from "@/lib/v1Api";

const ENGINES = ["All engines", "ChatGPT", "Gemini", "Perplexity"];

export default function VisibilityPage() {
  const toast = useV3Toast();
  const [engine, setEngine] = useState("All engines");
  const [open, setOpen] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [profile, setProfile] = useState({});
  const [busy, setBusy] = useState(false);
  const [booted, setBooted] = usePageBoot((s) => s.getProfile());

  const load = useCallback(async () => {
    const [bp, feat] = await Promise.all([getBusinessProfile(), loadFeature("ai-visibility")]);
    setProfile(bp.data?.profile || {});
    const rows = feat?.data?.payload?.rows || feat?.data?.rows || [];
    if (rows.length) {
      setPrompts(
        rows.map((r, i) => ({
          i,
          q: r[0],
          engine: r[1] || "ChatGPT",
          mention: String(r[2]).toLowerCase().includes("yes") || String(r[2]).toLowerCase() === "true",
          citation: String(r[3]).toLowerCase().includes("yes") || String(r[3]).toLowerCase() === "true",
          excerpt: r[4] || "",
        })),
      );
      setBooted(true);
      return;
    }
    const biz = (bp.data?.profile?.business || "").trim();
    const area = (bp.data?.profile?.areas || "").trim();
    const services = (bp.data?.profile?.services || "").split(",")[0]?.trim() || "";
    if (biz && area && services) {
      setPrompts([
        { i: 0, q: `Who offers ${services} in ${area}?`, engine: "ChatGPT", mention: false, citation: false, excerpt: "" },
        { i: 1, q: `How do I choose a provider for ${services}?`, engine: "ChatGPT", mention: false, citation: false, excerpt: "" },
        { i: 2, q: `Which companies provide ${services} in ${area}?`, engine: "Gemini", mention: false, citation: false, excerpt: "" },
      ]);
    } else {
      setPrompts([]);
    }
    setBooted(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => prompts.filter((x) => engine === "All engines" || x.engine === engine), [prompts, engine]);
  const mentions = rows.filter((x) => x.mention).length;
  const cites = rows.filter((x) => x.citation).length;

  const inspect = async (item) => {
    if (open === item.i) {
      setOpen(null);
      return;
    }
    setBusy(true);
    const res = await createAiDraft({
      kind: "ai-visibility",
      brief: `Simulate whether "${profile.business || "the business"}" would likely be mentioned for prompt: ${item.q}. Be honest. Return MENTION: yes/no, CITATION: yes/no, EXCERPT: one short paragraph.`,
      writingType: "AI visibility check",
      tokens: 300,
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    const body = data.body || data.draft?.body || "";
    const mention = /MENTION:\s*yes/i.test(body);
    const citation = /CITATION:\s*yes/i.test(body);
    setPrompts((list) =>
      list.map((p) => (p.i === item.i ? { ...p, mention, citation, excerpt: body } : p)),
    );
    setOpen(item.i);
    if (!res.ok) toast(data.detail || "Could not inspect answer.");
  };

  if (!booted) return <PageSkeleton />;

  if (!prompts.length) {
    return (
      <>
        <Hero label="AI visibility" line1="GET INTO" line2="THE ANSWER." sub="Checks use your real business profile and OpenAI. Nothing is pre-filled." />
        <div className="sf-empty sf-box">
          <h2>No live visibility checks yet</h2>
          <p>
            Add your business name, services, and areas first. Then we can inspect prompts against those facts — we do not invent mentions or citations.
          </p>
          <div className="sf-row sf-gap" style={{ marginTop: 18 }}>
            <Btn primary href="/app/profile">
              Complete business profile →
            </Btn>
            <Btn href="/app/queue">Open work queue</Btn>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Hero label="AI visibility" line1="GET INTO" line2="THE ANSWER." sub="Inspect whether your business appears in a defined set of AI answers." />

      <div className="sf-row sf-between">
        <span className="sf-small">Prompts from your profile · OpenAI inspects on demand</span>
        <label className="sf-field">
          Engine
          <select
            value={engine}
            onChange={(e) => {
              setEngine(e.target.value);
              setOpen(null);
            }}
          >
            {ENGINES.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="sf-three sf-gap">
        <div className="sf-box">
          <div className="sf-small">Answers mentioning you</div>
          <div className="sf-metric">
            {mentions} / {rows.length}
          </div>
          <div className="sf-small">Across this selected prompt sample</div>
        </div>
        <div className="sf-box">
          <div className="sf-small">Answers citing your site</div>
          <div className="sf-metric">
            {cites} / {rows.length}
          </div>
          <div className="sf-small">A linked source, not just a mention</div>
        </div>
        <div className="sf-box">
          <div className="sf-small">Tracked prompts</div>
          <div className="sf-metric">{rows.length}</div>
          <div className="sf-small">Small focused sample</div>
        </div>
      </div>

      <div className="sf-box sf-gap">
        <div className="sf-row sf-between">
          <h2>Your prompt coverage</h2>
          <Btn href="/app/queue">Send related pages to queue</Btn>
        </div>
        {rows.map((x) => (
          <div className="sf-promptrow" key={x.i}>
            <div className="sf-row sf-between">
              <div>
                <div className="sf-small">{x.engine}</div>
                <h3>{x.q}</h3>
                <div className="sf-chiprow">
                  <Pill neutral={!x.mention}>{x.mention ? "Mentioned" : "Not mentioned"}</Pill>
                  <Pill neutral>{x.citation ? "Website cited" : "No citation"}</Pill>
                </div>
              </div>
              <Btn onClick={() => inspect(x)} disabled={busy}>
                {open === x.i ? "Hide answer" : "Inspect answer"}
              </Btn>
            </div>
            {open === x.i ? (
              <div className="sf-answer">
                <div className="sf-label">Answer excerpt · Model estimate</div>
                <p style={{ whiteSpace: "pre-wrap" }}>{x.excerpt || "No excerpt yet."}</p>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="sf-note sf-gap">
        Uses OpenAI + your business profile only — DataForSEO is not required for AI Visibility. This measures the
        selected prompts; answers vary by model, date, location and phrasing.
      </div>
    </>
  );
}
