"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getHqProblems } from "@/lib/hqApi";
import { getUser, userLogout } from "@/utils/users/Helpers";
import SearchifyMarkSvg from "@/components/v8/SearchifyMarkSvg";
import RequireAdmin from "@/components/admin/RequireAdmin";
import "@/styles/v8-screens.css";

const TABS = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/hq/customers", label: "Customers" },
  { href: "/admin/hq/partners", label: "Partners and payouts" },
  { href: "/admin/hq/problems", label: "Problems", badge: true },
  { href: "/admin/hq/shareholders", label: "Shareholders" },
  { href: "/admin/settings", label: "Settings" },
];

const tabBase = {
  minHeight: 38,
  display: "inline-flex",
  alignItems: "center",
  padding: "0 14px",
  borderRadius: 10,
  textDecoration: "none",
  fontSize: 14,
};

export default function HqPanel({
  children,
  headerExtra,
  shellGap = 22,
  problemsCount,
  minHeight = 1200,
  // Kept for callers; HQ only shows real data, so there is no sample badge any more.
  showSample: _showSample = false,
}) {
  const pathname = usePathname() || "/admin";
  const router = useRouter();
  const [openProblems, setOpenProblems] = useState(null);
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    setAdminName(getUser()?.result?.username || "");
    if (problemsCount != null) return undefined;
    let cancelled = false;
    getHqProblems()
      .then((res) => {
        if (!cancelled && res?.ok) setOpenProblems(res.data?.openCount ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [problemsCount]);

  const badgeCount = problemsCount != null ? problemsCount : openProblems;

  // Admins have no customer workspace: leaving HQ signs out and returns to the admin sign-in.
  const signOut = () => {
    userLogout();
    router.replace("/admin/login?signedout=1");
  };

  return (
    <RequireAdmin>
      <style>{`
        @keyframes sfy-grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
        .hq-shell a.hq-exit:hover{color:#ECFFB8}
        .hq-shell button{font-family:inherit;cursor:pointer}
        .hq-shell button:disabled{cursor:not-allowed;opacity:.45}
        .hq-shell input[type=range]{accent-color:#D5F879}
        .hq-shell input[type=checkbox]{accent-color:#D5F879;width:18px;height:18px}
        .hq-shell button:focus-visible,.hq-shell a:focus-visible{outline:2px solid #4DA3FF;outline-offset:2px}
        @media (prefers-reduced-motion: reduce){.hq-shell *{animation:none !important;transition:none !important}}
      `}</style>
      <div
        className="hq-shell"
        style={{
          minHeight,
          background: "#0A0B0D",
          color: "#F2F4F5",
          fontFamily: "Geist, 'Helvetica Neue', sans-serif",
          boxSizing: "border-box",
          padding: "22px clamp(16px, 4vw, 56px) 56px",
          display: "flex",
          flexDirection: "column",
          gap: shellGap,
        }}
      >
        <header
          style={{
            maxWidth: 1240,
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
                background: "#D5F879",
                color: "#0A0B0D",
                fontWeight: 600,
              }}
            >
              HQ
            </span>
          </span>
          {headerExtra}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 14 }}>
            {adminName ? (
              <Link href="/admin/settings" style={{ fontSize: 13, color: "#9AA1AB", textDecoration: "none" }}>
                {adminName}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={signOut}
              className="hq-exit"
              style={{ minHeight: 34, padding: "0 12px", borderRadius: 10, border: "1px solid #262A31", background: "transparent", fontSize: 13, color: "#D7DADE" }}
            >
              Sign out
            </button>
          </span>
        </header>

        <nav
          aria-label="HQ sections"
          style={{
            maxWidth: 1240,
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
                  gap: tab.badge ? 8 : undefined,
                  background: on ? "#1A1D22" : undefined,
                  color: on ? "#F2F4F5" : "#9AA1AB",
                  fontWeight: on ? 600 : undefined,
                }}
              >
                {tab.label}
                {tab.badge && badgeCount ? (
                  <span
                    style={{
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: 11,
                      padding: "2px 7px",
                      borderRadius: 999,
                      background: "rgba(255,90,78,.16)",
                      color: "#FF8A80",
                    }}
                  >
                    {badgeCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </RequireAdmin>
  );
}
