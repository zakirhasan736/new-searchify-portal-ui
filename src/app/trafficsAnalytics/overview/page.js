import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Traffic Analytics",
  description: "Competitor lists and the traffic table.",
  path: "/trafficsAnalytics/overview",
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind="traffic-home"
      title="Traffic Analytics"
      description="Competitor lists and the traffic table."
      group="Research"
      initialTab="table"
    />
  );
}
