import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Prompt Tracking",
  description: "The same prompts run on a schedule. The trend is stored.",
  path: "/monitor/prompts",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="prompt-tracking"
      title="Prompt Tracking"
      description="The same prompts run on a schedule. The trend is stored."
    />
  );
}
