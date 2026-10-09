"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Btn, Hero, Pill, useV3Toast } from "@/components/v3/V3Shell";
import PageSkeleton from "@/components/v3/PageSkeleton";
import { usePageBoot } from "@/lib/usePageBoot";
import { getAiVisibility, getBusinessProfile, queueAiVisibilityFix, runAiVisibility } from "@/lib/v1Api";

const ALL = "All engines";

function SolutionModal({ check, busy, onClose, onQueue }) {
  if (!check) return null;
  const solution = check.solution || {};
  const steps = Array.isArray(solution.steps) ? solution.steps : [];
  return (
    <div className="sf-modal" role="dialog" aria-modal="true" aria-labelledby="sf-vis-sol-title">
      <button type="button" className="sf-modal-backdrop" aria-label="Close" onClick={onClose} />
      <div className="sf-modal-card">
        <div className="sf-row sf-between">
          <span className="sf-label">{check.engine}</span>
          <button type="button" className="sf-modal-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <h2 id="sf-vis-sol-title">{solution.title || check.suggestion || "Fix this gap"}</h2>
        <p className="sf-vis-errortext">{check.error}</p>
        {solution.why && solution.why !== check.error ? <p>{solution.why}</p> : null}
        <div className="sf-small">Prompt</div>
        <p>{check.prompt}</p>
        {steps.length ? (
          <ol className="sf-vis-steps">
            {steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        ) : null}
        {solution.titleDraft ? (
          <div className="sf-vis-draft">
            <div className="sf-small">Suggested title</div>
            <strong>{solution.titleDraft}</strong>
            {solution.descriptionDraft ? <p>{solution.descriptionDraft}</p> : null}
            {solution.targetUrl ? <div className="sf-small">{solution.targetUrl}</div> : null}
          </div>
        ) : null}
        <div className="sf-row sf-gap" style={{ marginTop: 18 }}>
          <Btn primary onClick={() => onQueue(check)} disabled={busy}>
            {busy ? "Sending…" : "Send fix to work queue"}
          </Btn>
          <Btn onClick={onClose}>Close</Btn>
        </div>
      </div>
    </div>
  );
}

export default function VisibilityPage() {
  const toast = useV3Toast();
  const [engine, setEngine] = useState(ALL);
  const [profile, setProfile] = useState({});
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [queueBusy, setQueueBusy] = useState(false);
  const [open, setOpen] = useState(null);
  const [booted, setBooted] = usePageBoot((s) => s.getFeature("ai-visibility-report"));

  const load = useCallback(async () => {
    const [bp, vis] = await Promise.all([getBusinessProfile(), getAiVisibility({ force: true })]);
    setProfile(bp.data?.profile || {});
    setReport(vis.data?.report || null);
    setBooted(true);
  }, [setBooted]);

  useEffect(() => {
    load();
  }, [load]);

  const checks = useMemo(() => {
    const list = report?.checks || [];
    if (engine === ALL) return list;
    return list.filter((c) => c.engine === engine);
  }, [report, engine]);

  const engines = report?.engines || [];
  const kpis = Object.fromEntries((report?.kpis || []).map((row) => [row[0], row[1]]));
  const ready = Boolean((profile.business || "").trim() && (profile.services || "").trim());

  const run = async () => {
    setBusy(true);
    const res = await runAiVisibility();
    setBusy(false);
    if (!res.ok) {
      toast(res.data?.detail || "Could not run the AI visibility report.");
      return;
    }
    setReport(res.data.report);
    toast("Visibility report ready.");
  };

  const queueFix = async (check) => {
    setQueueBusy(true);
    const res = await queueAiVisibilityFix({ checkId: check.id });
    setQueueBusy(false);
    if (!res.ok) {
      toast(res.data?.detail || "Could not add this to the work queue.");
      return;
    }
    toast("Fix sent to the work queue.");
    setOpen(null);
  };

  if (!booted) return <PageSkeleton />;

  if (!ready) {
    return (
      <>
        <Hero
          label="AI visibility"
          line1="GET INTO"
          line2="THE ANSWER."
          sub="ChatGPT, Gemini, Perplexity, Claude, Copilot, Grok, and Google AI Overviews — scored from your real profile."
        />
        <div className="sf-empty sf-box">
          <h2>No live visibility checks yet</h2>
          <p>Add your business name, services, and areas first. Then run a report across the major answer engines.</p>
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
      <Hero
        label="AI visibility"
        line1="GET INTO"
        line2="THE ANSWER."
        sub="Inspect whether your business is likely to appear in ChatGPT, Gemini, Perplexity, Claude, and other popular AI answers."
        action={
          <Btn primary onClick={run} disabled={busy}>
            {busy ? "Running report…" : report ? "Re-run report" : "Run visibility report"}
          </Btn>
        }
      />

      <div className="sf-row sf-between">
        <span className="sf-small">
          {report?.generatedAt ? `Last report ${report.generatedAt.replace("T", " ").replace("Z", "")} UTC` : "No report yet — run one to score each engine."}
        </span>
        <label className="sf-field">
          Engine
          <select
            value={engine}
            onChange={(e) => {
              setEngine(e.target.value);
            }}
          >
            {[ALL, ...["ChatGPT", "Gemini", "Perplexity", "Claude", "Copilot", "Google AI Overviews", "Grok"]].map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="sf-three sf-gap">
        <div className="sf-box">
          <div className="sf-small">Answers mentioning you</div>
          <div className="sf-metric">{kpis.Mentions || "0"}</div>
          <div className="sf-small">Across this selected prompt sample</div>
        </div>
        <div className="sf-box">
          <div className="sf-small">Answers citing your site</div>
          <div className="sf-metric">{kpis.Citations || "0"}</div>
          <div className="sf-small">A linked source, not just a mention</div>
        </div>
        <div className="sf-box">
          <div className="sf-small">Issues to fix</div>
          <div className="sf-metric">{kpis.Issues || String(checks.filter((c) => c.status !== "ok").length)}</div>
          <div className="sf-small">Open a suggestion for the solution</div>
        </div>
      </div>

      {engines.length ? (
        <div className="sf-box sf-gap">
          <h2>Engine coverage</h2>
          {engines
            .filter((row) => engine === ALL || row.name === engine)
            .map((row) => (
              <div className="sf-engine" key={row.id || row.name}>
                <strong>{row.name}</strong>
                <div className="sf-enginebar">
                  <span style={{ width: `${Math.max(4, Number(row.score) || 0)}%` }} />
                </div>
                <span className="sf-small">{row.score}%</span>
              </div>
            ))}
        </div>
      ) : null}

      <div className="sf-box sf-gap">
        <div className="sf-row sf-between">
          <h2>{report ? "Report results" : "Your prompt coverage"}</h2>
          <Btn href="/app/queue">Open work queue</Btn>
        </div>
        {!report ? (
          <div className="sf-empty" style={{ padding: "28px 8px" }}>
            <p>Run the visibility report to score ChatGPT, Gemini, Perplexity, Claude, Copilot, Grok, and Google AI Overviews.</p>
          </div>
        ) : (
          checks.map((item) => {
            const bad = item.status !== "ok";
            return (
              <div className={`sf-promptrow ${bad ? "is-error" : ""}`} key={item.id}>
                <div className="sf-row sf-between">
                  <div>
                    <div className="sf-small">{item.engine}</div>
                    <h3>{item.prompt}</h3>
                    <div className="sf-chiprow">
                      <Pill warn={bad} neutral={!item.mention}>
                        {item.mention ? "Mentioned" : "Not mentioned"}
                      </Pill>
                      <Pill neutral={!item.citation}>{item.citation ? "Website cited" : "No citation"}</Pill>
                    </div>
                    {bad && item.error ? <p className="sf-vis-errortext">{item.error}</p> : null}
                  </div>
                  <div className="sf-vis-actions">
                    {bad ? (
                      <Btn primary onClick={() => setOpen(item)}>
                        Suggestion
                      </Btn>
                    ) : (
                      <Btn onClick={() => setOpen(item)}>View notes</Btn>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="sf-note sf-gap">
        This report uses your business profile plus Search Console. It estimates whether each engine would name or cite
        you — it is not a paid live crawl of ChatGPT or Perplexity. Sync Google, then re-run after you publish a fix.
      </div>

      <SolutionModal check={open} busy={queueBusy} onClose={() => setOpen(null)} onQueue={queueFix} />
    </>
  );
}
