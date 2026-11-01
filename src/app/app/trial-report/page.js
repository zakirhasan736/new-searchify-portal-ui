"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import TrialReportScreen from "@/components/v8/screens/TrialReportScreen";
import { getBillingAccount } from "@/lib/billingApi";
import { accountNeedsPaidPlan } from "@/lib/trialGate";

/**
 * Legacy /app/trial-report route. After trial end the report lives on Today's moves (/app).
 */
export default function Page() {
  const router = useRouter();

  useEffect(() => {
    let live = true;
    getBillingAccount()
      .then((res) => {
        if (!live) return;
        const account = res?.ok ? res.data || res : null;
        if (accountNeedsPaidPlan(account)) router.replace("/app");
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [router]);

  return <TrialReportScreen />;
}
