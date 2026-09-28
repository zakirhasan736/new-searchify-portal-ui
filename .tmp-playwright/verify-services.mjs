import { chromium } from "playwright-core";
import path from "path";

const edge = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const out = path.resolve("shots");
const browser = await chromium.launch({ executablePath: edge, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (err) => errors.push(err.message));

await page.goto("http://localhost:3000/signin", { waitUntil: "networkidle" });
await page.getByPlaceholder("Enter Username").fill("client");
await page.getByPlaceholder("Enter Password").fill("Client#1234");
await page.getByRole("button", { name: "Sign In" }).click();
await page.waitForURL("**/works");

const shots = [
  ["/dashboard", "svc-dashboard.png", "Website overview"],
  ["/keywordgap/home", "svc-gap.png", "Keyword Gap"],
  ["/site/positions", "svc-ranks.png", "Position Tracking"],
  ["/site/audit", "svc-audit.png", "Site Audit"],
  ["/ai-search", "svc-ai.png", "AI Search"],
  ["/market/traffic-distribution", "svc-share.png", "Traffic Distribution"],
  ["/trafficsAnalytics/home", "svc-traffic.png", "Traffic Analytics"],
];

for (const [url, file, heading] of shots) {
  await page.goto(`http://localhost:3000${url}`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: heading }).waitFor();
  await page.screenshot({ path: path.join(out, file) });
}

console.log(JSON.stringify({ errors }));
await browser.close();
