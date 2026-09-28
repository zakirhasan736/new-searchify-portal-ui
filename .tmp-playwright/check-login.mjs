import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});
const page = await browser.newPage();
const logs = [];
page.on("console", (msg) => logs.push(`console.${msg.type()}: ${msg.text()}`));
page.on("pageerror", (err) => logs.push(`pageerror: ${err.message}`));
page.on("response", (res) => {
  const url = res.url();
  if (url.includes("/api/") || res.status() >= 400) {
    logs.push(`response ${res.status()} ${url}`);
  }
});

const paths = ["/works", "/seooptimization", "/seooptimization/new", "/projectmaking"];

await page.goto("http://localhost:3000/signin", { waitUntil: "domcontentloaded" });
await page.fill('input[name="username"]', "client");
await page.fill('input[name="password"]', "Client#1234");
await page.click('input[name="button"]');
await page.waitForURL("**/works", { timeout: 10000 });

for (const path of paths) {
  const errors = [];
  const onError = (err) => errors.push(err.message.split("\n")[0]);
  page.on("pageerror", onError);
  const response = await page.goto("http://localhost:3000" + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  page.off("pageerror", onError);
  const text = (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 120);
  console.log(`${response?.status()} ${path} ${errors.join(" | ") || "ok"} :: ${text}`);
}
await browser.close();
