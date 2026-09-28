import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "AI Search Visibility Report",
  description: "A stored report. Later views read the save.",
  path: "/ai-search/report",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="ai-visibility-report"
      title="AI Search Visibility Report"
      description="A stored report. Later views read the save."
    />
  );
}
