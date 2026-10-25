"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SearchifyLoader from "@/components/v8/SearchifyLoader";
import { isAdminAuthenticated, isPartnerAuthenticated } from "@/lib/authRoles";

/** HQ / admin routes require an admin JWT — customer or partner sessions are rejected. */
export default function RequireAdmin({ children }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      if (isPartnerAuthenticated()) {
        router.replace("/partners");
        return;
      }
      router.replace("/admin/login?next=" + encodeURIComponent(window.location.pathname || "/admin"));
      return;
    }
    setOk(true);
  }, [router]);

  if (!ok) {
    return <SearchifyLoader full label="Opening Searchify HQ" />;
  }

  return children;
}
