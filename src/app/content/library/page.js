import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "My Content",
  description: "The library. Publish waits until a person agrees.",
  path: "/content/library",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="my-content"
      title="My Content"
      description="The library. Publish waits until a person agrees."
    />
  );
}
