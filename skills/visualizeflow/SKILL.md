---
name: visualizeflow
description: Reverse-engineer a codebase or a single folder into one interactive architecture page - parts you can click, the connections between them, and walkthroughs of how the app runs - where every part, link and step cites the code (file and lines) it came from. Works on a git repo, a folder inside one, or a plain folder with no git. Use on /visualizeflow or when asked to visualize, diagram, map or reverse-engineer an app's architecture or flow.
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
  project (add it to `.git/info/exclude`, not `.gitignore`; skip that when there is no git).
- `/visualizeflow page` only rebuilds the page and opens it (step 5).
- Categories live in `<work>/data/meta.json` as `{id, label, description}`.
  Before writing a map, show the existing categories and ask which one this
  system belongs to, or offer a new one with a one-line description. Keep them
  few and meaningful (by what the systems are for: "Customer apps", "Internal
  tools", "Data pipelines", ...), not by technology.
- `<work>/projects.json` records what was mapped, as
  `{"<id>": {"path": "<target>", "commit": "<hash, or null>", "mapped": "16 Nov 2026"}}`.
  It is never put on the page. Write this map's entry in step 5.

Every tool takes `--work <folder>` (default: the page folder). Below, `T=PLUGIN/tools`.

## 0. Find out what you were pointed at

Run this first, every time. It is read only.

```bash
node $T/detect.mjs <path, default the current directory> --work <work>
```

It prints JSON. Use its values as given: `root` (what `--repo` is, and what
evidence paths are relative to), `source` (the block to put in the map, as is),
`id`, and `run` (`new`, or `update` when this target was mapped before). Tell
the person each line of `notes` in plain words before you start, and do what
`next` says. Then follow the route for `mode`:

| `mode` | What it is | What changes |
| ------ | ---------- | ------------ |
| `repo` | The root of a git repo with commits | Nothing: steps 1-5 as written. |
| `subfolder` | A folder inside a git repo | Map only that folder (`source.subdir`). Say so, and that running at the repo root maps everything. Code elsewhere in the repo that the folder calls, or that calls it, becomes one outside part each in a zone "Rest of the repo" (tag `repo`), cited where the two meet. Evidence paths still start at the repo root. Draw as many parts and walkthroughs as the folder really has: never pad to reach 12 parts or 4 walkthroughs (AUTHORING.md, "In a map of one folder"). |
| `folder` | No git, git with no commits, or files git does not track | There is no commit. Skip the git commands in step 1 (use file dates if you need "recent"). Citations have no links. After the last edit to the map, run `validate.mjs ... --stamp` so the cited files are fingerprinted. |
| `workspace` | Not a repo, but it holds several | Do not map it as one system. List `repos`, ask which to map, then run `detect.mjs` on that folder and follow its route. |
| `empty`, `missing` | Nothing to read | Stop and say so. |

Whatever the mode: when `source.url` is missing or `links` is `none`, citations
are shown as file and lines without links; that is expected, do not invent a URL.
When `run` is `update`, keep the same id and category, re-read what changed
(for git: `git log --oneline <old commit>..HEAD -- <subdir or .>`; with no git:
`validate.mjs` lists the cited files that changed), and say what changed.

## 1. Understand the app

Read, in this order (inside the target folder; for a `subfolder`, also the
repo's top-level README and manifests for context):
1. README, AGENTS.md / CLAUDE.md, docs/, architecture notes.
2. Manifests and workspaces (package.json, Cargo.toml, pyproject, go.mod,
   pubspec.yaml, ...).
3. How it runs: entry points, servers, ports, workers, queues, cron.
4. How it ships: CI workflows, Dockerfiles, compose files, release scripts.
5. What it talks to: SDK imports, HTTP clients, env var NAMES in examples
   (never read real .env values), webhooks.
6. Where data lives: schemas, migrations, files, caches, buckets.
7. With git: `git log -20 --format='%cs %s' -- <subdir or .>`. The commit you
   map is `source.commit` from step 0.

## 2. Write the map, citing as you go

Write `<work>/data/apps/<id>.json` per AUTHORING.md: 12-24 parts, every
outside service as its own part, the release path, where data lives, and 4-6
walkthroughs that follow real flows end to end. Put the `source` block from
step 0 in it unchanged. Every part, link and walkthrough step carries
`evidence: [{file, lines:[a,b], note}]` with tight ranges you have opened;
`lines` is required. Never cite a range you have not read. A claim you cannot
cite is either left out or marked unverified (it is then drawn dashed); the
checker rejects an uncited claim that is not marked. Status: `built` for what
the code has, `planned` for what docs promise and the code lacks (cite the
doc); `live` only after a read-only check that it answers (a public URL, a CI run).

For a first layout, `node $T/autolayout.mjs <in.json> <out.json>` places
parts and routes links from a JSON without coordinates (AUTHORING.md, "First
layout by machine"); hand-tune after, or lay it out by hand if the result is
much larger than 1500 x 1000.

## 3. Check it

`<root>` is `root` from step 0.

```bash
node $T/validate.mjs <id> --work <work> --repo <root>      # 0 errors: at the mapped commit, cited files in it, lines in range, brands in the logo table
node $T/shot.mjs <id> map --work <work>                    # open the PNG and look; fix and repeat
node $T/shot.mjs <id> overview --work <work>
node $T/mechanical.mjs <id> --work <work> --repo <root>    # links whose citations never name the other end, to look at
```

Look for overlaps, lines through parts or place titles, labels far from their
line, text cut off with "…", chip texts running into each other, cramped or
empty areas. Repeat until it reads cleanly. Fix the validator's warnings too
unless there is a reason not to. When `mechanical.mjs` flags a link whose cited
lines do show the connection, give the part it could not find a `"sig"` (the
words that name it in code); when they do not, fix the citation.

## 4. Refute pass

```bash
node $T/refute.mjs claims <id> --work <work>     # writes one claims file per checker and prints the paths
```

Hand each claims file and the repo to an independent checker: a subagent that
did not write the map and is not shown your notes. Tell it to DISPROVE every
claim against its cited lines and write a verdict file,
`{"checker": "<name>", "verdicts": [{"id", "hash", "verdict", "note", "fix"}]}`,
with `id` and `hash` copied from the claims file and `verdict` one of
`confirmed`, `wrong` (say what is true in `fix`) or `unverified`.

Then fix or remove every claim judged wrong, and get fresh verdicts for the
ones you changed (`refute.mjs claims <id> --work <work> --pending <verdict files>`
lists exactly those). Finish with:

```bash
node $T/refute.mjs apply <id> <every verdict file> --work <work>
```

It only succeeds when every claim in the map has a verdict for its current
wording. It then marks the unverified ones (drawn dashed in amber), sets
`source.refuted` and `source.refute`, and saves the verdicts in
`<work>/data/refute/<id>.json`. Never set `source.refuted` by hand, and do not
edit a claim after this step without re-checking it: the validator rejects both.

If you cannot start separate checkers (this agent has no subagents), do the
pass yourself as a second, fresh read of every cited range, write the verdict
file, and add `--self` to `apply`. The page then says the map was re-read by
its author, not independently checked. If you skip the pass, leave
`source.refuted` unset; the page says no second check was run.

Re-run `validate.mjs` (with `--stamp` in `folder` mode).

## 5. Hand it over

```bash
node $T/build.mjs --work <work>                         # <work>/dist/index.html + assets
node $T/single.mjs <work>/<id>.html --work <work>       # one self-contained file
```

Add or update this map in `<work>/projects.json` (`path` is `target` from step
0, `commit` is `source.commit` or null). Open `<work>/dist/index.html` (the
home page lists every system; the new one is in its category), give the path,
and a short summary: what the app is, what was mapped (whole repo, one folder,
or a folder with no git), its main flow, claims made / confirmed / fixed /
removed / unverified, how it was checked (independent, self, or not at all),
and evidence coverage (validate prints it).
