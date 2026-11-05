import { pageMeta } from "@/lib/seo";
import PricingView from "@/components/landing/PricingView";

export const metadata = pageMeta({
  title: "Pricing",
  description: "Pay for sites, not seats. Solo is free for the first month. Pro locks in early-launch pricing while spots remain.",
  path: "/pricing",
});

export default function Page() {
  return <PricingView />;
}
