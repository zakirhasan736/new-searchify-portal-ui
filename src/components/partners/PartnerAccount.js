"use client";

import PartnerShell, { usePartnerCtx } from "@/components/partners/PartnerShell";
import PasswordChangeForm from "@/components/account/PasswordChangeForm";

const card = {
  borderRadius: 20,
  background: "#101215",
  border: "1px solid #1A1D22",
  padding: 22,
  display: "flex",
  flexDirection: "column",
  gap: 14,
  minWidth: 0,
};

function Body() {
  const { profile, ptype } = usePartnerCtx();
  return (
    <>
      <section style={{ maxWidth: 1240, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 6 }}>
        <h1 style={{ margin: 0, fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, letterSpacing: "-0.02em" }}>Account</h1>
        <p style={{ margin: 0, fontSize: 15, color: "#9AA1AB" }}>Your partner sign-in and password.</p>
      </section>
      <section
        style={{
          maxWidth: 1240,
          width: "100%",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 14,
          alignItems: "start",
        }}
      >
        <div style={card}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Partner details</h2>
          <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "120px 1fr", gap: "10px 12px", fontSize: 14 }}>
            <dt style={{ color: "#7D848E" }}>Name</dt>
            <dd style={{ margin: 0 }}>{profile?.displayName || "…"}</dd>
            <dt style={{ color: "#7D848E" }}>Email</dt>
            <dd style={{ margin: 0, wordBreak: "break-all" }}>{profile?.email || "…"}</dd>
            <dt style={{ color: "#7D848E" }}>Type</dt>
            <dd style={{ margin: 0 }}>{ptype === "founding" ? "Founding partner" : "Partner"}</dd>
            <dt style={{ color: "#7D848E" }}>Rate</dt>
            <dd style={{ margin: 0 }}>{profile?.rate ? `${Math.round(Number(profile.rate) * 100)}%` : "…"}</dd>
            <dt style={{ color: "#7D848E" }}>Referral handle</dt>
            <dd style={{ margin: 0, fontFamily: "'Geist Mono', monospace", fontSize: 13 }}>{profile?.handle || "…"}</dd>
            <dt style={{ color: "#7D848E" }}>Partner since</dt>
            <dd style={{ margin: 0 }}>{profile?.since || "…"}</dd>
          </dl>
          <p style={{ margin: 0, fontSize: 13, color: "#7D848E", lineHeight: 1.5 }}>
            To change your name, email or rate, contact Searchify. Payout details are under Payout and tax.
          </p>
        </div>
        <div style={card}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Change password</h2>
          <PasswordChangeForm area="partner" />
        </div>
      </section>
    </>
  );
}

export default function PartnerAccount() {
  return (
    <PartnerShell active="account">
      <Body />
    </PartnerShell>
  );
}
