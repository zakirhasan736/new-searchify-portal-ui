"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import V3Shell from "@/components/v3/V3Shell";
import AdminShell from "@/components/v3/AdminShell";
import { userIsAuthenticated } from "@/utils/users/Helpers";

const AUTH = new Set(["/", "/signin", "/signup", "/forgotpassword", "/resetpassword"]);
const LEGACY_OK = new Set(["/signin", "/signup", "/forgotpassword", "/resetpassword"]);

/**
 * First-release shell: V3 UI for /app*.
 * Admin tools stay on /admin and never appear in customer navigation.
 */
export default function ProductShell({ children }) {
  const pathname = usePathname() || "/";
  const router = useRouter();

  useEffect(() => {
    if (AUTH.has(pathname) || pathname.startsWith("/app") || pathname.startsWith("/admin") || pathname.startsWith("/api")) return;
    if (userIsAuthenticated() && !LEGACY_OK.has(pathname)) {
      router.replace("/app");
    }
  }, [pathname, router]);

  if (AUTH.has(pathname)) {
    return (
      <div id="sf-app" className="sf-auth">
        {children}
      </div>
    );
  }
  if (pathname.startsWith("/app")) return <V3Shell>{children}</V3Shell>;
  if (pathname.startsWith("/admin")) return <AdminShell>{children}</AdminShell>;
  return children;
}
