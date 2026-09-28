import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (err) => errors.push(err.message.split("\n")[0]));

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto("http://localhost:3000/signin", { waitUntil: "networkidle" });
await page.screenshot({ path: "C:/Users/zakir/Desktop/searchify-new-ui-portal/.tmp-playwright/signin-desktop.png" });
await page.fill('input[name="username"]', "client");
await page.fill('input[name="password"]', "Client#1234");
await page.click('input[name="button"]');
await page.waitForURL("**/works");
await page.waitForTimeout(600);
await page.screenshot({ path: "C:/Users/zakir/Desktop/searchify-new-ui-portal/.tmp-playwright/works-desktop.png" });
await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
await page.screenshot({ path: "C:/Users/zakir/Desktop/searchify-new-ui-portal/.tmp-playwright/dashboard-desktop.png" });
await page.fill('input[aria-label="Find a tool"]', "");
await page.goto("http://localhost:3000/market/get-started", { waitUntil: "networkidle" });
await page.screenshot({ path: "C:/Users/zakir/Desktop/searchify-new-ui-portal/.tmp-playwright/workspace-desktop.png" });

await page.setViewportSize({ width: 390, height: 844 });
await page.goto("http://localhost:3000/works", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
await page.screenshot({ path: "C:/Users/zakir/Desktop/searchify-new-ui-portal/.tmp-playwright/works-mobile.png" });
await page.click('button[aria-label="Open menu"]');
await page.waitForTimeout(300);
await page.screenshot({ path: "C:/Users/zakir/Desktop/searchify-new-ui-portal/.tmp-playwright/menu-mobile.png" });

console.log(errors.length ? errors.join("\n") : "no page errors");
await browser.close();
