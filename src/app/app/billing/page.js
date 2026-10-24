import PricingView from "@/components/landing/PricingView";

export const metadata = { title: "Plan and billing" };

/** Pricing.dc.html, inside the app. Catalog, current plan, checkout, and quotes are live. */
export default function Page() {
  return <PricingView embedded />;
}
