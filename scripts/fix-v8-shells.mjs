import fs from "fs";
import path from "path";

const dir = path.join("src", "components", "v8", "screens");
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".js"))) {
  const p = path.join(dir, f);
  let s = fs.readFileSync(p, "utf8");
  const before = s;
  s = s.replace(/flex:\s*['"]999 1 560px['"]/g, "flex: '1 1 auto'");
  s = s.replace(/minHeight:\s*['"]1[0-9]{3}px['"]/g, "minHeight: 'auto'");
  s = s.replace(/minHeight:\s*['"]960px['"]/g, "minHeight: 'auto'");
  s = s.replace(
    /minHeight:\s*['"][^'"]+['"],\s*background:\s*['"]#0A0B0D['"],\s*display:\s*['"]flex['"],\s*flexWrap:\s*['"]wrap['"],\s*alignItems:\s*['"]stretch['"]/g,
    "minHeight: 'auto', background: '#0A0B0D', display: 'block'",
  );
  if (s !== before) {
    fs.writeFileSync(p, s);
    console.log("updated", f);
  }
}
