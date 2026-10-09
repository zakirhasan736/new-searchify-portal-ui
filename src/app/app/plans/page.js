import { Suspense } from "react";
import PlanStep from "@/components/guide/PlanStep";

export const metadata = { title: "Plans" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PlanStep />
    </Suspense>
  );
}
