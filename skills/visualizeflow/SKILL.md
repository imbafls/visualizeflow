---
name: visualizeflow
description: Reverse-engineer the current codebase into one interactive architecture page - parts you can click, the connections between them, and walkthroughs of how the app runs - where every part, link and step cites the code (file and lines) it came from. Use on /visualizeflow or when asked to visualize, diagram, map or reverse-engineer an app's architecture or flow.
---

# /visualizeflow

Map THIS project (the current directory, or the path given after the command)
as an interactive page. Everything is read only: never install, build, run
tests, start services, call paid APIs or write inside the project except the
work folder below.

**PLUGIN** below means the plugin folder: the folder two levels above this
SKILL.md (it holds `renderer/`, `tools/` and `AUTHORING.md`). In Claude Code it is
`${CLAUDE_PLUGIN_ROOT}`; in Codex, Gemini CLI, Grok Build, Cursor or any other agent,
resolve it from this file's path. It holds the renderer, schema, checker and
screenshot tool. Read `PLUGIN/AUTHORING.md` first (the
schema, drawing rules and evidence rules) and
`PLUGIN/examples/immich.json` (a finished map with evidence).
If `PLUGIN/node_modules` is missing, run `npm install` there
once (it writes only inside the plugin).

## Where maps go: one page for all your systems

Every map is added to the person's **page**: one folder that holds every system
they have mapped, built into one site with a home page grouped by category.
- The page folder is `~/visualizeflow` unless `VF_WORK` is set or the person
  names another. Create it on first use with `data/meta.json` copied from
  `PLUGIN/data/meta.json`, then set `"title"` (ask: "What should
  the page be called?"; default "Architecture maps").
- `/visualizeflow here` instead writes a one-off page to `.visualizeflow/` in the
  project (add it to `.git/info/exclude`, not `.gitignore`).
- `/visualizeflow page` only rebuilds the page and opens it (step 5).
- Categories live in `<work>/data/meta.json` as `{id, label, description}`.
  Before writing a map, show the existing categories and ask which one this
  system belongs to, or offer a new one with a one-line description. Keep them
  few and meaningful (by what the systems are for: "Customer apps", "Internal
  tools", "Data pipelines", ...), not by technology.
- `<work>/projects.json` maps each id to the project path and the commit it
  was mapped at. It is never put on the page. If this project already has an
  id there, this run **updates** that map (same id, same category) instead of
  adding a new one; say what changed since the recorded commit
  (`git log --oneline <old>..HEAD`).

Every tool takes `--work <folder>`. Below, `T=PLUGIN/tools`.

## 1. Understand the app

Read, in this order:
1. README, AGENTS.md / CLAUDE.md, docs/, architecture notes.
2. Manifests and workspaces (package.json, Cargo.toml, pyproject, go.mod,
   pubspec.yaml, ...).
3. How it runs: entry points, servers, ports, workers, queues, cron.
4. How it ships: CI workflows, Dockerfiles, compose files, release scripts.
5. What it talks to: SDK imports, HTTP clients, env var NAMES in examples
   (never read real .env values), webhooks.
6. Where data lives: schemas, migrations, files, caches, buckets.
7. `git log -20 --format='%cs %s'` and `git rev-parse HEAD` (the commit you map).

## 2. Write the map, citing as you go

Write `<work>/data/apps/<id>.json` per AUTHORING.md: 12-24 parts, every
outside service as its own part, the release path, where data lives, and 4-6
walkthroughs that follow real flows end to end. Add `source: {repo, commit,
url}`. Every part, link and walkthrough step carries
`evidence: [{file, lines:[a,b], note}]` with tight ranges you have opened.
Never cite a range you have not read. Status: `built` for what the code has,
`planned` for what docs promise and the code lacks; `live` only after a read-only
check that it answers (a public URL, a CI run).

For a first layout, `node $T/autolayout.mjs <in.json> <out.json>` places
parts and routes links from a JSON without coordinates; hand-tune after.

## 3. Check it

```bash
node $T/validate.mjs <id> --work <work> --repo <project>   # 0 errors: cited files exist, lines in range, brands in the logo table
node $T/shot.mjs <id> map --work <work>                    # open the PNG and look; fix and repeat
node $T/shot.mjs <id> overview --work <work>
node $T/mechanical.mjs <id> --work <work> --repo <project> # links with no mechanical support, to look at
```

Look for overlaps, lines through parts, labels far from their line, text cut
off with "…", cramped or empty areas. Repeat until it reads cleanly.

## 4. Refute pass

Hand the JSON and the repo to independent checkers (subagents that did not
write the map; split by parts, links and steps), each told to DISPROVE every
claim against its cited code and return confirmed / wrong (with the fix) /
unverified. Apply fixes. Remove claims shown false that can't be fixed. Mark
claims that can't be confirmed `"unverified": true` (parts, links) or add a
4th element `"unverified"` (steps); they draw dashed in amber. Then set
`source.refuted: true` and re-validate.

## 5. Hand it over

```bash
node $T/build.mjs --work <work>                         # <work>/dist/index.html + assets
node $T/single.mjs <work>/<id>.html --work <work>       # one self-contained file
```

Open `<work>/dist/index.html` (the home page lists every system; the new one
is in its category), give the path, and a short summary: what the app is, its main flow,
claims made / confirmed / fixed / removed / unverified, and evidence coverage
(validate prints it).
