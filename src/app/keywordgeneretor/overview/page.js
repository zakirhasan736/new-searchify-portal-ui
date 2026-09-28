import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Generate Keywords",
  description: "Volume and visits.",
  path: "/keywordgeneretor/overview",
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind="generate-keywords"
      title="Generate Keywords"
      description="Volume and visits."
      group="Research"
      initialTab="table"
    />
  );
}
