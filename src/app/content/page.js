import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Content Dashboard",
  description: "Pieces, status, and approvals.",
  path: "/content",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="content-dashboard"
      title="Content Dashboard"
      description="Pieces, status, and approvals."
    />
  );
}
