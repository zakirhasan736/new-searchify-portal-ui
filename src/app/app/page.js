"use client";

import { useEffect, useState } from "react";
import HomeScreen from "@/components/v8/screens/HomeScreen";
import TrialReportScreen from "@/components/v8/screens/TrialReportScreen";
import { getBillingAccount } from "@/lib/billingApi";
import { accountNeedsPaidPlan } from "@/lib/trialGate";
import { SkeletonCards } from "@/components/v8/SkeletonWave";

/**
 * Today's moves (/app). After a free-month trial ends (and before they pay),
 * this route shows the trial report so the urgency is front-and-center.
 */
export default function Page() {
  const [mode, setMode] = useState("loading");

  useEffect(() => {
    let live = true;
    getBillingAccount()
      .then((res) => {
        if (!live) return;
        const account = res?.ok ? res.data || res : null;
        setMode(accountNeedsPaidPlan(account) ? "trial-report" : "home");
      })
      .catch(() => {
        if (live) setMode("home");
      });
    return () => {
      live = false;
    };
  }, []);

  if (mode === "loading") {
    return (
      <div style={{ padding: "22px clamp(16px, 4vw, 56px)" }}>
        <SkeletonCards count={3} lines={4} />
      </div>
    );
  }
  if (mode === "trial-report") return <TrialReportScreen />;
  return <HomeScreen />;
}
