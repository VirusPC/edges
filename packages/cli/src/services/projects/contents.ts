import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { placeHarnessMaterial } from "../../domain/config/edges-materials.js";
import { ReadmeNode } from "../../domain/models/readme/readme-node.js";
import { HARNESS_BOARD_MODULES, harnessBoardSeed } from "../init/modules.js";
import { layerTypeSpecs, typeIndexTemplateName } from "../memory/types.js";
import { readIndexTemplate } from "../memory/templates.js";

const normalized = (source: string) => source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).join("\n");

/** Only unchanged generated indexes are scaffolding; authored prose and resources count. */
export function projectHasContents(scope: string, entry: string): boolean {
  const directory = path.dirname(entry);
  const options = { project: directory };
  const emptyIndexes = new Map<string, Set<string>>();
  for (const board of HARNESS_BOARD_MODULES) {
    const file = placeHarnessMaterial(scope, board.materialId, options).absPath;
    const body = board.body ?? harnessBoardSeed(board.title);
    emptyIndexes.set(file, new Set([
      normalized(new ReadmeNode(file).parse(body).serialize()),
      normalized(new ReadmeNode(file).create({ body, name: board.title, description: board.description }, { operation: "create" }).serialize()),
    ]));
  }
  for (const spec of layerTypeSpecs(scope, options)) {
    const file = path.join(scope, spec.indexFile);
    emptyIndexes.set(file, new Set([normalized(readIndexTemplate(typeIndexTemplateName(spec.name), spec.name, spec.description, {
      module: spec.module, format: spec.format, writable: String(spec.writable), gitignore: String(spec.gitignore),
    }))]));
  }
  function contains(dir: string): boolean {
    return readdirSync(dir, { withFileTypes: true }).some((item) => {
      const file = path.join(dir, item.name);
      if (file === entry && item.isFile()) return false;
      if (item.isDirectory()) return contains(file);
      if (!item.isFile()) return true;
      const seeds = emptyIndexes.get(file);
      return !seeds?.has(normalized(readFileSync(file, "utf8")));
    });
  }
  return contains(directory);
}
