import { readFileSync, existsSync } from "fs";
import { join } from "path";

const root = process.cwd();
const navSrc = readFileSync(join(root, "src/lib/navCatalog.js"), "utf8");
const kitSrc = readFileSync(join(root, "src/lib/pageFeatures.js"), "utf8");
const guideSrc = readFileSync(join(root, "src/lib/toolGuides.js"), "utf8");

const paths = [...navSrc.matchAll(/path:\s*"([^"]+)"/g)].map((m) => m[1]);
const kinds = [...navSrc.matchAll(/kind:\s*"([^"]+)"/g)].map((m) => m[1]);
const uniquePaths = [...new Set(paths)];
const uniqueKinds = [...new Set(kinds)];

function routeExists(p) {
  const clean = p.replace(/^\//, "");
  return ["page.js", "page.jsx", "page.tsx"].some((name) =>
    existsSync(join(root, "src/app", clean, name)),
  );
}

const missingRoutes = uniquePaths.filter((p) => !routeExists(p));
const kitKeys = new Set([
  ...[...kitSrc.matchAll(/"([a-z0-9-]+)":\s*\{/g)].map((m) => m[1]),
  ...[...kitSrc.matchAll(/^\s*([a-z0-9-]+):\s*\{/gm)].map((m) => m[1]),
]);
const missingKits = uniqueKinds.filter((k) => !kitKeys.has(k));
const guideKeys = new Set([
  ...[...guideSrc.matchAll(/"([a-z0-9-]+)":\s*\{/g)].map((m) => m[1]),
  ...[...guideSrc.matchAll(/^\s*([a-z0-9-]+):\s*\{/gm)].map((m) => m[1]),
]);
const missingGuides = uniqueKinds.filter((k) => !guideKeys.has(k));
const dupPaths = paths.filter((p, i) => paths.indexOf(p) !== i);

console.log(
  JSON.stringify(
    {
      pathCount: uniquePaths.length,
      kindCount: uniqueKinds.length,
      missingRoutes,
      missingKits,
      missingGuides,
      dupPaths,
      kinds: uniqueKinds,
    },
    null,
    2,
  ),
);
