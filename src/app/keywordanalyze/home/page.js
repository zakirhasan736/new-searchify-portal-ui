import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Keyword Analyze",
  description: "Search keywords and save groups.",
  path: "/keywordanalyze/home",
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind="keyword-analyze"
      title="Keyword Analyze"
      description="Search keywords and save groups."
      group="Research"
      initialTab="overview"
    />
  );
}
