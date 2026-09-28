import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "AI Search",
  description: "Stored AI-answer snapshots and a scheduled summary.",
  path: "/ai-search",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="ai-search"
      title="AI Search"
      description="Stored AI-answer snapshots and a scheduled summary."
    />
  );
}
