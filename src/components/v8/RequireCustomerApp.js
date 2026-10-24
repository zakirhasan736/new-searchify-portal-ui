"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { canAccessCustomerApp, isPartnerAuthenticated } from "@/lib/authRoles";

/** Auth gate for standalone /app skins that skip AppChrome (Phone, States). */
export default function RequireCustomerApp({ children }) {
  const router = useRouter();
  const pathname = usePathname() || "/app";
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!canAccessCustomerApp()) {
      if (isPartnerAuthenticated()) {
        router.replace("/partners");
        return;
      }
      router.replace("/login?next=" + encodeURIComponent(pathname));
      return;
    }
    setOk(true);
  }, [pathname, router]);

  if (!ok) {
    return <div style={{ minHeight: "40vh", background: "#0A0B0D" }} aria-busy="true" />;
  }

  return children;
}
