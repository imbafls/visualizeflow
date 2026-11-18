// Lay out an app map automatically, so an author only writes WHAT is there.
//
//   node tools/autolayout.mjs <in.json> [out.json]
//
// Input: an app JSON with zones, nodes (no x/y/w/h), edges, and an `arch`
// holding links (id/from/to/label/main/pending, no pts), features, optional
// captions ({lines}) and optional containers/groups as
// {id, kind:"container"|"group", label, sub?, members:[node ids]}.
// Output: the same JSON with arch.view, one place region per zone, sized and
// positioned containers/groups, node x/y/w/h, orthogonal link pts and label
// lx/ly/anchor, captions placed in free space. Engine: elkjs (layered,
// orthogonal routing, zones as compound nodes, hierarchy handled as one graph).

import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ELK = createRequire(import.meta.url)("elkjs/lib/elk.bundled.js");
const elk = new ELK();

const [inPath, outPath = inPath] = process.argv.slice(2);
if (!inPath) { console.error("usage: autolayout.mjs <in.json> [out.json]"); process.exit(1); }
const app = JSON.parse(readFileSync(inPath, "utf8"));
const arch = app.arch;

// ---------- sizes from content ----------
const LABEL_CH = 7.4, SUB_CH = 6.5, EDGE_CH = 6.6;
function size(n) {
  if (n.kind === "core") {
    const chipW = Math.max(0, ...(n.chips || []).map((c) => (c[0].length + c[1].length) * 6.4 + 60));
    const w = clamp(snap(Math.max(n.label.length * 8.4 + 64, (n.sub || "").length * SUB_CH + 64, chipW)), 220, 280);
    return [w, 64 + (n.chips || []).length * 32 + 6];
  }
  const pad = n.kind === "store" ? 60 : 60;
  const w = clamp(snap(Math.max(n.label.length * LABEL_CH + pad, (n.sub || "").length * SUB_CH + pad)), 180, 260);
  return [w, n.sub ? 56 : 48];
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const snap = (v) => Math.ceil(v / 4) * 4;

// ---------- zone order: where things run, left to right ----------
const TAG_RANK = { device: 0, network: 1, repo: 2, release: 2, service: 3, content: 4, "third party": 5 };
const zoneOrder = app.zones.map((z, i) => i).sort((a, b) => (TAG_RANK[app.zones[a].tag] ?? 3) - (TAG_RANK[app.zones[b].tag] ?? 3) || a - b);
const partOf = new Map(zoneOrder.map((zi, k) => [zi, k]));

// ---------- build the ELK hierarchy ----------
const boxes = (arch.regions || []).filter((r) => r.kind === "container" || r.kind === "group");
// nest boxes: a box sits in the smallest other box whose members include all of its members
const parentBox = new Map();
for (const b of boxes) {
  const cands = boxes.filter((o) => o !== b && o.members.length > b.members.length && b.members.every((m) => o.members.includes(m)));
  cands.sort((p, q) => p.members.length - q.members.length);
  if (cands[0]) parentBox.set(b.id, cands[0].id);
}
const nodeBox = new Map(); // node id -> innermost box id
for (const b of [...boxes].sort((p, q) => q.members.length - p.members.length)) for (const m of b.members) nodeBox.set(m, b.id);
const zoneOfBox = (b) => { const z = new Set(b.members.map((m) => app.nodes.find((n) => n.id === m)?.zone)); return [...z]; };

const PAD = { place: "[top=44,left=16,bottom=16,right=16]", container: "[top=34,left=16,bottom=16,right=16]", group: "[top=42,left=14,bottom=12,right=14]" };
const flipped = new Map();
const rankOf = (id) => { const n = app.nodes.find((x) => x.id === id); if (n) return partOf.get(n.zone); const b = boxes.find((x) => x.id === id); return partOf.get(app.nodes.find((x) => x.id === b.members[0]).zone); };
function buildGraph(v) {
  const elkNodes = new Map();
  const mk = (id, extra = {}) => { const o = { id, children: [], edges: [], ...extra }; elkNodes.set(id, o); return o; };
  const root = mk("root", {
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": v.dir,
      "elk.hierarchyHandling": "INCLUDE_CHILDREN",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.partitioning.activate": String(v.part),
      "elk.spacing.nodeNode": String(v.nn),
      "elk.layered.spacing.nodeNodeBetweenLayers": String(v.nl),
      "elk.spacing.edgeNode": "16",
      "elk.spacing.edgeEdge": "12",
      "elk.layered.spacing.edgeNodeBetweenLayers": "16",
      "elk.layered.spacing.edgeEdgeBetweenLayers": "10",
      "elk.spacing.edgeLabel": "4",
      "elk.spacing.componentComponent": "20",
      "elk.edgeLabels.placement": "CENTER",
      "elk.layered.nodePlacement.strategy": v.place,
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
      "elk.json.edgeCoords": "ROOT",
      "elk.layered.compaction.postCompaction.strategy": v.compact || "NONE",
      "elk.layered.mergeEdges": String(!!v.merge),
      "elk.json.shapeCoords": "ROOT",
    },
  });
  const zoneIds = app.zones.map((z, i) => {
    const o = mk("zone" + i, { layoutOptions: { "elk.padding": PAD.place, "elk.partitioning.partition": String(partOf.get(i)) } });
    root.children.push(o);
    return o.id;
  });
  for (const b of boxes) mk(b.id, { layoutOptions: { "elk.padding": PAD[b.kind] } });
  for (const b of boxes) {
    const host = parentBox.get(b.id) ?? zoneIds[zoneOfBox(b)[0]];
    elkNodes.get(host).children.push(elkNodes.get(b.id));
  }
  // invisible header keepers: an edgeless box at each region's top-left so parts
  // and lines keep off the place / container / group label
  if (v.hdr) {
    app.zones.forEach((z, i) => elkNodes.get(zoneIds[i]).children.push(mk("hdr-zone" + i, { width: Math.round(z.label.length * 7.5 + 20), height: 2, children: undefined, edges: undefined })));
    for (const b of boxes) elkNodes.get(b.id).children.push(mk("hdr-" + b.id, { width: Math.round(b.label.length * 8.4 + (b.sub ? b.sub.length * 6.2 + 18 : 0) + 20), height: 2, children: undefined, edges: undefined }));
  }
  for (const n of app.nodes) {
    const [w, h] = size(n);
    const host = nodeBox.get(n.id) ?? zoneIds[n.zone];
    elkNodes.get(host).children.push(mk(n.id, { width: w, height: h, children: undefined, edges: undefined }));
  }
  for (const l of arch.links) {
    // lay every link out "downstream" in zone order (device -> ... -> third party);
    // the points are reversed back afterwards so arrows still point the right way
    const flip = v.flip && rankOf(l.from) > rankOf(l.to);
    flipped.set(l.id, flip);
    const e = { id: l.id, sources: [flip ? l.to : l.from], targets: [flip ? l.from : l.to] };
    if (l.label) e.labels = [{ id: l.id + "_lb", text: l.label, width: Math.round(l.label.length * EDGE_CH + 12), height: 17 }];
    root.edges.push(e);
  }
  return root;
}
for (const b of boxes) { const zs = zoneOfBox(b); if (!parentBox.has(b.id) && zs.length > 1) console.log(`note: box ${b.id} spans zones ${zs}; drawn in zone ${zs[0]}`); }

// Try a few variants and keep the one that reads largest when fitted to a ~1500x950 frame.
const variants = [];
for (const dir of ["DOWN", "RIGHT"]) for (const part of [true, false]) for (const place of ["NETWORK_SIMPLEX", "BRANDES_KOEPF"]) for (const compact of ["NONE", "EDGE_LENGTH"])
  for (const hdr of [false, true]) for (const flip of [false, true]) variants.push({ dir, part, place, compact, hdr, flip, nn: 24, nl: dir === "DOWN" ? 30 : 36 });
const only = process.env.VARIANT ? +process.env.VARIANT : null;
let best = null;
// how many link segments run across a place / container / group label
function headerHits(r) {
  const flatR = new Map(); (function w(o) { flatR.set(o.id, o); (o.children || []).forEach(w); })(r);
  const hb = [];
  app.zones.forEach((z, i) => { const o = flatR.get("zone" + i); hb.push({ x: o.x, y: o.y + 8, w: z.label.length * 7.5 + 24, h: 22 }); });
  for (const b of boxes) { const o = flatR.get(b.id); hb.push({ x: o.x + 8, y: o.y - 11, w: b.label.length * 8.4 + (b.sub ? b.sub.length * 6.2 + 18 : 0) + 24, h: 22 }); }
  let n = 0, bends = 0, len = 0;
  for (const e of r.edges) for (const sec of e.sections || []) {
    const pts = [sec.startPoint, ...(sec.bendPoints || []), sec.endPoint];
    bends += pts.length - 2;
    for (let k = 0; k < pts.length - 1; k++) {
      len += Math.abs(pts[k].x - pts[k + 1].x) + Math.abs(pts[k].y - pts[k + 1].y);
      const a = pts[k], b = pts[k + 1], x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
      for (const h of hb) if (x1 > h.x && x0 < h.x + h.w && y1 > h.y && y0 < h.y + h.h) n++;
    }
  }
  return { n, bends, len: Math.round(len) };
}
for (const [i, v] of variants.entries()) {
  if (only != null && i !== only) continue;
  const r = await elk.layout(buildGraph(v));
  r.flipped = new Map(flipped);
  const scale = Math.min(1500 / (r.width + 32), 950 / (r.height + 56));
  const hh = headerHits(r);
  // normalise link length by the drawing's diagonal so big and small apps compare
  const score = scale - 0.01 * hh.n - 0.002 * hh.bends - 0.02 * hh.len / Math.hypot(r.width, r.height);
  if (process.env.DEBUG) console.log(i, JSON.stringify(v), Math.round(r.width), Math.round(r.height), scale.toFixed(3), "hdrHits", hh.n, "bends", hh.bends, "len", hh.len, "score", score.toFixed(3));
  if (!best || score > best.score) best = { r, scale, score, v, i, hh };
}
const res = best.r;
console.log(`variant ${best.i}: ${best.v.dir}, partitions ${best.v.part ? "on" : "off"}, flip ${best.v.flip}, header keepers ${best.v.hdr}, ${best.v.place}, fit scale ${best.scale.toFixed(2)}, header crossings ${best.hh.n}, bends ${best.hh.bends}`);

// ---------- read back ----------
const OX = 16, OY = 40;
const flat = new Map();
(function walk(o) { flat.set(o.id, o); (o.children || []).forEach(walk); })(res);
const R = (v) => Math.round(v);
const rect = (o) => ({ x: R(o.x + OX), y: R(o.y + OY), w: R(o.width), h: R(o.height) });

for (const n of app.nodes) Object.assign(n, rect(flat.get(n.id)));
const regions = [];
app.zones.forEach((z, i) => regions.push({ id: "zone" + i, kind: "place", label: z.label, ...rect(flat.get("zone" + i)) }));
for (const b of boxes) { const { members, ...rest } = b; regions.push({ ...rest, ...rect(flat.get(b.id)) }); }

const edgesById = new Map();
(function walkE(o) { (o.edges || []).forEach((e) => edgesById.set(e.id, e)); (o.children || []).forEach(walkE); })(res);
const problems = [];
for (const l of arch.links) {
  const e = edgesById.get(l.id);
  const secs = e.sections || [];
  if (secs.length !== 1) problems.push(`link ${l.id}: ${secs.length} sections`);
  const s = secs[0];
  let pts = [[s.startPoint.x, s.startPoint.y], ...(s.bendPoints || []).map((p) => [p.x, p.y]), [s.endPoint.x, s.endPoint.y]].map(([x, y]) => [R(x + OX), R(y + OY)]);
  if (res.flipped.get(l.id)) pts.reverse();
  pts = tidy(pts);
  l.pts = pts;
  const lb = (e.labels || [])[0];
  if (lb && l.label) { l.lx = R(lb.x + OX + lb.width / 2); l.ly = R(lb.y + OY + 12); l.anchor = "middle"; }
}
// rounding can leave a 1px jog; straighten so every segment is axis aligned
function tidy(pts) {
  const out = [pts[0].slice()];
  for (let i = 1; i < pts.length; i++) {
    const p = out[out.length - 1], q = pts[i].slice();
    if (p[0] !== q[0] && p[1] !== q[1]) { if (Math.abs(p[0] - q[0]) <= 1) q[0] = p[0]; else if (Math.abs(p[1] - q[1]) <= 1) q[1] = p[1]; }
    if (q[0] === p[0] && q[1] === p[1]) continue;
    out.push(q);
  }
  // drop collinear middle points
  return out.filter((p, i, a) => i === 0 || i === a.length - 1 || !((a[i - 1][0] === p[0] && p[0] === a[i + 1][0]) || (a[i - 1][1] === p[1] && p[1] === a[i + 1][1])));
}

const VW = R(res.width + OX * 2), VH = R(res.height + OY + 16);
arch.view = [VW, VH];
app.view = arch.view;
arch.regions = regions;

// ---------- labels: pull each one onto its own line ----------
// ELK puts centre labels in a label row beside the edge; with several edges in
// a row that reads as a ruler of floating words. Move each label next to the
// longest clear segment of its own link when such a spot exists.
{
  const H = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const lbox = (lx, ly, an, text) => { const w = text.length * EDGE_CH + 12; return { x: an === "middle" ? lx - w / 2 : an === "end" ? lx - w + 6 : lx - 6, y: ly - 12, w, h: 17 }; };
  const nodeObs = app.nodes.map((n) => ({ x: n.x - 4, y: n.y - 12, w: n.w + 8, h: n.h + 16 }));
  const headObs = regions.map((r) => r.kind === "place" ? { x: r.x, y: r.y, w: r.label.length * 7.5 + 32, h: 34 } : { x: r.x + 8, y: r.y - 12, w: r.label.length * 8.4 + (r.sub ? r.sub.length * 6.2 + 18 : 0) + 28, h: 24 });
  const segsOf = (l) => l.pts.slice(1).map((q, i) => [l.pts[i], q]);
  const segBox = ([p, q]) => ({ x: Math.min(p[0], q[0]) - 3, y: Math.min(p[1], q[1]) - 3, w: Math.abs(p[0] - q[0]) + 6, h: Math.abs(p[1] - q[1]) + 6 });
  const distToPath = (b, l) => Math.min(...segsOf(l).map(([p, q]) => {
    const sx0 = Math.min(p[0], q[0]), sx1 = Math.max(p[0], q[0]), sy0 = Math.min(p[1], q[1]), sy1 = Math.max(p[1], q[1]);
    const dx = Math.max(0, b.x - sx1, sx0 - (b.x + b.w)), dy = Math.max(0, b.y - sy1, sy0 - (b.y + b.h));
    return Math.hypot(dx, dy);
  }));
  const placedL = [];
  const labelled = arch.links.filter((l) => l.label).sort((a, b) => b.label.length - a.label.length);
  let moved = 0;
  for (const l of labelled) {
    const other = arch.links.filter((o) => o !== l).flatMap(segsOf).map(segBox);
    const free = (b) => ![...nodeObs, ...headObs, ...other, ...placedL].some((o) => H(b, o)) && b.x >= 2 && b.y >= 2 && b.x + b.w <= VW - 2 && b.y + b.h <= VH - 2;
    const cur = lbox(l.lx, l.ly, l.anchor, l.label);
    if (free(cur) && distToPath(cur, l) <= 4) { placedL.push(cur); continue; }
    let best = null;
    for (const [p, q] of segsOf(l)) {
      const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
      for (const f of [0.5, 0.35, 0.65, 0.2, 0.8]) {
        const mx = p[0] + (q[0] - p[0]) * f, my = p[1] + (q[1] - p[1]) * f;
        const cands = p[1] === q[1]
          ? [[mx, my - 6, "middle"], [mx, my + 16, "middle"]]
          : [[mx + 8, my + 4, "start"], [mx - 8, my + 4, "end"]];
        for (const [x, y, an] of cands) {
          const b = lbox(x, y, an, l.label);
          if (p[1] === q[1] && b.w > len - 8) continue;
          if (!free(b)) continue;
          const score = len - Math.abs(f - 0.5) * 120 + (p[1] === q[1] ? 60 : 0);
          if (!best || score > best.score) best = { score, x, y, an, b };
        }
      }
    }
    if (best) { l.lx = R(best.x); l.ly = R(best.y); l.anchor = best.an; placedL.push(best.b); moved++; }
    else placedL.push(cur);
  }
  console.log(`labels moved onto their line: ${moved}/${labelled.length}`);
}

// ---------- captions: first free spot inside a place ----------
const taken = [
  ...app.nodes.map((n) => ({ x: n.x - 8, y: n.y - 8, w: n.w + 16, h: n.h + 16 })),
  ...arch.links.filter((l) => l.label).map((l) => { const w = l.label.length * EDGE_CH + 12; return { x: l.lx - w / 2 - 4, y: l.ly - 16, w: w + 8, h: 25 }; }),
  ...regions.filter((r) => r.kind !== "place").map((r) => ({ x: r.x + 8, y: r.y - 14, w: r.label.length * 8.4 + (r.sub ? r.sub.length * 6.2 + 18 : 0) + 40, h: 30 })),
  ...regions.filter((r) => r.kind === "place").map((r) => ({ x: r.x, y: r.y, w: r.label.length * 7.5 + 40, h: 34 })),
];
const segBoxes = arch.links.flatMap((l) => l.pts.slice(1).map((q, i) => { const p = l.pts[i]; return { x: Math.min(p[0], q[0]) - 6, y: Math.min(p[1], q[1]) - 6, w: Math.abs(p[0] - q[0]) + 12, h: Math.abs(p[1] - q[1]) + 12 }; }));
const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const placed = [];
for (const c of arch.captions || []) {
  const w = Math.max(...c.lines.map((t) => t.length)) * 6.8 + 8, h = c.lines.length * 20 + 4;
  let spot = null;
  for (const p of regions.filter((r) => r.kind === "place")) {
    for (let y = p.y + 40; y + h <= p.y + p.h - 8 && !spot; y += 8)
      for (let x = p.x + 14; x + w <= p.x + p.w - 8 && !spot; x += 8) {
        const b = { x, y, w, h };
        if (![...taken, ...segBoxes, ...placed].some((t) => hit(b, t))) spot = b;
      }
    if (spot) break;
  }
  if (spot) { c.x = R(spot.x + 2); c.y = R(spot.y + 16); placed.push(spot); }
  else problems.push(`caption "${c.lines[0]}" found no free space; dropped`);
}
arch.captions = (arch.captions || []).filter((c) => c.x != null);

writeFileSync(outPath, JSON.stringify(app, null, 2));
for (const p of problems) console.log("note:", p);
console.log(`${outPath}: view ${VW}x${VH}, ${app.nodes.length} nodes, ${arch.links.length} links`);
