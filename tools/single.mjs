// Inline dist/ into one self-contained HTML file (no other files needed).
//   node tools/single.mjs <out.html>
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { WORK as root } from "./paths.mjs";
const out = process.argv[2];
let html = readFileSync(join(root, "dist/index.html"), "utf8");
const css = readFileSync(join(root, "dist/styles.css"), "utf8");
const js = readFileSync(join(root, "dist/app.js"), "utf8").replace(/<\/script/gi, "<\\/script");
const fav = readFileSync(join(root, "dist/favicon.svg"), "utf8");
html = html.replace('<link rel="stylesheet" href="styles.css">', () => "<style>" + css + "</style>")
  .replace('<script src="app.js" defer></script>', () => "<script>" + js + "</script>")
  .replace('<link rel="icon" href="favicon.svg" type="image/svg+xml">', () => fav.trim() ? '<link rel="icon" href="data:image/svg+xml,' + encodeURIComponent(fav) + '">' : "")
  .replace('<meta name="robots" content="noindex, nofollow">', "");
writeFileSync(out, html);
console.log(out, Math.round(html.length / 1024) + " KB");
