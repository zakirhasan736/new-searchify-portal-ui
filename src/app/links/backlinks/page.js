import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Backlinks",
  description: "Backlink table from the stored index.",
  path: "/links/backlinks",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="backlinks"
      title="Backlinks"
      description="Backlink table from the stored index."
    />
  );
}
