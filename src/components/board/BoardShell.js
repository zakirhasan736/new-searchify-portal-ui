"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { userIsAuthenticated, userLogout } from "@/utils/users/Helpers";
import AssistantDock from "@/components/board/AssistantDock";
import WebsiteBar from "@/components/board/WebsiteBar";
import { activeJourneySite, beginAnotherWebsite, hydrateJourney, loadJourney, planById, requiredJourneyPath } from "@/lib/journey";
import { pendingPreviewCount } from "@/lib/previewQueue";
import "@/styles/results-board.css";

const NAV = [
  { href: "/app", label: "Overview", icon: "◫", exact: true },
  { href: "/app/queue", label: "Needs human approval", icon: "◷", count: true },
  { href: "/app/connections", label: "Connections", icon: "◎" },
  { href: "/app/keywords", label: "Keywords", icon: "⌕" },
  { href: "/app/visibility", label: "AI visibility", icon: "✧" },
  { href: "/app/backlinks", label: "Backlinks", icon: "↔" },
  { href: "/app/results", label: "Site audit", icon: "▤" },
  { href: "/app/history", label: "Completion log", icon: "✓" },
  { href: "/app/settings", label: "Settings", icon: "⚙" },
  { href: "/app/billing", label: "Subscription", icon: "▣" },
  { href: "/app/workspace", label: "Manage workspace", icon: "▦" },
  { href: "/app/admin-preview", label: "Admin preview", icon: "◇" },
];

const TABS = [
  { href: "/app", label: "Overview", short: "Home", icon: "◫", exact: true },
  { href: "/app/keywords", label: "Keywords", short: "Keywords", icon: "⌕" },
  { href: "/app/visibility", label: "AI visibility", short: "Visibility", icon: "✧" },
  { href: "/app/backlinks", label: "Backlinks", short: "Links", icon: "↔" },
];

function hostOf(site) {
  const raw = site?.answers?.site || "";
  try {
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return raw.replace(/^https?:\/\//, "") || "Workspace";
  }
}

function isCurrent(pathname, item) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export default function BoardShell({ children }) {
  const pathname = usePathname() || "/app";
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [host, setHost] = useState("Workspace");
  const [plan, setPlan] = useState("");
  const [pending, setPending] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!userIsAuthenticated()) {
      router.replace("/login");
      return;
    }
    let live = true;
    hydrateJourney().then(() => {
      if (!live) return;
      const gate = requiredJourneyPath(pathname);
      if (gate) {
        const extra = window.location.search;
        router.replace(extra && !gate.includes("?") ? `${gate}${extra}` : gate);
        return;
      }
      const state = loadJourney();
      setHost(hostOf(activeJourneySite(state)));
      setPlan(planById(state.planId)?.name || "");
      setReady(true);
      setPending(pendingPreviewCount());
    });
    return () => {
      live = false;
    };
  }, [pathname, router]);

  useEffect(() => {
    const refreshCount = () => setPending(pendingPreviewCount());
    window.addEventListener("sf-preview-queue", refreshCount);
    return () => window.removeEventListener("sf-preview-queue", refreshCount);
  }, []);

  useEffect(() => {
    const refreshSite = (event) => {
      if (event?.detail?.local) return;
      setHost(event?.detail?.label || hostOf(activeJourneySite()));
    };
    window.addEventListener("sf-site", refreshSite);
    return () => window.removeEventListener("sf-site", refreshSite);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  if (!ready) return <div className="sf-board" />;

  return (
    <div className="sf-board">
      <div className="shell dashboard-mode">
        <header className="topbar">
          <button
            className="nav-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="workspace-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="nav-toggle-bars" aria-hidden="true" />
            {menuOpen ? "Close" : "Menu"}
          </button>
          <Link className="brand" href="/">
            <span className="mark">s</span>
            <span>searchify</span>
          </Link>
          <div className="topmeta">
            <span className="prototype"><i aria-hidden="true" />{plan ? `${plan} plan` : "Workspace"}</span>
            <span className="privacy">Human approval required</span>
            <button className="header-tour" type="button" onClick={() => window.dispatchEvent(new CustomEvent("sf-start-tour"))}>Take the tour</button>
            <button className="signout" type="button" onClick={() => { userLogout(); router.replace("/login"); }}>Sign out</button>
          </div>
        </header>
        <section className="dashboard">
          <div className="dashboard-layout">
            {menuOpen ? <button className="nav-backdrop" type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} /> : null}
            <nav id="workspace-nav" className={`dash-sidebar${menuOpen ? " is-open" : ""}`} aria-label="Workspace navigation" data-tour="nav" onClick={() => setMenuOpen(false)}>
              <div className="sidebar-site">
                <span className="sidebar-site-mark">s</span>
                <span>
                  <strong>Searchify</strong>
                  <small>{host}</small>
                </span>
                <button className="sidebar-close" type="button" onClick={(event) => { event.stopPropagation(); setMenuOpen(false); }}>Close</button>
              </div>
              <div className="sidebar-label">WORKSPACE</div>
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`side-link${isCurrent(pathname, item) ? " active" : ""}`}
                  aria-current={isCurrent(pathname, item) ? "page" : undefined}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                  {item.count && pending ? <b>{pending}</b> : null}
                </Link>
              ))}
              <div className="sidebar-spacer" />
              <button className="finish-onboarding" type="button" onClick={() => router.push(beginAnotherWebsite())}>
                <span>＋</span> Add a website
              </button>
              <div className="approval-reminder">
                <span className="approval-dot" />
                <span>
                  <strong>Human approval on</strong>
                  <small>Live changes wait for you.</small>
                </span>
              </div>
            </nav>
            <div className="dashboard-main">
              <WebsiteBar />
              {children}
            </div>
          </div>
        </section>
      </div>
      <MobileTabs pathname={pathname} pending={pending} moreOpen={moreOpen} setMoreOpen={setMoreOpen} onSignOut={() => { userLogout(); router.replace("/login"); }} />
      <AssistantDock pathname={pathname} />
    </div>
  );
}

function MobileTabs({ pathname, pending, moreOpen, setMoreOpen, onSignOut }) {
  const moreItems = NAV.filter((item) => !TABS.some((tab) => tab.href === item.href));
  const currentTab = TABS.findIndex((item) => isCurrent(pathname, item));
  const moreCurrent = moreItems.some((item) => isCurrent(pathname, item));
  const indicator = currentTab >= 0 ? currentTab : TABS.length;
  return (
    <>
      {moreOpen ? <button className="mobile-more-backdrop" type="button" aria-label="Close more" onClick={() => setMoreOpen(false)} /> : null}
      <div className={`mobile-more-sheet${moreOpen ? " is-open" : ""}`} aria-hidden={moreOpen ? undefined : true} inert={moreOpen ? undefined : true}>
        <div className="mobile-more-handle" aria-hidden="true" />
        <p>All features</p>
        <div className="mobile-more-grid">
          {moreItems.map((item, index) => (
            <Link key={item.href} href={item.href} className={`mobile-more-link${isCurrent(pathname, item) ? " active" : ""}`} style={{ "--i": index }}>
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
              {item.count && pending ? <b>{pending}</b> : null}
            </Link>
          ))}
        </div>
        <button className="mobile-more-signout" type="button" onClick={onSignOut}>Sign out</button>
      </div>
      <nav className="mobile-tabbar" aria-label="Mobile" style={{ "--tab": indicator }}>
        <span className="mobile-tab-indicator" aria-hidden="true" />
        {TABS.map((item) => (
          <Link key={item.href} href={item.href} className={`mobile-tab${isCurrent(pathname, item) ? " active" : ""}`} aria-current={isCurrent(pathname, item) ? "page" : undefined}>
            <span aria-hidden="true">{item.icon}</span>
            {item.short}
          </Link>
        ))}
        <button type="button" className={`mobile-tab${moreCurrent || moreOpen ? " active" : ""}`} aria-expanded={moreOpen} onClick={() => setMoreOpen((open) => !open)}>
          <span className="tab-dots" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
          More
          {pending ? <b>{pending}</b> : null}
        </button>
      </nav>
    </>
  );
}
