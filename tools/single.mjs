// Inline <work>/dist/ into one self-contained HTML file: styles, script, icon
// and fonts are all inside it, and it loads nothing from the network.
//   node tools/single.mjs <out.html> --work <work>
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { WORK as root } from "./paths.mjs";
const out = process.argv[2];
if (!out) { console.error("usage: single.mjs <out.html> [--work <folder>]"); process.exit(1); }
const read = (f) => readFileSync(join(root, "dist", f), "utf8");
let html = read("index.html");
const fonts = read("fonts.css").replace(/url\((fonts\/[\w.-]+\.woff2)\)/g, (m, f) => `url(data:font/woff2;base64,${readFileSync(join(root, "dist", f)).toString("base64")})`);
const js = read("app.js").replace(/<\/script/gi, "<\\/script");
const fav = read("favicon.svg");
const swap = (from, to) => { if (!html.includes(from)) { console.error(`single.mjs: the built page no longer contains ${from}; rebuild with build.mjs`); process.exit(1); } html = html.replace(from, () => to); };
swap('<link rel="stylesheet" href="fonts.css">', "<style>" + fonts + "</style>");
swap('<link rel="stylesheet" href="styles.css">', "<style>" + read("styles.css") + "</style>");
swap('<script src="app.js" defer></script>', "<script>" + js + "</script>");
swap('<link rel="icon" href="favicon.svg" type="image/svg+xml">', fav.trim() ? '<link rel="icon" href="data:image/svg+xml,' + encodeURIComponent(fav) + '">' : "");
swap('<meta name="robots" content="noindex, nofollow">', "");
const loads = html.match(/<(?:link|script|img)\b[^>]*\b(?:href|src)="(?!data:|#)[^"]*"/gi);
if (loads) { console.error("single.mjs: the page would still load other files:\n  " + loads.join("\n  ")); process.exit(1); }
writeFileSync(out, html);
console.log(out, Math.round(html.length / 1024) + " KB");
