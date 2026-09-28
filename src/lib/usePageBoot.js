"use client";

import { useState } from "react";
import { useV3Store } from "@/lib/v3Store";

/** True immediately when Zustand already has the screen's data — no skeleton flash. */
export function usePageBoot(hasCache) {
  const [booted, setBooted] = useState(() => {
    try {
      return Boolean(hasCache?.(useV3Store.getState()));
    } catch {
      return false;
    }
  });
  return [booted, setBooted];
}
