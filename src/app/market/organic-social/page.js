import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Organic Social",
  description: "Social referral sessions stored for this project.",
  path: "/market/organic-social",
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind="organic-social"
      title="Organic Social"
      description="Social referral sessions stored for this project."
    />
  );
}
