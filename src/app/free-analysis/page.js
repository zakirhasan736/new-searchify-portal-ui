import { Suspense } from "react";
import { pageMeta } from "@/lib/seo";
import FreeAnalysisScreen from "@/components/v8/screens/FreeAnalysisScreen";

export const metadata = pageMeta({
  title: "Free website analysis",
  description: "See how Google sees your website — free, no login. Titles, health, and Google Places.",
  path: "/free-analysis",
});

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#0A0B0D" }} />}>
      <FreeAnalysisScreen />
    </Suspense>
  );
}
