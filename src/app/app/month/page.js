import { Suspense } from "react";
import ReportScreen from "@/components/v8/screens/ReportScreen";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ReportScreen />
    </Suspense>
  );
}
