import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Traffic Analytics",
  description: "Sessions, users, and engagement over time.",
  path: "/trafficsAnalytics/home",
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind="traffic-home"
      title="Traffic Analytics"
      description="Sessions, users, and engagement over time."
      group="Research"
      initialTab="overview"
    />
  );
}
