"use client";

import { Btn, Pill } from "@/components/v3/V3Shell";

/** Google Ads OAuth (adwords) was removed from Searchify for Google verification / least privilege. */
export default function GoogleAdsPicker() {
  return (
    <div className="sf-box sf-ai sf-gap">
      <div className="sf-row sf-between">
        <h2>Google Ads</h2>
        <Pill neutral>Not available</Pill>
      </div>
      <p style={{ fontSize: 13 }}>
        Searchify no longer connects Google Ads. Use Search Console and Analytics on Plug in for organic search data.
      </p>
      <Btn href="/app/connections">Open Plug in</Btn>
    </div>
  );
}
