import { pageMeta } from "@/lib/seo";
import PrivacyView from "@/components/landing/PrivacyView";

export const metadata = pageMeta({
  title: "Privacy",
  description:
    "What Searchify stores for an account, a connected site, and approved drafts — and what the contact form does not send.",
  path: "/privacy",
});

export default function Page() {
  return <PrivacyView />;
}
