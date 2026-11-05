"use client";

import { useEffect, useState } from "react";
import HqPanel, { useFirstLoad } from "@/components/admin/HqPanel";
import {
  approvePayoutStatement,
  draftPayoutStatement,
  editPayoutStatement,
  getPayoutSettings,
  getPayoutStatements,
  rejectPayoutStatement,
  savePayoutSettings,
} from "@/lib/hqApi";
import { authHeaders } from "@/utils/users/Helpers";

const RATE_FIELDS = [
  ["affiliateSolo", "Affiliate Solo %"],
  ["affiliatePro", "Affiliate Pro %"],
  ["affiliateAgency", "Affiliate Agency %"],
  ["affiliateManaged", "Affiliate Managed SEO %"],
  ["partnerSolo", "Partner Solo %"],
  ["partnerPro", "Partner Pro %"],
  ["partnerAgency", "Partner Agency %"],
  ["partnerManaged", "Partner Managed SEO %"],
  ["reserveRate", "Reserve % of profit"],
];

const NUMBER_FIELDS = [
  ["affiliateMonths", "Affiliate commission months (0 = lifetime)"],
  ["partnerMonths", "Partner commission months (0 = while subscribed)"],
  ["holdDays", "Hold days before payable"],
  ["minimumPayout", "Minimum payout"],
  ["cashCoverMonths", "Months of costs the reserve must cover"],
  ["profitableMonthsRequired", "Profitable months required in a row"],
];

const COST_FIELDS = [
  ["dataforseo", "DataForSEO"],
  ["openai", "OpenAI"],
  ["aws", "AWS"],
  ["maintenance", "Developer maintenance"],
  ["tools", "Software and accounting"],
  ["salary", "Owner salary"],
];

function pct(value) {
  const n = Number(value || 0);
  return n <= 1 ? Math.round(n * 1000) / 10 : n;
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default function HqPayouts() {
  const [loading, firstLoad] = useFirstLoad();
  const [settings, setSettings] = useState(null);
  const [statements, setStatements] = useState([]);
  const [statement, setStatement] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  const load = () =>
    Promise.all([getPayoutSettings(), getPayoutStatements()]).then(([settingsRes, listRes]) => {
      if (settingsRes.ok) setSettings(settingsRes.data.settings);
      if (listRes.ok) setStatements(listRes.data.statements || []);
    });

  useEffect(() => {
    firstLoad(load());
  }, []);

  const saveSettings = async () => {
    setErr("");
    const owners = (settings.owners || []).map((row) => ({ ...row, pct: pct(row.pct) }));
    const body = { ...settings, owners };
    RATE_FIELDS.forEach(([key]) => {
      body[key] = pct(settings[key]);
    });
    const res = await savePayoutSettings(body);
    if (!res.ok) setErr(res.data?.detail || "Could not save settings.");
    else setSettings(res.data.settings);
  };

  const build = async () => {
    setErr("");
    const costs = statement?.month === month ? statement.costs : {};
    const res = await draftPayoutStatement({
      month,
      note,
      bankBalance: statement?.bankBalance,
      costs,
      revenueGross: statement?.month === month ? statement.revenueGross : undefined,
      stripeFees: statement?.month === month ? statement.stripeFees : undefined,
      refunds: statement?.month === month ? statement.refunds : undefined,
      salesTax: statement?.month === month ? statement.salesTax : undefined,
    });
    if (!res.ok) setErr(res.data?.detail || "Could not build the statement.");
    else {
      setStatement(res.data.statement);
      setStatements(await getPayoutStatements().then((r) => r.data?.statements || []));
    }
  };

  const recalculate = async () => {
    if (!statement) return;
    const res = await editPayoutStatement(statement.id, {
      note,
      bankBalance: statement.bankBalance,
      costs: statement.costs,
      revenueGross: statement.revenueGross,
      stripeFees: statement.stripeFees,
      refunds: statement.refunds,
      salesTax: statement.salesTax,
    });
    if (!res.ok) setErr(res.data?.detail || "Could not recalculate.");
    else setStatement(res.data.statement);
  };

  const download = async () => {
    if (!statement) return;
    const res = await fetch(`/api/v1/hq/statements/${encodeURIComponent(statement.id)}/csv`, { headers: authHeaders() });
    const text = await res.text();
    const blob = new Blob([text], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${statement.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const fieldStyle = {
    minHeight: 36,
    borderRadius: 8,
    border: "1px solid #262A31",
    background: "#101215",
    color: "#F2F4F5",
    padding: "0 8px",
    width: 120,
  };

  return (
    <HqPanel loading={loading} shellGap={20}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18, color: "#F2F4F5" }}>
        <h1 style={{ margin: 0, fontSize: 32 }}>Monthly payout</h1>
        <p style={{ margin: 0, color: "#9AA1AB" }}>
          Nothing is sent automatically. Build the month, edit the numbers, then approve. You pay PayPal, Wise, or bank yourself.
        </p>
        {err ? <p style={{ color: "#FF8A80" }}>{String(err)}</p> : null}
        {settings ? (
          <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Settings</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 8 }}>
              {RATE_FIELDS.map(([key, label]) => (
                <label key={key} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                  <span>{label}</span>
                  <input style={fieldStyle} value={pct(settings[key])} onChange={(event) => setSettings({ ...settings, [key]: event.target.value })} />
                </label>
              ))}
              {NUMBER_FIELDS.map(([key, label]) => (
                <label key={key} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                  <span>{label}</span>
                  <input style={fieldStyle} value={settings[key] ?? ""} onChange={(event) => setSettings({ ...settings, [key]: event.target.value })} />
                </label>
              ))}
            </div>
            <h3 style={{ margin: "8px 0 0", fontSize: 16 }}>Ownership split</h3>
            {(settings.owners || []).map((row, index) => (
              <div key={row.id || index} style={{ display: "flex", gap: 8 }}>
                <input
                  style={{ ...fieldStyle, width: 220 }}
                  value={row.name}
                  onChange={(event) => {
                    const owners = settings.owners.slice();
                    owners[index] = { ...row, name: event.target.value };
                    setSettings({ ...settings, owners });
                  }}
                />
                <input
                  style={fieldStyle}
                  value={pct(row.pct)}
                  onChange={(event) => {
                    const owners = settings.owners.slice();
                    owners[index] = { ...row, pct: event.target.value };
                    setSettings({ ...settings, owners });
                  }}
                />
                <span style={{ color: "#9AA1AB", alignSelf: "center" }}>%</span>
              </div>
            ))}
            <button type="button" onClick={saveSettings} style={{ alignSelf: "flex-start", minHeight: 36, border: 0, borderRadius: 8, background: "#4DA3FF", color: "#101215", padding: "0 12px" }}>
              Save settings
            </button>
          </section>
        ) : null}

        <section style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input style={fieldStyle} value={month} onChange={(event) => setMonth(event.target.value)} />
          <button type="button" onClick={build} style={{ minHeight: 36, border: 0, borderRadius: 8, background: "#262A31", color: "#F2F4F5", padding: "0 12px" }}>
            Build statement
          </button>
        </section>

        {statement ? (
          <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>{statement.month} · {statement.status}</h2>
            <p style={{ margin: 0 }}>1. Net revenue {money(statement.revenueNet)} from {money(statement.revenueGross)} collected, minus fees, refunds, and tax.</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["revenueGross", "stripeFees", "refunds", "salesTax", "bankBalance"].map((key) => (
                <label key={key}>
                  {key}{" "}
                  <input style={fieldStyle} value={statement[key] ?? 0} onChange={(event) => setStatement({ ...statement, [key]: event.target.value })} />
                </label>
              ))}
            </div>
            <p style={{ margin: 0 }}>2. Commissions {money(statement.commissionTotal)}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {COST_FIELDS.map(([key, label]) => (
                <label key={key}>
                  {label}{" "}
                  <input
                    style={fieldStyle}
                    value={statement.costs?.[key] ?? 0}
                    onChange={(event) => setStatement({ ...statement, costs: { ...statement.costs, [key]: event.target.value } })}
                  />
                </label>
              ))}
            </div>
            <p style={{ margin: 0 }}>3. Costs {money(statement.costTotal)}. Profit {money(statement.profit)}.</p>
            <p style={{ margin: 0 }}>4. Reserve held {money(statement.reserveHeld)}.</p>
            <p style={{ margin: 0 }}>5. Distributable {money(statement.distributable)}. Carried {money(statement.carried)}.</p>
            {statement.blockedReason ? <p style={{ margin: 0, color: "#FFC53D" }}>{statement.blockedReason}</p> : <p style={{ margin: 0, color: "#3DDC84" }}>Both gates passed.</p>}
            <ul>
              {(statement.owners || []).map((owner) => (
                <li key={owner.id}>{owner.name} · {pct(owner.pct)}% · {money(owner.amount)}</li>
              ))}
            </ul>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Note" style={{ minHeight: 70, borderRadius: 8, border: "1px solid #262A31", background: "#101215", color: "#F2F4F5", padding: 8 }} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={recalculate} style={{ minHeight: 36, border: 0, borderRadius: 8, background: "#262A31", color: "#F2F4F5", padding: "0 12px" }}>Recalculate</button>
              <button type="button" onClick={async () => setStatement((await approvePayoutStatement(statement.id, note)).data?.statement || statement)} style={{ minHeight: 36, border: 0, borderRadius: 8, background: "#4DA3FF", color: "#101215", padding: "0 12px" }}>Approve</button>
              <button type="button" onClick={async () => setStatement((await rejectPayoutStatement(statement.id, note)).data?.statement || statement)} style={{ minHeight: 36, border: 0, borderRadius: 8, background: "#262A31", color: "#F2F4F5", padding: "0 12px" }}>Reject</button>
              <button type="button" onClick={download} style={{ minHeight: 36, border: 0, borderRadius: 8, background: "#262A31", color: "#F2F4F5", padding: "0 12px" }}>Download CSV</button>
            </div>
          </section>
        ) : null}

        <section>
          <h2 style={{ fontSize: 18 }}>History</h2>
          <ul>
            {statements.map((row) => (
              <li key={row.id}>
                <button type="button" onClick={() => { setStatement(row); setMonth(row.month); setNote(row.note || ""); }} style={{ background: "none", border: 0, color: "#9FE7F5", cursor: "pointer" }}>
                  {row.month} · {row.status} · profit {money(row.profit)}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </HqPanel>
  );
}
