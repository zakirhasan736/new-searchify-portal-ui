"use client";

import { useCallback, useEffect, useState } from "react";
import { getHqSystemCheck } from "@/lib/hqApi";

const TONE = {
  ok: { dot: "#3DDC84", border: "#1A1D22", bg: "transparent" },
  warn: { dot: "#FFC53D", border: "rgba(255,197,61,.3)", bg: "rgba(255,197,61,.05)" },
  error: { dot: "#FF5A4E", border: "rgba(255,90,78,.35)", bg: "rgba(255,90,78,.06)" },
};

/** Why connected customers might see no results: DataForSEO, OpenAI and Google setup, checked live. */
export default function SystemCheck() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");

  const run = useCallback(async (deep = false) => {
    setBusy(deep ? "deep" : "quick");
    setNote("");
    const res = await getHqSystemCheck(deep).catch(() => ({ ok: false, data: {} }));
    setBusy("");
    if (!res.ok) {
      setNote(typeof res.data?.detail === "string" ? res.data.detail : "The system check could not run.");
      return;
    }
    setData(res.data);
  }, []);

  useEffect(() => {
    run(false);
  }, [run]);

  const checks = data?.checks || [];
  const head = !data ? "Checking services…" : data.errors ? `${data.errors} service problem${data.errors === 1 ? "" : "s"} stop results` : data.warnings ? "Services work, with warnings" : "All services working";

  return (
    <section aria-label="System check" style={{ maxWidth: 1240, width: "100%", margin: "0 auto", boxSizing: "border-box", borderRadius: 18, border: "1px solid #262A31", background: "#101215", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: "1 1 320px" }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: "#F2F4F5" }}>System check: {head}</span>
          <span style={{ fontSize: 13, color: "#9AA1AB" }}>
            DataForSEO (keywords, backlinks, audit, AI visibility), OpenAI and Google setup. The full check spends a few cents on one small request per DataForSEO API.
          </span>
        </span>
        <button type="button" onClick={() => run(false)} disabled={!!busy} style={{ minHeight: 40, padding: "0 14px", borderRadius: 10, border: "1px solid #262A31", background: "transparent", color: "#F2F4F5", fontSize: 13 }}>
          {busy === "quick" ? "Checking…" : "Check again"}
        </button>
        <button type="button" onClick={() => run(true)} disabled={!!busy} style={{ minHeight: 40, padding: "0 14px", borderRadius: 10, border: 0, background: "#D5F879", color: "#0A0B0D", fontSize: 13, fontWeight: 600 }}>
          {busy === "deep" ? "Testing APIs…" : "Test every DataForSEO API"}
        </button>
      </div>
      {checks.map((check) => {
        const tone = TONE[check.state] || TONE.warn;
        return (
          <div key={check.key} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 12px", borderRadius: 12, border: `1px solid ${tone.border}`, background: tone.bg }}>
            <span aria-hidden style={{ width: 8, height: 8, borderRadius: 4, background: tone.dot, marginTop: 6, flex: "none" }} />
            <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#F2F4F5" }}>
                <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{check.state === "ok" ? "Working: " : check.state === "error" ? "Problem: " : "Warning: "}</span>
                {check.label}
              </span>
              {check.detail ? <span style={{ fontSize: 13, color: "#9AA1AB", lineHeight: 1.45, overflowWrap: "anywhere" }}>{check.detail}</span> : null}
              {check.fix ? <span style={{ fontSize: 13, color: "#D7DADE", lineHeight: 1.45 }}>Fix: {check.fix}</span> : null}
            </span>
          </div>
        );
      })}
      {data?.checkedAt ? <span style={{ fontSize: 12, color: "#7D848E" }}>Checked {data.checkedAt} UTC{data.deep ? " · full API test" : ""}</span> : null}
      {note ? <span role="status" style={{ fontSize: 13, color: "#FF8A80" }}>{note}</span> : null}
    </section>
  );
}
