import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Keyword Gap",
  description: "Range filters on the stored gap.",
  path: "/keywordgap/overview",
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind="keyword-gap"
      title="Keyword Gap"
      description="Range filters on the stored gap."
      group="Research"
      initialTab="table"
    />
  );
}
