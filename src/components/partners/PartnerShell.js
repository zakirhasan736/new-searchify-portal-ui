"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import SearchifyMarkSvg from "@/components/v8/SearchifyMarkSvg";
import SearchifyLoader from "@/components/v8/SearchifyLoader";
import { ShellBusyProvider } from "@/components/v8/ShellBusy";
import { getPartnerMe, partnerInitials } from "@/lib/partnerApi";
import { userLogout } from "@/utils/users/Helpers";
import { PARTNER_KEY, clearSessionFlag, isPartnerAuthenticated } from "@/lib/authRoles";

const TABS = [
  { href: "/partners", id: "overview", label: "Overview" },
  { href: "/partners/earnings", id: "earnings", label: "Earnings" },
  { href: "/partners/payout", id: "payout", label: "Payout and tax" },
  { href: "/partners/terms", id: "terms", label: "Agreement and rules" },
  { href: "/partners/account", id: "account", label: "Account" },
];

export const PartnerCtx = createContext({ ptype: "standard", setPtype: () => {}, me: null, overview: null });

export function usePartnerCtx() {
  return useContext(PartnerCtx);
}

export function meFromProfile(profile, ptype) {
  const name = profile?.displayName || profile?.name || "Partner";
  const since = profile?.since || "";
  const F = ptype === "founding" || profile?.tier === "founding";
  return {
    name,
    initials: partnerInitials(name),
    sub: F ? "Founding partner" : since ? `Partner since ${since}` : "Partner",
  };
}

const SHELL_CSS = `
.partner-v8-root{margin:0;background:#0A0B0D}
.partner-v8-root a{color:#D5F879;text-decoration:none}
.partner-v8-root a:hover{color:#ECFFB8}
.partner-v8-root button{font-family:inherit;cursor:pointer}
.partner-v8-root input:focus-visible,.partner-v8-root button:focus-visible,.partner-v8-root a:focus-visible,.partner-v8-root select:focus-visible{outline:2px solid #4DA3FF;outline-offset:2px}
.partner-v8-root input[type=checkbox]{accent-color:#D5F879;width:18px;height:18px;flex:none}
@keyframes sfy-grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes sfy-rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion: reduce){.partner-v8-root *{animation:none !important;transition:none !important}}
`;

const navLinkBase = {
  minHeight: 38,
  display: "inline-flex",
  alignItems: "center",
  padding: "0 14px",
  borderRadius: 10,
  textDecoration: "none",
  fontSize: 14,
};

export default function PartnerShell({
  children,
  active = "overview",
  minHeight = 900,
  showPreview = false,
  showSignOut = true,
}) {
  const pathname = usePathname() || "/partners";
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [ptype, setPtypeState] = useState("standard");
  const [profile, setProfile] = useState(null);

  const setPtype = useCallback((t) => {
    try {
      sessionStorage.setItem("searchify-partner-type", t);
    } catch {
      /* ignore */
    }
    setPtypeState(t);
  }, []);

  useEffect(() => {
    // Partner centre is isolated: customer JWT alone must not unlock it.
    if (!isPartnerAuthenticated()) {
      router.replace("/partners/login");
      return;
    }
    let cancelled = false;
    getPartnerMe()
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) {
          clearSessionFlag(PARTNER_KEY);
          userLogout();
          router.replace("/partners/login");
          return;
        }
        const p = res.data?.profile || {};
        setProfile(p);
        const tier = res.data?.tier || p.tier || "standard";
        setPtypeState(tier === "founding" ? "founding" : "standard");
        try {
          sessionStorage.setItem("searchify-partner-type", tier === "founding" ? "founding" : "standard");
        } catch {
          /* ignore */
        }
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          // Session flag alone (offline) — still allow shell with minimal profile.
          try {
            setPtypeState(sessionStorage.getItem("searchify-partner-type") || "standard");
          } catch {
            setPtypeState("standard");
          }
          setProfile({ displayName: "Partner", since: "" });
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const me = useMemo(() => meFromProfile(profile, ptype), [profile, ptype]);
  const ctx = useMemo(() => ({ ptype, setPtype, me, profile }), [ptype, setPtype, me, profile]);

  const signOut = () => {
    clearSessionFlag(PARTNER_KEY);
    try {
      sessionStorage.removeItem("searchify-partner-type");
    } catch {
      /* ignore */
    }
    userLogout();
    router.replace("/partners/login");
  };

  if (!ready) {
    return <SearchifyLoader full label="Opening your partner centre" />;
  }

  const types = [
    ["standard", "Partner"],
    ["founding", "Founding partner"],
  ];

  return (
    <PartnerCtx.Provider value={ctx}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <style>{SHELL_CSS}</style>
      <div
        className="partner-v8-root"
        style={{
          minHeight,
          background: "#0A0B0D",
          color: "#F2F4F5",
          fontFamily: "Geist, 'Helvetica Neue', sans-serif",
          boxSizing: "border-box",
          padding: "22px clamp(16px, 4vw, 56px) 56px",
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <header
          style={{
            maxWidth: 1180,
            width: "100%",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 10, marginRight: "auto" }}>
            <SearchifyMarkSvg size={30} />
            <span
              style={{
                fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                fontWeight: 800,
                fontSize: 19,
                letterSpacing: "-0.4px",
              }}
            >
              searchify
            </span>
            <span
              style={{
                fontFamily: "'Geist Mono', monospace",
                fontSize: 11,
                padding: "3px 8px",
                borderRadius: 6,
                border: "1px solid #D5F879",
                color: "#D5F879",
              }}
            >
              PARTNER CENTRE
            </span>
          </span>
          {showPreview ? (
            <span
              role="group"
              aria-label="Preview as"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#7D848E" }}
            >
              Preview as
              <span
                style={{
                  display: "inline-flex",
                  padding: 3,
                  borderRadius: 10,
                  background: "#131519",
                  border: "1px solid #262A31",
                }}
              >
                {types.map(([id, label]) =>
                  ptype === id ? (
                    <button
                      key={id}
                      type="button"
                      aria-pressed
                      onClick={() => setPtype(id)}
                      style={{
                        minHeight: 32,
                        padding: "0 10px",
                        borderRadius: 8,
                        border: 0,
                        background: "#262A31",
                        color: "#F2F4F5",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {label}
                    </button>
                  ) : (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={false}
                      onClick={() => setPtype(id)}
                      style={{
                        minHeight: 32,
                        padding: "0 10px",
                        borderRadius: 8,
                        border: 0,
                        background: "transparent",
                        color: "#9AA1AB",
                        fontSize: 12,
                      }}
                    >
                      {label}
                    </button>
                  ),
                )}
              </span>
            </span>
          ) : null}
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#262A31",
                display: "grid",
                placeItems: "center",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {me.initials}
            </span>
            <span style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{me.name}</span>
              <span style={{ fontSize: 12, color: "#9AA1AB" }}>{me.sub}</span>
            </span>
          </span>
          {showSignOut ? (
            <button
              type="button"
              onClick={signOut}
              style={{
                minHeight: 38,
                padding: "0 14px",
                borderRadius: 999,
                border: "1px solid #262A31",
                background: "transparent",
                color: "#F2F4F5",
                fontSize: 13,
              }}
            >
              Sign out
            </button>
          ) : null}
        </header>

        <nav
          aria-label="Partner centre"
          style={{
            maxWidth: 1180,
            width: "100%",
            margin: "0 auto",
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            borderBottom: "1px solid #1A1D22",
            paddingBottom: 12,
          }}
        >
          {TABS.map((tab) => {
            const on = tab.id === active || pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={on ? "page" : undefined}
                style={{
                  ...navLinkBase,
                  ...(on
                    ? { background: "#1A1D22", color: "#F2F4F5", fontWeight: 600 }
                    : { color: "#9AA1AB" }),
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <ShellBusyProvider label="Opening your partner centre">{children}</ShellBusyProvider>
      </div>
    </PartnerCtx.Provider>
  );
}
