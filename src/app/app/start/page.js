import { Suspense } from "react";
import SetupScreen from "@/components/v8/screens/SetupScreen";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SetupScreen />
    </Suspense>
  );
}
