"use client";

import { Suspense } from "react";
import ReviewScreen from "@/components/v8/screens/ReviewScreen";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ReviewScreen />
    </Suspense>
  );
}
