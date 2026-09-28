"use client";

import { Btn, Hero, Pill } from "@/components/v3/V3Shell";

export default function AdminHomePage() {
  return (
    <>
      <Hero
        label="Administration"
        line1="OPERATOR"
        line2="CONTROLS."
        sub="Tag management and catalog work stay in this admin shell — never in the customer sidebar."
      />
      <div className="sf-box sf-gap">
        <div className="sf-row sf-between">
          <div>
            <h2>What lives here</h2>
            <p>Industry tags, catalog maintenance, and other operator-only tools.</p>
          </div>
          <Pill>Admin vs customer</Pill>
        </div>
        <div className="sf-list">
          <div className="sf-listrow" style={{ paddingLeft: 0, paddingRight: 0 }}>
            <div>
              <h3>Tag management</h3>
              <p style={{ fontSize: 13 }}>Add domain tags used by the catalog. Customers cannot open this from Settings.</p>
            </div>
            <Btn primary href="/admin/tagmgmt">
              Open tags
            </Btn>
          </div>
          <div className="sf-listrow" style={{ paddingLeft: 0, paddingRight: 0 }}>
            <div>
              <h3>Customer workspace</h3>
              <p style={{ fontSize: 13 }}>Connections, queue, reports, and billing stay on /app.</p>
            </div>
            <Btn href="/app">Open /app</Btn>
          </div>
        </div>
      </div>
    </>
  );
}
