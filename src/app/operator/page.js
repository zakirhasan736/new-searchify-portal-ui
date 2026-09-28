import OperatorStudio from "@/components/studio/OperatorStudio";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "SEO Operator",
  description: "Turn GSC opportunities into approved CMS changes and monitor outcomes.",
  path: "/operator",
  index: true,
});

export default function Page() {
  return <OperatorStudio />;
}
