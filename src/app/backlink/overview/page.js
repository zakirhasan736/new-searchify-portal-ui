import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Backlink Analytics",
  description: "Filtered backlink rows.",
  path: "/backlink/overview",
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind="backlink-analytics"
      title="Backlink Analytics"
      description="Filtered backlink rows."
      group="Research"
      initialTab="table"
    />
  );
}
