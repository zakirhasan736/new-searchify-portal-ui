import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Organic Search",
  description: "Clicks, impressions, CTR, and position.",
  path: "/organicsearch/overview",
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind="organic-research"
      title="Organic Search"
      description="Clicks, impressions, CTR, and position."
      group="Research"
      initialTab="table"
    />
  );
}
