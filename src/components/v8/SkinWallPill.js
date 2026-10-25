"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SKINS_HOME } from "@/lib/skinCatalog";
import { canAccessCustomerApp, isPartnerAuthenticated, isPreviewSignedIn } from "@/lib/authRoles";

const BEFORE_LOGIN = new Set([
  "/login",
  "/signin",
  "/signup",
  "/forgot",
  "/forgotpassword",
  "/reset",
  "/reset-password",
  "/resetpassword",
  "/partners/login",
]);

/** App routes that show the fixed phone tab bar. */
function abovePhoneTabs(pathname) {
  if (!pathname.startsWith("/app")) return false;
  return pathname !== "/app/start" && pathname !== "/app/plans" && pathname !== "/app/states";
}

/**
 * Fixed bottom-right shortcut to the screen wall.
 * Visible only after a customer, admin, partner, or preview sign-in.
 */
export default function SkinWallPill() {
  const pathname = usePathname() || "/";
  const [show, setShow] = useState(false);

  useEffect(() => {
    const signedIn = canAccessCustomerApp() || isPartnerAuthenticated() || isPreviewSignedIn();
    setShow(signedIn && !BEFORE_LOGIN.has(pathname));
  }, [pathname]);

  if (!show) return null;
  if (pathname === SKINS_HOME || pathname.startsWith(`${SKINS_HOME}/`)) return null;

  return (
    <Link
      href={SKINS_HOME}
      aria-label="Open wall of all screens"
      className={`v8-wall-pill${abovePhoneTabs(pathname) ? " is-above-tabs" : ""}`}
    >
      All screens
    </Link>
  );
}
