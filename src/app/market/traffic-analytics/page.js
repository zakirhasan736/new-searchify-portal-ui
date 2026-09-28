import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Traffic Analytics",
  description: "Sessions, users, and engagement over time from stored analytics.",
  path: "/market/traffic-analytics",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="traffic-analytics"
      title="Traffic Analytics"
      description="Sessions, users, and engagement over time from stored analytics."
    />
  );
}
