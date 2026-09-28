import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Organic Search",
  description: "Organic landing data.",
  path: "/organicsearch/home",
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind="organic-research"
      title="Organic Search"
      description="Organic landing data."
      group="Research"
      initialTab="overview"
    />
  );
}
