import fs from "fs";
import path from "path";

const root = "c:/Users/zakir/Desktop/searchify-new-ui-portal";

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/^page\.(js|jsx|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

function routeFromFile(f) {
  let r = f.replace(/\\/g, "/").split("/src/app")[1];
  r = r.replace(/\/page\.(js|jsx|tsx)$/, "");
  r = r.replace(/\/\([^)]+\)/g, "");
  return r || "/";
}

const nav = fs.readFileSync(path.join(root, "src/lib/navCatalog.js"), "utf8");
const paths = [...nav.matchAll(/path:\s*"([^"]+)"/g)].map((m) => m[1]);
const kinds = [...nav.matchAll(/kind:\s*"([^"]+)"/g)].map((m) => m[1]);
const uniquePaths = [...new Set(paths)];
const routes = new Set(walk(path.join(root, "src/app")).map(routeFromFile));
const missingRoutes = uniquePaths.filter((p) => !routes.has(p));

const kitsSrc = fs.readFileSync(path.join(root, "src/lib/pageFeatures.js"), "utf8");
const kitKinds = new Set([...kitsSrc.matchAll(/^\s+"([^"]+)":\s*\{/gm)].map((m) => m[1]));
const uniqueKinds = [...new Set(kinds)];
const missingKits = uniqueKinds.filter((k) => !kitKinds.has(k) && k !== "seo-dashboard");

const catalog = fs.readFileSync("c:/Users/zakir/Desktop/searchify-portal-new-backend/app/catalog_data.py", "utf8");
const seedKinds = new Set([...catalog.matchAll(/\(\s*"([a-z0-9-]+)"\s*,/g)].map((m) => m[1]));
const missingSeeds = uniqueKinds.filter((k) => !seedKinds.has(k) && k !== "seo-dashboard");

// sample page contents for ToolPage usage
const thin = [];
for (const p of uniquePaths) {
  if (!routes.has(p)) continue;
  const file = path.join(root, "src/app", p === "/" ? "page.js" : `${p.slice(1)}/page.js`);
  if (!fs.existsSync(file)) continue;
  const src = fs.readFileSync(file, "utf8");
  if (!src.includes("ToolPage") && !src.includes("SeoDashboard") && !src.includes("HomeOverview") && !src.includes("ArticleStudio") && !src.includes("ProductPages") && !src.includes("AccountPages") && !src.includes("Workspace")) {
    thin.push({ path: p, hint: src.slice(0, 120).replace(/\s+/g, " ") });
  }
}

console.log(
  JSON.stringify(
    {
      navPaths: uniquePaths.length,
      missingRoutes,
      missingKits,
      missingSeeds,
      nonToolPages: thin,
      kinds: uniqueKinds,
    },
    null,
    2,
  ),
);
