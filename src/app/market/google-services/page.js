import { Suspense } from "react";
import Workspace from "@/components/features/Workspace";
import GoogleConnectPanel from "@/components/studio/GoogleConnectPanel";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Google Services",
  description: "Unified hub for Search Console, GA4, PageSpeed, and Places.",
  path: "/market/google-services",
  index: true,
});

export default function Page() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="rounded-2xl border border-line bg-panel p-5 text-sm text-white/50">Loading Google…</div>}>
        <GoogleConnectPanel />
      </Suspense>
      <Workspace
        kind="google-services"
        title="Google Services hub"
        description="Live tables from connected GSC, GA4, PageSpeed Insights, and Places."
        group="Traffic & Market"
      />
    </div>
  );
}
