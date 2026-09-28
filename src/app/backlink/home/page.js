import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Backlink Analytics",
  description: "Referring links for this project.",
  path: "/backlink/home",
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind="backlink-analytics"
      title="Backlink Analytics"
      description="Referring links for this project."
      group="Research"
      initialTab="overview"
    />
  );
}
