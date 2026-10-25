import PricingView from "@/components/landing/PricingView";

export const metadata = { title: "Plans" };

/** Same Pricing.dc.html layout as Plan and billing. First-time customers land here after the site brief. */
export default function Page() {
  return <PricingView onboarding />;
}
