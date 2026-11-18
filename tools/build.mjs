// Build the page into <work>/dist/.
//
//   node tools/build.mjs --work <work>
//
// Reads data/meta.json, data/apps/*.json and data/in-progress/*.json, puts
// them in one JSON block in renderer/template.html, and copies the page's assets.
// Apps are ordered by category (meta.categories order), then by "order".
// It runs tools/validate.mjs first and stops on any error.

import { readFileSync, readdirSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { WORK, META, SRC, ASSETS } from "./paths.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const v = spawnSync(process.execPath, [join(root, "tools/validate.mjs"), "--work", WORK, ...process.argv.slice(2)], { encoding: "utf8" });
process.stdout.write(v.stdout.split("\n").filter((l) => !l.startsWith("  warn")).join("\n"));
if (v.status !== 0) { console.error("build stopped: fix the errors above"); process.exit(1); }

const meta = JSON.parse(readFileSync(META, "utf8"));
const read = (dir) => existsSync(join(WORK, dir))
  ? readdirSync(join(WORK, dir)).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(join(WORK, dir, f), "utf8")))
  : [];
const catIndex = new Map(meta.categories.map((c, i) => [c.id, i]));
const byCat = (a, b) => (catIndex.get(a.category) - catIndex.get(b.category)) || ((a.order ?? 99) - (b.order ?? 99)) || a.name.localeCompare(b.name);
const apps = read("data/apps").sort(byCat);
const inProgress = read("data/in-progress").sort(byCat);

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const now = new Date();
const generated = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
const data = { generated, title: meta.title, statuses: meta.statuses, categories: meta.categories, apps, inProgress };

// "</" inside the JSON would end the script tag early.
const json = JSON.stringify(data).replace(/<\//g, "<\\/");
const html = readFileSync(join(SRC, "template.html"), "utf8").replace("<<DATA>>", () => json).replace(/<<GENERATED>>/g, generated);
mkdirSync(join(WORK, "dist"), { recursive: true });
writeFileSync(join(WORK, "dist/index.html"), html);
mkdirSync(join(WORK, "dist/fonts"), { recursive: true });
for (const f of ASSETS) copyFileSync(join(SRC, f), join(WORK, "dist", f));
console.log(`built ${join(WORK, "dist")}: ${apps.length} apps, ${inProgress.length} in progress, ${Math.round(html.length / 1024)} KB, dated ${generated}`);
