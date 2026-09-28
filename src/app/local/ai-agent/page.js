import LocalStudio from "@/components/studio/LocalStudio";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "GBP AI Agent",
  description: "Suggested review replies. A person still sends them.",
  path: "/local/ai-agent",
  index: true,
});

export default function Page() {
  return <LocalStudio kind="local-ai-agent" />;
}
