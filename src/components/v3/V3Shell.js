"use client";

import { createContext, useContext, useEffect, useMemo, useState, useTransition } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getUser, userIsAuthenticated, userLogout } from "@/utils/users/Helpers";
import { beginAnotherWebsite, hydrateJourney, requiredJourneyPath } from "@/lib/journey";
import { getActiveSite, getBusinessProfile, getGoogleStatus, listCmsConnections, loadWorkspace, prefetchHotData, setActiveSite } from "@/lib/v1Api";
import PageSkeleton from "@/components/v3/PageSkeleton";
import BrandMark from "@/components/v3/BrandMark";
import "@/styles/searchify-v3.css";

const AUTH = new Set(["/login", "/signin", "/signup", "/forgot", "/forgotpassword", "/reset", "/reset-password", "/resetpassword"]);

export const V3ToastContext = createContext(() => {});
export function useV3Toast() {
  return useContext(V3ToastContext);
}

/** Exact HTML Source v3 section map */
export const SECTIONS = [
  {
    id: "overview",
    label: "Overview",
    path: "/app",
    icon: "layout-dashboard",
    tabs: [],
  },
  {
    id: "queue",
    label: "Work queue",
    path: "/app/queue",
    icon: "list-checks",
    tabs: [
      { label: "Review updates", path: "/app/queue" },
      { label: "Change history", path: "/app/history" },
    ],
  },
  {
    id: "performance",
    label: "Performance",
    path: "/app/results",
    icon: "chart",
    tabs: [
      { label: "Search performance", path: "/app/results" },
      { label: "Rankings", path: "/app/rankings" },
      { label: "AI analytics", path: "/app/analytics" },
    ],
  },
  {
    id: "research",
    label: "Research",
    path: "/app/keywords",
    icon: "search",
    tabs: [
      { label: "Keywords", path: "/app/keywords" },
      { label: "Backlinks", path: "/app/backlinks" },
    ],
  },
  { id: "content", label: "Content", path: "/app/content", icon: "file", tabs: [] },
  { id: "local", label: "Local", path: "/app/local", icon: "map", tabs: [] },
  { id: "visibility", label: "AI Visibility", path: "/app/visibility", icon: "scan", tabs: [] },
  { id: "ads", label: "Google Ads", path: "/app/ads", icon: "megaphone", tabs: [] },
  {
    id: "reports",
    label: "Reports",
    path: "/app/reports",
    icon: "report",
    tabs: [{ label: "Saved reports", path: "/app/reports" }],
  },
  {
    id: "settings",
    label: "Settings",
    path: "/app/connections",
    icon: "settings",
    tabs: [
      { label: "Connections", path: "/app/connections" },
      { label: "Business profile", path: "/app/profile" },
      { label: "Workspace", path: "/app/workspace" },
      { label: "Usage", path: "/app/usage" },
      { label: "Operations", path: "/app/operations" },
    ],
  },
];

function matchSection(pathname) {
  if (pathname.startsWith("/app/queue") || pathname.startsWith("/app/history") || pathname.startsWith("/app/setup")) {
    return SECTIONS.find((s) => s.id === "queue");
  }
  if (pathname.startsWith("/app/results") || pathname.startsWith("/app/rankings") || pathname.startsWith("/app/analytics")) {
    return SECTIONS.find((s) => s.id === "performance");
  }
  if (pathname.startsWith("/app/keywords") || pathname.startsWith("/app/backlinks")) {
    return SECTIONS.find((s) => s.id === "research");
  }
  if (pathname.startsWith("/app/content")) return SECTIONS.find((s) => s.id === "content");
  if (pathname.startsWith("/app/local")) return SECTIONS.find((s) => s.id === "local");
  if (pathname.startsWith("/app/visibility")) return SECTIONS.find((s) => s.id === "visibility");
  if (pathname.startsWith("/app/ads")) return SECTIONS.find((s) => s.id === "ads");
  if (pathname.startsWith("/app/reports")) return SECTIONS.find((s) => s.id === "reports");
  if (
    pathname.startsWith("/app/connections") ||
    pathname.startsWith("/app/profile") ||
    pathname.startsWith("/app/usage") ||
    pathname.startsWith("/app/workspace") ||
    pathname.startsWith("/app/operations")
  ) {
    return SECTIONS.find((s) => s.id === "settings");
  }
  return SECTIONS[0];
}

const DOCK_TABS = [
  { id: "overview", label: "Home", icon: "layout-dashboard", path: "/app" },
  { id: "queue", label: "Queue", icon: "list-checks", path: "/app/queue" },
  { id: "performance", label: "Results", icon: "chart", path: "/app/results" },
  { id: "settings", label: "Setup", icon: "settings", path: "/app/connections" },
];

const MORE_GROUPS = [
  {
    title: "Insights",
    ids: ["research", "visibility", "ads", "reports"],
  },
  {
    title: "Create",
    ids: ["content", "local"],
  },
];

const MORE_IDS = MORE_GROUPS.flatMap((g) => g.ids);

function hostFrom(value) {
  const raw = String(value || "").replace(/^sc-domain:/i, "").trim();
  if (!raw) return "";
  try {
    const href = raw.startsWith("http") ? raw : `https://${raw}`;
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return raw.replace(/^www\./, "");
  }
}

function initials(value) {
  const parts = String(value || "")
    .replace(/\.[a-z]{2,}$/i, "")
    .split(/[\s._-]+/)
    .filter(Boolean);
  if (!parts.length) return "SF";
  return (parts[0][0] + (parts[1]?.[0] || parts[0][1] || "")).toUpperCase();
}

function Icon({ name }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 };
  const paths = {
    "layout-dashboard": (
      <>
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </>
    ),
    "list-checks": <path d="M10 6h11M10 12h11M10 18h11M3 6l1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17" strokeLinecap="round" />,
    chart: <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />,
    search: (
      <>
        <circle cx="11" cy="11" r="6" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
    file: (
      <>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
        <path d="M14 3v5h5M9 13h6M9 17h4" />
      </>
    ),
    map: (
      <>
        <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2.2" />
      </>
    ),
    scan: (
      <>
        <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    megaphone: <path d="M3 11v2a4 4 0 0 0 4 4h1l2 3h2l-1-3h2a8 8 0 0 0 8-8V8L10 11H7a4 4 0 0 0-4 0Z" />,
    report: (
      <>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
        <path d="M14 3v5h5M9 17v-4M12 17v-6M15 17v-2" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
    more: (
      <>
        <circle cx="5" cy="12" r="1.6" fill="currentColor" />
        <circle cx="12" cy="12" r="1.6" fill="currentColor" />
        <circle cx="19" cy="12" r="1.6" fill="currentColor" />
      </>
    ),
    close: <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />,
  };
  return <svg {...common}>{paths[name] || <circle cx="12" cy="12" r="9" />}</svg>;
}

export function Hero({ label, line1, line2, sub, action, index }) {
  return (
    <section className="sf-hero">
      <div className="sf-hero-top">
        <span className="sf-label">{label}</span>
        {index ? <span className="sf-hero-index">{index}</span> : null}
      </div>
      <h1>
        {line1}
        <br />
        <span>{line2}</span>
      </h1>
      <div className="sf-hero-bottom">
        <p>{sub}</p>
        {action ? <div className="sf-hero-actions">{action}</div> : null}
      </div>
    </section>
  );
}

export function Pill({ children, warn, neutral }) {
  return <span className={`sf-pill ${warn ? "sf-warn" : ""} ${neutral ? "sf-neutral" : ""}`}>{children}</span>;
}

export function Btn({ children, onClick, primary, disabled, href }) {
  if (href) {
    return (
      <Link href={href} prefetch className={`sf-btn ${primary ? "sf-primary" : ""}`}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={`sf-btn ${primary ? "sf-primary" : ""}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function SectionTabs({ section }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [, startTransition] = useTransition();
  if (!section?.tabs?.length) return null;
  return (
    <div className="sf-toolbar sf-sectiontabs" aria-label={`${section.label} views`}>
      {section.tabs.map((tab) => {
        const active = pathname === tab.path || (tab.path !== "/app" && pathname.startsWith(tab.path));
        return (
          <Link
            key={tab.path}
            href={tab.path}
            prefetch
            className={active ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              startTransition(() => router.push(tab.path));
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export default function V3Shell({ children }) {
  const reduce = useReducedMotion();
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [toast, setToast] = useState("");
  const sessionUser = getUser()?.result?.username || getUser()?.data?.username || "You";
  const [workspace, setWorkspace] = useState({ site: "", owner: sessionUser, sites: [], activeId: null, limit: 5 });

  const active = useMemo(() => matchSection(pathname), [pathname]);

  // Auth + warm cache once — do not refetch Google on every nav click
  useEffect(() => {
    if (AUTH.has(pathname)) {
      setReady(true);
      return;
    }
    if (!userIsAuthenticated()) {
      router.replace("/login");
      return;
    }
    let cancel = false;
    hydrateJourney().then(() => {
      if (cancel) return;
      const gate = requiredJourneyPath(pathname);
      if (gate) router.replace(gate);
      else setReady(true);
    });
    const applyWorkspace = (google, cms, profile) => {
      const g = google?.connection || google || {};
      const sites = (cms?.connections || []).filter((c) => c.status === "connected");
      const saved = getActiveSite();
      const active = sites.find((c) => c.id === saved) || sites[0] || null;
      if (active?.id) setActiveSite(active.id);
      const site =
        hostFrom(active?.siteUrl || active?.site_url) ||
        hostFrom(g.gscSiteUrl) ||
        hostFrom(profile?.business) ||
        "";
      setWorkspace({
        site,
        owner: sessionUser,
        sites,
        activeId: active?.id || null,
        limit: Number(cms?.limit) || 5,
      });
    };
    loadWorkspace()
      .then((res) => {
        applyWorkspace(res.data?.google, res.data?.cms, res.data?.profile);
        if (!res.data?.google?.connection?.gscSiteUrl) {
          Promise.all([getGoogleStatus(), listCmsConnections(), getBusinessProfile()])
            .then(([g, c, p]) => applyWorkspace(g.data, c.data, p.data?.profile))
            .catch(() => {});
        }
      })
      .catch(() => {
        Promise.all([getGoogleStatus(), listCmsConnections(), getBusinessProfile()])
          .then(([g, c, p]) => applyWorkspace(g.data, c.data, p.data?.profile))
          .catch(() => {});
      });
    prefetchHotData();
    SECTIONS.forEach((s) => {
      try {
        router.prefetch(s.path);
        (s.tabs || []).forEach((tab) => router.prefetch(tab.path));
      } catch {
        /* ignore */
      }
    });
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      setScrolled(false);
    });
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(""), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  if (AUTH.has(pathname)) return children;
  if (!ready) {
    return (
      <div id="sf-app" className="sf-booting">
        <div className="sf-shell">
          <aside className="sf-side" aria-hidden="true">
            <BrandMark href="/app" className="sf-side-logo" />
            <div className="sf-appbar-site">
              <span className="sf-avatar">SF</span>
              <strong>Loading</strong>
            </div>
          </aside>
          <div className="sf-maincol">
            <header className="sf-top">
              <div className="sf-row">
                <span className="sf-avatar">SF</span>
                <span>Loading workspace</span>
              </div>
            </header>
            <main className="sf-content">
              <PageSkeleton />
            </main>
          </div>
        </div>
        <nav className="sf-dock" aria-hidden="true">
          <div className="sf-dock-inner">
            {["Home", "Queue", "Results", "Setup", "More"].map((label) => (
              <span key={label} className="sf-dock-item">
                <span className="sf-skel-bar" style={{ width: 22, height: 22, margin: "0 auto 4px", borderRadius: 8 }} />
                <span>{label}</span>
              </span>
            ))}
          </div>
        </nav>
      </div>
    );
  }

  return (
    <div id="sf-app" className={[menuOpen ? "sf-menu-open" : "", scrolled ? "sf-scrolled" : ""].filter(Boolean).join(" ")}>
      <div className="sf-shell">
        <aside className="sf-side">
          <BrandMark href="/app" className="sf-side-logo" />
          <div className="sf-appbar-site">
            <span className="sf-avatar">{initials(workspace.site || workspace.owner)}</span>
            <strong>{workspace.site || workspace.owner}</strong>
          </div>
          <div className="sf-workspace">
            <div className="sf-label">Projects · {workspace.sites.length}/{workspace.limit || 5}</div>
            {workspace.sites.length > 1 ? (
              <select
                className="sf-workspace-select"
                value={workspace.activeId || ""}
                aria-label="Switch website project"
                onChange={(e) => {
                  const id = Number(e.target.value) || null;
                  const chosen = workspace.sites.find((s) => s.id === id);
                  setActiveSite(id);
                  setWorkspace((w) => ({
                    ...w,
                    activeId: id,
                    site: hostFrom(chosen?.siteUrl || chosen?.site_url) || w.site,
                  }));
                  setToast(`Active project · ${hostFrom(chosen?.siteUrl || chosen?.site_url) || "website"}`);
                }}
              >
                {workspace.sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {hostFrom(s.siteUrl || s.site_url) || s.label || `Site ${s.id}`}
                  </option>
                ))}
              </select>
            ) : (
              <div className="sf-workspace-name">{workspace.site || "No website yet"}</div>
            )}
            <button type="button" className="sf-link" style={{ display: "inline-block", marginTop: 8, fontSize: 12 }} onClick={() => router.push(beginAnotherWebsite())}>
              Add a website →
            </button>
          </div>
          <nav className="sf-nav sf-nav-desk" aria-label="Main navigation">
            {SECTIONS.map((s) => {
              const current = active?.id === s.id;
              return (
                <Link
                  key={s.id}
                  href={s.path}
                  prefetch
                  aria-current={current ? "page" : undefined}
                  className={current ? "active" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuOpen(false);
                    startTransition(() => router.push(s.path));
                  }}
                >
                  <Icon name={s.icon} />
                  {s.label}
                </Link>
              );
            })}
          </nav>
          <div className="sf-sidefoot">
            <div className="sf-row">
              <span className="sf-avatar">{initials(workspace.owner)}</span>
              <div>
                <strong>{workspace.owner}</strong>
                <button
                  type="button"
                  className="sf-link"
                  onClick={() => {
                    userLogout();
                    router.replace("/login");
                  }}
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </aside>
        <div className="sf-maincol">
          <header className="sf-top">
            <div className="sf-row">
              <span className="sf-avatar">{initials(workspace.site || workspace.owner)}</span>
              <span>{workspace.site || workspace.owner}</span>
            </div>
          </header>
          {toast ? (
            <div className="sf-toast" role="status">
              {toast}
            </div>
          ) : null}
          <main className="sf-content">
            <V3ToastContext.Provider value={setToast}>
              <SectionTabs section={active} />
              <motion.div
                className="sf-page"
                key={pathname}
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              >
                {children}
              </motion.div>
            </V3ToastContext.Provider>
            <div className="sf-foot">
              <span>Every live change requires your approval</span>
            </div>
          </main>
        </div>
      </div>
      {menuOpen ? <button type="button" className="sf-nav-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} /> : null}
      <div id="sf-more-sheet" className={`sf-sheet${menuOpen ? " is-open" : ""}`} role="dialog" aria-label="More destinations" aria-hidden={!menuOpen}>
        <div className="sf-sheet-handle" />
        <div className="sf-sheet-head">
          <div>
            <div className="sf-label">Workspace</div>
            <strong>{workspace.site || workspace.owner}</strong>
          </div>
          <button type="button" className="sf-sheet-close" aria-label="Close" onClick={() => setMenuOpen(false)}>
            <Icon name="close" />
          </button>
        </div>
        {workspace.sites.length > 1 ? (
          <label className="sf-field sf-sheet-project">
            Active project
            <select
              className="sf-workspace-select"
              value={workspace.activeId || ""}
              onChange={(e) => {
                const id = Number(e.target.value) || null;
                const chosen = workspace.sites.find((s) => s.id === id);
                setActiveSite(id);
                setWorkspace((w) => ({
                  ...w,
                  activeId: id,
                  site: hostFrom(chosen?.siteUrl || chosen?.site_url) || w.site,
                }));
                setToast(`Active project · ${hostFrom(chosen?.siteUrl || chosen?.site_url) || "website"}`);
              }}
            >
              {workspace.sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {hostFrom(s.siteUrl || s.site_url) || s.label || `Site ${s.id}`}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {MORE_GROUPS.map((group) => (
          <div className="sf-sheet-group" key={group.title}>
            <div className="sf-label">{group.title}</div>
            <div className="sf-sheet-grid">
              {group.ids.map((id) => {
                const s = SECTIONS.find((item) => item.id === id);
                if (!s) return null;
                const current = active?.id === s.id;
                return (
                  <Link
                    key={`sheet-${s.id}`}
                    href={s.path}
                    prefetch
                    aria-current={current ? "page" : undefined}
                    className={current ? "active" : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      setMenuOpen(false);
                      startTransition(() => router.push(s.path));
                    }}
                  >
                    <span className="sf-sheet-ico">
                      <Icon name={s.icon} />
                    </span>
                    {s.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        <button
          type="button"
          className="sf-sheet-signout"
          onClick={() => {
            userLogout();
            router.replace("/login");
          }}
        >
          Sign out
        </button>
      </div>
      <nav className="sf-dock" aria-label="Primary">
        <div className="sf-dock-inner">
          {DOCK_TABS.map((s) => {
            const current = active?.id === s.id;
            return (
              <Link
                key={s.id}
                href={s.path}
                prefetch
                aria-current={current ? "page" : undefined}
                className={`sf-dock-item${current ? " active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  setMenuOpen(false);
                  startTransition(() => router.push(s.path));
                }}
              >
                <span className="sf-dock-ico">
                  <Icon name={s.icon} />
                </span>
                <span>{s.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            className={`sf-dock-item${menuOpen || MORE_IDS.includes(active?.id) ? " active" : ""}`}
            aria-expanded={menuOpen}
            aria-controls="sf-more-sheet"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="sf-dock-ico">
              <Icon name={menuOpen ? "close" : "more"} />
            </span>
            <span>{menuOpen ? "Close" : "More"}</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
