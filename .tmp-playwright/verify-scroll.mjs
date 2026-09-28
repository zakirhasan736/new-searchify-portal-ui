import { chromium } from "playwright-core";

const edge = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const paths = [
  ["/works", "My works"],
  ["/seooptimization", "Site optimization"],
  ["/seooptimization/new", "New optimization"],
  ["/dashboard", "Website overview"],
  ["/SEOranking", "Keywords"],
  ["/keywordanalyze/home", "Keyword Analyze"],
  ["/keywordanalyze/overview", "Keyword Analyze"],
  ["/websitekeyword/home", "Website Keywords"],
  ["/trafficsAnalytics/home", "Traffic Analytics"],
  ["/trafficsAnalytics/overview", "Traffic Analytics"],
  ["/keywordgap/home", "Keyword Gap"],
  ["/keywordmannager/home", "Keyword Manager"],
  ["/organicsearch/home", "Organic Search"],
  ["/keywordoverview/home", "Keyword Overview"],
  ["/domainoverview/home", "Domain Overview"],
  ["/backlink/home", "Backlink Analytics"],
  ["/market/get-started", "Get Started"],
  ["/market/traffic-analytics", "Traffic Analytics"],
  ["/market/overview", "Market Overview"],
  ["/market/top-pages", "Top Pages"],
  ["/market/traffic-distribution", "Traffic Distribution"],
  ["/market/organic-search", "Organic Search"],
  ["/ai-search", "AI Search"],
  ["/ai-search/audit", "AI Search Audit"],
  ["/writing/assistant", "SEO Writing Assistant"],
  ["/links/backlinks", "Backlinks"],
  ["/links/audit", "Backlink Audit"],
  ["/site/audit", "Site Audit"],
  ["/site/positions", "Position Tracking"],
  ["/site/on-page", "On Page SEO Checker"],
  ["/visibility/overview", "Visibility Overview"],
  ["/content", "Content Dashboard"],
  ["/content/library", "My Content"],
  ["/UserProfile", "Account"],
  ["/news", "Announcements"],
  ["/features", "AI features"],
];

const browser = await chromium.launch({ executablePath: edge, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 800 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));

await page.goto("http://localhost:3000/signin", { waitUntil: "networkidle" });
await page.getByPlaceholder("Enter Username").fill("client");
await page.getByPlaceholder("Enter Password").fill("Client#1234");
await page.getByRole("button", { name: "Sign In" }).click();
await page.waitForURL("**/works");

await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
await page.getByRole("heading", { name: "Website overview" }).waitFor();
const metrics = await page.evaluate(() => {
  const main = document.querySelector("main");
  const nav = document.querySelector("aside nav");
  main.scrollTop = main.scrollHeight;
  nav.scrollTop = nav.scrollHeight;
  return {
    mainScrolls: main.scrollHeight > main.clientHeight,
    mainMoved: main.scrollTop > 0,
    navScrolls: nav.scrollHeight > nav.clientHeight,
    navMoved: nav.scrollTop > 0,
    bodyLocked: getComputedStyle(document.body).overflow === "hidden",
  };
});

const failed = [];
for (const [path, title] of paths) {
  const response = await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle" });
  const heading = await page.getByRole("heading", { name: title, exact: true }).count();
  if (!response || response.status() >= 400 || heading === 0) failed.push(`${path} ${response?.status()} heading=${heading}`);
}

await page.setViewportSize({ width: 390, height: 800 });
await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Menu" }).click();
const drawer = await page.locator("aside").boundingBox();
const mobileMain = await page.evaluate(() => {
  const main = document.querySelector("main");
  return main.scrollHeight > main.clientHeight;
});

console.log(JSON.stringify({ metrics, failed, errors, drawer, mobileMain }, null, 2));
await browser.close();
