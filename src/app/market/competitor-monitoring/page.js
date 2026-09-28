import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Competitor Monitoring",
  description: "Competitor traffic and keyword overlap, saved each week.",
  path: "/market/competitor-monitoring",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="competitor-monitoring"
      title="Competitor Monitoring"
      description="Competitor traffic and keyword overlap, saved each week."
    />
  );
}
