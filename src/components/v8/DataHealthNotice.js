"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import RegionSelector from "@/components/board/RegionSelector";
import { getDataHealth, runSiteScan, syncGoogleLive } from "@/lib/v1Api";
import { activeJourneySite } from "@/lib/journey";

const TONE = {
  error: { dot: "#FF5A4E", border: "rgba(255,90,78,.35)", bg: "rgba(255,90,78,.06)" },
  warn: { dot: "#FFC53D", border: "rgba(255,197,61,.3)", bg: "rgba(255,197,61,.05)" },
};

/**
 * Says why a screen is empty or partial: no scan yet, a firewall, no market, Google property not chosen,
 * the research service down. Shows nothing when everything the screen needs is in place.
 * `need` limits it to the checks that matter for this screen (e.g. ["scan", "market", "research"]).
 */
export default function DataHealthNotice({ need = null, onFixed = null, style = null }) {
  const [checks, setChecks] = useState([]);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const site = activeJourneySite()?.answers?.site || "";

  const load = useCallback(async () => {
    const res = await getDataHealth(site).catch(() => ({ ok: false }));
    if (res?.ok && Array.isArray(res.data?.checks)) setChecks(res.data.checks);
  }, [site]);

  useEffect(() => {
    load();
  }, [load]);

  const shown = checks.filter((c) => c.state !== "ok" && (!need || need.includes(c.key)));
  if (!shown.length) return null;

  const act = async (check) => {
    const action = check.action || {};
    setNote("");
    if (action.do === "scan") {
      setBusy(check.key);
      const res = await runSiteScan({ site, force: true }).catch(() => ({ ok: false, data: {} }));
      setBusy("");
      if (!res.ok) {
        setNote(res.data?.problem?.message || res.data?.detail?.message || res.data?.detail || "The scan could not finish.");
      } else {
        setNote(`Scan finished: ${res.data?.scan?.pagesRead || 0} pages read.`);
        onFixed?.();
      }
      load();
    } else if (action.do === "sync") {
      setBusy(check.key);
      const res = await syncGoogleLive().catch(() => ({ ok: false, data: {} }));
      setBusy("");
      setNote(res.ok ? "Search Console data loaded." : res.data?.detail || "Google could not be read just now.");
      if (res.ok) onFixed?.();
      load();
    } else if (action.do === "contact_support") {
      window.location.href = "mailto:support@searchify.io?subject=" + encodeURIComponent("Research data unavailable");
    }
  };

  return (
    <section
      aria-label="What this page still needs"
      style={{
        borderRadius: 16,
        border: "1px solid #262A31",
        background: "#101215",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        ...(style || {}),
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: "#F2F4F5" }}>
        {shown.some((c) => c.state === "error") ? "Some results can't show yet" : "Results are partial"}
      </span>
      {shown.map((check) => {
        const tone = TONE[check.state] || TONE.warn;
        const action = check.action || {};
        return (
          <div
            key={check.key}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              flexWrap: "wrap",
              padding: "10px 12px",
              borderRadius: 12,
              border: `1px solid ${tone.border}`,
              background: tone.bg,
            }}
          >
            <span aria-hidden style={{ width: 8, height: 8, borderRadius: 4, background: tone.dot, marginTop: 6, flex: "none" }} />
            <span style={{ flex: "1 1 260px", minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#F2F4F5" }}>{check.label}</span>
              {check.detail ? <span style={{ fontSize: 13, color: "#9AA1AB", lineHeight: 1.45 }}>{check.detail}</span> : null}
              {check.key === "market" ? (
                <span style={{ marginTop: 6 }}>
                  <RegionSelector siteUrl={site} />
                </span>
              ) : null}
            </span>
            {action.href ? (
              <Link
                href={action.href}
                style={{ alignSelf: "center", minHeight: 36, display: "inline-flex", alignItems: "center", padding: "0 12px", borderRadius: 10, border: "1px solid #262A31", color: "#F2F4F5", fontSize: 13, textDecoration: "none" }}
              >
                {action.label}
              </Link>
            ) : action.do && check.key !== "market" ? (
              <button
                type="button"
                onClick={() => act(check)}
                disabled={busy === check.key}
                style={{ alignSelf: "center", minHeight: 36, padding: "0 12px", borderRadius: 10, border: 0, background: "#D5F879", color: "#0A0B0D", fontSize: 13, fontWeight: 600, opacity: busy === check.key ? 0.7 : 1 }}
              >
                {busy === check.key ? "Working…" : action.label}
              </button>
            ) : null}
          </div>
        );
      })}
      {note ? (
        <span role="status" style={{ fontSize: 13, color: "#9AA1AB" }}>
          {note}
        </span>
      ) : null}
    </section>
  );
}
