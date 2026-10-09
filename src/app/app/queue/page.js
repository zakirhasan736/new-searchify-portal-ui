import { Suspense } from "react";
import { ApprovalsView } from "@/components/board/WorkspaceViews";

export const metadata = { title: "Needs human approval" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ApprovalsView />
    </Suspense>
  );
}
