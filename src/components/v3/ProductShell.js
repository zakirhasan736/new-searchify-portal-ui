"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import BoardShell from "@/components/board/BoardShell";
import AdminShell from "@/components/v3/AdminShell";
import ClientOnly from "@/components/shell/ClientOnly";
import { userIsAuthenticated } from "@/utils/users/Helpers";

const MARKETING = new Set(["/", "/about", "/pricing", "/contact", "/terms", "/privacy"]);
const AUTH = new Set([
  "/login",
  "/signin",
  "/signup",
  "/forgot",
  "/forgotpassword",
  "/reset",
  "/reset-password",
  "/resetpassword",
]);

/**
 * First-release shell: V3 UI for /app*.
 * Admin tools stay on /admin and never appear in customer navigation.
 */
export default function ProductShell({ children }) {
  const pathname = usePathname() || "/";
  const router = useRouter();

  useEffect(() => {
    if (
      MARKETING.has(pathname) ||
      AUTH.has(pathname) ||
      pathname.startsWith("/app") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/api")
    ) {
      return;
    }
    if (userIsAuthenticated()) router.replace("/app");
  }, [pathname, router]);

  if (MARKETING.has(pathname)) return children;
  if (pathname === "/app/start" || pathname === "/app/plans") return <ClientOnly>{children}</ClientOnly>;

  const inner = AUTH.has(pathname) ? (
    <div id="sf-app" className="sf-auth">
      {children}
    </div>
  ) : pathname.startsWith("/app") ? (
    <BoardShell>{children}</BoardShell>
  ) : pathname.startsWith("/admin") ? (
    <AdminShell>{children}</AdminShell>
  ) : (
    children
  );

  return <ClientOnly>{inner}</ClientOnly>;
}
