import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Keyword Analyze",
  description: "Saved keyword groups.",
  path: "/keywordanalyze/overview",
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind="keyword-analyze"
      title="Keyword Analyze"
      description="Saved keyword groups."
      group="Research"
      initialTab="table"
    />
  );
}
