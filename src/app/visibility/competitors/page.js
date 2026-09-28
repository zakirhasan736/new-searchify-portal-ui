import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Competitor Research",
  description: "What competitors rank for.",
  path: "/visibility/competitors",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="competitor-research"
      title="Competitor Research"
      description="What competitors rank for."
    />
  );
}
