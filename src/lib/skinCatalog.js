/**
 * Wall of skins — mirrors presentation/screens.html from Searchify-UI-SourceV8FINAL.
 * Routes map HTML skins onto the live Next app (APIs wired where the product has them).
 */

export const SKIN_SECTIONS = [
  {
    title: "The core loop",
    tiles: [
      { n: "01", t: "Plug in", d: "Connect Google and WordPress", href: "/app/connections" },
      { n: "02", t: "The scan", d: "What it costs, colour-coded task board", href: "/app/results" },
      { n: "03", t: "Home", d: "One move at a time", href: "/app" },
      { n: "04", t: "Page progress", d: "Poor to Excellent, page by page", href: "/app/path" },
      { n: "05", t: "Keyword tracker", d: "Did the change work, keyword by keyword", href: "/app/keywords" },
      { n: "05b", t: "Backlinks", d: "New and lost links, competitor gap", href: "/app/backlinks" },
      { n: "06", t: "Phone", d: "Approve on the go", href: "/app/phone" },
    ],
  },
  {
    title: "Around the loop",
    tiles: [
      { n: "00", t: "Landing page", d: "Public site, scan as the hero", href: "/" },
      { n: "08", t: "Pricing and checkout", d: "Solo, Pro, Premium", href: "/pricing" },
      { n: "09", t: "Edit before shipping", d: "Live Google preview and checks", href: "/app/queue" },

      { n: "10", t: "Reports and change log", d: "Filter every change, export reports", href: "/app/history" },
      { n: "11", t: "Settings", d: "Team, notifications, autonomy, billing", href: "/app/settings" },
      { n: "12", t: "All client sites", d: "Agency view", href: "/app/workspace" },
      { n: "13", t: "Client report", d: "Shareable monthly report", href: "/app/month" },
      { n: "14", t: "Problem and empty states", d: "Broken cable, plugin install, new site", href: "/app/states" },
      { n: "", t: "Privacy", d: "What we hold and why", href: "/privacy" },
      { n: "", t: "Terms", d: "Working terms for the site and workspace", href: "/terms" },
      { n: "", t: "Brand mark", d: "Six lights, Poor to Excellent", href: "/brand" },
    ],
  },
  {
    title: "Dashboards and partners",
    tiles: [
      { n: "15", t: "Results", d: "Clicks, position and leads over time", href: "/app/outcomes" },
      { n: "16", t: "Agency command centre", d: "Every client's approvals in one queue", href: "/app/command" },
      { n: "17", t: "Searchify HQ", d: "Internal business dashboard", href: "/admin" },
      { n: "18", t: "Partner sign in", d: "partner@searchify.io / Partner-2026", href: "/partners/login" },
      { n: "19", t: "Partner centre", d: "Link clicks, sign-ups and payouts", href: "/partners" },
      { n: "20", t: "Partner earnings", d: "Cleared, in the 30-day hold, reversed", href: "/partners/earnings" },
      { n: "21", t: "Partner payout and tax", d: "Payout method and tax details", href: "/partners/payout" },
      { n: "22", t: "Partner agreement and rules", d: "Terms, disclosure wording, marketing kit", href: "/partners/terms" },
    ],
  },
  {
    title: "Searchify HQ (internal)",
    tiles: [
      { n: "23", t: "HQ customers", d: "Look up an account, refund, comp, cancel", href: "/admin/hq/customers" },
      { n: "24", t: "HQ partners and payouts", d: "Payout run, applications, founding partners", href: "/admin/hq/partners" },
      { n: "25", t: "HQ problems", d: "Failed payments, broken connections, rollbacks", href: "/admin/hq/problems" },
      { n: "26", t: "HQ shareholders", d: "Dividend test, split, quarterly update", href: "/admin/hq/shareholders" },
    ],
  },
  {
    title: "Earlier direction (V1)",
    tiles: [
      { n: "", t: "Today", d: "V1 home", href: "/app" },
      { n: "", t: "Review a move", d: "Edit before shipping", href: "/app/queue" },

      { n: "", t: "Proof ledger", d: "Change log", href: "/app/history" },
      { n: "", t: "Connections", d: "Plug in", href: "/app/connections" },
      { n: "", t: "60-second setup", d: "Business brief", href: "/app/start" },
      { n: "", t: "Customer sign in", d: "Workspace login", href: "/login" },
    ],
  },
];

export const SKINS_HOME = "/skins";
