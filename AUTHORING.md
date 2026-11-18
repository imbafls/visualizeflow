# Writing a map (visualizeflow)

One map per app: `<work>/data/apps/<id>.json`. An app that does not work end to end
yet can instead be a card in `<work>/data/in-progress/<id>.json` (see the end).


`examples/immich.json` is a complete example with evidence; read it first for shape, layout and citation style.

Check every claim yourself, read only. Never change anything to make the page,
and never put a key, token, password or private URL credential on it.

## Working app: `data/apps/<id>.json`

| Field | What |
| ----- | ---- |
| `id` | short lowercase, same as the file name |
| `name` | the name its makers use |
| `code` | 2 capital letters, unique across apps (node codes become `NS-01`, ...) |
| `category` | `apps` (categories are in the plugin's `data/meta.json`; a work folder may override it) |
| `order` | position inside its category (1 = first) |
| `checked` | the day it was checked, like `16 Nov 2026` |
| `depth` | `"in depth"` |
| `summary` | 2-4 plain sentences: what it is, who it is for, what it runs on, the one thing that matters most today |
| `facts` | 4-6 `[label, value]` pairs: `Live at`, `Stack`, `Hosting`, `Releases`, `Last commit`, ... |
| `caveat` | exactly what was checked today and how, and what could not be checked |
| `blockers` | optional: node ids the app is waiting on (shown as chips on the overview) |
| `blockersLabel` | optional heading for them, default "Waiting on" |
| `view` | same as `arch.view` |
| `zones` | `[{label, tag}]`: where parts run. `tag` is one of `device`, `service`, `third party`, `release`, `network`, `content`, `repo` (the rest of the repo, in a map of one folder). A node's `zone` is an index into this list; the overview groups parts by it |
| `nodes` | the parts (below) |
| `edges` | every connection as `{from, to, label, pending}`; the side panel's "Talks to" list reads this. Keep it in step with `arch.links`: one edge per link with the same from/to/label/pending |
| `arch` | the drawing (below) |

### Nodes

```json
{"id":"ns-db","kind":"store","zone":1,"x":716,"y":128,"w":250,"h":64,
 "brand":"supabase","label":"Salon database","sub":"Postgres · 25 migrations · RLS",
 "status":"live",
 "what":"What this part does, in plain words, 1-3 sentences.",
 "state":"What was seen today: running, answering, last run green, version...",
 "where":"code path, repo, CT, account or URL (no secrets)",
 "checked":"16 Nov · how (e.g. curl /api/health, gh run list, pvectl ls)"}
```

- Node ids: a short prefix for the app, then a word (`ns-db`, `ns-site`).
- `kind`: `core` (the heart of the app; may hold `chips`, a list of
  `[name, note]` sub-features drawn inside it, ~30px each), `component`
  (a running part), `store` (data: drawn as a cylinder), `external` (someone
  else's service: drawn as a pill).
- `brand`: a logo key from `var BR` in `renderer/app.js` (the validator lists them).
  Use the generic ones (`globe`, `server`, `terminal`, `laptop`, `loop`,
  `plug`, `chip`, `file`, `mic`, `graph`, `shield`, `key`, `film`, `chart`,
  `spark`, `wrench`, `branch`, `download`, `camera`) when no brand fits.
- `sig`: optional list of words that name this part in code (`"sig": ["predict", "immich_ml"]`).
  `tools/mechanical.mjs` looks for them in the lines a link cites; add it when a
  part's file names and label are too generic to search for.
- When the map is made by reading code only: `state` says what the code shows,
  `where` is the path, and `checked` is the day plus "read the code".
- `status`: `live` (running and confirmed by a check today), `ready` (account
  or key exists, not in use), `built` (code done, not deployed or switched
  off), `pending` (needs a setup step), `paused` (stopped on purpose),
  `planned` (decided, not built), `notes` (not checked; from older notes).
  Never mark `live` without a check today.
- 12-24 parts for a whole app (a map of one folder may have fewer; never pad).
  Show the real moving parts and every outside service it
  depends on, the release path, and where data lives. Not every file.

### The drawing: `arch`

```json
"arch": {
  "view": [1258, 836],
  "regions": [
    {"id":"vc","kind":"place","label":"Vercel","x":16,"y":40,"w":660,"h":560},
    {"id":"app","kind":"container","label":"LN Nails & Spa site","sub":"Next.js 16","x":36,"y":80,"w":590,"h":440}
  ],
  "links": [
    {"id":"l-site-db","from":"ns-site","to":"ns-db","label":"reads menu, hours",
     "pts":[[180,128],[180,98],[800,98],[800,128]],"main":true,"pending":false,
     "lx":560,"ly":94,"anchor":"middle"}
  ],
  "features": [
    {"id":"visit","name":"A guest visits","status":"live","tag":"live",
     "line":"One sentence: what this flow is.",
     "steps":[["ns-domain","What happens at this part, one sentence."],["ns-vercel","..."]],
     "links":["l-domain-vercel","l-vercel-site"]}
  ],
  "captions": [{"x":1022,"y":120,"lines":["Short note,","3-4 lines max."]}]
}
```

- `view`: about 1200-1500 wide, 700-1000 high.
- `regions`: one `place` per zone, same label, laid out as columns or rows
  with 16-20px gaps; parts sit wholly inside their place. A `container` is
  an optional box around parts that ship together (one app, one CT); its
  label sits on its top edge, so leave ~20px above its first part. A
  `group` is a labelled box links may point at as a whole (`from`/`to` its id).
  A link to a group has no entry in `edges` (edges join parts only), so give
  each part in the group at least one link of its own.
- Parts: about 200-260 wide, 52-64 high (a `core` with chips taller). Keep
  at least 24px between parts and line up their x and y on a grid; tidy
  rows and columns read best.
- `links`: every segment is straight across or straight down (no
  diagonals). The first point sits on the edge of `from`, the last on the
  edge of `to`; the arrow is drawn at the last point. Route around parts,
  not through them, using the gaps and the space between places. `main`
  marks the app's main path (drawn brighter). `pending: true` draws it dashed
  ("not connected yet").
- Link labels: 1-4 words, placed with `lx`/`ly` (text baseline) in clear
  space next to the line, `anchor` `start`/`middle`/`end`. The label box is
  ~6.6px per character wide and 17px high, sitting from `ly-12` to `ly+5`.
- `features` are the walkthroughs, the best part of the page: 4-6 real
  flows (2-3 for a small folder), how the app runs end to end (a user does X; a release ships; a
  nightly job runs; data comes back). 3-7 steps each, in order, each step a
  part and one sentence of what happens there. `links` lists the links the
  flow travels along. `status` is the flow's status; `tag` its pill text.
- `captions`: optional short notes in empty space.

### Check it

```bash
node tools/validate.mjs <id> --work <work> --repo <root>   # must end with 0 errors; fix warnings too unless there is a reason
node tools/shot.mjs <id> map --work <work>          # prints a PNG path: open it and look
node tools/shot.mjs <id> overview --work <work>
```

`<root>` is the repo root, or the folder itself when there is no git;
`node tools/detect.mjs <path>` prints it.

Look at the PNG for: parts or labels on top of each other, lines through
parts, labels far from their line, text cut off ("…" means a label or
sub is too long for its box), empty or cramped areas. Fix and shoot again
until it reads cleanly.

### First layout by machine

`node tools/autolayout.mjs <in.json> <out.json>` places everything, so the
input carries no coordinates: nodes without `x/y/w/h`, links without
`pts/lx/ly/anchor`, captions as `{"lines": [...]}`, no `view` and no `place`
regions (one is made per zone). A container or group is given as
`{"id", "kind": "container" | "group", "label", "sub", "members": [node ids]}`.
It is a first draft: look at the screenshot, and lay the map out by hand when
the result is larger than about 1500 x 1000 or hard to read.

## In progress: `data/in-progress/<id>.json`

```json
{"id":"myapp","name":"My App","category":"apps","stage":"building",
 "checked":"16 Nov 2026",
 "summary":"2-3 sentences: what it is meant to be and where it stands.",
 "facts":[["Repo","owner/repo"],["Stack","..."],["Last commit","15 Nov 2026"]],
 "works":["What works today, one line each (may be empty)."],
 "left":["What is left before it works end to end, one line each."]}
```

`stage`: `building` (active, commits in the last ~3 weeks), `stalled`
(no work in 3+ weeks but meant to continue), `parked` (set aside on purpose).

## In progress, with a map

An app that already has a map but does not work end to end yet keeps its
`data/apps/<id>.json` and adds `"stage"`, `"works"` and `"left"` (same meaning
as above). It is then listed under In progress, not in the category tabs, and
its card links to its map. Remove the three fields when it works.

## Evidence (reverse-engineering mode)

When the map is made from code, every claim cites the code it was inferred
from. `node tools/detect.mjs <path>` looks at what you were pointed at and
prints the `source` block to put in the app, unchanged. It is one of:

```json
"source": {"repo": "owner/name", "url": "https://github.com/owner/name", "host": "github", "commit": "<full 40-char hash>"}
"source": {"repo": "owner/name", "url": "...", "host": "github", "commit": "<hash>", "subdir": "server"}
"source": {"name": "myapp", "commit": "<hash>"}
"source": {"local": true, "name": "myapp"}
```

| Field | What |
| ----- | ---- |
| `commit` | The commit that was read. Required unless `local`. |
| `repo`, `url`, `host` | Where the repo lives. `host` is `github`, `gitlab`, `bitbucket` or `other`; each citation links to its lines at the commit on the first three. Without `url`, or with `other`, citations are shown without links. |
| `name` | What to call the code when there is no `repo` (a repo with no remote, or a plain folder). |
| `subdir` | The map is of this one folder inside the repo. Evidence paths still start at the repo root. |
| `local` | A folder with no commit (no git, or no commits yet). Citations are file and lines as read. |
| `dirty` | The working copy had uncommitted changes when it was read. |
| `hashes`, `stamped` | Written by `validate.mjs --stamp` for a `local` map: a fingerprint of each cited file, so a later run can tell which changed. |
| `refuted`, `refute` | Written by `tools/refute.mjs apply`, never by hand (below). |

Then each **part**, each **link** in `arch.links`, and each **walkthrough
step** carries evidence:

```json
"evidence": [{"file": "server/src/services/job.service.ts", "lines": [120, 164], "note": "queues thumbnail jobs after upload"}]
```

- `file` is relative to the root `detect.mjs` printed (the repo root, even for
  a map of one folder; the folder itself when there is no git), forward
  slashes. `lines` is required: `[first, last]`, 1-based, and tight: the lines
  that show the claim, not the whole file. `note` says in a few words what
  those lines show.
- A walkthrough step is `[nodeId, "text", [evidence...]]`.
- 1-3 citations per claim is right. Cite code over docs; docs only when the
  claim is about intent or deployment.
- A claim you cannot cite is left out, or marked unverified: `"unverified": true`
  on a part or link, a 4th element `"unverified"` on a step. It is drawn dashed
  in amber and says so. An uncited claim that is not marked is an **error**.
- In a map of one folder (`subdir`):
  - Parts inside the folder are drawn as usual, and every claim about them
    cites at least one place inside the folder.
  - Code elsewhere in the repo that the folder calls, or that calls it (the
    server that posts to it, the compose file that runs it, the workflow that
    builds it), is one part each in a zone "Rest of the repo" with tag `repo`.
    Use `kind` `component` or `store` for these; `external` is for someone
    else's service. Claims about them cite where the two meet: the line in the
    folder that reaches out or receives the call, and the outside code that
    makes the call when that is what shows it.
  - Draw as many parts and walkthroughs as the folder really has. Do not pad
    to reach a count, and do not cite a file just to have one inside the folder.
- Status for code you did not run: `built` ("In the code"); `planned`
  for what the docs promise but the code doesn't have; never `live`.

`node tools/validate.mjs <id> --work <work> --repo <root>` checks, as errors:
the repo is at `source.commit` (and `<root>` is its root); every cited file
exists, is part of that commit, and has the cited lines; every citation has
`lines`; every unmarked claim has evidence; `refuted` matches a refute record.
As warnings: cited files with uncommitted changes, one range cited by many
claims, a built part that cites only docs, a folder-map claim that cites
nothing inside the folder, and (for `local`) cited files that changed since
the map was stamped.

### Write for a newcomer first

- `summary` opens with one sentence a non-engineer understands ("Ollama lets you
  download an AI chat model and run it on your own laptop."), then the technical
  sentences.
- Walkthrough steps say what happens in user terms first, then the code name:
  "The server finds the model you asked for and starts a worker to run it
  (ChatHandler → scheduleRunnerForModel)."
- Avoid unexplained acronyms in `label`, `line` and step text; keep them for `sub`,
  `state` and evidence notes.

### Refute pass

After authoring, checkers that did not write the map read each cited range and
try to disprove the claim. The pass is recorded, not just declared:

```bash
node tools/refute.mjs claims <id> --work <work>                      # one claims file per checker
node tools/refute.mjs claims <id> --work <work> --pending v1.json    # only what is still open
node tools/refute.mjs apply <id> v1.json v2.json ... --work <work>   # add --self when no independent checker exists
```

A checker writes `{"checker": "name", "verdicts": [{"id", "hash", "verdict", "note", "fix"}]}`
with `id` and `hash` copied from its claims file and `verdict` one of
`confirmed`, `wrong`, `unverified`. Claims judged wrong are fixed or removed
by the author, and a fixed claim needs a fresh verdict (its hash changed).
`apply` succeeds only when every claim has a `confirmed` or `unverified`
verdict for its current wording. It marks the unverified ones, sets
`"refuted": true` (or `"self"`) and a `"refute"` record holding a fingerprint
of everything that was checked, and saves the verdicts in
`<work>/data/refute/<id>.json`.

The page words itself from that: `true` says each claim was confirmed by a
second, independent check; `"self"` says the author re-read it; unset says no
second check was run. Editing a claim, a citation or an unverified mark after
the pass makes the validator fail until the changed claims are re-checked.
