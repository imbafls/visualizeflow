// Check map data before it is built or deployed.
//
//   node tools/validate.mjs            every app and in-progress entry
//   node tools/validate.mjs myapp --work .visualizeflow --repo .   one map, with its evidence checked
//
// Errors fail the run (exit 1). Warnings are printed and do not fail it.
// It checks the schema the page reads (src/app.js) and the drawing itself:
// links that are not straight runs, ends that miss their part, parts that
// overlap, labels on top of parts, and things outside the drawing.

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { WORK, META, SRC, takeArg } from "./paths.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const meta = JSON.parse(readFileSync(META, "utf8"));
const appJs = readFileSync(join(SRC, "app.js"), "utf8");
const BRANDS = new Set([...appJs.slice(appJs.indexOf("var BR = {"), appJs.indexOf("var OWN")).matchAll(/^\s{2}([a-z0-9]+):\{/gm)].map((m) => m[1]));
const STATUSES = new Set(Object.keys(meta.statuses));
const CATS = new Set(meta.categories.map((c) => c.id));
const KINDS = new Set(["component", "core", "store", "external"]);
const ZONETAGS = new Set(["device", "service", "third party", "release", "network", "content"]);

const argv = process.argv.slice(2);
const ri = argv.indexOf("--repo");
const REPO = ri >= 0 ? argv.splice(ri, 2)[1] : process.env.VF_REPO;
const only = argv[0];
const lineCache = new Map();
function fileLines(f) {
  if (lineCache.has(f)) return lineCache.get(f);
  const p = join(REPO, f);
  const n = existsSync(p) && !statSync(p).isDirectory() ? readFileSync(p, "utf8").split(/\r?\n/).length : -1;
  lineCache.set(f, n); return n;
}
const COV = { claims: 0, cited: 0, unverified: 0, items: 0 };
// Evidence: [{file, lines:[a,b], note}] on parts, links and walkthrough steps (step[2]).
function checkEvidence(at, ev, strong, E, W, unv) {
  COV.claims++; if (unv) COV.unverified++;
  if (ev === undefined || (Array.isArray(ev) && !ev.length)) { (strong ? E : W).push(`${at}: no evidence (cite the file and lines it was inferred from)`); return; }
  if (!Array.isArray(ev)) { E.push(`${at}: evidence must be [{file, lines, note}]`); return; }
  COV.cited++;
  for (const x of ev) {
    COV.items++;
    if (!isStr(x.file)) { E.push(`${at}: evidence item without "file"`); continue; }
    if (x.file.startsWith("/") || x.file.includes("\\") || x.file.includes("..")) E.push(`${at}: evidence file "${x.file}" must be relative to the repo root, with forward slashes`);
    if (x.lines !== undefined && !(Array.isArray(x.lines) && x.lines.length === 2 && x.lines.every(Number.isInteger) && x.lines[0] >= 1 && x.lines[1] >= x.lines[0])) E.push(`${at}: evidence ${x.file} lines must be [first, last] (1-based)`);
    if (!REPO) continue;
    const n = fileLines(x.file);
    if (n < 0) E.push(`${at}: evidence file ${x.file} does not exist in the repo`);
    else if (Array.isArray(x.lines) && x.lines[1] > n) E.push(`${at}: evidence ${x.file} lines ${x.lines} run past the end (${n} lines)`);
  }
}
let errors = 0, warnings = 0;

function report(id, list, level) {
  for (const m of list) console.log(`  ${level === "error" ? "ERROR" : "warn "} ${id}: ${m}`);
}

const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const inside = (p, r, pad = 0) => p[0] > r.x + pad && p[0] < r.x + r.w - pad && p[1] > r.y + pad && p[1] < r.y + r.h - pad;
const overlap = (a, b, gap = 0) => a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap;
const onBorder = (p, n, tol = 3) => {
  const inX = p[0] >= n.x - tol && p[0] <= n.x + n.w + tol, inY = p[1] >= n.y - tol && p[1] <= n.y + n.h + tol;
  const nearV = Math.abs(p[0] - n.x) <= tol || Math.abs(p[0] - (n.x + n.w)) <= tol;
  const nearH = Math.abs(p[1] - n.y) <= tol || Math.abs(p[1] - (n.y + n.h)) <= tol;
  return (nearV && inY) || (nearH && inX);
};
// Does the segment a-b pass through the inside of rect r (shrunk by pad)?
function segHits(a, b, r, pad = 4) {
  const x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]), y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1]);
  return x1 > r.x + pad && x0 < r.x + r.w - pad && y1 > r.y + pad && y0 < r.y + r.h - pad;
}

function checkApp(a, file) {
  const E = [], W = [];
  for (const k of ["id", "name", "code", "summary", "caveat", "category", "checked"]) if (!isStr(a[k])) E.push(`missing or empty "${k}"`);
  if (a.id && file && a.id + ".json" !== file) E.push(`id "${a.id}" does not match file ${file}`);
  if (a.category && !CATS.has(a.category)) E.push(`category "${a.category}" is not one of ${[...CATS].join(", ")}`);
  if (a.stage !== undefined) {
    if (!["building", "stalled", "parked"].includes(a.stage)) E.push(`stage must be building, stalled or parked (or leave it out for a working app)`);
    for (const k of ["works", "left"]) if (!Array.isArray(a[k]) || !a[k].every(isStr)) E.push(`an in-progress app needs "${k}", a list of sentences`);
  }
  if (a.source !== undefined) {
    if (!isStr(a.source.repo) || !/^[\w.-]+\/[\w.-]+$/.test(a.source.repo)) E.push(`source.repo must be "owner/name"`);
    if (!isStr(a.source.commit) || !/^[0-9a-f]{40}$/.test(a.source.commit)) E.push(`source.commit must be the full 40-character commit hash`);
    if (!REPO) W.push(`no --repo given: cited files and line ranges were not checked`);
  }
  if (!isNum(a.order)) E.push(`"order" must be a number (position inside its category)`);
  if (!Array.isArray(a.facts) || !a.facts.every((f) => Array.isArray(f) && f.length === 2 && isStr(f[0]) && isStr(f[1]))) E.push(`"facts" must be [[label, value], ...]`);
  if (!Array.isArray(a.zones) || !a.zones.length) E.push(`"zones" must be a non-empty array`);
  else a.zones.forEach((z, i) => { if (!isStr(z.label)) E.push(`zone ${i} has no label`); if (!ZONETAGS.has(z.tag)) W.push(`zone ${i} tag "${z.tag}" is not one of ${[...ZONETAGS].join(", ")}`); });
  if (!Array.isArray(a.nodes) || !a.nodes.length) { E.push(`"nodes" must be a non-empty array`); return { E, W }; }

  const ids = new Map();
  a.nodes.forEach((n, i) => {
    const at = `node ${n.id ?? i}`;
    if (!isStr(n.id)) E.push(`${at}: no id`);
    else if (ids.has(n.id)) E.push(`${at}: duplicate id`);
    else ids.set(n.id, n);
    for (const k of ["label", "what", "state", "checked"]) if (!isStr(n[k])) E.push(`${at}: missing "${k}"`);
    for (const k of ["x", "y", "w", "h"]) if (!isNum(n[k])) E.push(`${at}: "${k}" must be a number`);
    if (!Number.isInteger(n.zone) || n.zone < 0 || n.zone >= (a.zones?.length ?? 0)) E.push(`${at}: zone ${n.zone} is not a zone index`);
    if (!STATUSES.has(n.status)) E.push(`${at}: status "${n.status}" is not one of ${[...STATUSES].join(", ")}`);
    if (n.kind && !KINDS.has(n.kind)) E.push(`${at}: kind "${n.kind}" is not one of ${[...KINDS].join(", ")}`);
    if (!BRANDS.has(n.brand)) E.push(`${at}: brand "${n.brand}" has no logo in src/app.js (use one of: ${[...BRANDS].join(" ")})`);
    if (n.chips && !(Array.isArray(n.chips) && n.chips.every((c) => Array.isArray(c) && c.length === 2))) E.push(`${at}: chips must be [[name, note], ...]`);
    if (n.chips && n.chips.length && n.h < 60 + n.chips.length * 30) W.push(`${at}: ${n.chips.length} chips may not fit in h=${n.h}`);
    if (isStr(n.label) && n.label.length > 30) W.push(`${at}: label is ${n.label.length} characters; it will be squeezed`);
    if (a.source) checkEvidence(at, n.evidence, ["live", "built"].includes(n.status) && !n.unverified, E, W, n.unverified);
  });

  if (!Array.isArray(a.edges)) E.push(`"edges" must be an array`);
  else a.edges.forEach((e, i) => {
    if (!ids.has(e.from)) E.push(`edge ${i}: from "${e.from}" is not a node`);
    if (!ids.has(e.to)) E.push(`edge ${i}: to "${e.to}" is not a node`);
    if (typeof e.pending !== "boolean") W.push(`edge ${i}: "pending" should be true or false`);
  });
  for (const b of a.blockers ?? []) if (!ids.has(b)) E.push(`blocker "${b}" is not a node`);

  const ar = a.arch;
  if (!ar) { E.push(`"arch" is missing (every app draws a hand-laid map)`); return { E, W }; }
  const [VW, VH] = ar.view ?? [];
  if (!isNum(VW) || !isNum(VH)) { E.push(`arch.view must be [width, height]`); return { E, W }; }
  if (VW < 600 || VW > 2400 || VH < 400 || VH > 1800) W.push(`arch.view ${VW}x${VH} is unusual (others are about 1200-1500 x 700-1000)`);
  const view = { x: 0, y: 0, w: VW, h: VH };
  const places = (ar.regions ?? []).filter((r) => r.kind === "place");
  if (!places.length) E.push(`arch.regions has no "place" region`);
  (ar.regions ?? []).forEach((r) => {
    if (!["place", "container", "group"].includes(r.kind)) E.push(`region ${r.id}: kind must be "place", "container" or "group"`);
    if (![r.x, r.y, r.w, r.h].every(isNum)) E.push(`region ${r.id}: needs x, y, w, h`);
    else if (r.x < 0 || r.y < 0 || r.x + r.w > VW || r.y + r.h > VH) E.push(`region ${r.id} runs outside the ${VW}x${VH} view`);
  });
  for (let i = 0; i < places.length; i++) for (let j = i + 1; j < places.length; j++)
    if (overlap(places[i], places[j], -1)) W.push(`places "${places[i].label}" and "${places[j].label}" overlap`);

  for (const n of ids.values()) {
    if (![n.x, n.y, n.w, n.h].every(isNum)) continue;
    if (n.x < 0 || n.y < 0 || n.x + n.w > VW || n.y + n.h > VH) E.push(`node ${n.id} is outside the ${VW}x${VH} view`);
    const home = places.find((p) => n.x >= p.x && n.y >= p.y && n.x + n.w <= p.x + p.w && n.y + n.h <= p.y + p.h);
    if (!home) W.push(`node ${n.id} does not sit wholly inside any place region`);
  }
  const list = [...ids.values()].filter((n) => [n.x, n.y, n.w, n.h].every(isNum));
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++)
    if (overlap(list[i], list[j], 6)) E.push(`nodes ${list[i].id} and ${list[j].id} overlap or sit closer than 6px`);

  const groups = new Map((ar.regions ?? []).filter((r) => r.kind === "group" && isStr(r.id)).map((r) => [r.id, r]));
  const lids = new Set();
  const pairs = new Set();
  (ar.links ?? []).forEach((l) => {
    const at = `link ${l.id}`;
    if (!isStr(l.id)) E.push(`a link has no id`);
    else if (lids.has(l.id)) E.push(`${at}: duplicate id`);
    lids.add(l.id);
    const A = ids.get(l.from) ?? groups.get(l.from), B = ids.get(l.to) ?? groups.get(l.to);
    if (!A) E.push(`${at}: from "${l.from}" is not a node or group region`);
    if (!B) E.push(`${at}: to "${l.to}" is not a node or group region`);
    pairs.add(l.from + ">" + l.to);
    if (!Array.isArray(l.pts) || l.pts.length < 2 || !l.pts.every((p) => Array.isArray(p) && isNum(p[0]) && isNum(p[1]))) { E.push(`${at}: pts must be 2+ [x, y] points`); return; }
    for (let k = 0; k < l.pts.length - 1; k++) {
      const p = l.pts[k], q = l.pts[k + 1];
      if (p[0] !== q[0] && p[1] !== q[1]) E.push(`${at}: segment ${k} is diagonal (${p} -> ${q}); links run straight across or down`);
      if (p[0] === q[0] && p[1] === q[1]) W.push(`${at}: segment ${k} has zero length`);
    }
    for (const p of l.pts) if (!inside(p, view, -1)) E.push(`${at}: point ${p} is outside the view`);
    if (A && !onBorder(l.pts[0], A)) E.push(`${at}: first point ${l.pts[0]} is not on the edge of ${A.id} (x ${A.x}-${A.x + A.w}, y ${A.y}-${A.y + A.h})`);
    if (B && !onBorder(l.pts[l.pts.length - 1], B)) E.push(`${at}: last point ${l.pts[l.pts.length - 1]} is not on the edge of ${B.id} (x ${B.x}-${B.x + B.w}, y ${B.y}-${B.y + B.h})`);
    for (const n of list) {
      if (n === A || n === B) continue;
      if (groups.get(l.from) && overlap(n, groups.get(l.from), -1) || groups.get(l.to) && overlap(n, groups.get(l.to), -1)) continue;
      for (let k = 0; k < l.pts.length - 1; k++) if (segHits(l.pts[k], l.pts[k + 1], n)) { W.push(`${at}: segment ${k} runs through node ${n.id}`); break; }
    }
    if (isStr(l.label)) {
      if (!isNum(l.lx) || !isNum(l.ly)) E.push(`${at}: has a label but no lx, ly`);
      else {
        const w = l.label.length * 6.4 + 8, x0 = l.anchor === "start" ? l.lx : l.anchor === "end" ? l.lx - w : l.lx - w / 2;
        const box = { x: x0, y: l.ly - 11, w, h: 14 };
        if (box.x < 0 || box.x + box.w > VW || box.y < 0 || box.y + box.h > VH) W.push(`${at}: label "${l.label}" runs outside the view`);
        for (const n of list) if (overlap(box, n, -2)) { W.push(`${at}: label "${l.label}" sits on node ${n.id}`); break; }
      }
      if (l.label.length > 34) W.push(`${at}: label is ${l.label.length} characters; keep link labels short`);
    }
    if (l.anchor && !["start", "middle", "end"].includes(l.anchor)) E.push(`${at}: anchor must be start, middle or end`);
    if (a.source) checkEvidence(at, l.evidence, !l.pending && !l.unverified, E, W, l.unverified);
  });
  for (const e of a.edges ?? []) if (!pairs.has(e.from + ">" + e.to)) W.push(`edge ${e.from} -> ${e.to} has no drawn link in arch.links (the panel lists it, the map does not show it)`);
  const epairs = new Set((a.edges ?? []).map((e) => e.from + ">" + e.to));
  for (const l of ar.links ?? []) if (ids.has(l.from) && ids.has(l.to) && !epairs.has(l.from + ">" + l.to)) W.push(`link ${l.id} (${l.from} -> ${l.to}) has no matching entry in edges (the panel will not list it)`);

  for (const n of list) {
    const deg = (ar.links ?? []).filter((l) => l.from === n.id || l.to === n.id).length;
    if (!deg) W.push(`node ${n.id} has no links; is it really part of this app?`);
  }

  const fids = new Set();
  if (!Array.isArray(ar.features) || !ar.features.length) W.push(`no features (walkthroughs); each app should trace at least its main flow`);
  (ar.features ?? []).forEach((f) => {
    const at = `feature ${f.id}`;
    if (!isStr(f.id) || fids.has(f.id)) E.push(`${at}: missing or duplicate id`);
    fids.add(f.id);
    if (!isStr(f.name) || !isStr(f.line)) E.push(`${at}: needs name and line`);
    if (!STATUSES.has(f.status)) E.push(`${at}: status "${f.status}" is not a status`);
    if (!Array.isArray(f.steps) || !f.steps.length) E.push(`${at}: needs steps`);
    else f.steps.forEach((s, i) => { if (!ids.has(s[0])) E.push(`${at}: step ${i} names "${s[0]}", not a node`); if (!isStr(s[1])) E.push(`${at}: step ${i} has no text`); if (a.source) checkEvidence(`${at} step ${i}`, s[2], false, E, W, s[3] === "unverified"); });
    for (const id of f.links ?? []) if (!lids.has(id)) E.push(`${at}: link "${id}" is not in arch.links`);
  });
  (ar.captions ?? []).forEach((c, i) => {
    if (!isNum(c.x) || !isNum(c.y) || !Array.isArray(c.lines)) E.push(`caption ${i}: needs x, y, lines`);
    else {
      const box = { x: c.x, y: c.y - 12, w: Math.max(...c.lines.map((t) => t.length)) * 6.6, h: c.lines.length * 16 };
      if (box.x + box.w > VW || box.y + box.h > VH) W.push(`caption ${i} runs outside the view`);
      for (const n of list) if (overlap(box, n, -2)) { W.push(`caption ${i} sits on node ${n.id}`); break; }
    }
  });
  return { E, W };
}

function checkProgress(p, file) {
  const E = [], W = [];
  for (const k of ["id", "name", "summary", "category", "checked", "stage"]) if (!isStr(p[k])) E.push(`missing or empty "${k}"`);
  if (p.id && file && p.id + ".json" !== file) E.push(`id "${p.id}" does not match file ${file}`);
  if (p.category && !CATS.has(p.category)) E.push(`category "${p.category}" is not one of ${[...CATS].join(", ")}`);
  for (const k of ["works", "left"]) if (!Array.isArray(p[k]) || !p[k].every(isStr)) E.push(`"${k}" must be a list of sentences`);
  if (!Array.isArray(p.facts) || !p.facts.every((f) => Array.isArray(f) && f.length === 2 && isStr(f[0]) && isStr(f[1]))) E.push(`"facts" must be [[label, value], ...]`);
  if (p.stage && !["building", "stalled", "parked"].includes(p.stage)) E.push(`stage must be building, stalled or parked`);
  return { E, W };
}

const appsDir = join(WORK, "data/apps"), progDir = join(WORK, "data/in-progress");
const jobs = [
  ...readdirSync(appsDir).filter((f) => f.endsWith(".json")).map((f) => ["app", appsDir, f]),
  ...(existsSync(progDir) ? readdirSync(progDir).filter((f) => f.endsWith(".json")).map((f) => ["progress", progDir, f]) : []),
].filter(([, , f]) => !only || f === only + ".json");
if (only && !jobs.length) { console.log(`no ${appsDir}/${only}.json`); process.exit(1); }

const seen = new Map();
for (const [type, dir, f] of jobs) {
  let data;
  try { data = JSON.parse(readFileSync(join(dir, f), "utf8")); }
  catch (e) { report(f, [`not valid JSON: ${e.message}`], "error"); errors++; continue; }
  if (seen.has(data.id)) { report(f, [`id "${data.id}" is also used by ${seen.get(data.id)}`], "error"); errors++; }
  seen.set(data.id, f);
  const { E, W } = type === "app" ? checkApp(data, f) : checkProgress(data, f);
  report(data.id ?? f, E, "error"); report(data.id ?? f, W, "warn");
  errors += E.length; warnings += W.length;
}
if (!only) {
  const codes = new Map();
  for (const f of readdirSync(appsDir).filter((x) => x.endsWith(".json"))) {
    const a = JSON.parse(readFileSync(join(appsDir, f), "utf8"));
    if (codes.has(a.code)) { console.log(`  ERROR ${a.id}: code "${a.code}" is also used by ${codes.get(a.code)}`); errors++; }
    codes.set(a.code, a.id);
  }
}
if (COV.claims) console.log(`evidence: ${COV.cited}/${COV.claims} claims cite code (${Math.round(100 * COV.cited / COV.claims)}%), ${COV.items} citations, ${COV.unverified} marked unverified`);
console.log(`${jobs.length} checked: ${errors} error(s), ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);
