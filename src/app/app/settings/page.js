"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SettingsScreen from "@/components/v8/screens/SettingsScreen";

function SettingsPageInner() {
  const params = useSearchParams();
  const tab = params.get("tab") || "auto";
  return <SettingsScreen initialTab={tab} />;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SettingsPageInner />
    </Suspense>
  );
}
