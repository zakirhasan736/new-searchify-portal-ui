import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "AI Search Audit",
  description: "Crawl findings. Fixes are scored before a person applies them.",
  path: "/ai-search/audit",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="ai-search-audit"
      title="AI Search Audit"
      description="Crawl findings. Fixes are scored before a person applies them."
    />
  );
}
