import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Keyword Overview",
  description: "Volume, difficulty, and intent.",
  path: "/keywordoverview/home",
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind="keyword-metrics"
      title="Keyword Overview"
      description="Volume, difficulty, and intent."
      group="Research"
      initialTab="overview"
    />
  );
}
