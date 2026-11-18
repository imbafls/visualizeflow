// The router: look at what the person pointed at and say how to map it.
//
//   node tools/detect.mjs [path] [--work <folder>]
//
// Prints one JSON object. `mode` picks the route:
//   repo       the root of a git repo that has commits
//   subfolder  a folder inside a git repo (map just that folder)
//   folder     a plain folder: no git, git with no commits yet, or files git does not track
//   workspace  not a repo itself, but it holds several repos (ask which one)
//   empty      nothing to read
//   missing    the path does not exist or is not a folder
// `root` is what to pass as --repo, and what evidence paths are relative to.
// `source` is the block to put in the map. `notes` are things to tell the person.
// Read only: it runs git queries and lists files, and changes nothing.

import { existsSync, statSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { git, parseRemote, slash } from "./lib.mjs";
import { WORK } from "./paths.mjs";

const target = resolve(process.argv[2] || ".");
const out = { target: slash(target), mode: "missing", root: null, subdir: null, git: null, links: "none", files: 0, source: null, id: null, run: "new", existing: null, notes: [], next: [] };
const done = () => { console.log(JSON.stringify(out, null, 2)); process.exit(out.mode === "missing" || out.mode === "empty" ? 1 : 0); };

if (!existsSync(target) || !statSync(target).isDirectory()) { out.notes.push(`${out.target} is not a folder.`); done(); }

const SKIP = new Set([".git", "node_modules", "dist", "build", "target", ".next", ".venv", "venv", "__pycache__", "vendor", ".visualizeflow", ".cache", "coverage"]);
function countFiles(dir, cap = 20000) {
  let n = 0; const stack = [dir];
  while (stack.length && n < cap) {
    const d = stack.pop();
    let list; try { list = readdirSync(d, { withFileTypes: true }); } catch { continue; }
    for (const e of list) { if (e.isDirectory()) { if (!SKIP.has(e.name)) stack.push(join(d, e.name)); } else if (e.isFile()) n++; }
  }
  return n;
}
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "map";

const top = git(target, "rev-parse", "--show-toplevel");
const head = top ? git(top, "rev-parse", "-q", "--verify", "HEAD") : null;
const prefix = top ? (git(target, "rev-parse", "--show-prefix") ?? "").replace(/\/+$/, "") : "";
const tracked = top && head ? (git(target, "ls-files", "--", ".") ?? "").split("\n").filter(Boolean).length : 0;

if (top && head && tracked) {
  // ---- a git repo with commits: the whole repo, or one folder of it ----
  const remotes = (git(top, "remote") ?? "").split("\n").filter(Boolean);
  const remoteName = remotes.includes("origin") ? "origin" : remotes[0];
  const remote = remoteName ? parseRemote(git(top, "remote", "get-url", remoteName)) : null;
  const dirty = (git(target, "status", "--porcelain", "--", ".") ?? "").split("\n").filter(Boolean).length;
  const pushed = remoteName ? !!(git(top, "branch", "-r", "--contains", head) ?? "").trim() : null;
  let subs = [];
  try { subs = [...readFileSync(join(top, ".gitmodules"), "utf8").matchAll(/^\s*path\s*=\s*(.+)$/gm)].map((m) => m[1].trim()); } catch {}
  out.mode = prefix ? "subfolder" : "repo";
  out.root = slash(top); out.subdir = prefix || null; out.files = tracked;
  out.git = {
    root: slash(top), head, branch: git(top, "rev-parse", "--abbrev-ref", "HEAD"), commits: +(git(top, "rev-list", "--count", "HEAD") ?? 0),
    shallow: git(top, "rev-parse", "--is-shallow-repository") === "true", dirty, remote: remote ? remote.url : null, host: remote ? remote.host : null, pushed,
    submodules: subs,
  };
  out.source = remote ? { repo: remote.repo, url: remote.url, host: remote.host, commit: head } : { name: basename(top), commit: head };
  if (prefix) out.source.subdir = prefix;
  if (dirty) out.source.dirty = true;
  out.links = remote && remote.host !== "other" ? remote.host : "none";
  out.id = slug(basename(top) + (prefix ? "-" + prefix : ""));

  if (prefix) {
    out.notes.push(`This is the folder ${prefix}/ inside the repo ${basename(top)}. Only that folder is mapped; run it at ${slash(top)} to map the whole repo.`);
    out.next.push(`Map what lives in ${prefix}/. Code elsewhere in the repo that it calls or is called by becomes outside parts in a zone "Rest of the repo" with tag "repo", not a full map of them.`);
    out.next.push(`Evidence paths stay relative to the repo root (they start with ${prefix}/ for code in the folder). Every claim about a part inside the folder cites at least one place inside ${prefix}/; claims about outside parts may cite the code outside it.`);
  }
  if (!remote) out.notes.push(remoteName ? "The remote is a local path, so citations are shown as file and lines without links." : "This repo has no remote, so citations are shown as file and lines without links.");
  else if (remote.host === "other") out.notes.push(`Line links are only built for GitHub, GitLab and Bitbucket. ${remote.domain} is none of those, so citations are shown without links (set source.host by hand if it is a self-hosted GitHub or GitLab).`);
  else if (pushed === false) out.notes.push(`Commit ${head.slice(0, 7)} is not on the remote yet. The line links will 404 until it is pushed.`);
  if (dirty) out.notes.push(`${dirty} file(s) here have uncommitted changes. The map describes the files as they are now; links point at commit ${head.slice(0, 7)}, so cited lines in changed files may be off. Commit first for exact links.`);
  if (out.git.shallow) out.notes.push(`Shallow clone: history is cut short, so git cannot tell when ${prefix ? "this folder" : "a file"} last changed. Give the mapped commit, not a last-change date.`);
  const inside = prefix ? subs.filter((p) => p.startsWith(prefix + "/")) : subs;
  if (inside.length) out.notes.push(`Submodule(s) ${prefix ? "inside this folder" : "in this repo"}: ${inside.join(", ")}. Their code is a separate repo: draw each as an outside part unless asked otherwise.`);
  else if (subs.length) out.notes.push(`The repo has submodule(s) outside this folder (${subs.join(", ")}). Draw one only if this folder's code uses it.`);
  if (!prefix) {
    const mono = ["pnpm-workspace.yaml", "lerna.json", "nx.json", "turbo.json", "go.work"].filter((f) => existsSync(join(top, f)));
    try { if (JSON.parse(readFileSync(join(top, "package.json"), "utf8")).workspaces) mono.push("package.json workspaces"); } catch {}
    try { if (/^\[workspace\]/m.test(readFileSync(join(top, "Cargo.toml"), "utf8"))) mono.push("Cargo workspace"); } catch {}
    if (mono.length) out.notes.push(`Monorepo (${mono.join(", ")}). Map it as one system, or point at one package folder for a closer map.`);
  }
  if (tracked > 5000) out.notes.push(`${tracked} tracked files: a large codebase. Expect a longer run, or point at one folder.`);
  out.next.push(`Pass --repo ${slash(top)} to validate.mjs and mechanical.mjs.`);
} else {
  // ---- no usable git here ----
  const kids = readdirSync(target, { withFileTypes: true }).filter((e) => e.isDirectory() && !SKIP.has(e.name));
  const repos = top ? [] : kids.filter((e) => existsSync(join(target, e.name, ".git"))).map((e) => e.name);
  out.files = countFiles(target);
  if (repos.length) {
    out.mode = "workspace"; out.root = slash(target);
    out.repos = repos.slice(0, 60);
    out.notes.push(`This folder is not a repo, but it holds ${repos.length} repo(s): ${repos.slice(0, 12).join(", ")}${repos.length > 12 ? ", ..." : ""}.`);
    out.next.push("Ask which one to map (each becomes its own map on the page), then run detect.mjs on that folder. Map this folder as one system only if the person says its repos are one system.");
  } else if (!out.files) {
    out.mode = "empty"; out.notes.push("There are no files to read here.");
  } else {
    out.mode = "folder"; out.root = slash(target); out.id = slug(basename(target));
    out.source = { local: true, name: basename(target) };
    if (top && !head) out.notes.push("This is a git repo with no commits yet, so there is no commit to pin the map to.");
    else if (top) out.notes.push(`This folder sits inside the repo ${basename(top)}, but git tracks none of its files, so it is mapped as a plain folder.`);
    else out.notes.push("There is no git here, so there is no commit to pin the map to.");
    out.notes.push("Citations are shown as file and lines without links. A fingerprint of each cited file is saved instead of a commit, so a later run can tell which ones changed.");
    out.next.push(`Pass --repo ${slash(target)} to validate.mjs and mechanical.mjs. Evidence paths are relative to that folder.`);
    out.next.push("After the last edit to the map, run validate.mjs once more with --stamp to save the fingerprints.");
    if (out.files > 5000) out.notes.push(`${out.files}+ files: a large folder. Expect a longer run, or point at one subfolder.`);
  }
}

// ---- mapped before? then this run updates that map ----
const same = (a, b) => slash(resolve(a)).toLowerCase() === slash(resolve(b)).toLowerCase();
try {
  const projects = JSON.parse(readFileSync(join(WORK, "projects.json"), "utf8"));
  for (const [id, p] of Object.entries(projects)) {
    if (!p || !p.path || !same(p.path, target)) continue;
    out.run = "update"; out.id = id;
    out.existing = { id, commit: p.commit ?? null, mapped: p.mapped ?? null };
    if (p.commit && out.git) {
      const n = git(out.git.root, "rev-list", "--count", `${p.commit}..HEAD`, "--", out.subdir || ".");
      out.existing.commitsSince = n === null ? null : +n;
      out.notes.push(n === null ? `Mapped before as "${id}" at ${p.commit.slice(0, 7)}, which is not in this clone's history.` : `Mapped before as "${id}" at ${p.commit.slice(0, 7)}; ${n} commit(s) since then touch it.`);
    } else out.notes.push(`Mapped before as "${id}". validate.mjs lists the cited files that changed since.`);
    out.next.unshift(`Update the map "${id}" (same id, same category) instead of adding a new one.`);
  }
} catch {}

done();
