"use client";

import { useEffect, useMemo, useState } from "react";
import PartnerShell, { usePartnerCtx } from "@/components/partners/PartnerShell";
import { getPartnerPayout, savePartnerPayout } from "@/lib/partnerApi";

function nextPayoutLabel(now = new Date()) {
  const day = now.getDate() > 15 ? new Date(now.getFullYear(), now.getMonth() + 1, 15) : new Date(now.getFullYear(), now.getMonth(), 15);
  return day.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function PartnerPayoutBody() {
  const { profile } = usePartnerCtx();

  const [method, setMethod] = useState("paypal");
  const [methodSaved, setMethodSaved] = useState(false);
  const [methodBusy, setMethodBusy] = useState(false);
  const [country, setCountry] = useState("us");
  const [outside, setOutside] = useState(true);
  const [certify, setCertify] = useState(false);
  const [saved, setSaved] = useState(false);
  const [taxBusy, setTaxBusy] = useState(false);
  const [payEmail, setPayEmail] = useState("");
  const [legal, setLegal] = useState("");
  const [addr, setAddr] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPartnerPayout().then((res) => {
      if (cancelled || !res.ok) return;
      const po = res.data?.payout || {};
      setMethod(po.method || "paypal");
      setPayEmail(po.email || profile?.email || "");
      setLegal(po.legalName || profile?.displayName || "");
      setAddr(po.address || "");
      setCountry(po.country || "us");
      setOutside(po.outsideUs !== false);
      setCertify(Boolean(po.certified));
      setSaved(Boolean(po.certified && po.legalName && po.address));
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  async function persist(partial) {
    return savePartnerPayout({
      method,
      email: payEmail.trim(),
      legalName: legal.trim(),
      address: addr.trim(),
      country,
      outsideUs: outside,
      certified: certify,
      ...partial,
    });
  }

  const methods = useMemo(
    () =>
      [
        ["paypal", "PayPal", "Paid in US dollars"],
        ["wise", "Wise", "USD, CAD, GBP or EUR"],
        ["cabank", "Canadian bank", "CAD direct deposit"],
        ["usbank", "US bank (ACH)", "Paid in US dollars"],
      ].map(([id, label, sub]) => ({
        id,
        label,
        sub,
        checked: method === id,
        border: method === id ? "#D5F879" : "#262A31",
        bg: method === id ? "rgba(213,248,121,.06)" : "#0A0B0D",
      })),
    [method],
  );

  const isEmail = method === "paypal" || method === "wise";
  const isCaBank = method === "cabank";
  const isUsBank = method === "usbank";
  const emailLabel = method === "paypal" ? "PayPal email" : "Wise email";
  const currency =
    method === "cabank" ? "Canadian dollars" : method === "wise" ? "Your choice of currency" : "US dollars";

  const isUS = country === "us";
  const isCA = country === "ca";
  const isOther = country === "other";
  const ready = certify && legal.trim() && addr.trim() && (country !== "us" || outside);

  const inputStyle = {
    minHeight: 46,
    padding: "0 12px",
    borderRadius: 12,
    border: "1px solid #262A31",
    background: "#0A0B0D",
    color: "#F2F4F5",
    font: "inherit",
    fontSize: 15,
    minWidth: 0,
  };

  return (
    <>
      <div style={{ maxWidth: 1180, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 6 }}>
        <h1
          style={{
            margin: 0,
            fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
            fontSize: "clamp(30px, 3.6vw, 44px)",
            lineHeight: 1.04,
            letterSpacing: "-1.2px",
            fontWeight: 700,
          }}
        >
          How you get paid.
        </h1>
        <span style={{ fontSize: 15, color: "#9AA1AB" }}>
          Payouts go out on the 15th for everything that cleared the month before, once you{"'re"} over $50. We need your tax details before the first one.
        </span>
      </div>

      <div
        style={{
          maxWidth: 1180,
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
          alignItems: "flex-start",
        }}
      >
        <section
          aria-labelledby="meth-h"
          style={{
            flex: "1 1 420px",
            minWidth: 0,
            borderRadius: 22,
            background: "#101215",
            border: "1px solid #1A1D22",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <h2 id="meth-h" style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            Payout method
          </h2>
          <div role="radiogroup" aria-label="Payout method" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
            {methods.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={m.checked}
                onClick={() => {
                  setMethod(m.id);
                  setMethodSaved(false);
                }}
                style={{
                  textAlign: "left",
                  font: "inherit",
                  color: "#F2F4F5",
                  minHeight: 64,
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: `1px solid ${m.border}`,
                  background: m.bg,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600 }}>{m.label}</span>
                <span style={{ fontSize: 12, color: "#9AA1AB" }}>{m.sub}</span>
              </button>
            ))}
          </div>
          {isEmail ? (
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
              {emailLabel}
              <input
                type="email"
                value={payEmail}
                onChange={(e) => {
                  setPayEmail(e.target.value);
                  setMethodSaved(false);
                }}
                style={inputStyle}
              />
            </label>
          ) : null}
          {isCaBank ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
                Institution
                <input inputMode="numeric" placeholder="3 digits" style={inputStyle} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
                Transit
                <input inputMode="numeric" placeholder="5 digits" style={inputStyle} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
                Account
                <input inputMode="numeric" placeholder="7 to 12 digits" style={inputStyle} />
              </label>
            </div>
          ) : null}
          {isUsBank ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
                Routing number
                <input inputMode="numeric" placeholder="9 digits" style={inputStyle} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
                Account number
                <input inputMode="numeric" style={inputStyle} />
              </label>
            </div>
          ) : null}
          <div
            style={{
              borderRadius: 14,
              background: "#0A0B0D",
              border: "1px solid #1A1D22",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              fontSize: 13,
              color: "#9AA1AB",
              lineHeight: 1.5,
            }}
          >
            <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <span>Paid in</span>
              <span style={{ color: "#F2F4F5" }}>{currency}</span>
            </span>
            <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <span>Minimum</span>
              <span style={{ color: "#F2F4F5" }}>$50, smaller balances roll over</span>
            </span>
            <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <span>Next payout</span>
              <span style={{ color: "#F2F4F5" }}>{nextPayoutLabel()}</span>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={methodBusy || !loaded}
              onClick={async () => {
                setMethodBusy(true);
                const res = await persist({ method, email: payEmail.trim() });
                setMethodBusy(false);
                if (res.ok) setMethodSaved(true);
              }}
              style={{
                minHeight: 46,
                padding: "0 18px",
                borderRadius: 12,
                border: 0,
                background: "#D5F879",
                color: "#0A0B0D",
                fontSize: 14,
                fontWeight: 600,
                opacity: methodBusy || !loaded ? 0.45 : 1,
              }}
            >
              {methodBusy ? "Saving…" : "Save payout method"}
            </button>
            {methodSaved ? (
              <span role="status" style={{ fontSize: 13, color: "#3DDC84" }}>
                Saved. We sent a confirmation code to your email before the change takes effect.
              </span>
            ) : null}
          </div>
        </section>

        <section
          aria-labelledby="tax-h"
          style={{
            flex: "999 1 520px",
            minWidth: 0,
            borderRadius: 22,
            background: "#101215",
            border: `1px solid ${saved ? "rgba(61,220,132,.4)" : "rgba(255,197,61,.35)"}`,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <h2 id="tax-h" style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
              Tax details
            </h2>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "5px 10px",
                borderRadius: 999,
                color: saved ? "#3DDC84" : "#FFC53D",
                background: saved ? "rgba(61,220,132,.12)" : "rgba(255,197,61,.12)",
              }}
            >
              {saved ? "On file" : "Needed before your first payout"}
            </span>
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
            Where do you live and do your referral work?
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setSaved(false);
              }}
              style={{ ...inputStyle, padding: "0 10px" }}
            >
              <option value="us">United States</option>
              <option value="ca">Canada</option>
              <option value="other">Another country</option>
            </select>
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
              Legal name or business name
              <input
                type="text"
                value={legal}
                onChange={(e) => {
                  setLegal(e.target.value);
                  setSaved(false);
                }}
                style={inputStyle}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
              Mailing address
              <input
                type="text"
                value={addr}
                onChange={(e) => {
                  setAddr(e.target.value);
                  setSaved(false);
                }}
                style={inputStyle}
              />
            </label>
          </div>
          {isUS ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, lineHeight: 1.5 }}>
                <input
                  type="checkbox"
                  checked={outside}
                  onChange={() => {
                    setOutside(!outside);
                    setSaved(false);
                  }}
                  style={{ marginTop: 3 }}
                />
                I do my referral work from outside Canada.
              </label>
              <span style={{ fontSize: 13, color: "#9AA1AB", lineHeight: 1.5 }}>
                Searchify is a Canadian company. When the work is done outside Canada, no Canadian tax is taken off your commissions. You report them on your own US return.
              </span>
            </div>
          ) : null}
          {isCA ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
                  SIN, or business number if you have one
                  <input type="text" inputMode="numeric" placeholder="9 digits" style={inputStyle} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
                  GST/HST number (only if registered)
                  <input type="text" placeholder="123456789 RT0001" style={inputStyle} />
                </label>
              </div>
              <span style={{ fontSize: 13, color: "#9AA1AB", lineHeight: 1.5 }}>
                If we pay you more than $500 in a year, we send you a T4A slip by the end of February. If you{"'re"} registered for GST/HST, we add it on top of your commissions.
              </span>
            </>
          ) : null}
          {isOther ? (
            <>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
                Tax ID in your country (optional)
                <input type="text" style={inputStyle} />
              </label>
              <span style={{ fontSize: 13, color: "#9AA1AB", lineHeight: 1.5 }}>
                You report your commissions where you live. We may ask for more if your country requires it.
              </span>
            </>
          ) : null}
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, lineHeight: 1.5 }}>
            <input
              type="checkbox"
              checked={certify}
              onChange={() => {
                setCertify(!certify);
                setSaved(false);
              }}
              style={{ marginTop: 3 }}
            />
            The details above are true and complete, and I{"'ll"} update them if anything changes.
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={!ready || taxBusy || !loaded}
              onClick={async () => {
                setTaxBusy(true);
                const res = await persist({
                  legalName: legal.trim(),
                  address: addr.trim(),
                  country,
                  outsideUs: outside,
                  certified: certify,
                });
                setTaxBusy(false);
                if (res.ok) setSaved(true);
              }}
              style={{
                minHeight: 46,
                padding: "0 18px",
                borderRadius: 12,
                border: 0,
                background: "#D5F879",
                color: "#0A0B0D",
                fontSize: 14,
                fontWeight: 600,
                opacity: ready && !taxBusy && loaded ? 1 : 0.45,
              }}
            >
              {taxBusy ? "Saving…" : "Save tax details"}
            </button>
            <span role="status" style={{ fontSize: 13, color: saved ? "#3DDC84" : "#9AA1AB" }}>
              {saved ? "Saved. Your payouts are unlocked." : ready ? "Ready to save." : "Fill in your name and address, then tick the box above."}
            </span>
          </div>
          <span style={{ fontSize: 12, color: "#7D848E" }}>
            Stored encrypted. Only the Searchify finance team can see it. This is general information, not tax advice.
          </span>
        </section>
      </div>
    </>
  );
}

export default function PartnerPayout() {
  return (
    <PartnerShell active="payout" minHeight={900}>
      <PartnerPayoutBody />
    </PartnerShell>
  );
}
