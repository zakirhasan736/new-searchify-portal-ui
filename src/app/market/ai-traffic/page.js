import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "AI Traffic",
  description: "Visits that arrived from an AI product.",
  path: "/market/ai-traffic",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="ai-traffic"
      title="AI Traffic"
      description="Visits that arrived from an AI product."
    />
  );
}
