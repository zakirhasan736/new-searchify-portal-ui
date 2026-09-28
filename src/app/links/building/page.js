import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Link Building",
  description: "Prospects and an outreach draft. A person sends it.",
  path: "/links/building",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="link-building"
      title="Link Building"
      description="Prospects and an outreach draft. A person sends it."
    />
  );
}
