import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const catalogPath = path.resolve("src/lib/featureCatalog.js");
const source = fs.readFileSync(catalogPath, "utf8");
const json = source.replace("export const FEATURES = ", "").replace(/;\s*$/, "");
const features = Function(`"use strict"; return (${json});`)();
const app = path.resolve("src/app");

for (const feature of features) {
  const dir = path.join(app, feature.path.replace(/^\//, ""));
  fs.mkdirSync(dir, { recursive: true });
  const file = `import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: ${JSON.stringify(feature.title)},
  description: ${JSON.stringify(feature.description)},
  path: ${JSON.stringify(feature.path)},
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind=${JSON.stringify(feature.kind)}
      title=${JSON.stringify(feature.title)}
      description=${JSON.stringify(feature.description)}
    />
  );
}
`;
  fs.writeFileSync(path.join(dir, "page.js"), file);
}

console.log("pages", features.length);
