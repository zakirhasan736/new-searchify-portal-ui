"use client";

import { createContext, useContext, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { userLogout } from "@/utils/users/Helpers";
import BrandMark from "@/components/v3/BrandMark";
import "@/styles/searchify-v3.css";

const ToastCtx = createContext(() => {});
export function useAdminToast() {
  return useContext(ToastCtx);
}

const ADMIN_NAV = [
  { label: "Admin home", path: "/admin" },
  { label: "Tag management", path: "/admin/tagmgmt" },
];

export default function AdminShell({ children }) {
  const pathname = usePathname() || "/admin";
  const router = useRouter();
  const [toast, setToast] = useState("");

  const show = (msg) => {
    setToast(String(msg || ""));
    window.setTimeout(() => setToast(""), 2800);
  };

  return (
    <div id="sf-app" className="sf-admin">
      <div className="sf-shell">
        <aside className="sf-side">
          <BrandMark href="/admin" className="sf-side-logo" />
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
              <Link key={item.path} href={item.path} className={pathname === item.path ? "active" : undefined}>
                {item.label}
              </Link>
            ))}
            <Link href="/app">Workspace</Link>
          </nav>
          <div style={{ marginTop: "auto", display: "grid", gap: 10 }}>
            <Link href="/app" className="sf-link">
              Customer workspace →
            </Link>
            <button
              type="button"
              className="sf-link"
              onClick={() => {
                userLogout();
                router.replace("/signin");
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
              <strong>Tag management stays out of customer navigation</strong>
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
