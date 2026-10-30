// Fails if CSS/TSX uses physical left/right properties (RTL safety). Logical properties only.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const bad = [
  /(^|[\s;{])(margin|padding)-(left|right)\s*:/,
  /(^|[\s;{])(left|right)\s*:/,
  /text-align\s*:\s*(left|right)/,
  /(^|[\s;{])float\s*:\s*(left|right)/,
  /border-(left|right)(-\w+)?\s*:/,
  /border-(top|bottom)-(left|right)-radius/,
  /(^|[\s;{])(min-|max-)?(width|height)\s*:/, // prefer inline-size / block-size
];
const out = [];
function walk(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (n === "node_modules" || n === ".next" || n === "Resources") continue;
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(css|tsx?)$/.test(n) && p.includes("/src/")) {
      readFileSync(p, "utf8").split("\n").forEach((line, i) => {
        // skip the media-query and style-prop width in TS (aspectRatio etc.) — check CSS only for width/height
        for (const re of bad) {
          if (re.test(line) && (re !== bad[bad.length - 1] || p.endsWith(".css")) && !/@media|prefers/.test(line))
            out.push(`${p}:${i + 1}: ${line.trim()}`);
        }
      });
    }
  }
}
walk(process.cwd());
if (out.length) { console.error("Physical-direction CSS found (use logical properties):\n" + out.join("\n")); process.exit(1); }
console.log("logical-css: ok");
