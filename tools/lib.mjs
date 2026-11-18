// Shared by the tools: git probing, remote parsing, and the list of claims a map makes.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

// Run git in a folder. Returns trimmed stdout, or null when git fails or is not installed.
export function git(dir, ...args) {
  const r = spawnSync("git", ["-C", dir, ...args], { encoding: "utf8", windowsHide: true, maxBuffer: 256 * 1024 * 1024 });
  return r.status === 0 ? r.stdout.replace(/\r?\n$/, "") : null;
}

export const sha = (s, n = 16) => createHash("sha256").update(s).digest("hex").slice(0, n);
export const slash = (p) => p.split("\\").join("/");

// A remote URL -> {host, domain, repo, url}. Credentials in the URL are dropped.
// host is "github", "gitlab", "bitbucket" or "other" (no line links). Returns null
// for a remote that is a local path.
export function parseRemote(raw) {
  if (!raw) return null;
  let host, path, m;
  if ((m = raw.match(/^[\w.+-]+:\/\/(?:[^@/]*@)?([^/:]+)(?::\d+)?\/(.+)$/))) [, host, path] = m;
  else if ((m = raw.match(/^(?:[^@/]+@)?([^:/]{2,}):(?!\/)(.+)$/))) [, host, path] = m;
  else return null;
  path = path.replace(/\.git\/?$/, "").replace(/^\/+|\/+$/g, "");
  host = host.toLowerCase();
  if (!path || !host.includes(".")) return null;
  const kind = host === "github.com" ? "github" : host === "bitbucket.org" ? "bitbucket" : /(^|\.)gitlab\./.test(host) ? "gitlab" : "other";
  return { host: kind, domain: host, repo: path, url: `https://${host}/${path}` };
}

const ev = (list) => (Array.isArray(list) ? list.map((e) => ({ file: e.file, lines: e.lines, note: e.note })) : []);

// Every claim a map makes: one per part, per drawn link and per walkthrough step.
// `hash` covers the claim's wording and its citations, so an edit after a check shows.
export function claims(app) {
  const out = [], label = new Map((app.nodes ?? []).map((n) => [n.id, n.label]));
  for (const n of app.nodes ?? []) {
    const core = { label: n.label, sub: n.sub, what: n.what, status: n.status, kind: n.kind, evidence: ev(n.evidence) };
    out.push({ id: "part:" + n.id, kind: "part", claim: `${n.label}${n.sub ? ` (${n.sub})` : ""}: ${n.what}`, evidence: core.evidence, unverified: !!n.unverified, hash: sha(JSON.stringify(core)), ref: n });
  }
  for (const l of app.arch?.links ?? []) {
    const core = { from: l.from, to: l.to, label: l.label, note: l.note, pending: !!l.pending, evidence: ev(l.evidence) };
    out.push({ id: "link:" + l.id, kind: "link", claim: `${label.get(l.from) ?? l.from} -> ${label.get(l.to) ?? l.to}${l.label ? `: ${l.label}` : ""}${l.note ? ` (${l.note})` : ""}${l.pending ? " [not connected yet]" : ""}`, evidence: core.evidence, unverified: !!l.unverified, hash: sha(JSON.stringify(core)), ref: l });
  }
  for (const f of app.arch?.features ?? []) (f.steps ?? []).forEach((s, i) => {
    const core = { feature: f.id, node: s[0], text: s[1], evidence: ev(s[2]) };
    out.push({ id: `step:${f.id}:${i}`, kind: "step", claim: `Walkthrough "${f.name}", step ${i + 1}, at ${label.get(s[0]) ?? s[0]}: ${s[1]}`, evidence: core.evidence, unverified: s[3] === "unverified", hash: sha(JSON.stringify(core)), ref: s });
  });
  return out;
}

// One fingerprint for the whole map as it was checked: every claim, its wording,
// its citations and whether it is marked unverified, at the mapped commit.
export function digest(app) {
  const lines = claims(app).map((c) => `${c.id}:${c.hash}:${c.unverified ? 1 : 0}`).sort();
  return sha([app.source?.commit ?? "local", ...lines].join("\n"), 32);
}

export function setUnverified(c, on) {
  if (c.kind === "step") { if (on) { c.ref[2] ??= []; c.ref[3] = "unverified"; } else if (c.ref.length > 3) c.ref.length = 3; }
  else if (on) c.ref.unverified = true; else delete c.ref.unverified;
}
