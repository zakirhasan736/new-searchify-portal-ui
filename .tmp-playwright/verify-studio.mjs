import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";

const edge = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const out = path.resolve("shots");
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath: edge, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));

await page.goto("http://localhost:3000/signin", { waitUntil: "networkidle" });
await page.getByPlaceholder("Enter Username").fill("client");
await page.getByPlaceholder("Enter Password").fill("Client#1234");
await page.getByRole("button", { name: "Sign In" }).click();
await page.waitForURL("**/works", { timeout: 20000 });
await page.getByRole("heading", { name: "My works" }).waitFor();
await page.screenshot({ path: path.join(out, "works.png") });

await page.keyboard.press("Control+k");
await page.getByPlaceholder("Find a page").waitFor();
await page.getByPlaceholder("Find a page").fill("traffic");
await page.screenshot({ path: path.join(out, "palette.png") });
await page.keyboard.press("Escape");

await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
await page.getByRole("heading", { name: "Website overview" }).waitFor();
await page.getByText("Sessions").waitFor();
await page.screenshot({ path: path.join(out, "dashboard.png") });

await page.getByPlaceholder("Filter this page").fill("bounce");
await page.getByRole("button", { name: "Table" }).waitFor();
await page.screenshot({ path: path.join(out, "filter.png") });

await page.goto("http://localhost:3000/market/get-started", { waitUntil: "networkidle" });
await page.getByRole("heading", { name: "Get started" }).waitFor();
await page.getByRole("button", { name: "Add row" }).click();
await page.screenshot({ path: path.join(out, "workspace.png") });

await page.setViewportSize({ width: 390, height: 844 });
await page.goto("http://localhost:3000/works", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Menu" }).click();
await page.getByRole("link", { name: "Site optimization" }).waitFor();
await page.screenshot({ path: path.join(out, "mobile.png") });

console.log(JSON.stringify({ url: page.url(), errors }, null, 2));
await browser.close();
