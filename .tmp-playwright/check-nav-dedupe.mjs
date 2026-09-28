import fs from "fs";
import path from "path";

const root = "c:/Users/zakir/Desktop/searchify-new-ui-portal";
const src = fs.readFileSync(path.join(root, "src/lib/navCatalog.js"), "utf8");
const navBlock = src.slice(src.indexOf("export const NAV"), src.indexOf("export function flatNavItems"));
const paths = [...navBlock.matchAll(/path:\s*"([^"]+)"/g)].map((m) => m[1]);
const counts = {};
paths.forEach((p) => {
  counts[p] = (counts[p] || 0) + 1;
});
const dups = Object.entries(counts).filter(([, n]) => n > 1);

const kits = fs.readFileSync(path.join(root, "src/lib/pageFeatures.js"), "utf8");
const kinds = [...kits.matchAll(/^\s+"([^"]+)":\s*\{/gm)].map((m) => m[1]);
const views = [...kits.matchAll(/views:\s*\[([^\]]+)\]/g)].map((m) => m[1]);
const viewCounts = {};
views.forEach((v) => {
  viewCounts[v] = (viewCounts[v] || 0) + 1;
});
const sameViews = Object.entries(viewCounts).filter(([, n]) => n > 1);

console.log(JSON.stringify({ navPaths: paths.length, unique: Object.keys(counts).length, dups, kitCount: kinds.length, sharedViewSignatures: sameViews.length }, null, 2));
