import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Keywords",
  description: "Rank cards and the keyword table.",
  path: "/SEOranking",
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind="keyword-ranking"
      title="Keywords"
      description="Rank cards and the keyword table."
      group="Research"
      initialTab="overview"
    />
  );
}
