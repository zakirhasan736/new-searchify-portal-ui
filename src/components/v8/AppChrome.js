"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import SearchifyMarkSvg from "@/components/v8/SearchifyMarkSvg";
import SearchifyLoader from "@/components/v8/SearchifyLoader";
import PhoneTabBar from "@/components/v8/PhoneTabBar";
import { authHeaders, getUser, userLogout } from "@/utils/users/Helpers";
import { canAccessCustomerApp, isPartnerAuthenticated } from "@/lib/authRoles";
import { activeJourneySite, hydrateJourney, loadJourney, planById, requiredJourneyPath } from "@/lib/journey";
import { getBusinessProfile } from "@/lib/v1Api";
import "@/styles/v8-screens.css";
import "@/styles/v8-phone.css";

/** Nav.dc.html route map — labels identical to the estimate. */
const CORE = [
  { id: "connect", label: "Plug in", href: "/app/connections", n: "1" },
  { id: "scan", label: "Site scan", href: "/app/results", n: "2" },
  { id: "home", label: "Today’s moves", href: "/app", n: "3", exact: true },
  { id: "path", label: "Page progress", href: "/app/path", n: "4" },
  { id: "tracker", label: "Keyword tracker", href: "/app/keywords", n: "5" },
  { id: "backlinks", label: "Backlinks", href: "/app/backlinks", n: "6" },
  { id: "results", label: "Results", href: "/app/outcomes", n: "7" },
  { id: "reports", label: "Reports and change log", href: "/app/history", n: "8" },
];

const ACCOUNT = [
  { id: "command", label: "Agency command centre", href: "/app/command" },
  { id: "sites", label: "All client sites", href: "/app/workspace" },
  { id: "clientreport", label: "Client report", href: "/app/month" },
  { id: "settings", label: "Settings", href: "/app/settings" },
  { id: "billing", label: "Plan and billing", href: "/app/billing" },
];

function hostOf(site) {
  const raw = site?.answers?.site || "";
  try {
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return raw.replace(/^https?:\/\//, "") || "Your site";
  }
}

function isOn(pathname, item) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function initials(name) {
  const parts = String(name || "AR").trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => (p[0] || "").toUpperCase()).join("") || "AR";
}

/**
 * Exact post-login chrome from Nav.dc.html + page content column.
 * No WebsiteBar / old results-board chrome.
 */
export default function AppChrome({ children, current }) {
  const pathname = usePathname() || "/app";
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [host, setHost] = useState("Your site");
  const [menuOpen, setMenuOpen] = useState(false);
  const [who, setWho] = useState({ name: "You", sub: "Workspace", initials: "YO" });
  const mainRef = useRef(null);

  useEffect(() => {
    // Customer workspace needs a customer or admin JWT — not partner-only or preview-only session.
    if (!canAccessCustomerApp()) {
      if (isPartnerAuthenticated()) {
        router.replace("/partners");
        return;
      }
      router.replace("/login?next=" + encodeURIComponent(pathname || "/app"));
      return;
    }
    const user = getUser();
    let live = true;
    Promise.all([
      hydrateJourney(),
      getBusinessProfile().catch(() => ({ ok: false })),
      fetch("/api/v1/profile", { headers: authHeaders(), cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([_, bp, acct]) => {
      if (!live) return;
      const gate = requiredJourneyPath(pathname);
      if (gate) {
        router.replace(gate);
        return;
      }
      const state = loadJourney();
      setHost(hostOf(activeJourneySite(state)));
      const profile = bp?.data?.profile || {};
      const name =
        acct?.displayName ||
        acct?.username ||
        user?.result?.displayName ||
        user?.result?.username ||
        user?.data?.username ||
        acct?.email ||
        user?.result?.email ||
        "You";
      const plan = planById(state.planId)?.name || "";
      const biz = String(profile.business || "").trim();
      const mail = String(acct?.email || user?.result?.email || "").trim();
      const sub = [biz, plan].filter(Boolean).join(" · ") || mail || "Workspace";
      setWho({ name, sub, initials: initials(name) });
      setReady(true);
    });
    return () => {
      live = false;
    };
  }, [pathname, router]);

  useEffect(() => {
    setMenuOpen(false);
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  useEffect(() => {
    const onSite = (event) => {
      if (event?.detail?.label) setHost(event.detail.label);
      else setHost(hostOf(activeJourneySite()));
    };
    window.addEventListener("sf-site", onSite);
    return () => window.removeEventListener("sf-site", onSite);
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  if (!ready) {
    return <SearchifyLoader full label="Opening your workspace" />;
  }

  return (
    <div className={`v8-screen-root v8-app-chrome${menuOpen ? " is-nav-open" : ""}`}>
      <div className="v8-app-mobilebar">
        <Link href="/app" className="v8-app-mobilebar-brand">
          <SearchifyMarkSvg size={28} />
          searchify
        </Link>
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((v) => !v)}
          className={`v8-app-mobilebar-btn${menuOpen ? " is-open" : ""}`}
        >
          <span className="v8-app-burger" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      <button
        type="button"
        className="v8-app-nav-backdrop"
        aria-label="Close menu"
        tabIndex={menuOpen ? 0 : -1}
        aria-hidden={menuOpen ? undefined : true}
        onClick={() => setMenuOpen(false)}
      />

      {/* Fixed left rail. Brand and account stay put; links scroll if the rail is short. */}
      <aside className={`v8-app-nav-col${menuOpen ? " is-open" : ""}`}>
        <div className="v8-app-nav-head">
          <Link href="/app" style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px", textDecoration: "none", color: "#F2F4F5" }}>
            <SearchifyMarkSvg size={30} />
            <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontWeight: 800, fontSize: 19, letterSpacing: "-0.4px" }}>searchify</span>
          </Link>

          <Link
            href="/app/workspace"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              minHeight: 48,
              padding: "6px 12px",
              borderRadius: 12,
              border: "1px solid #262A31",
              background: "#131519",
              color: "#F2F4F5",
              textDecoration: "none",
            }}
          >
            <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <span style={{ fontSize: 12, color: "#9AA1AB" }}>Working on</span>
              <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{host}</span>
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9AA1AB" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M7 10l5 5 5-5" />
            </svg>
          </Link>
        </div>

        <nav className={`v8-app-nav${menuOpen ? " is-open" : ""}`} aria-label="Main">
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ padding: "0 10px 6px", fontSize: 12, fontWeight: 600, color: "#7D848E" }}>Core features</span>
            {CORE.map((it) => {
              const on = current ? current === it.id : isOn(pathname, it);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  aria-current={on ? "page" : undefined}
                  style={
                    on
                      ? {
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          minHeight: 44,
                          padding: "0 10px",
                          borderRadius: 11,
                          background: "#131519",
                          boxShadow: "inset 3px 0 0 #4DA3FF",
                          color: "#F2F4F5",
                          textDecoration: "none",
                          fontSize: 14,
                          fontWeight: 600,
                          minWidth: 0,
                        }
                      : {
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          minWidth: 0,
                          minHeight: 44,
                          padding: "0 10px",
                          borderRadius: 11,
                          color: "#B4BAC3",
                          textDecoration: "none",
                          fontSize: 14,
                        }
                  }
                >
                  <span
                    style={
                      on
                        ? {
                            width: 22,
                            height: 22,
                            flex: "none",
                            borderRadius: "50%",
                            background: "#4DA3FF",
                            color: "#0A0B0D",
                            display: "grid",
                            placeItems: "center",
                            fontFamily: "'Geist Mono', monospace",
                            fontSize: 11,
                            fontWeight: 500,
                            boxShadow: "0 0 10px rgba(77,163,255,.6)",
                          }
                        : {
                            width: 22,
                            height: 22,
                            flex: "none",
                            borderRadius: "50%",
                            border: "1px solid #3A404A",
                            boxSizing: "border-box",
                            display: "grid",
                            placeItems: "center",
                            fontFamily: "'Geist Mono', monospace",
                            fontSize: 11,
                            color: "#9AA1AB",
                          }
                    }
                  >
                    {it.n}
                  </span>
                  <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.label}</span>
                </Link>
              );
            })}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ padding: "0 10px 6px", fontSize: 12, fontWeight: 600, color: "#7D848E" }}>Profile and sites</span>
            {ACCOUNT.map((it) => {
              const on = current ? current === it.id : isOn(pathname, it);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  aria-current={on ? "page" : undefined}
                  style={
                    on
                      ? {
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          minHeight: 42,
                          padding: "0 12px",
                          borderRadius: 11,
                          background: "#131519",
                          boxShadow: "inset 3px 0 0 #4DA3FF",
                          color: "#F2F4F5",
                          textDecoration: "none",
                          fontSize: 14,
                          fontWeight: 600,
                          minWidth: 0,
                        }
                      : {
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          minWidth: 0,
                          minHeight: 42,
                          padding: "0 12px",
                          borderRadius: 11,
                          color: "#B4BAC3",
                          textDecoration: "none",
                          fontSize: 14,
                        }
                  }
                >
                  <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="v8-app-nav-foot">
          <Link
            href="/app/settings"
            style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, borderRadius: 12, border: "1px solid #1A1D22", color: "#F2F4F5", textDecoration: "none" }}
          >
            <span style={{ width: 34, height: 34, flex: "none", borderRadius: "50%", background: "#262A31", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 600 }}>
              {who.initials}
            </span>
            <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{who.name}</span>
              <span style={{ fontSize: 12, color: "#9AA1AB" }}>{who.sub}</span>
            </span>
          </Link>
          <button
            type="button"
            className="v8-app-signout"
            onClick={() => {
              userLogout();
              router.replace("/login");
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main ref={mainRef} className="v8-app-main">{children}</main>

      {/* Phone.dc.html bottom tabs — mobile layout reference applied app-wide */}
      <PhoneTabBar className="v8-app-phone-tabs" />
    </div>
  );
}
