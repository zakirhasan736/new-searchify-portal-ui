import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Keyword Manager",
  description: "Keywords inside the selected list.",
  path: "/keywordmannager/overview",
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind="keyword-manager"
      title="Keyword Manager"
      description="Keywords inside the selected list."
      group="Research"
      initialTab="table"
    />
  );
}
