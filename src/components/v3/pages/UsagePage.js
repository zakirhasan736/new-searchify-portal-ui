"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Btn, Hero, Pill, useV3Toast } from "@/components/v3/V3Shell";
import PageSkeleton from "@/components/v3/PageSkeleton";
import { usePageBoot } from "@/lib/usePageBoot";
import { getProductUsage, listCmsConnections, saveUsageControls, setWorkspacePlan } from "@/lib/v1Api";

export default function UsagePage() {
  const toast = useV3Toast();
  const [stats, setStats] = useState({
    sites: 0,
    siteLimit: 5,
    plan: "starter",
    pendingApprovals: 0,
    published: 0,
    canSetLimit: false,
    scanHours: 6,
    scansPaused: false,
    costCapUsd: 0,
    estimatedSpendUsd: 0,
    overCap: false,
    apiCalls: {},
  });
  const [sites, setSites] = useState([]);
  const [scanHours, setScanHours] = useState(6);
  const [costCap, setCostCap] = useState(0);
  const [siteLimitDraft, setSiteLimitDraft] = useState(5);
  const [busy, setBusy] = useState(false);
  const [booted, setBooted] = usePageBoot((s) => s.getCms());

  const load = useCallback(async () => {
    const [usage, cms] = await Promise.all([getProductUsage(), listCmsConnections()]);
    const u = usage.ok ? usage.data : {};
    const conns = cms.data?.connections || [];
    setSites(conns);
    setStats({
      sites: u.sites ?? conns.length,
      siteLimit: u.limit || cms.data?.limit || 5,
      plan: u.plan || cms.data?.plan || "starter",
      pendingApprovals: u.pendingApprovals || 0,
      published: u.published || 0,
      canSetLimit: Boolean(cms.data?.canSetLimit),
      scanHours: u.scanHours || 6,
      scansPaused: Boolean(u.scansPaused),
      costCapUsd: Number(u.costCapUsd) || 0,
      estimatedSpendUsd: Number(u.estimatedSpendUsd) || 0,
      overCap: Boolean(u.overCap),
      apiCalls: u.apiCalls || {},
    });
    setScanHours(u.scanHours || 6);
    setCostCap(Number(u.costCapUsd) || 0);
    setSiteLimitDraft(u.limit || cms.data?.limit || 5);
    setBooted(true);
  }, [setBooted]);

  useEffect(() => {
    load();
  }, [load]);

  const changePlan = async (plan) => {
    setBusy(true);
    const res = await setWorkspacePlan({ plan });
    setBusy(false);
    if (!res.ok) {
      toast(res.data?.detail || "Could not update plan.");
      return;
    }
    toast(`Package set to ${res.data?.plan}. Website limit stays at ${res.data?.limit}.`);
    await load();
  };

  const saveSiteLimit = async () => {
    setBusy(true);
    const res = await setWorkspacePlan({ site_limit: Math.max(1, Math.min(Number(siteLimitDraft) || 1, 100)) });
    setBusy(false);
    if (!res.ok) {
      toast(res.data?.detail || "Could not update website limit.");
      return;
    }
    toast(`Website limit set to ${res.data?.limit}.`);
    await load();
  };

  const saveControls = async () => {
    setBusy(true);
    const res = await saveUsageControls({ scanHours, costCapUsd: costCap });
    setBusy(false);
    if (!res.ok) {
      toast(res.data?.detail || "Could not save cost controls.");
      return;
    }
    toast("Scan frequency and cost cap saved.");
    await load();
  };

  const sitePct = Math.min(100, (stats.sites / Math.max(stats.siteLimit, 1)) * 100);
  const calls = stats.apiCalls || {};

  if (!booted) return <PageSkeleton />;

  return (
    <>
      <Hero
        label="Usage + billing"
        line1="YOU’RE IN"
        line2="CONTROL."
        sub={`${stats.plan} plan · ${stats.sites} of ${stats.siteLimit} websites · estimated API spend $${stats.estimatedSpendUsd.toFixed(2)}`}
      />

      <div className="sf-box sf-gap">
        <div className="sf-row sf-between">
          <div>
            <div className="sf-label">Current plan</div>
            <h2 style={{ marginTop: 8 }}>{stats.plan}</h2>
          </div>
          <Pill warn={stats.overCap} neutral={!stats.overCap}>
            {stats.overCap ? "Over cost cap" : `${stats.sites} / ${stats.siteLimit} websites`}
          </Pill>
        </div>
        <p style={{ fontSize: 13 }}>
          Package labels (Starter / Agency / Scale) do not reset the website limit. Change the limit separately below.
          Scan frequency and a spend cap sit on top of that limit.
        </p>
        {stats.canSetLimit ? (
          <>
            <div className="sf-row sf-gap">
              <Btn onClick={() => changePlan("starter")} disabled={busy || stats.plan === "starter"}>
                Starter
              </Btn>
              <Btn onClick={() => changePlan("agency")} disabled={busy || stats.plan === "agency"}>
                Agency
              </Btn>
              <Btn onClick={() => changePlan("scale")} disabled={busy || stats.plan === "scale"}>
                Scale
              </Btn>
            </div>
            <div className="sf-row sf-gap" style={{ alignItems: "end" }}>
              <label className="sf-field" style={{ minWidth: 160 }}>
                Website limit
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={siteLimitDraft}
                  onChange={(e) => setSiteLimitDraft(Number(e.target.value) || 1)}
                />
              </label>
              <Btn primary onClick={saveSiteLimit} disabled={busy || siteLimitDraft === stats.siteLimit}>
                Save website limit
              </Btn>
            </div>
          </>
        ) : null}
        <div className="sf-divider" />
        <div className="sf-row sf-between">
          <span>Website allowance</span>
          <strong>
            {stats.sites} / {stats.siteLimit}
          </strong>
        </div>
        <div className="sf-progress">
          <span style={{ width: `${sitePct}%` }} />
        </div>
        <div className="sf-row sf-between sf-gap">
          <span>Pending approvals</span>
          <strong>{stats.pendingApprovals}</strong>
        </div>
        <div className="sf-row sf-between">
          <span>Updates published</span>
          <strong>{stats.published}</strong>
        </div>
      </div>

      <div className="sf-box sf-gap">
        <h3>API spend + cost controls</h3>
        <p style={{ fontSize: 13 }}>
          Estimated from live Google and OpenAI calls this workspace has already made. Set a cap to pause overnight
          scans when spend is high.
        </p>
        <div className="sf-three">
          <div>
            <div className="sf-small">Estimated spend</div>
            <div className="sf-metric" style={{ fontSize: 28 }}>
              ${stats.estimatedSpendUsd.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="sf-small">Scan frequency</div>
            <div className="sf-metric" style={{ fontSize: 28 }}>
              {stats.scansPaused ? "Paused" : `${stats.scanHours}h`}
            </div>
          </div>
          <div>
            <div className="sf-small">Cost cap</div>
            <div className="sf-metric" style={{ fontSize: 28 }}>
              {stats.costCapUsd ? `$${stats.costCapUsd}` : "Off"}
            </div>
          </div>
        </div>
        <div className="sf-grid">
          <label className="sf-field">
            Hours between scans
            <input type="number" min={1} max={168} value={scanHours} onChange={(e) => setScanHours(Number(e.target.value) || 6)} />
          </label>
          <label className="sf-field">
            Monthly cost cap (USD, 0 = none)
            <input type="number" min={0} value={costCap} onChange={(e) => setCostCap(Number(e.target.value) || 0)} />
          </label>
        </div>
        <div className="sf-row sf-gap">
          <Btn primary onClick={saveControls} disabled={busy}>
            Save cost controls
          </Btn>
          <Btn
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await saveUsageControls({ scansPaused: !stats.scansPaused });
              setBusy(false);
              toast(stats.scansPaused ? "Scans resumed." : "Scans paused.");
              load();
            }}
          >
            {stats.scansPaused ? "Resume scans" : "Pause scans"}
          </Btn>
        </div>
        <div className="sf-tablewrap">
          <table>
            <thead>
              <tr>
                <th>API</th>
                <th>Calls</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(calls).map(([key, value]) => (
                <tr key={key}>
                  <td>{key.toUpperCase()}</td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sf-box sf-gap">
        <div className="sf-row sf-between">
          <h3>Created projects</h3>
          <Btn href="/app/connections">Open connections</Btn>
        </div>
        {sites.length ? (
          sites.map((site) => (
            <div className="sf-row sf-between" key={site.id}>
              <div>
                <strong>{site.label || site.siteUrl}</strong>
                <div className="sf-small">{site.siteUrl}</div>
              </div>
              <Link className="sf-link" href={`/app/connections/google?site=${site.id}`}>
                Manage →
              </Link>
            </div>
          ))
        ) : (
          <p style={{ fontSize: 13 }}>No projects yet. Connect a WordPress site in Connections.</p>
        )}
      </div>
    </>
  );
}
