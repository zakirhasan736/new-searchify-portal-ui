"use client";

import { useEffect, useState } from "react";
import { briefFromAnswers } from "@/lib/businessBrief";
import { effectiveSiteKey, siteForScope } from "@/lib/siteScope";

export function useWorkspaceSite(scope = "") {
  const [value, setValue] = useState({ brief: briefFromAnswers({}), site: null, key: "" });
  useEffect(() => {
    const read = (event) => {
      if (event?.detail?.local && event.detail.scope !== scope) return;
      if (!scope && event?.detail?.local) return;
      const site = siteForScope(scope);
      setValue({ brief: briefFromAnswers(site?.answers), site, key: effectiveSiteKey(scope, site) });
    };
    read();
    window.addEventListener("sf-site", read);
    return () => window.removeEventListener("sf-site", read);
  }, [scope]);
  return value;
}

export function useBusinessBrief(scope = "") {
  return useWorkspaceSite(scope).brief;
}
