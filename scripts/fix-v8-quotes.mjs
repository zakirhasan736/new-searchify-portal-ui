import fs from "fs";

const files = [
  "src/components/v8/screens/BacklinksScreen.js",
  "src/components/v8/screens/ChangelogScreen.js",
  "src/components/v8/screens/HomeScreen.js",
  "src/components/v8/screens/WinScreen.js",
  "src/components/v8/screens/ResultsScreen.js",
  "src/components/v8/screens/CommandScreen.js",
  "src/components/v8/screens/PortfolioScreen.js",
  "src/components/v8/screens/SettingsScreen.js",
  "src/components/v8/screens/PhoneScreen.js",
  "src/components/v8/screens/ReportScreen.js",
  "src/components/v8/screens/ScanScreen.js",
  "src/components/v8/screens/PathScreen.js",
  "src/components/v8/screens/ConnectScreen.js",
  "src/components/v8/screens/SetupScreen.js",
];

for (const f of files) {
  if (!fs.existsSync(f)) continue;
  let s = fs.readFileSync(f, "utf8");
  const before = s;
  // Fix HomeScreen placeholder broken quotes
  s = s.replace(
    /placeholder="Talk to Searchify — "([^"]*)" or "([^"]*)""/,
    'placeholder="Talk to Searchify — “$1” or “$2”"',
  );
  // Inside single-quoted JS strings, escape unescaped apostrophes: ... Calgary's ...
  // Only when the apostrophe is between letters inside a '...' string segment is hard;
  // instead convert MOVES/ROWS object literals that use '...' with apostrophes by
  // replacing common contractions when they appear inside single-quoted strings.
  s = s.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (full, inner) => {
    if (!inner.includes("'") && !/[A-Za-z]'[A-Za-z]/.test(inner)) return full;
    // Has an apostrophe used as English contraction — switch to double quotes + escape
    const escaped = inner.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
    return `"${escaped}"`;
  });
  if (s !== before) {
    fs.writeFileSync(f, s);
    console.log("fixed", f);
  } else {
    console.log("ok", f);
  }
}
