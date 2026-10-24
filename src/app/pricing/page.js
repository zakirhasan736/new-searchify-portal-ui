import { pageMeta } from "@/lib/seo";
import PricingView from "@/components/landing/PricingView";

export const metadata = pageMeta({
  title: "Pricing",
  description: "Pay for sites, not seats. Solo, Pro, Premium, and Enterprise plans with a 14-day trial.",
  path: "/pricing",
});

export default function Page() {
  return <PricingView />;
}
