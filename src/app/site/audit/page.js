import SiteAuditStudio from "@/components/studio/SiteAuditStudio";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Site Audit",
  description: "Full PageSpeed Insights report plus Search Console findings.",
  path: "/site/audit",
  index: true,
});

export default function Page() {
  return <SiteAuditStudio />;
}
