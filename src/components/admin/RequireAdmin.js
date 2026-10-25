"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
    return (
      <div style={{ minHeight: "40vh", background: "#0A0B0D", color: "#9AA1AB", padding: 28, fontFamily: "Geist, system-ui, sans-serif" }}>
        Checking admin access…
      </div>
    );
  }

  return children;
}
