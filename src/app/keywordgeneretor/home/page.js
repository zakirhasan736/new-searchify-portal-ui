import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Generate Keywords",
  description: "Keyword ideas with volume and visits.",
  path: "/keywordgeneretor/home",
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind="generate-keywords"
      title="Generate Keywords"
      description="Keyword ideas with volume and visits."
      group="Research"
      initialTab="overview"
    />
  );
}
