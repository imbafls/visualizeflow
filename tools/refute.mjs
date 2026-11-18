// The refute pass, with a record. A checker that did not write the map tries
// to disprove each claim against its cited code; this tool hands out the
// claims and only marks the map as checked once every claim has a verdict.
//
//   node tools/refute.mjs claims <id> --work <work>
//       writes <work>/.refute/<id>/claims-parts.json, -links.json, -steps.json
//       (one file per checker) and prints their paths.
//   node tools/refute.mjs claims <id> --work <work> --pending v1.json v2.json ...
//       writes claims-recheck.json: only the claims those verdict files do not
//       settle yet (not checked, edited since, or judged wrong).
//   node tools/refute.mjs apply <id> v1.json v2.json ... --work <work> [--self]
//       when every claim in the map has a verdict of "confirmed" or
//       "unverified" for its current wording: marks unverified claims, sets
//       source.refuted and source.refute, and saves the verdicts in
//       <work>/data/refute/<id>.json. Otherwise it changes nothing and lists
//       what is left. --self records that no independent checker was
//       available (the page then says so).
//
// A verdict file is what one checker writes:
//   {"checker": "parts checker", "verdicts": [
//     {"id": "part:im-db", "hash": "<copied from the claims file>",
//      "verdict": "confirmed" | "wrong" | "unverified", "note": "why", "fix": "what it should say"}]}
// A claim judged "wrong" is fixed in the map (or removed) by the author; the
// fix changes its hash, so it needs a fresh verdict before apply will pass.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { WORK } from "./paths.mjs";
import { claims, digest, setUnverified, slash } from "./lib.mjs";

const argv = process.argv.slice(2);
const flag = (name) => { const i = argv.indexOf(name); if (i < 0) return false; argv.splice(i, 1); return true; };
const SELF = flag("--self");
const pi = argv.indexOf("--pending");
const pendingFiles = pi >= 0 ? argv.splice(pi).slice(1) : null;
const [cmd, id, ...files] = argv;
const usage = () => { console.error("usage: refute.mjs claims <id> [--pending <verdicts.json> ...] | apply <id> <verdicts.json> ... [--self]   (plus --work <folder>)"); process.exit(1); };
if (!["claims", "apply"].includes(cmd) || !id) usage();

const mapFile = join(WORK, "data/apps", id + ".json");
if (!existsSync(mapFile)) { console.error(`no ${slash(mapFile)}`); process.exit(1); }
const app = JSON.parse(readFileSync(mapFile, "utf8"));
if (!app.source) { console.error(`${id} has no "source" block: there is no code to check its claims against`); process.exit(1); }
const all = claims(app);

// Latest verdict per claim id; later files win, so a re-check replaces the first verdict.
function readVerdicts(list) {
  const by = new Map(), checkers = new Set();
  for (const f of list) {
    let v;
    try { v = JSON.parse(readFileSync(f, "utf8")); } catch (e) { console.error(`${f}: not readable JSON (${e.message})`); process.exit(1); }
    if (!v || !Array.isArray(v.verdicts)) { console.error(`${f}: needs {"checker": "...", "verdicts": [...]}`); process.exit(1); }
    checkers.add(typeof v.checker === "string" && v.checker.trim() ? v.checker.trim() : f);
    for (const x of v.verdicts) if (x && typeof x.id === "string") by.set(x.id, { ...x, checker: v.checker ?? f });
  }
  return { by, checkers };
}
// What still stands between the map and a finished pass.
function open(by) {
  const left = [];
  for (const c of all) {
    const v = by.get(c.id);
    if (!v) left.push({ c, why: "not checked" });
    else if (v.hash !== c.hash) left.push({ c, why: "edited since it was checked" });
    else if (v.verdict === "wrong") left.push({ c, why: `judged wrong: ${v.note ?? ""}${v.fix ? ` Fix: ${v.fix}` : ""}`, wrong: true });
    else if (v.verdict !== "confirmed" && v.verdict !== "unverified") left.push({ c, why: `verdict "${v.verdict}" is not confirmed, wrong or unverified` });
  }
  return left;
}
const brief = (c) => ({ id: c.id, hash: c.hash, claim: c.claim, evidence: c.evidence });

if (cmd === "claims") {
  const dir = join(WORK, ".refute", id);
  mkdirSync(dir, { recursive: true });
  const head = { map: id, repo: app.source.repo ?? app.source.name ?? null, commit: app.source.commit ?? null, subdir: app.source.subdir ?? null,
    how: "For each claim, open every cited file at the cited lines and try to DISPROVE the claim. confirmed = the cited lines show it. wrong = the code contradicts it (say what is true in \"fix\"). unverified = the cited lines neither show nor contradict it. Copy id and hash unchanged into your verdict." };
  const write = (name, list) => { const p = join(dir, `claims-${name}.json`); writeFileSync(p, JSON.stringify({ ...head, claims: list.map(brief) }, null, 2) + "\n"); console.log(`${slash(p)}  ${list.length} claim(s)`); };
  if (pendingFiles) {
    const left = open(readVerdicts(pendingFiles).by).filter((x) => !x.wrong).map((x) => x.c);
    if (!left.length) console.log("nothing to re-check: every claim that is not judged wrong has a current verdict");
    else write("recheck", left);
  } else {
    for (const [name, kind] of [["parts", "part"], ["links", "link"], ["steps", "step"]]) {
      const list = all.filter((c) => c.kind === kind);
      if (list.length <= 45) { if (list.length) write(name, list); continue; }
      const n = Math.ceil(list.length / 40), size = Math.ceil(list.length / n);
      for (let i = 0; i < n; i++) write(`${name}-${i + 1}`, list.slice(i * size, (i + 1) * size));
    }
  }
  process.exit(0);
}

// ---- apply ----
if (!files.length) usage();
const { by, checkers } = readVerdicts(files);
const left = open(by);
if (left.length) {
  console.log(`refute pass not finished: ${left.length} of ${all.length} claim(s) need attention`);
  for (const x of left) console.log(`  ${x.c.id}: ${x.why}`);
  console.log(`Fix or remove the wrong ones in the map, get verdicts for the rest ("refute.mjs claims ${id} --pending <verdict files>" lists them), then run apply again with every verdict file.`);
  process.exit(1);
}
let confirmed = 0, unverified = 0;
for (const c of all) {
  const un = by.get(c.id).verdict === "unverified";
  setUnverified(c, un);
  if (un) unverified++; else confirmed++;
}
const d = new Date(), months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const date = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
app.source.refuted = SELF ? "self" : true;
app.source.refute = { date, checkers: checkers.size, claims: all.length, confirmed, unverified, digest: digest(app) };
writeFileSync(mapFile, JSON.stringify(app, null, 2) + "\n");
mkdirSync(join(WORK, "data/refute"), { recursive: true });
const record = { map: id, commit: app.source.commit ?? null, ...app.source.refute, independent: !SELF, checkerNames: [...checkers],
  verdicts: all.map((c) => { const v = by.get(c.id); return { id: c.id, hash: c.hash, verdict: v.verdict, checker: v.checker, note: v.note ?? "" }; }) };
writeFileSync(join(WORK, "data/refute", id + ".json"), JSON.stringify(record, null, 2) + "\n");
console.log(`refute pass recorded for ${id}: ${all.length} claims, ${confirmed} confirmed, ${unverified} unverified, ${checkers.size} checker(s)${SELF ? " (not independent)" : ""}`);
