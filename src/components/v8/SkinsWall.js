"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SearchifyMarkSvg from "@/components/v8/SearchifyMarkSvg";
import { SKIN_SECTIONS } from "@/lib/skinCatalog";
import { getUser, userIsAuthenticated, userLogout } from "@/utils/users/Helpers";
import {
  PARTNER_KEY,
  PREVIEW_KEY,
  clearSessionFlag,
  isAdminAuthenticated,
  isPartnerAuthenticated,
  isPreviewSignedIn,
} from "@/lib/authRoles";

export default function SkinsWall() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [who, setWho] = useState("preview");

  useEffect(() => {
    const preview = isPreviewSignedIn();
    const customer = userIsAuthenticated();
    const partner = isPartnerAuthenticated();
    const admin = isAdminAuthenticated();
    if (!preview && !customer && !partner && !admin) {
      router.replace(`/login?next=${encodeURIComponent("/skins")}`);
      return;
    }
    const name = getUser()?.result?.username || getUser()?.data?.username;
    setWho(admin ? `${name || "admin"} · HQ` : partner ? "partner session" : customer ? name || "workspace" : "demo@searchify.io · preview only");
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div style={{ minHeight: "100dvh", background: "#0A0B0D", color: "#9AA1AB", padding: 28, fontFamily: "Geist, system-ui, sans-serif" }}>
        Loading screens…
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#0A0B0D",
        color: "#F2F4F5",
        font: "15px/1.5 Geist, system-ui, sans-serif",
        paddingLeft: "max(16px, env(safe-area-inset-left, 0px))",
        paddingRight: "max(16px, env(safe-area-inset-right, 0px))",
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          paddingBlock: "28px 64px",
          display: "flex",
          flexDirection: "column",
          gap: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 600, fontSize: 17 }}>
          <SearchifyMarkSvg size={28} />
          searchify
          <span
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: 11,
              color: "#9AA1AB",
              border: "1px solid #262A31",
              borderRadius: 6,
              padding: "2px 7px",
              marginLeft: 6,
            }}
          >
            PREVIEW
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#9AA1AB" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4DA3FF", boxShadow: "0 0 10px #4DA3FF" }} />
              Signed in as {who}
            </div>
            <button
              type="button"
              onClick={() => {
                clearSessionFlag(PREVIEW_KEY);
                clearSessionFlag(PARTNER_KEY);
                try {
                  userLogout();
                } catch {
                  /* ignore */
                }
                router.replace("/");
              }}
              style={{
                minHeight: 40,
                padding: "0 14px",
                borderRadius: 999,
                border: "1px solid #262A31",
                background: "transparent",
                color: "#F2F4F5",
                font: "500 13px Geist, system-ui, sans-serif",
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(34px, 4.6vw, 56px)",
                  lineHeight: 0.96,
                  letterSpacing: "-2px",
                }}
              >
                Every screen, in one place.
              </h1>
              <p style={{ margin: 0, color: "#9AA1AB", fontSize: 17, maxWidth: "46ch" }}>
                Directory of every skin. Customer /app needs a workspace login, partners need /partners/login, HQ needs an
                admin account — tiles still enforce those gates.
              </p>
            </div>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: 56,
                padding: "0 26px",
                borderRadius: 14,
                background: "#4DA3FF",
                color: "#0A0B0D",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 16,
                boxShadow: "0 0 24px rgba(77,163,255,.45)",
              }}
            >
              Start the tour from the landing page
            </Link>
          </div>

          {SKIN_SECTIONS.map((section) => (
            <section key={section.title}>
              <h3
                style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: "0.6px",
                  color: "#7D848E",
                  margin: "0 0 12px",
                  textTransform: "uppercase",
                }}
              >
                {section.title}
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                  gap: 10,
                }}
              >
                {section.tiles.map((tile) => (
                  <Link
                    key={`${section.title}-${tile.href}-${tile.t}`}
                    href={tile.href}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      padding: "16px 18px",
                      borderRadius: 16,
                      background: "#101215",
                      border: "1px solid #1A1D22",
                      color: "#F2F4F5",
                      textDecoration: "none",
                      minHeight: 44,
                    }}
                  >
                    {tile.n ? (
                      <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color: "#7D848E" }}>{tile.n}</span>
                    ) : null}
                    <span style={{ fontWeight: 600 }}>{tile.t}</span>
                    {tile.d ? <span style={{ fontSize: 14, color: "#9AA1AB" }}>{tile.d}</span> : null}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
