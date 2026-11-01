"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import SearchifyMarkSvg from "@/components/v8/SearchifyMarkSvg";
import SearchifyLoader from "@/components/v8/SearchifyLoader";
import { getInvestorMe } from "@/lib/investorApi";
import { INVESTOR_KEY, clearSessionFlag, isInvestorAuthenticated } from "@/lib/authRoles";
import { userLogout } from "@/utils/users/Helpers";

const TABS = [
  { href: "/investors", label: "Your stake", exact: true },
  { href: "/investors/earnings", label: "Referral earnings" },
  { href: "/investors/playbook", label: "Playbook and resources" },
];

const InvestorCtx = createContext({ me: null });
export function useInvestorCtx() {
  return useContext(InvestorCtx);
}

const tabBase = {
  minHeight: 38,
  display: "inline-flex",
  alignItems: "center",
  padding: "0 14px",
  borderRadius: 10,
  textDecoration: "none",
  fontSize: 14,
};

export default function InvestorShell({ children, minHeight = 1300, showSample = false }) {
  const pathname = usePathname() || "/investors";
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState(null);

  useEffect(() => {
    if (!isInvestorAuthenticated()) {
      router.replace("/investors/login");
      return;
    }
    let cancelled = false;
    getInvestorMe().then((res) => {
      if (!cancelled && res.ok) setMe(res.data);
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  const signOut = () => {
    clearSessionFlag(INVESTOR_KEY);
    userLogout();
    router.replace("/investors/login");
  };

  if (!ready) {
    return <SearchifyLoader full label="Opening investor portal" />;
  }

  return (
    <InvestorCtx.Provider value={{ me }}>
      <style>{`
        @keyframes sfy-rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        .inv-shell a.inv-link:hover{color:#CFF4FA}
        .inv-shell button{font-family:inherit;cursor:pointer}
        .inv-shell button:focus-visible,.inv-shell a:focus-visible{outline:2px solid #4DA3FF;outline-offset:2px}
        @media (prefers-reduced-motion: reduce){.inv-shell *{animation:none !important;transition:none !important}}
      `}</style>
      <div
        className="inv-shell"
        style={{
          minHeight,
          background: "#0A0B0D",
          color: "#F2F4F5",
          fontFamily: "Geist, 'Helvetica Neue', sans-serif",
          boxSizing: "border-box",
          padding: "22px clamp(16px, 4vw, 56px) 56px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <header
          style={{
            maxWidth: 1120,
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
            <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontWeight: 800, fontSize: 19, letterSpacing: "-0.4px" }}>
              searchify
            </span>
            <span
              style={{
                fontFamily: "'Geist Mono', monospace",
                fontSize: 11,
                padding: "3px 8px",
                borderRadius: 6,
                background: "#9FE7F5",
                color: "#0A0B0D",
                fontWeight: 600,
              }}
            >
              INVESTOR
            </span>
            {showSample ? (
              <span
                style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 11,
                  padding: "3px 8px",
                  borderRadius: 6,
                  border: "1px solid #3A404A",
                  color: "#9AA1AB",
                }}
              >
                SAMPLE DATA
              </span>
            ) : null}
          </span>
          <span style={{ fontSize: 13, color: "#9AA1AB" }}>Signed in as {me?.displayName || "Investor"}</span>
          <button
            type="button"
            onClick={signOut}
            className="inv-link"
            style={{ fontSize: 13, color: "#9AA1AB", background: "none", border: 0, padding: 0 }}
          >
            Sign out
          </button>
        </header>

        <nav
          aria-label="Shareholder portal"
          style={{
            maxWidth: 1120,
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
            const on = tab.exact ? pathname === tab.href : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={on ? "page" : undefined}
                style={{
                  ...tabBase,
                  background: on ? "#1A1D22" : undefined,
                  color: on ? "#F2F4F5" : "#9AA1AB",
                  fontWeight: on ? 600 : undefined,
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </InvestorCtx.Provider>
  );
}
