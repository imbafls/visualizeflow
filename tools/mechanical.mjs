// Heuristic, mechanical support for each map link (no model involved).
//   node tools/mechanical.mjs <id> --repo <clone>
//
// For link A -> B: look in the code next to A's cited files (same folders) for
// a mention of B: an import of one of B's cited modules, or one of B's
// signature words (from "sig" on the node if given, else its cited file names
// and package-like words in its "sub"). A link with no hit is flagged for a
// human to look at; a flag is not proof the link is wrong.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { WORK as root } from "./paths.mjs";
const args = process.argv.slice(2), ri = args.indexOf("--repo");
const REPO = args.splice(ri, 2)[1], id = args[0];
const app = JSON.parse(readFileSync(join(root, "data/apps", id + ".json"), "utf8"));
const node = new Map(app.nodes.map((n) => [n.id, n]));
const CODE = /\.(ts|js|mjs|svelte|dart|py|ya?ml|json|sql|sh|toml)$/;
const dirCache = new Map();
function filesIn(d) {
  if (dirCache.has(d)) return dirCache.get(d);
  const p = join(REPO, d), out = [];
  if (existsSync(p)) for (const f of readdirSync(p)) { const q = join(p, f); if (statSync(q).isFile() && CODE.test(f) && statSync(q).size < 400000) out.push(q); }
  dirCache.set(d, out); return out;
}
const textCache = new Map();
const text = (f) => textCache.get(f) ?? (textCache.set(f, readFileSync(f, "utf8")), textCache.get(f));
function sig(n) {
  if (Array.isArray(n.sig)) return n.sig;
  const s = new Set();
  for (const e of n.evidence ?? []) { const b = basename(e.file, extname(e.file)); if (b.length > 4 && !/^(index|main|app|config|readme|package|docker-compose)$/i.test(b)) s.add(b); }
  for (const w of (n.sub ?? "").split(/[^A-Za-z0-9_.-]+/)) if (w.length > 3 && /[a-z]/.test(w) && !/^(with|from|that|this|jobs|files|server)$/i.test(w)) s.add(w);
  return [...s];
}
let ok = 0; const flagged = [];
for (const l of app.arch.links) {
  const A = node.get(l.from), B = node.get(l.to);
  if (!A || !B) continue;
  const dirs = new Set((A.evidence ?? []).concat(l.evidence ?? []).map((e) => dirname(e.file)));
  const words = sig(B);
  let hit = null;
  outer: for (const d of dirs) for (const f of filesIn(d)) { const t = text(f); for (const w of words) if (t.toLowerCase().includes(w.toLowerCase())) { hit = `${f.slice(REPO.length + 1).split("\\").join("/")} mentions "${w}"`; break outer; } }
  if (hit) ok++; else flagged.push(`${l.id} (${l.from} -> ${l.to}): no mention of [${words.slice(0, 6).join(", ")}] near ${[...dirs].join(", ") || "(no cited files)"}`);
}
console.log(`mechanical support: ${ok}/${app.arch.links.length} links`);
for (const f of flagged) console.log("  flag " + f);
