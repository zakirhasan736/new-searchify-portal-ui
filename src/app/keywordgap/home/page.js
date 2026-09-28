import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Keyword Gap",
  description: "Keywords you miss against competitors.",
  path: "/keywordgap/home",
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind="keyword-gap"
      title="Keyword Gap"
      description="Keywords you miss against competitors."
      group="Research"
      initialTab="overview"
    />
  );
}
