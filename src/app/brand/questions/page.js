import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Questions",
  description: "Questions that trigger brand answers.",
  path: "/brand/questions",
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind="brand-questions"
      title="Questions"
      description="Questions that trigger brand answers."
    />
  );
}
