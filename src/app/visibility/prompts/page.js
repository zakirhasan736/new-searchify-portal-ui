import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Prompt Research",
  description: "Suggested prompts. The answers are stored.",
  path: "/visibility/prompts",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="prompt-research"
      title="Prompt Research"
      description="Suggested prompts. The answers are stored."
    />
  );
}
