import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "AI Analysis",
  description: "A stored summary of prompt runs and AI answers.",
  path: "/visibility/analysis",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="ai-analysis"
      title="AI Analysis"
      description="A stored summary of prompt runs and AI answers."
    />
  );
}
