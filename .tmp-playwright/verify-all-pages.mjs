import { chromium } from "playwright-core";

const edge = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const pages = [
  ["/dashboard", "Website overview", "metrics"],
  ["/SEOranking", "Keywords", "keywords"],
  ["/keywordanalyze/home", "Keyword Analyze", "keyword groups"],
  ["/websitekeyword/home", "Website Keywords", "keywords"],
  ["/keywordgeneretor/home", "Generate Keywords", "keyword ideas"],
  ["/trafficsAnalytics/home", "Traffic Analytics", "traffic rows"],
  ["/keywordgap/home", "Keyword Gap", "missing keywords"],
  ["/keywordmannager/home", "Keyword Manager", "lists"],
  ["/organicsearch/home", "Organic Search", "organic keywords"],
  ["/keywordoverview/home", "Keyword Overview", "keyword metrics"],
  ["/domainoverview/home", "Domain Overview", "domain metrics"],
  ["/backlink/home", "Backlink Analytics", "backlinks"],
  ["/market/get-started", "Get Started", "setup steps"],
  ["/market/top-pages", "Top Pages", "pages"],
  ["/market/traffic-distribution", "Traffic Distribution", "channels"],
  ["/market/organic-search", "Organic Search", "queries"],
  ["/ai-search", "AI Search", "prompts"],
  ["/ai-search/audit", "AI Search Audit", "findings"],
  ["/links/backlinks", "Backlinks", "backlinks"],
  ["/links/building", "Link Building", "prospects"],
  ["/site/audit", "Site Audit", "issues"],
  ["/site/positions", "Position Tracking", "tracked keywords"],
  ["/visibility/competitors", "Competitor Research", "competitor keywords"],
  ["/monitor/prompts", "Prompt Tracking", "tracked prompts"],
  ["/content", "Content Dashboard", "pieces"],
  ["/content/library", "My Content", "library items"],
];

const browser = await chromium.launch({ executablePath: edge, headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(`${page.url()} :: ${error.message}`));

await page.goto("http://localhost:3000/signin", { waitUntil: "networkidle" });
await page.getByPlaceholder("Enter Username").fill("client");
await page.getByPlaceholder("Enter Password").fill("Client#1234");
await page.getByRole("button", { name: "Sign In" }).click();
await page.waitForURL("**/works");

const failed = [];
for (const [path, title, label] of pages) {
  const response = await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle" });
  const heading = await page.getByRole("heading", { name: title, exact: true }).count();
  const search = await page.getByPlaceholder(/Search for a keyword|Enter a domain/).count();
  const results = await page.getByText(new RegExp(label, "i")).count();
  const views = await page.locator("main button").filter({ hasText: /Overview|Organic|Positions|Queries|Issues|Mentions/ }).count();
  if (!response || response.status() >= 400 || !heading || !search || !results) {
    failed.push({ path, status: response?.status(), heading, search, results, views });
  }
}

await page.goto("http://localhost:3000/content/article", { waitUntil: "networkidle" });
const article = await page.getByRole("heading", { name: "AI Article Generator" }).count();
const generate = await page.getByRole("button", { name: "Generate" }).count();

console.log(JSON.stringify({ failed, article, generate, errors }, null, 2));
await browser.close();
