import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Topic Research",
  description: "Keyword clusters already stored for this project.",
  path: "/writing/topics",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="topic-research"
      title="Topic Research"
      description="Keyword clusters already stored for this project."
    />
  );
}
