import { chromium } from "playwright-core";
import path from "path";

const edge = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const out = path.resolve("shots");
const browser = await chromium.launch({ executablePath: edge, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));

await page.goto("http://localhost:3000/signin", { waitUntil: "networkidle" });
await page.getByPlaceholder("Enter Username").fill("client");
await page.getByPlaceholder("Enter Password").fill("Client#1234");
await page.getByRole("button", { name: "Sign In" }).click();
await page.waitForURL("**/works");

await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Range/ }).click();
await page.getByRole("button", { name: "Last 7 days" }).waitFor();
await page.screenshot({ path: path.join(out, "dropdown.png") });
await page.getByRole("button", { name: "Last 3 months" }).click();

await page.getByRole("button", { name: "Search", exact: true }).click();
await page.getByPlaceholder("Keyword, domain, or metric").fill("bounce");
await page.getByRole("button", { name: /Bounce rate/ }).click();
await page.getByText("Search: Bounce rate").waitFor();
await page.screenshot({ path: path.join(out, "search-popup-result.png") });

await page.goto("http://localhost:3000/keywordmannager/home", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Create list" }).click();
const save = page.getByRole("button", { name: "Save list" });
await save.waitFor();
const disabledShort = await save.isDisabled();
await page.getByPlaceholder("List name").fill("Brand terms");
const enabled = !(await save.isDisabled());
await save.click();
await page.getByText("Saved to your project.").waitFor();
await page.getByRole("button", { name: "Saved" }).click();
await page.getByText("Brand terms").waitFor();
await page.screenshot({ path: path.join(out, "keyword-list.png") });

await page.goto("http://localhost:3000/trafficsAnalytics/home", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Create list" }).click();
await page.getByPlaceholder("List name").fill("Rival set");
await page.getByPlaceholder("Domain, subdomain, or folder").fill("ama");
await page.getByRole("button", { name: "amazon.com" }).click();
await page.getByRole("button", { name: "Save list" }).click();
await page.getByText("Saved to your project.").waitFor();

console.log(JSON.stringify({ errors, disabledShort, enabled }, null, 2));
await browser.close();
