"use client";

import { useCallback, useEffect, useState } from "react";
import { Btn, Hero, Pill, useV3Toast } from "@/components/v3/V3Shell";
import PageSkeleton from "@/components/v3/PageSkeleton";
import { usePageBoot } from "@/lib/usePageBoot";
import { useRouter } from "next/navigation";
import { loadFeature, syncGoogleLive } from "@/lib/v1Api";

export default function KeywordsPage() {
  const toast = useV3Toast();
  const router = useRouter();
  const [seed, setSeed] = useState("");
  const [rows, setRows] = useState([]);
  const [plan, setPlan] = useState([]);
  const [run, setRun] = useState(false);
  const [busy, setBusy] = useState(false);
  const [booted, setBooted] = usePageBoot((s) => s.getFeature("keyword-research") || s.getFeature("organic-search"));

  const load = useCallback(async () => {
    const feat = await loadFeature("keyword-research");
    const organic = await loadFeature("organic-search");
    const fromResearch = feat?.data?.payload?.rows || feat?.data?.rows || [];
    const fromGsc = (organic?.data?.payload?.rows || organic?.data?.rows || []).map((r) => [r[0], r[2], "Search Console", r[4] ?? r[3]]);
    const merged = fromResearch.length ? fromResearch : fromGsc;
    setRows(merged.filter((r) => String(r[0] || "").trim()));
    setBooted(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const explore = async () => {
    if (!seed.trim()) {
      toast("Enter a service or topic to explore.");
      return;
    }
    setBusy(true);
    await syncGoogleLive();
    await load();
    setRun(true);
    setBusy(false);
    toast("Showing live Search Console queries that match your topic.");
  };

  const visible = rows.filter((r) => {
    const q = seed.trim().toLowerCase();
    if (!q || !run) return true;
    return String(r[0] || "").toLowerCase().includes(q);
  });

  const sendToQueue = async () => {
    setBusy(true);
    const sync = await syncGoogleLive();
    setBusy(false);
    if (!sync.ok) {
      toast(sync.data?.detail || "Connect Search Console first so the work queue can use live pages.");
      return;
    }
    toast("Work queue updated from Search Console pages.");
    router.push("/app/queue");
  };

  const toggle = (i) => {
    setPlan((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  };

  if (!booted) return <PageSkeleton />;

  return (
    <>
      <Hero label="Keyword research" line1="FIND YOUR" line2="NEXT KEYWORD." sub="Explore useful search topics and build a focused content plan." />

      <div className="sf-box sf-ai">
        <div className="sf-toolform">
          <label className="sf-field">
            Topic or service
            <input value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="e.g. plumbing calgary" />
          </label>
          <label className="sf-field" style={{ maxWidth: 200 }}>
            Market
            <select>
              <option>Your GSC property</option>
            </select>
          </label>
          <Btn primary onClick={explore} disabled={busy}>
            {busy ? "Loading…" : "Explore keywords"}
          </Btn>
        </div>
      </div>

      {visible.length ? (
        <div className="sf-box sf-gap">
          <div className="sf-row sf-between">
            <h2>Ideas for your plan</h2>
            <Pill neutral>Live Search Console</Pill>
          </div>
          <p>Showing live queries{seed && run ? ` matching “${seed}”` : ""}.</p>
          <div className="sf-tablewrap sf-gap">
            <table className="sf-ranktable">
              <thead>
                <tr>
                  <th>Keyword</th>
                  <th>Volume / impr.</th>
                  <th>Source</th>
                  <th>Plan</th>
                </tr>
              </thead>
              <tbody>
                {visible.slice(0, 25).map((x, i) => (
                  <tr key={i}>
                    <td>
                      {x[0]}
                      <div className="sf-small">{x[3] ? `Position: ${x[3]}` : "No tracked position"}</div>
                    </td>
                    <td>{x[1]}</td>
                    <td>{x[2]}</td>
                    <td>
                      <Btn primary={!plan.includes(i)} onClick={() => toggle(i)}>
                        {plan.includes(i) ? "Remove" : "Add"}
                      </Btn>
                      {plan.includes(i) ? (
                        <div style={{ marginTop: 8 }}>
                          <Btn href={`/app/content?topic=${encodeURIComponent(String(x[0] || ""))}`}>Open in Content →</Btn>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="sf-box sf-gap">
          <h2>No live queries yet</h2>
          <p>Connect Google Search Console and sync. Keyword ideas here are your real GSC queries, not invented volumes.</p>
          <div className="sf-row sf-gap">
            <Btn primary href="/app/connections">
              Connect Google →
            </Btn>
            <Btn href="/app/queue">Work queue</Btn>
          </div>
        </div>
      )}

      <div className="sf-box sf-gap">
        <div className="sf-row sf-between">
          <h2>Your keyword plan · {plan.length}</h2>
          {plan.length ? (
            <Btn primary onClick={sendToQueue} disabled={busy}>
              {busy ? "Updating…" : "Refresh work queue →"}
            </Btn>
          ) : null}
        </div>
        {plan.length ? (
          plan.map((i) => (
            <div className="sf-listrow" key={i}>
              <div>
                <h3>{visible[i]?.[0] || rows[i]?.[0]}</h3>
                <span className="sf-small">{visible[i]?.[2] || rows[i]?.[2]} · Draft plan</span>
              </div>
              <div className="sf-row">
                <Btn href={`/app/content?topic=${encodeURIComponent(String(visible[i]?.[0] || rows[i]?.[0] || ""))}`}>Content</Btn>
                <Btn onClick={() => toggle(i)}>Remove</Btn>
              </div>
            </div>
          ))
        ) : (
          <p>Saved topics appear here. Adding a topic does not publish. The work queue still uses live GSC pages.</p>
        )}
      </div>
    </>
  );
}
