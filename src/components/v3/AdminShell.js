"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { userLogout } from "@/utils/users/Helpers";
import { PARTNER_KEY, PREVIEW_KEY, clearSessionFlag, isAdminAuthenticated } from "@/lib/authRoles";
import SearchifyLoader from "@/components/v8/SearchifyLoader";
import SearchifyMark from "@/components/landing/SearchifyMark";
import "@/styles/searchify-v3.css";
import "@/styles/v8-kit.css";

const ToastCtx = createContext(() => {});
export function useAdminToast() {
  return useContext(ToastCtx);
}

const ADMIN_NAV = [
  { label: "Admin home", path: "/admin" },
  { label: "Tag management", path: "/admin/tagmgmt" },
  { label: "HQ customers", path: "/admin/hq/customers" },
  { label: "HQ partners", path: "/admin/hq/partners" },
  { label: "HQ problems", path: "/admin/hq/problems" },
  { label: "HQ shareholders", path: "/admin/hq/shareholders" },
];

export default function AdminShell({ children }) {
  const pathname = usePathname() || "/admin";
  const router = useRouter();
  const [toast, setToast] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.replace("/admin/login?next=" + encodeURIComponent(pathname || "/admin"));
      return;
    }
    setReady(true);
  }, [pathname, router]);

  const show = (msg) => {
    setToast(String(msg || ""));
    window.setTimeout(() => setToast(""), 2800);
  };

  if (!ready) {
    return <SearchifyLoader full label="Opening Searchify HQ" />;
  }

  return (
    <div id="sf-app" className="sf-admin v8-admin">
      <div className="sf-shell">
        <aside className="sf-side">
          <Link href="/admin" className="v8-brand" style={{ padding: "4px 2px 12px" }}>
            <SearchifyMark size={28} />
            <span>searchify</span>
            <span className="v8-tag">HQ</span>
          </Link>
          <div className="sf-appbar-site">
            <span className="sf-avatar">AD</span>
            <strong>Admin</strong>
          </div>
          <div className="sf-workspace">
            <div className="sf-label">Admin</div>
            <div className="sf-workspace-name">Operator console</div>
          </div>
          <nav className="sf-nav sf-nav-desk" aria-label="Admin">
            {ADMIN_NAV.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={pathname === item.path || pathname.startsWith(`${item.path}/`) ? "active" : undefined}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/admin">HQ</Link>
            <Link href="/admin/settings">Settings</Link>
          </nav>
          <div style={{ marginTop: "auto", display: "grid", gap: 10 }}>
            <button
              type="button"
              className="sf-link"
              onClick={() => {
                clearSessionFlag(PARTNER_KEY);
                clearSessionFlag(PREVIEW_KEY);
                userLogout();
                router.replace("/admin/login");
              }}
            >
              Sign out
            </button>
          </div>
        </aside>
        <div className="sf-maincol">
          <header className="sf-top">
            <div>
              <div className="sf-label">Administration</div>
              <strong>HQ stays out of customer navigation</strong>
            </div>
          </header>
          <main className="sf-content">
            <ToastCtx.Provider value={show}>{children}</ToastCtx.Provider>
            {toast ? <div className="sf-toast">{toast}</div> : null}
          </main>
        </div>
      </div>
    </div>
  );
}
