"use client";

import PhoneScreen from "@/components/v8/screens/PhoneScreen";
import RequireCustomerApp from "@/components/v8/RequireCustomerApp";
import "@/styles/v8-phone.css";

/** Presentation Phone.dc.html — mobile layout example + live approve queue. */
export default function Page() {
  return (
    <RequireCustomerApp>
      <div className="v8-phone-stage">
        <PhoneScreen />
      </div>
    </RequireCustomerApp>
  );
}
