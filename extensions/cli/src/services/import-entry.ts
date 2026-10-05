import { dirname, join, resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { identifyNodeType } from "../models/layout.js";
import { InternalNode } from "../models/internal-node.js";
import { indexContract } from "./node-layout.js";
import { checkPath } from "./node-files.js";
/** Business adapters may import an unclassified external entry, but never retype a known domain. */
export function assertImportType(rawSource: string, expected: string): string {
  const source = checkPath(resolve(rawSource));
  const parent = join(dirname(dirname(source)), "AGENTS.md");
  const contract = existsSync(parent)
    ? indexContract(
        new InternalNode(parent).parse(readFileSync(parent, "utf8")),
      )
    : undefined;
  const type = identifyNodeType(source, contract);
  if (type !== expected && type !== "leaf")
    throw new Error(
      `${source}: source type ${type ?? "unknown"} cannot be imported as ${expected}`,
    );
  return source;
}
