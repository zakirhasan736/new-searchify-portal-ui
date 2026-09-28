import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "GA4 Landing Pages",
  description: "Top landing pages from Google Analytics 4.",
  path: "/market/ga4-landing-pages",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="ga4-landing-pages"
      title="GA4 Landing Pages"
      description="Sessions, users, and bounce rate by landing page."
    />
  );
}
