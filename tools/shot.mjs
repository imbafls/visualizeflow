// Screenshot one entry the way the page draws it, to check a map by eye.
//
//   node tools/shot.mjs <id> [map|overview|progress] [out.png] [width] [height]
//
// Builds a one-entry preview in tools/.preview/<id>/ (no validation, so it
// works while other apps are being edited) and screenshots it with headless
// Chromium (playwright-core). Page errors are printed and fail the run. Default: the map view at 1600x1000, saved as
// tools/.preview/<id>/<view>.png. Prints the PNG path. Read the PNG to look.

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import { WORK, META, SRC } from "./paths.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const [id, view = "map", outArg, wArg, hArg] = process.argv.slice(2);
// "home" as the id shoots the home page with every map in the work folder.
if (!id) { console.error("usage: shot.mjs <id> [map|overview|progress] [out.png] [width] [height]"); process.exit(1); }

const meta = JSON.parse(readFileSync(META, "utf8"));
const HOME = id === "home", ALL = HOME || !!process.env.VF_ALL;
const appFile = join(WORK, "data/apps", id + ".json"), progFile = join(WORK, "data/in-progress", id + ".json");
const isApp = existsSync(appFile);
if (!HOME && !isApp && !existsSync(progFile)) { console.error(`no data/apps/${id}.json or data/in-progress/${id}.json`); process.exit(1); }
const readDir = (d) => existsSync(join(WORK, d)) ? readdirSync(join(WORK, d)).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(join(WORK, d, f), "utf8"))) : [];
const entry = HOME ? null : JSON.parse(readFileSync(isApp ? appFile : progFile, "utf8"));
const data = {
  generated: "preview", title: meta.title, statuses: meta.statuses, categories: meta.categories,
  apps: ALL ? readDir("data/apps") : isApp ? [entry] : [],
  inProgress: ALL ? readDir("data/in-progress") : isApp ? [] : [entry],
};
const dir = join(WORK, ".preview", id);
mkdirSync(dir, { recursive: true });
const html = readFileSync(join(SRC, "template.html"), "utf8")
  .replace("<<DATA>>", () => JSON.stringify(data).replace(/<\//g, "<\\/")).replace(/<<GENERATED>>/g, "preview");
writeFileSync(join(dir, "index.html"), html);
for (const f of ["app.js", "styles.css", "favicon.svg"]) copyFileSync(join(SRC, f), join(dir, f));

const out = resolve(outArg || join(dir, `${isApp ? view : "progress"}.png`));
const W = +(wArg || 1600), H = +(hArg || 1000);
const url = pathToFileURL(join(dir, "index.html")).href + (isApp && view === "map" ? "?view=map" : "") + "#" + (HOME ? "home" : isApp ? id : "in-progress");
let browser;
try { browser = await chromium.launch(); }
catch { browser = await chromium.launch({ channel: "chrome" }); }
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: +(process.env.VF_DSF || 1) });
const problems = [];
page.on("pageerror", (e) => problems.push("page error: " + e.message));
page.on("console", (m) => { if (m.type() === "error" && !/fonts.g/.test(m.text())) problems.push("console: " + m.text()); });
await page.goto(url);
await page.waitForTimeout(1500);
// VF_STAGE=1 hides the page header so the map and its panel fill the frame (for hero images).
if (process.env.VF_STAGE) {
  await page.addStyleTag({ content: ".top,.apphead,.agents,footer{display:none!important} main{padding-top:0!important;margin:0!important} .wrap{padding-top:12px!important} #stage{height:calc(100vh - 24px)!important} .tools,.maphint{display:none!important} .wrap{max-width:none!important}" });
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  await page.waitForTimeout(600);
}
// VF_ACT="node:<id>" | "link:<id>" | "tour:<id>:<step>" opens that panel before the shot.
const act = process.env.VF_ACT;
if (act) {
  const [k, a, b] = act.split(":");
  await page.evaluate(([k, a, b]) => {
    const v = window.visualizeflow;
    if (k === "node") v.select(a);
    else if (k === "link") v.selectLink(a);
    else if (k === "tour") v.tour(a, +(b || 0));
  }, [k, a, b]);
  await page.waitForTimeout(900);
}
if (process.env.VF_FIT) { await page.evaluate(() => document.getElementById("zoom-fit").click()); await page.waitForTimeout(900); }
await page.screenshot({ path: out, fullPage: HOME || !isApp || view !== "map" });
await browser.close();
for (const p of problems) console.log(p);
console.log(out);
process.exit(problems.some((p) => p.startsWith("page error")) ? 1 : 0);
