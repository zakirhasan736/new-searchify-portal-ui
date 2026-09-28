import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Keyword Overview",
  description: "Keyword metric detail.",
  path: "/keywordoverview/overview",
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind="keyword-metrics"
      title="Keyword Overview"
      description="Keyword metric detail."
      group="Research"
      initialTab="table"
    />
  );
}
