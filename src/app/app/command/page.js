import { Suspense } from "react";
import CommandScreen from "@/components/v8/screens/CommandScreen";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CommandScreen />
    </Suspense>
  );
}
