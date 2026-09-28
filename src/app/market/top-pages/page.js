import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Top Pages",
  description: "Landing pages joined from stored Search Console and GA4 rows.",
  path: "/market/top-pages",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="top-pages"
      title="Top Pages"
      description="Landing pages joined from stored Search Console and GA4 rows."
    />
  );
}
