"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { NAV, activeRailId, flatNavItems } from "@/lib/navCatalog";
import brandLogo from "@/assets/img/Searchify-logo.png";
import { userIsAuthenticated, userLogout } from "@/utils/users/Helpers";

const AUTH = new Set(["/", "/signin", "/signup", "/forgotpassword"]);

const ICONS = {
  home: (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  ),
  seo: (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
  ai: (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="M12 3 13.8 8.2 19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
    </svg>
  ),
  traffic: (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
    </svg>
  ),
  local: (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  ),
  content: (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <rect x="4" y="4" width="12" height="16" rx="2" />
      <path d="M8 9h8M8 13h6" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="M5 19V9M10 19V5M15 19v-6M20 19V8" />
    </svg>
  ),
};

function Chevron({ open }) {
  return (
    <svg viewBox="0 0 16 16" className={`h-3.5 w-3.5 shrink-0 text-brand/80 transition-transform ${open ? "rotate-180" : ""}`}>
      <path d="M4 6.5 8 10.5 12 6.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function activePanelTitle(rail, pathname) {
  if (!rail?.panels?.length) return "";
  for (const panel of rail.panels) {
    if (panel.items.some((item) => pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path)))) {
      return panel.title;
    }
  }
  return rail.panels[0]?.title || "";
}

export default function Shell({ children }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const [query, setQuery] = useState("");
  const [railId, setRailId] = useState("home");
  const [openGroup, setOpenGroup] = useState("");
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setSignedIn(userIsAuthenticated());
  }, [pathname]);

  const logout = () => {
    userLogout();
    setSignedIn(false);
    setMobileOpen(false);
    router.push("/signin");
  };

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPalette(true);
      }
      if (event.key === "Escape") {
        setPalette(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const id = activeRailId(pathname);
    setRailId(id);
    setMobileOpen(false);
    setPalette(false);
    const rail = NAV.find((item) => item.id === id);
    setOpenGroup(activePanelTitle(rail, pathname));
  }, [pathname]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    document.body.style.overflow = mobileOpen || palette ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen, palette]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return flatNavItems()
      .filter((item) => `${item.title} ${item.group || ""} ${item.section || ""}`.toLowerCase().includes(needle))
      .slice(0, 14);
  }, [query]);

  if (AUTH.has(pathname)) {
    return <div className="studio-scroll h-dvh overflow-y-auto bg-ink px-[max(0px,env(safe-area-inset-left))] pr-[max(0px,env(safe-area-inset-right))]">{children}</div>;
  }

  const rail = NAV.find((item) => item.id === railId) || NAV[0];

  return (
    <div className="h-dvh overflow-hidden bg-ink text-white font-body">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(146,107,255,0.18),transparent_42%),radial-gradient(ellipse_at_bottom_right,rgba(232,87,130,0.12),transparent_40%)]" />
      <div className="relative flex h-dvh">
        {mobileOpen ? <button className="fixed inset-0 z-30 bg-black/70 lg:hidden" aria-label="Close menu" onClick={() => setMobileOpen(false)} /> : null}

        <aside
          className={`fixed inset-y-0 left-0 z-40 flex h-dvh w-[min(19.5rem,calc(100vw-2rem))] overflow-hidden border-r border-white/[0.06] bg-[#09070f]/92 pt-[env(safe-area-inset-top)] shadow-[8px_0_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition-transform duration-300 ease-out lg:w-[18.75rem] lg:translate-x-0 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Icon rail — spaces */}
          <div className="relative flex w-[3.65rem] shrink-0 flex-col items-center border-r border-white/[0.05] bg-black/25 py-4">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(146,107,255,0.12),transparent_40%)]" />
            <Link
              href="/home"
              onClick={() => setMobileOpen(false)}
              className="relative mb-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/40 to-blush/25 ring-1 ring-white/15 transition hover:ring-brand/50"
              aria-label="Searchify home"
            >
              <img
                src={typeof brandLogo === "string" ? brandLogo : brandLogo?.src}
                alt=""
                className="h-5 w-5 object-contain"
              />
            </Link>
            <div className="studio-scroll relative flex min-h-0 flex-1 flex-col items-center gap-1.5 overflow-y-auto px-1.5 pb-2">
              {NAV.map((item) => {
                const active = railId === item.id;
                const className = `group relative flex h-11 w-11 items-center justify-center rounded-2xl transition ${
                  active
                    ? "bg-brand/30 text-white shadow-[0_0_20px_rgba(146,107,255,0.25)] ring-1 ring-brand/45"
                    : "text-white/40 hover:bg-white/[0.06] hover:text-white/85"
                }`;
                const icon = (
                  <>
                    {active ? <span className="absolute -left-1.5 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-brand" /> : null}
                    <span className="relative">{ICONS[item.icon] || ICONS.home}</span>
                    <span className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-lg bg-[#16121f] px-2 py-1 text-[11px] font-medium text-white shadow-lg ring-1 ring-white/10 group-hover:block">
                      {item.label}
                    </span>
                  </>
                );
                if (item.id === "home") {
                  return (
                    <Link key={item.id} href="/home" title={item.label} className={className} onClick={() => setMobileOpen(false)}>
                      {icon}
                    </Link>
                  );
                }
                return (
                  <button
                    key={item.id}
                    type="button"
                    title={item.label}
                    aria-label={item.label}
                    aria-pressed={active}
                    onClick={() => {
                      setRailId(item.id);
                      setOpenGroup(item.panels[0]?.title || "");
                    }}
                    className={className}
                  >
                    {icon}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tool panel */}
          <div className="relative flex min-w-0 flex-1 flex-col">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(146,107,255,0.1),transparent_55%)]" />

            <div className="relative flex shrink-0 items-start justify-between gap-2 px-3.5 pb-3 pt-4">
              <div className="min-w-0">
                <p className="truncate font-sans text-[15px] font-semibold tracking-tight text-white">Searchify</p>
                <p className="mt-0.5 truncate text-[11px] text-white/40">{rail.label}</p>
              </div>
              <button type="button" className="rounded-xl bg-white/[0.06] px-2.5 py-2 text-sm text-white/55 transition hover:bg-white/10 hover:text-white lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close sidebar">
                ✕
              </button>
            </div>

            <div className="relative shrink-0 px-3 pb-3">
              <button
                type="button"
                onClick={() => setPalette(true)}
                className="flex h-10 w-full items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.035] px-2.5 text-left text-[12.5px] text-white/45 transition hover:border-brand/30 hover:bg-brand/[0.08] hover:text-white/75"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 fill-none stroke-current stroke-[1.8] text-brand/70">
                  <circle cx="11" cy="11" r="6" />
                  <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                </svg>
                <span className="flex-1 truncate">Search tools…</span>
                <kbd className="hidden rounded-md bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-white/35 sm:inline">⌘K</kbd>
              </button>
            </div>

            <nav className="studio-scroll relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 pb-3 [-webkit-overflow-scrolling:touch]">
              {rail.id === "home" ? (
                <div className="mx-0.5 space-y-2 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent p-3.5 ring-1 ring-white/[0.05]">
                  <p className="text-[12px] font-medium text-white/75">Welcome back</p>
                  <p className="text-[11.5px] leading-relaxed text-white/40">Use the icon rail to switch spaces. Home holds your project overview and shortcuts.</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {NAV.filter((n) => n.id !== "home").slice(0, 4).map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          setRailId(n.id);
                          setOpenGroup(n.panels[0]?.title || "");
                        }}
                        className="rounded-lg bg-white/[0.04] px-2 py-1 text-[10px] text-white/50 transition hover:bg-brand/20 hover:text-white"
                      >
                        {n.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="pb-2">
                  <div className="mb-2.5 flex items-center justify-between px-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">Tools</p>
                    <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] tabular-nums text-white/35">
                      {rail.panels.reduce((n, p) => n + p.items.length, 0)}
                    </span>
                  </div>
                  {rail.panels.map((panel) => {
                    const open = openGroup === panel.title;
                    return (
                      <div key={panel.title} className="mb-0.5">
                        <button
                          type="button"
                          onClick={() => setOpenGroup(open ? "" : panel.title)}
                          className={`flex min-h-9 w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-[12.5px] font-medium transition ${
                            open ? "bg-white/[0.05] text-white" : "text-white/45 hover:bg-white/[0.03] hover:text-white/80"
                          }`}
                        >
                          <Chevron open={open} />
                          <span className="min-w-0 flex-1 truncate">{panel.title}</span>
                          <span className="text-[10px] tabular-nums text-white/22">{panel.items.length}</span>
                        </button>
                        <div
                          className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                        >
                          <div className="overflow-hidden">
                            <div className="space-y-0.5 pb-1.5 pl-1.5">
                              {panel.items.map((item) => {
                                const active = pathname === item.path || (item.path === "/seooptimization" && pathname.startsWith("/seooptimization"));
                                return (
                                  <Link
                                    key={`${panel.title}-${item.path}-${item.title}`}
                                    href={item.path}
                                    onClick={() => setMobileOpen(false)}
                                    className={`relative block rounded-lg px-2.5 py-2 text-[12px] leading-snug transition ${
                                      active
                                        ? "bg-brand/20 font-medium text-white ring-1 ring-brand/30"
                                        : "text-white/50 hover:bg-white/[0.04] hover:text-white"
                                    }`}
                                  >
                                    {active ? <span className="absolute left-0.5 top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-brand" /> : null}
                                    <span className={active ? "pl-1.5" : ""}>{item.title}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </nav>

            <div className="relative shrink-0 border-t border-white/[0.05] px-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5">
              <Link
                href="/UserProfile"
                onClick={() => setMobileOpen(false)}
                className="flex min-h-11 items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-white/[0.04]"
              >
                <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand to-blush text-[11px] font-semibold text-white">
                  S
                  {signedIn ? <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#09070f]" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium text-white">Account</span>
                  <span className="block text-[10px] text-white/35">{signedIn ? "Profile & settings" : "Sign in to sync"}</span>
                </span>
              </Link>
              {signedIn ? (
                <button type="button" onClick={logout} className="mt-1 flex h-8 w-full items-center justify-center rounded-lg text-[11.5px] text-white/40 transition hover:bg-white/[0.04] hover:text-blush">
                  Log out
                </button>
              ) : (
                <Link href="/signin" onClick={() => setMobileOpen(false)} className="mt-1 flex h-8 w-full items-center justify-center rounded-lg bg-brand/15 text-[11.5px] font-medium text-brand transition hover:bg-brand/25">
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </aside>

        <div className="flex h-dvh min-w-0 flex-1 flex-col lg:pl-[18.75rem]">
          <header className="flex shrink-0 items-center gap-2 bg-[#09070f]/80 px-3 py-2.5 backdrop-blur-md sm:gap-3 sm:px-4 sm:py-3 lg:px-8 pt-[max(0.625rem,env(safe-area-inset-top))]">
            <button type="button" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <MenuIcon />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] text-white/40 sm:text-xs">
                {rail.label}
                <span className="hidden text-white/25 sm:inline"> · studio</span>
              </p>
              <input
                placeholder="Search domain or tool…"
                className="mt-0.5 h-9 w-full max-w-xl border-0 bg-transparent text-sm outline-none placeholder:text-white/35 sm:mt-1"
                onFocus={() => setPalette(true)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && event.currentTarget.value.trim()) {
                    setPalette(true);
                    setQuery(event.currentTarget.value.trim());
                  }
                }}
              />
            </div>
            <button type="button" onClick={() => setPalette(true)} className="hidden h-10 shrink-0 rounded-2xl bg-gradient-to-r from-blush to-brand px-4 text-sm font-semibold sm:inline-flex sm:items-center">
              Open palette
            </button>
            <Link href="/UserProfile" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/25 text-xs font-semibold sm:hidden" aria-label="Account">
              Z
            </Link>
          </header>
          <main className="studio-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5 sm:py-6 lg:px-10 lg:py-8 [-webkit-overflow-scrolling:touch]">
            {children}
          </main>
        </div>
      </div>

      {palette ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 px-0 pt-[8vh] sm:items-start sm:px-4 sm:pt-[10vh]" onClick={() => setPalette(false)}>
          <div className="flex max-h-[85dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-[#120e1c] shadow-2xl shadow-brand/20 sm:rounded-3xl" onClick={(event) => event.stopPropagation()}>
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search spaces, tools, reports…" className="h-14 w-full border-0 bg-transparent px-5 text-white outline-none" />
            <ul className="studio-scroll min-h-0 flex-1 overflow-y-auto border-t border-white/5 pb-[env(safe-area-inset-bottom)]">
              {results.map((item) => (
                <li key={`${item.group}-${item.path}-${item.title}`}>
                  <Link href={item.path} className="flex min-h-12 items-center justify-between gap-3 px-5 py-3 hover:bg-brand/10" onClick={() => setPalette(false)}>
                    <span className="min-w-0 truncate">{item.title}</span>
                    <span className="shrink-0 text-xs text-brand">{item.group}</span>
                  </Link>
                </li>
              ))}
              {!results.length ? <li className="px-5 py-6 text-sm text-white/50">No matches in the studio catalog.</li> : null}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
