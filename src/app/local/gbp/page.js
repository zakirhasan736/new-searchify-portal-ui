import LocalStudio from "@/components/studio/LocalStudio";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "GBP Optimization",
  description: "Google Business Profile checklist and gaps.",
  path: "/local/gbp",
  index: true,
});

export default function Page() {
  return <LocalStudio kind="local-gbp" />;
}
