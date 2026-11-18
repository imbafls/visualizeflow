# visualizeflow

A Claude Code plugin that reverse-engineers a codebase into one interactive
architecture page: the parts you can click, the connections between them, and
step-by-step walkthroughs of how the app actually runs. Every part, connection
and walkthrough step cites the code it was inferred from (file and lines at a
fixed commit), and independent checkers try to disprove every claim before the
map is handed over. The page says how far each map was checked.

It works on a whole git repo, on one folder inside a repo, and on a plain
folder with no git.

## Quick start (Claude Code)

You need [Claude Code](https://claude.com/claude-code), Node 20+ and Chrome (or Chromium).

**1. Install it.** Paste this into Claude Code:

```
/plugin install visualizeflow --marketplace imbafls/visualizeflow
```

<details><summary>Older Claude Code versions</summary>

```
/plugin marketplace add imbafls/visualizeflow
/plugin install visualizeflow@visualizeflow
```

</details>

Then restart Claude Code.

**2. Map a project.** Open Claude Code in any repo and run:

```
/visualizeflow
```

Or just ask in your own words:

```
Map how this codebase works with visualizeflow, with walkthroughs of its main flows.
```

**3. Open your page.** When it finishes, it opens `~/visualizeflow/dist/index.html`. Every project
you map is added to that one page. To see it again later:

```
/visualizeflow page
```

On first use it runs `npm install` inside the plugin folder (two dependencies), and it uses your
installed Chrome to screenshot the map while checking it. A medium-sized repo takes about 20-40 minutes, mostly reading code and
checking claims.

## Other AI coding tools

visualizeflow is plain instructions plus a few Node tools, so any coding agent that can read files and
run commands can use it. These are tools you run on your own computer, inside a project.

### OpenAI Codex CLI

Run in a terminal:

```
codex plugin marketplace add imbafls/visualizeflow
codex plugin add visualizeflow@visualizeflow
```

Then, in Codex inside any project:

```
Use the visualizeflow skill to map how this codebase works, with walkthroughs of its main flows.
```

### Gemini CLI

```
gemini extensions install https://github.com/imbafls/visualizeflow
```

Then, in Gemini CLI inside any project:

```
Use the visualizeflow skill to map how this codebase works, with walkthroughs of its main flows.
```

### Grok Build, Cursor, GitHub Copilot, Windsurf, Cline, and any other agent

Paste this one prompt into the agent, inside the project you want mapped. It sets everything up
the first time and reuses it after that:

```
Set up and run visualizeflow on this repository:
1. If ~/.visualizeflow-plugin does not exist, run: git clone https://github.com/imbafls/visualizeflow ~/.visualizeflow-plugin
   Otherwise run: git -C ~/.visualizeflow-plugin pull
2. Run npm install inside ~/.visualizeflow-plugin
3. Read ~/.visualizeflow-plugin/skills/visualizeflow/SKILL.md and follow it exactly to map this
   repository. PLUGIN in that file means ~/.visualizeflow-plugin.
Work read only on this repository: do not install, build or run anything in it.
```

| Tool | How | Tested |
| ---- | --- | ------ |
| Claude Code | plugin (Quick start above) | yes |
| OpenAI Codex | plugin (`codex plugin add`) | yes |
| Gemini CLI | extension | not yet |
| Grok Build, Cursor, Copilot, Windsurf, Cline | the prompt above | not yet |

Chat apps without access to your files (ChatGPT, Gemini or Grok on the web) can't run it. They can
open the page it makes, though.

## Use

Type `/visualizeflow` in a project, or `/visualizeflow <path>` for another
folder. It reads the code (read only: nothing is installed, built or run),
adds the map to your page, checks it, screenshots it until it reads cleanly,
runs the refute pass, and builds a page you can open or share as a single
HTML file.

## What you can point it at

It first looks at what it was given (`tools/detect.mjs`) and picks the route:

| You point it at | What you get |
| --------------- | ------------ |
| The root of a git repo | A map of the whole repo, pinned to the current commit. |
| A folder inside a repo | A map of that folder only, pinned to the commit. The rest of the repo shows up as outside parts where the folder touches it. |
| A folder with no git (or no commits yet) | A map with file-and-line citations and no links. A fingerprint of each cited file is saved in place of a commit, so the next run can tell what changed. |
| A folder that holds several repos | It lists them and asks which one to map. |
| Something it mapped before | It updates that map and says what changed since. |

Citations link to the exact lines at the mapped commit on GitHub, GitLab and
Bitbucket. With another host, no remote, or no git, they are shown as file
and lines. It also tells you when the commit is not pushed yet (links would
404) and when files have uncommitted changes (lines may be off).

## One page for all your systems

Every map goes into your own page (`~/visualizeflow` by default). It builds into one site with a home
page that groups your systems into categories you choose, a search box, and a "Go to" menu.
Running `/visualizeflow` again in a project you mapped before updates its map.
`/visualizeflow here` makes a one-off page inside the project instead, and `/visualizeflow page` rebuilds and opens the page.

The page works on phones. The map and its panel share one screen, you can pinch to zoom, and
walkthroughs step through it with the Back and Next buttons always in reach.

## What is in a map

- **Parts**: running components, data stores and outside services, grouped
  by where they run, each with a logo, a status and a plain-language "what it
  does".
- **Connections**: drawn as straight-routed lines with short labels; clicking
  one shows its evidence.
- **Walkthroughs**: 4-6 real flows (a user action, a background job, a
  release) played step by step across the map.
- **Evidence**: each claim lists `file:lines` with a note; on GitHub, GitLab
  and Bitbucket repos each one links to the exact lines at the mapped commit.
- **Unverified claims**: anything a checker could not confirm, or the author
  could not cite, is drawn dashed in amber and says so.

## How a map is checked

- **By the validator, every time.** With the code at hand it fails the map
  unless the repo is at the mapped commit, every cited file is part of that
  commit, every cited line range exists, and every claim either cites code or
  is marked unverified.
- **By the refute pass.** Checkers that did not write the map try to disprove
  each claim against its cited lines. `tools/refute.mjs` hands out the claims
  and only marks the map as checked when every claim has a verdict; the
  verdicts are saved next to the map. Editing a claim afterwards voids the mark
  until that claim is re-checked.
- **The page says which it was.** "Confirmed by a second, independent check",
  "re-read by its author" (agents that cannot start separate checkers), or
  "no second check has been run".

What this does not do: the validator cannot tell whether cited lines really
show the claim. That judgement is the refute pass, which is done by an AI
checker and can be wrong. Treat the map as a well-cited guide, and follow the
links.

## Layout

```
.claude-plugin/plugin.json   plugin manifest
skills/visualizeflow/SKILL.md the process Claude follows
AUTHORING.md                 the map schema, drawing rules and evidence rules
renderer/                    the page: template.html, app.js (incl. logo table), styles.css, fonts, favicon.svg
data/meta.json               statuses and categories
tools/detect.mjs             the router: repo, folder in a repo, plain folder or workspace, and the source block to use
tools/validate.mjs           schema, geometry, logo and evidence checks (--repo checks the commit, cited files and line ranges)
tools/refute.mjs             hands out claims to checkers and records their verdicts
tools/shot.mjs               headless screenshots (map, overview; can open a part, link or walkthrough step)
tools/build.mjs              builds <work>/dist/
tools/single.mjs             one self-contained HTML file (fonts included; loads nothing from the network)
tools/mechanical.mjs         heuristic: flags links whose citations never name the part they connect to
tools/autolayout.mjs         first-draft layout with elkjs
tools/strip.mjs              drops the coordinates from a map, to lay it out again
tools/test.mjs               tests for the tools (npm test)
examples/immich.json         a finished map with evidence
```

The tools that read a map take `--work <folder>` (default `~/visualizeflow`,
or `VF_WORK`).

## Requirements

Node 20+. `npm install` in the plugin folder (elkjs, playwright-core).
Screenshots need a Chromium: playwright's, or an installed Chrome. Git is
needed for repos; a plain folder works without it. The page it builds loads
nothing from the network: its fonts (Geist, SIL Open Font License) are included.

## Example

`examples/immich.json` maps [Immich](https://github.com/immich-app/immich) at
commit `ff445d5`: 21 parts, 22 connections, 6 walkthroughs, 162 citations.
`examples/immich.refute.json` is the record of its refute pass: 76 claims,
each with the verdict an independent checker gave it.
Not affiliated with Immich.

## License

MIT
