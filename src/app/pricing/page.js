import { pageMeta } from "@/lib/seo";
import PricingView from "@/components/landing/PricingView";

export const metadata = pageMeta({
  title: "Pricing",
  description:
    "Searchify is validating its first customer workflow. Ask about the pilot and get clear scope and pricing before you commit.",
  path: "/pricing",
});

export default function Page() {
  return <PricingView />;
}
