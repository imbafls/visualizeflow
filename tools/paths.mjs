// Where things are. The renderer and tools live in the plugin; a run's data
// and output live in a work folder (default ~/visualizeflow, the person's page):
//   <work>/data/apps/<id>.json   the map
//   <work>/dist/                 the built page
//   <work>/.preview/<id>/        screenshots
// Pass --work <dir> (or set VF_WORK). <work>/data/meta.json overrides the
// plugin's statuses and categories when present.
import { existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

export const PLUGIN = join(dirname(fileURLToPath(import.meta.url)), "..");
export function takeArg(argv, name) {
  const i = argv.indexOf(name);
  if (i < 0) return undefined;
  const v = argv[i + 1]; argv.splice(i, 2); return v;
}
export const WORK = resolve(takeArg(process.argv, "--work") ?? process.env.VF_WORK ?? join(homedir(), "visualizeflow"));
export const META = existsSync(join(WORK, "data/meta.json")) ? join(WORK, "data/meta.json") : join(PLUGIN, "data/meta.json");
export const SRC = process.env.VF_SRC ? resolve(process.env.VF_SRC) : join(PLUGIN, "renderer");
// Everything the page loads besides index.html. Nothing comes from the network.
export const ASSETS = ["app.js", "styles.css", "fonts.css", "favicon.svg", "fonts/geist.woff2", "fonts/geist-mono.woff2"];
