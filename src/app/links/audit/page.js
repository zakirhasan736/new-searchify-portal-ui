import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Backlink Audit",
  description: "Flagged rows. A person reviews the queue.",
  path: "/links/audit",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="backlink-audit"
      title="Backlink Audit"
      description="Flagged rows. A person reviews the queue."
    />
  );
}
