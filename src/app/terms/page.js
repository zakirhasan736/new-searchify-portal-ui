import { pageMeta } from "@/lib/seo";
import TermsView from "@/components/landing/TermsView";

export const metadata = pageMeta({
  title: "Terms",
  description:
    "The working terms for the Searchify website, account, and SEO review workspace. Plain language for a product still in validation.",
  path: "/terms",
});

export default function Page() {
  return <TermsView />;
}
