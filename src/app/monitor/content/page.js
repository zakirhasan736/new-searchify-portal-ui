import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Content Creation",
  description: "A piece from an approved brief, then a score.",
  path: "/monitor/content",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="content-creation"
      title="Content Creation"
      description="A piece from an approved brief, then a score."
    />
  );
}
