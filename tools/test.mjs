// Tests for the tools. Needs git on the PATH; makes throwaway repos in the temp folder.
//   node --test tools/test.mjs      (or: npm test)
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { parseRemote, claims, digest } from "./lib.mjs";

const T = dirname(fileURLToPath(import.meta.url));
const TMP = mkdtempSync(join(tmpdir(), "vf-test-"));
process.on("exit", () => { try { rmSync(TMP, { recursive: true, force: true }); } catch {} });

let seq = 0;
const dir = (name) => { const d = join(TMP, `${++seq}-${name}`); mkdirSync(d, { recursive: true }); return d; };
const put = (root, file, text) => { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), text); };
const sh = (cwd, ...a) => { const r = spawnSync("git", ["-C", cwd, "-c", "user.name=t", "-c", "user.email=t@example.com", "-c", "commit.gpgsign=false", "-c", "init.defaultBranch=main", ...a], { encoding: "utf8" }); assert.equal(r.status, 0, r.stderr); return r.stdout.trim(); };
const tool = (name, ...a) => { const r = spawnSync(process.execPath, [join(T, name + ".mjs"), ...a], { encoding: "utf8", env: { ...process.env, VF_WORK: "", VF_REPO: "" } }); return { code: r.status, out: r.stdout + r.stderr }; };
const API = 'import { save } from "./db.js";\nexport function handle(x) { return save(x); }\n// end\n';
const DB = "export function save(x) { return x; }\n// end\n";

// A repo with the code under `pre` ("" or "pkg/"), committed.
function repo(pre = "") {
  const r = dir("repo");
  put(r, pre + "api.js", API); put(r, pre + "db.js", DB); put(r, "other/x.js", "export const x = 1;\n");
  sh(r, "init", "-q"); sh(r, "add", "-A"); sh(r, "commit", "-q", "-m", "one");
  return { root: r, head: sh(r, "rev-parse", "HEAD") };
}
// The smallest map the validator accepts, citing api.js and db.js under `pre`.
function map(source, pre = "") {
  const e = (file, lines, note) => [{ file: pre + file, lines, note }];
  const node = (id, x, kind, brand, label, file, lines) => ({ id, kind, zone: 0, x, y: 80, w: 220, h: 60, brand, label, status: "built", what: "Does a thing.", state: "In the code.", checked: "16 Nov", evidence: e(file, lines, "shows it") });
  return {
    id: "demo", name: "Demo", code: "DM", category: "apps", order: 1, checked: "16 Nov 2026", summary: "A demo.", caveat: "Read only.", facts: [["Stack", "node"]], source,
    zones: [{ label: "App", tag: "service" }],
    nodes: [node("d-api", 40, "core", "server", "API", "api.js", [1, 3]), node("d-db", 340, "store", "file", "Store", "db.js", [1, 2])],
    edges: [{ from: "d-api", to: "d-db", label: "saves", pending: false }],
    arch: {
      view: [640, 400], regions: [{ id: "r", kind: "place", label: "App", x: 16, y: 40, w: 600, h: 300 }],
      links: [{ id: "l1", from: "d-api", to: "d-db", label: "saves", pts: [[260, 110], [340, 110]], main: true, pending: false, lx: 300, ly: 100, anchor: "middle", evidence: e("api.js", [2, 2], "calls save") }],
      features: [{ id: "f1", name: "Save", status: "built", line: "Saves a thing.", steps: [["d-api", "Gets it.", e("api.js", [1, 3], "x")], ["d-db", "Stores it.", e("db.js", [1, 2], "y")]], links: ["l1"] }],
    },
  };
}
function work(m) { const w = dir("work"); put(w, "data/apps/demo.json", JSON.stringify(m)); return w; }
const reread = (w) => JSON.parse(readFileSync(join(w, "data/apps/demo.json"), "utf8"));
const validate = (w, root, ...more) => tool("validate", "demo", "--work", w, ...(root ? ["--repo", root] : []), ...more);
const detect = (p, ...more) => { const r = tool("detect", p, ...more); return { code: r.code, ...JSON.parse(r.out) }; };

// ---------- the router ----------
test("detect: repo root, no remote", () => {
  const { root, head } = repo();
  const d = detect(root);
  assert.equal(d.mode, "repo"); assert.equal(d.source.commit, head); assert.equal(d.subdir, null);
  assert.equal(d.links, "none"); assert.ok(d.source.name); assert.equal(d.source.repo, undefined);
});
test("detect: GitHub remote, credentials dropped, unpushed commit noted", () => {
  const { root } = repo();
  sh(root, "remote", "add", "origin", "https://someone:secret-token@github.com/owner/name.git");
  const d = detect(root);
  assert.deepEqual([d.source.repo, d.source.url, d.source.host, d.links], ["owner/name", "https://github.com/owner/name", "github", "github"]);
  assert.ok(!JSON.stringify(d).includes("secret-token"));
  assert.ok(d.notes.some((n) => /not on the remote yet/.test(n)));
});
test("detect: a folder inside a repo", () => {
  const { root, head } = repo("pkg/");
  const d = detect(join(root, "pkg"));
  assert.equal(d.mode, "subfolder"); assert.equal(d.subdir, "pkg"); assert.equal(d.source.subdir, "pkg"); assert.equal(d.source.commit, head);
  assert.equal(d.root.toLowerCase(), detect(root).root.toLowerCase());
  assert.equal(d.files, 2);
});
test("detect: uncommitted changes are reported", () => {
  const { root } = repo();
  put(root, "api.js", API + "// edited\n");
  const d = detect(root);
  assert.equal(d.source.dirty, true); assert.equal(d.git.dirty, 1);
});
test("detect: plain folder, git with no commits, and untracked folder inside a repo", () => {
  const plain = dir("plain"); put(plain, "a.js", "1\n");
  const p = detect(plain);
  assert.equal(p.mode, "folder"); assert.deepEqual([p.source.local, p.source.commit], [true, undefined]);
  const unborn = dir("unborn"); put(unborn, "a.js", "1\n"); sh(unborn, "init", "-q");
  assert.equal(detect(unborn).mode, "folder");
  const { root } = repo(); put(root, ".gitignore", "drop/\n"); put(root, "drop/a.js", "1\n");
  assert.equal(detect(join(root, "drop")).mode, "folder");
});
test("detect: workspace, empty and missing", () => {
  const ws = dir("ws"); for (const n of ["one", "two"]) { put(ws, n + "/a.js", "1\n"); sh(join(ws, n), "init", "-q"); }
  const w = detect(ws);
  assert.equal(w.mode, "workspace"); assert.deepEqual(w.repos.sort(), ["one", "two"]);
  const e = detect(dir("empty")); assert.equal(e.mode, "empty"); assert.equal(e.code, 1);
  assert.equal(detect(join(TMP, "nope")).mode, "missing");
});
test("detect: a project mapped before is an update", () => {
  const { root, head } = repo();
  const w = dir("work"); put(w, "projects.json", JSON.stringify({ mine: { path: root, commit: head } }));
  put(root, "new.js", "1\n"); sh(root, "add", "-A"); sh(root, "commit", "-q", "-m", "two");
  const d = detect(root, "--work", w);
  assert.equal(d.run, "update"); assert.equal(d.id, "mine"); assert.equal(d.existing.commitsSince, 1);
});
test("parseRemote", () => {
  assert.deepEqual(parseRemote("git@github.com:o/n.git"), { host: "github", domain: "github.com", repo: "o/n", url: "https://github.com/o/n" });
  assert.equal(parseRemote("https://gitlab.com/g/sub/n.git").host, "gitlab");
  assert.equal(parseRemote("https://gitlab.com/g/sub/n.git").repo, "g/sub/n");
  assert.equal(parseRemote("ssh://git@bitbucket.org/team/n.git").host, "bitbucket");
  assert.equal(parseRemote("https://git.example.com/a/b").host, "other");
  assert.equal(parseRemote("C:\\code\\thing"), null); assert.equal(parseRemote("/srv/git/thing.git"), null); assert.equal(parseRemote(""), null);
});

// ---------- the validator ----------
test("validate: a cited map at the mapped commit passes", () => {
  const { root, head } = repo();
  const r = validate(work(map({ name: "demo", commit: head })), root);
  assert.equal(r.code, 0, r.out); assert.match(r.out, /5\/5 claims cite code/);
});
test("validate: citations need lines", () => {
  const { root, head } = repo(); const m = map({ name: "demo", commit: head });
  delete m.nodes[0].evidence[0].lines;
  const r = validate(work(m), root); assert.equal(r.code, 1); assert.match(r.out, /needs lines/);
});
test("validate: a claim with no evidence is an error unless marked unverified", () => {
  const { root, head } = repo(); const m = map({ name: "demo", commit: head });
  m.arch.features[0].steps[1] = ["d-db", "Stores it."];
  assert.match(validate(work(m), root).out, /step 1: no evidence/);
  m.arch.features[0].steps[1] = ["d-db", "Stores it.", [], "unverified"];
  delete m.arch.links[0].evidence; m.arch.links[0].unverified = true;
  const r = validate(work(m), root); assert.equal(r.code, 0, r.out); assert.match(r.out, /2 marked unverified/);
});
test("validate: the repo must be at the mapped commit, and --repo must be its root", () => {
  const { root, head } = repo("pkg/");
  const w = work(map({ name: "demo", commit: "0".repeat(40) }, "pkg/"));
  assert.match(validate(w, root).out, /the repo is at commit/);
  assert.match(validate(work(map({ name: "demo", commit: head }, "")), join(root, "pkg")).out, /must be the repo root/);
});
test("validate: --repo with no source block is an error", () => {
  const { root } = repo(); const m = map(undefined); delete m.source;
  const r = validate(work(m), root); assert.equal(r.code, 1); assert.match(r.out, /no "source" block/);
});
test("validate: a cited file that is not in the commit is an error; an edited one is a warning", () => {
  const { root, head } = repo(); const m = map({ name: "demo", commit: head });
  put(root, "db.js", DB + "// edited\n");
  assert.match(validate(work(m), root).out, /1 cited file\(s\) have uncommitted changes/);
  put(root, "fresh.js", "1\n2\n"); m.nodes[1].evidence = [{ file: "fresh.js", lines: [1, 2], note: "new" }];
  const r = validate(work(m), root); assert.equal(r.code, 1); assert.match(r.out, /is not in the commit/);
});
test("validate: a folder map cites from the repo root and stays inside its folder", () => {
  const { root, head } = repo("pkg/");
  const m = map({ name: "demo", commit: head, subdir: "pkg" }, "pkg/");
  assert.equal(validate(work(m), root).code, 0);
  m.nodes[1].evidence = [{ file: "other/x.js", lines: [1, 1], note: "elsewhere" }];
  const r = validate(work(m), root); assert.equal(r.code, 0); assert.match(r.out, /cites nothing inside pkg\//);
  m.source.subdir = "nope"; assert.match(validate(work(m), root).out, /is not a folder under/);
});
test("validate: a folder with no git is stamped, and later edits to cited files show", () => {
  const f = dir("plain"); put(f, "api.js", API); put(f, "db.js", DB);
  const w = work(map({ local: true, name: "plain" }));
  assert.match(validate(w, f).out, /no fingerprints saved yet/);
  const st = validate(w, f, "--stamp"); assert.equal(st.code, 0, st.out); assert.match(st.out, /fingerprints of 2 cited file/);
  assert.equal(Object.keys(reread(w).source.hashes).length, 2);
  assert.doesNotMatch(validate(w, f).out, /changed since/);
  put(f, "db.js", DB + "// edited\n");
  assert.match(validate(w, f).out, /1 cited file\(s\) changed since the map was stamped: db\.js/);
});
test("validate: source needs a commit or local, and a safe url", () => {
  const { root } = repo();
  assert.match(validate(work(map({ name: "demo" })), root).out, /source\.commit must be/);
  assert.match(validate(work(map({ name: "demo", local: true, url: "javascript:alert(1)" })), null).out, /source\.url must be/);
});

// ---------- the refute pass ----------
test("refute: only a full set of verdicts marks the map as checked, and a later edit shows", () => {
  const { root, head } = repo(); const m = map({ name: "demo", commit: head }); const w = work(m);
  m.source.refuted = true; const faked = work(m);
  assert.match(validate(faked, root).out, /no refute record/);

  const c = tool("refute", "claims", "demo", "--work", w); assert.equal(c.code, 0, c.out);
  const files = ["parts", "links", "steps"].map((n) => join(w, ".refute/demo", `claims-${n}.json`));
  const all = files.flatMap((f) => JSON.parse(readFileSync(f, "utf8")).claims);
  assert.equal(all.length, 5);
  const v = (name, list) => { const p = join(w, name + ".json"); writeFileSync(p, JSON.stringify({ checker: name, verdicts: list })); return p; };
  const verdict = (x, how) => ({ id: x.id, hash: x.hash, verdict: how, note: "n" });

  const partial = v("a", all.slice(0, 3).map((x) => verdict(x, "confirmed")));
  let r = tool("refute", "apply", "demo", partial, "--work", w); assert.equal(r.code, 1); assert.match(r.out, /2 of 5 claim\(s\) need attention/);
  assert.equal(reread(w).source.refuted, undefined);

  const wrong = v("b", [verdict(all[3], "wrong"), verdict(all[4], "unverified")]);
  r = tool("refute", "apply", "demo", partial, wrong, "--work", w); assert.equal(r.code, 1); assert.match(r.out, /judged wrong/);

  const fixed = v("c", [verdict(all[3], "confirmed")]);
  r = tool("refute", "apply", "demo", partial, wrong, fixed, "--work", w); assert.equal(r.code, 0, r.out); assert.match(r.out, /4 confirmed, 1 unverified/);
  const done = reread(w);
  assert.equal(done.source.refuted, true); assert.equal(done.source.refute.digest, digest(done));
  assert.equal(claims(done).filter((x) => x.unverified).length, 1);
  assert.ok(existsSync(join(w, "data/refute/demo.json")));
  assert.equal(validate(w, root).code, 0);

  done.nodes[0].what = "Does something else entirely.";
  writeFileSync(join(w, "data/apps/demo.json"), JSON.stringify(done));
  assert.match(validate(w, root).out, /changed after its refute pass/);
  r = tool("refute", "claims", "demo", "--work", w, "--pending", partial, wrong, fixed); assert.match(r.out, /claims-recheck\.json\s+1 claim/);
});
test("refute: --self is recorded as not independent", () => {
  const { root, head } = repo(); const w = work(map({ name: "demo", commit: head }));
  const p = join(w, "v.json");
  writeFileSync(p, JSON.stringify({ checker: "author", verdicts: claims(reread(w)).map((x) => ({ id: x.id, hash: x.hash, verdict: "confirmed" })) }));
  assert.equal(tool("refute", "apply", "demo", p, "--self", "--work", w).code, 0);
  assert.equal(reread(w).source.refuted, "self"); assert.equal(validate(w, root).code, 0);
});

// ---------- the rest ----------
test("mechanical: runs with --repo, and says how to call it without", () => {
  const { root, head } = repo(); const m = map({ name: "demo", commit: head });
  const plain = tool("mechanical", "demo", "--work", work(m), "--repo", root); assert.match(plain.out, /no distinctive words for d-db/);
  m.nodes[1].sig = ["save"]; const w = work(m);
  const r = tool("mechanical", "demo", "--work", w, "--repo", root); assert.equal(r.code, 0, r.out); assert.match(r.out, /1\/1 links name the other end/);
  const bad = tool("mechanical", "demo", "--work", w); assert.equal(bad.code, 1); assert.match(bad.out, /usage/);
});
test("build and single: one file that loads nothing else", () => {
  const { head } = repo(); const w = work(map({ repo: "owner/name", url: "https://github.com/owner/name", host: "github", commit: head }));
  const b = tool("build", "--work", w); assert.equal(b.code, 0, b.out);
  const out = join(w, "demo.html");
  const s = tool("single", out, "--work", w); assert.equal(s.code, 0, s.out);
  const html = readFileSync(out, "utf8");
  assert.doesNotMatch(html, /<(link|script|img)\b[^>]*\b(href|src)="(?!data:)/i);
  assert.doesNotMatch(html, /fonts\.googleapis|fonts\.gstatic/);
  assert.match(html, /data:font\/woff2;base64,/);
});
test("validate: a folder map lets claims about outside parts cite outside the folder", () => {
  const { root, head } = repo("pkg/");
  const m = map({ name: "demo", commit: head, subdir: "pkg" }, "pkg/");
  m.zones.push({ label: "Rest of the repo", tag: "repo" });
  m.nodes[1].zone = 1; m.nodes[1].evidence = [{ file: "other/x.js", lines: [1, 1], note: "elsewhere" }];
  m.arch.links[0].evidence = [{ file: "other/x.js", lines: [1, 1], note: "the caller" }];
  m.arch.regions.push({ id: "r2", kind: "place", label: "Rest", x: 330, y: 60, w: 240, h: 100 });
  const r = validate(work(m), root); assert.equal(r.code, 0, r.out); assert.doesNotMatch(r.out, /cites nothing inside/);
});
test("validate: text that will not fit is flagged", () => {
  const { root, head } = repo(); const m = map({ name: "demo", commit: head });
  m.nodes[1].sub = "CPU · CUDA · OpenVINO · MIGraphX · ARM NN · RKNN";
  m.nodes[0].chips = [["A very long chip name indeed", "and an equally long note"]]; m.nodes[0].h = 100;
  const r = validate(work(m), root);
  assert.match(r.out, /node d-db: sub needs about/); assert.match(r.out, /chip "A very long chip name indeed"/);
});
