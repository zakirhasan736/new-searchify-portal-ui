import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Referral",
  description: "Referring sites, source, and medium.",
  path: "/market/referral",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="referral"
      title="Referral"
      description="Referring sites, source, and medium."
    />
  );
}
