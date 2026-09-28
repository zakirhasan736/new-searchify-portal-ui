import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Topic Finder",
  description: "Stored keywords ranked for new topics.",
  path: "/content/topics",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="topic-finder"
      title="Topic Finder"
      description="Stored keywords ranked for new topics."
    />
  );
}
