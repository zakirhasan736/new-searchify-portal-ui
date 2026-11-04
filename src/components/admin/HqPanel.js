"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getHqProblems } from "@/lib/hqApi";
import { getUser, userLogout } from "@/utils/users/Helpers";
import SearchifyMarkSvg from "@/components/v8/SearchifyMarkSvg";
import RequireAdmin from "@/components/admin/RequireAdmin";
import SearchifyLoader from "@/components/v8/SearchifyLoader";
import { motion } from "framer-motion";
import MotionStage from "@/components/motion/MotionStage";
import "@/styles/v8-screens.css";

const TABS = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/hq/customers", label: "Customers" },
  { href: "/admin/hq/partners", label: "Affiliates and payouts" },
  { href: "/admin/hq/problems", label: "Problems", badge: true },
  { href: "/admin/hq/cancellations", label: "Cancellations", cancelBadge: true },
  { href: "/admin/hq/shareholders", label: "Shareholders" },
  { href: "/admin/hq/payouts", label: "Monthly payout" },
  { href: "/admin/settings", label: "Settings" },
];

/**
 * `const [loading, firstLoad] = useFirstLoad();` then `firstLoad(getHqSomething())`.
 * `loading` stays true until the first wrapped request settles (success or failure); later requests don't reset it.
 */
export function useFirstLoad() {
  const [loading, setLoading] = useState(true);
  const firstLoad = useCallback((promise) => {
    const done = () => setLoading(false);
    if (promise && typeof promise.then === "function") promise.then(done, done);
    else done();
    return promise;
  }, []);
  return [loading, firstLoad];
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

export default function HqPanel({
  children,
  headerExtra,
  shellGap = 22,
  problemsCount,
  cancellationsCount = "4",
  minHeight = 1200,
  // Kept for callers; HQ only shows real data, so there is no sample badge any more.
  showSample = false,
  // True until the screen's first data has arrived: the full-screen six-dot loader covers the page meanwhile.
  loading = false,
}) {
  const pathname = usePathname() || "/admin";
  const router = useRouter();
  const [openProblems, setOpenProblems] = useState(null);
  const [adminName, setAdminName] = useState("");
  const [capped, setCapped] = useState(false);

  useEffect(() => {
    // A request that never answers must not trap the admin behind the loader.
    const t = window.setTimeout(() => setCapped(true), 15000);
    return () => window.clearTimeout(t);
  }, []);

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
      {loading && !capped ? <SearchifyLoader full label="Opening Searchify HQ" /> : null}
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
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontFamily: "'Geist Mono', monospace",
                fontSize: 11,
                padding: "3px 8px",
                borderRadius: 6,
                background: "rgba(255,90,78,.14)",
                color: "#FF8A80",
                fontWeight: 600,
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              OWNER ONLY
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
            const showBadge = tab.badge || tab.cancelBadge;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={on ? "page" : undefined}
                style={{
                  ...tabBase,
                  position: "relative",
                  gap: showBadge ? 8 : undefined,
                  color: on ? "#F2F4F5" : "#9AA1AB",
                  fontWeight: on ? 600 : undefined,
                }}
              >
                {on ? (
                  <motion.span
                    layoutId="hq-tab-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                    style={{ position: "absolute", inset: 0, borderRadius: 10, background: "#1A1D22", zIndex: 0 }}
                  />
                ) : null}
                <span style={{ position: "relative" }}>{tab.label}</span>
                {tab.badge && badgeCount ? (
                  <span
                    style={{
                      position: "relative",
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
                {tab.cancelBadge ? (
                  <span
                    style={{
                      position: "relative",
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: 11,
                      padding: "2px 7px",
                      borderRadius: 999,
                      background: "rgba(255,197,61,.14)",
                      color: "#FFC53D",
                    }}
                  >
                    {cancellationsCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <MotionStage key={pathname} deps={[loading]} style={{ display: "flex", flexDirection: "column", gap: shellGap }}>
          {children}
        </MotionStage>
      </div>
    </RequireAdmin>
  );
}
