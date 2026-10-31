import { Suspense } from "react";
import { pageMeta } from "@/lib/seo";
import CheckoutView from "@/components/landing/CheckoutView";

export const metadata = pageMeta({
  title: "Checkout",
  description: "Start Searchify — account, business, and payment.",
  path: "/checkout",
});

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0A0B0D" }} />}>
      <CheckoutView />
    </Suspense>
  );
}
