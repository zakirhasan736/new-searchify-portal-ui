"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import BoardShell from "@/components/board/BoardShell";
import AdminShell from "@/components/v3/AdminShell";
import ClientOnly from "@/components/shell/ClientOnly";
import SkinWallPill from "@/components/v8/SkinWallPill";
import { userIsAuthenticated } from "@/utils/users/Helpers";
import { captureReferral } from "@/lib/referral";

const MARKETING = new Set(["/", "/about", "/pricing", "/contact", "/terms", "/privacy", "/skins"]);

const AUTH = new Set([
  "/login",
  "/signin",
  "/signup",
  "/forgot",
  "/forgotpassword",
  "/reset",
  "/reset-password",
  "/resetpassword",
  "/admin/login",
]);
const PARTNERS = (pathname) => pathname === "/partners" || pathname.startsWith("/partners/");
const HQ = (pathname) => pathname === "/admin" || pathname.startsWith("/admin/hq") || pathname === "/admin/settings";
const SKINS = (pathname) => pathname === "/skins" || pathname.startsWith("/skins/");
/** States.dc.html is full-bleed — no left Nav. */
const STANDALONE_APP = (pathname) => pathname === "/app/states";

/**
 * Post-login + marketing shell. HQ uses HqPanel only (no v3 AdminShell).
 * Wall pill mirrors presentation/support.js (preview/dev).
 */
export default function ProductShell({ children }) {
  const pathname = usePathname() || "/";
  const router = useRouter();

  // Partner links (?ref=handle) can land on any page; remember the handle for sign-up.
  useEffect(() => {
    captureReferral();
  }, [pathname]);

  useEffect(() => {
    if (
      MARKETING.has(pathname) ||
      AUTH.has(pathname) ||
      PARTNERS(pathname) ||
      HQ(pathname) ||
      SKINS(pathname) ||
      pathname.startsWith("/app") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/api")
    ) {
      return;
    }
    if (userIsAuthenticated()) router.replace("/app");
  }, [pathname, router]);

  const withWall = (node) => (
    <>
      {node}
      <SkinWallPill />
    </>
  );

  if (SKINS(pathname)) return <ClientOnly>{children}</ClientOnly>;
  if (MARKETING.has(pathname) || PARTNERS(pathname) || HQ(pathname)) {
    return <ClientOnly>{withWall(children)}</ClientOnly>;
  }
  if (pathname === "/app/start" || pathname === "/app/plans" || STANDALONE_APP(pathname)) {
    return <ClientOnly>{withWall(children)}</ClientOnly>;
  }

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

  return <ClientOnly>{withWall(inner)}</ClientOnly>;
}
