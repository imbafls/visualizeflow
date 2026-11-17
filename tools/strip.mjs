// Turn a hand-laid app into the "what only" input autolayout reads.
//
//   node tools/al/strip.mjs <hand.json | live-index.html#appId> <out.json> [newId] [code] [category]
//
// Drops every coordinate: node x/y/w/h, region x/y/w/h, link pts/lx/ly/anchor,
// caption x/y, arch.view and the top-level view. Containers and groups are kept
// as semantics: their member node ids are read off the hand layout (nodes whose
// box sits inside the region) and written as `members`.

import { readFileSync, writeFileSync } from "node:fs";

const [src, out, newId, code, category] = process.argv.slice(2);
let app;
if (src.includes("#")) {
  const [file, id] = src.split("#");
  const html = readFileSync(file, "utf8");
  const m = html.match(/<script[^>]*id="architecture-data"[^>]*>([\s\S]*?)<\/script>/);
  app = JSON.parse(m[1]).apps.find((a) => a.id === id);
} else app = JSON.parse(readFileSync(src, "utf8"));
app = structuredClone(app);

const within = (n, r) => n.x >= r.x - 1 && n.y >= r.y - 1 && n.x + n.w <= r.x + r.w + 1 && n.y + n.h <= r.y + r.h + 1;
const regions = (app.arch.regions || []).filter((r) => r.kind !== "place").map((r) => {
  const o = { id: r.id, kind: r.kind, label: r.label, members: app.nodes.filter((n) => within(n, r)).map((n) => n.id) };
  if (r.sub) o.sub = r.sub;
  return o;
});
for (const n of app.nodes) { delete n.x; delete n.y; delete n.w; delete n.h; }
app.arch = {
  regions,
  links: app.arch.links.map(({ pts, lx, ly, anchor, ...rest }) => rest),
  features: app.arch.features,
  captions: (app.arch.captions || []).map((c) => ({ lines: c.lines })),
};
delete app.view;
if (newId) app.id = newId;
if (code) app.code = code;
if (category) app.category = category;
if (app.order == null) app.order = 99;
if (!app.checked) app.checked = "16 Nov 2026";
writeFileSync(out, JSON.stringify(app, null, 2));
console.log(out, `${app.nodes.length} nodes, ${app.arch.links.length} links, ${regions.length} containers/groups`);
