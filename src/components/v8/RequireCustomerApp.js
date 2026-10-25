"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import SearchifyLoader from "@/components/v8/SearchifyLoader";
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
    return <SearchifyLoader full label="Opening your workspace" />;
  }

  return children;
}
