import { Suspense } from "react";
import Workspace from "@/components/features/Workspace";
import GoogleConnectPanel from "@/components/studio/GoogleConnectPanel";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Get Started",
  description: "Connect the site, Search Console, and GA4, then run the first crawl.",
  path: "/market/get-started",
  index: true,
});

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Suspense fallback={<div className="rounded-2xl border border-line bg-panel p-5 text-sm text-white/50">Loading Google connect…</div>}>
        <GoogleConnectPanel />
      </Suspense>
      <Workspace
        kind="get-started"
        title="Get Started"
        description="Connect the site, Search Console, and GA4, then run the first crawl."
      />
    </div>
  );
}
