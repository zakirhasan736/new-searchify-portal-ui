"use client";

import StatesScreen from "@/components/v8/screens/StatesScreen";
import RequireCustomerApp from "@/components/v8/RequireCustomerApp";

export default function Page() {
  return (
    <RequireCustomerApp>
      <StatesScreen />
    </RequireCustomerApp>
  );
}
