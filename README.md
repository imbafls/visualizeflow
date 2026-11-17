# visualizeflow

A Claude Code plugin that reverse-engineers a codebase into one interactive
architecture page: the parts you can click, the connections between them, and
step-by-step walkthroughs of how the app actually runs. Every part, connection
and walkthrough step cites the code it was inferred from (file and lines at a
fixed commit), and an independent checker tries to disprove every claim
before the map is handed over.

## Install

In Claude Code:

```
/plugin install visualizeflow --marketplace imbafls/visualizeflow
```

or, on older versions:

```
/plugin marketplace add imbafls/visualizeflow
/plugin install visualizeflow@visualizeflow
```

Then run `npm install` once in the installed plugin folder, or let the skill do it on first use.

## Use

Type `/visualizeflow` in a project. It reads the code (read only: nothing is
installed, built or run), adds the map to your page, checks it,
screenshots it until it reads cleanly, runs the refute pass, and builds a
page you can open or share as a single HTML file.

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
- **Evidence**: each claim lists `file:lines` with a note; on GitHub repos each
  one links to the exact lines at the mapped commit.
- **Unverified claims**: anything the checker could not confirm is drawn
  dashed in amber and says so.

## Layout

```
.claude-plugin/plugin.json   plugin manifest
skills/visualizeflow/SKILL.md the process Claude follows
AUTHORING.md                 the map schema, drawing rules and evidence rules
renderer/                    the page: template.html, app.js (incl. logo table), styles.css, favicon.svg
data/meta.json               statuses and categories
tools/validate.mjs           schema, geometry, logo and evidence checks (--repo checks cited files and line ranges)
tools/shot.mjs               headless screenshots (map, overview; can open a part, link or walkthrough step)
tools/build.mjs              builds <work>/dist/
tools/single.mjs             one self-contained HTML file
tools/mechanical.mjs         heuristic: flags links with no mechanical support in the code near them
tools/autolayout.mjs         first-draft layout with elkjs
examples/immich.json         a finished map with evidence
```

Every tool takes `--work <folder>` (default `./.visualizeflow`).

## Requirements

Node 20+. `npm install` in the plugin folder (elkjs, playwright-core).
Screenshots need a Chromium: playwright's, or an installed Chrome.

## Example

`examples/immich.json` maps [Immich](https://github.com/immich-app/immich) at
commit `ff445d5`: 21 parts, 22 connections, 6 walkthroughs, 158 citations.
Not affiliated with Immich.

## License

MIT
