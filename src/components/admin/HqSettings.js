"use client";

import { useEffect, useState } from "react";
import HqPanel, { useFirstLoad } from "@/components/admin/HqPanel";
import PasswordChangeForm from "@/components/account/PasswordChangeForm";
import { authHeaders } from "@/utils/users/Helpers";

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

export default function HqSettings() {
  const [me, setMe] = useState(null);
  const [loading, firstLoad] = useFirstLoad();

  useEffect(() => {
    let cancelled = false;
    firstLoad(fetch("/api/v1/auth/me", { headers: authHeaders(), cache: "no-store" }))
      .then((r) => r.json().catch(() => null))
      .then((data) => {
        if (!cancelled && data?.email) setMe(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <HqPanel loading={loading} minHeight={900}>
      <section style={{ maxWidth: 1240, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 6 }}>
        <h1 style={{ margin: 0, fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, letterSpacing: "-0.02em" }}>Settings</h1>
        <p style={{ margin: 0, fontSize: 15, color: "#9AA1AB" }}>Your HQ admin account.</p>
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
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Account</h2>
          <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "120px 1fr", gap: "10px 12px", fontSize: 14 }}>
            <dt style={{ color: "#7D848E" }}>Username</dt>
            <dd style={{ margin: 0 }}>{me?.username || "…"}</dd>
            <dt style={{ color: "#7D848E" }}>Email</dt>
            <dd style={{ margin: 0, wordBreak: "break-all" }}>{me?.email || "…"}</dd>
            <dt style={{ color: "#7D848E" }}>Role</dt>
            <dd style={{ margin: 0 }}>HQ admin</dd>
            <dt style={{ color: "#7D848E" }}>Sign-in page</dt>
            <dd style={{ margin: 0, fontFamily: "'Geist Mono', monospace", fontSize: 13 }}>/admin/login</dd>
          </dl>
          <p style={{ margin: 0, fontSize: 13, color: "#7D848E", lineHeight: 1.5 }}>
            Locked out with no email set up? Set a new ADMIN_PASSWORD in the backend environment and restart the API. It
            is applied once, when the value changes.
          </p>
        </div>
        <div style={card}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Change password</h2>
          <PasswordChangeForm area="admin" />
        </div>
      </section>
    </HqPanel>
  );
}
