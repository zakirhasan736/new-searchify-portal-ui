import { Suspense } from "react";
import GuidedSetup from "@/components/guide/GuidedSetup";

export const metadata = { title: "Setup" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <GuidedSetup />
    </Suspense>
  );
}
