// Heuristic, mechanical support for each map link (no model involved).
//   node tools/mechanical.mjs <id> --work <work> --repo <root>
//
// A link A -> B should cite the place where one side refers to the other. So
// for each of the link's own citations this asks: is the cited file on A's
// side (a file A cites, or in the same folder as one) and do the cited lines
// name B, or the other way round? "Naming" a part means one of its signature
// words appears: "sig" on the node if given, else the names of the files it
// cites and the distinctive words of its label and sub.
//
//   strong  the cited lines name the other end
//   file    the cited file names it somewhere, though not in the cited lines
//   none    neither; flagged for a person to look at
//
// A flag is not proof the link is wrong, and "strong" is not proof it is right:
// this only finds links whose citations never mention what they claim to connect.
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname, basename, extname } from "node:path";
import { WORK } from "./paths.mjs";

const args = process.argv.slice(2), ri = args.indexOf("--repo");
const REPO = ri >= 0 ? args.splice(ri, 2)[1] : process.env.VF_REPO;
const id = args[0];
if (!id || !REPO) { console.error("usage: mechanical.mjs <id> --repo <root> [--work <folder>]"); process.exit(1); }
const app = JSON.parse(readFileSync(join(WORK, "data/apps", id + ".json"), "utf8"));
const node = new Map(app.nodes.map((n) => [n.id, n]));

const squash = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "");
const COMMON = new Set(["index", "main", "config", "readme", "package", "dockercompose", "dockerfile", "server", "service", "services", "client", "clients", "worker", "workers", "storage", "store", "files", "file", "jobs", "with", "from", "that", "this", "data", "local", "optional", "source", "build", "release", "library", "libraries", "external", "tools", "media", "model", "models", "event", "events", "request", "utils", "types", "common", "shared", "base", "core", "image", "images", "search", "queue", "import", "export", "test", "tests"]);
function sig(n) {
  if (Array.isArray(n.sig)) return n.sig.map(squash).filter(Boolean);
  const s = new Set();
  const add = (w) => { const k = squash(w); if (k.length > 3 && /[a-z]/.test(k) && !COMMON.has(k)) s.add(k); };
  for (const e of n.evidence ?? []) { const b = basename(e.file, extname(e.file)); add(b); for (const part of b.split(/[.\-_]/)) add(part); }
  for (const w of `${n.label ?? ""} ${n.sub ?? ""}`.split(/[^A-Za-z0-9_.+-]+/)) add(w);
  return [...s];
}
const textCache = new Map();
function lines(f) {
  if (textCache.has(f)) return textCache.get(f);
  const p = join(REPO, f);
  const v = existsSync(p) && statSync(p).isFile() && statSync(p).size < 2_000_000 ? readFileSync(p, "utf8").split(/\r?\n/) : null;
  textCache.set(f, v); return v;
}
const territory = (n) => ({ files: new Set((n.evidence ?? []).map((e) => e.file)), dirs: new Set((n.evidence ?? []).map((e) => dirname(e.file))) });
const onSide = (t, f) => t.files.has(f) || t.dirs.has(dirname(f));
const names = (text, words) => { const t = squash(text); return words.find((w) => t.includes(w)); };

const tally = { strong: 0, file: 0, none: 0 }, flagged = [];
for (const l of app.arch.links) {
  const A = node.get(l.from), B = node.get(l.to);
  if (!A || !B) continue;
  const tA = territory(A), tB = territory(B), wA = sig(A), wB = sig(B);
  let best = "none", why = "";
  for (const e of l.evidence ?? []) {
    const all = lines(e.file); if (!all) continue;
    const range = all.slice((e.lines?.[0] ?? 1) - 1, e.lines?.[1] ?? all.length).join("\n");
    // which end does this citation have to name? the one whose side it is not on
    const wants = [];
    if (onSide(tA, e.file) || !onSide(tB, e.file)) wants.push(["B", wB]);
    if (onSide(tB, e.file)) wants.push(["A", wA]);
    for (const [, words] of wants) {
      const hit = names(range, words);
      if (hit) { best = "strong"; why = `${e.file}:${e.lines?.join("-")} names "${hit}"`; break; }
      if (best === "none" && names(all.join("\n"), words)) best = "file";
    }
    if (best === "strong") break;
  }
  tally[best]++;
  if (best === "strong") continue;
  const first = (l.evidence ?? [])[0], other = first && onSide(tB, first.file) && !onSide(tA, first.file) ? A : B, words = other === A ? wA : wB;
  flagged.push(`${best === "file" ? "weak" : "flag"} ${l.id} (${l.from} -> ${l.to}): ${best === "file" ? "the cited files name the other end, but not in the cited lines" : !first ? "no citations" : !words.length ? `no distinctive words for ${other.id} to look for (add "sig": ["..."] to that part)` : `its citations never name ${other.id} [${words.slice(0, 6).join(", ")}]`}`);
}
console.log(`mechanical support: ${tally.strong}/${app.arch.links.length} links name the other end in their cited lines, ${tally.file} only elsewhere in the cited file, ${tally.none} not at all`);
for (const f of flagged) console.log("  " + f);
