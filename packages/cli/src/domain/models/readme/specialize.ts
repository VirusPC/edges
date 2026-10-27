import { basename, dirname } from "node:path";
import { ENTRY_NAMES } from "../../config/layout.js";
import { ComposeReadmeNode } from "../compose/compose-readme-node.js";
import { ReadmeNode } from "./readme-node.js";

/** A module entry README that adds behavior by subclassing ReadmeNode. */
export interface ReadmeEntryModel {
  matches(file: string): boolean;
  model: new (file: string) => ReadmeNode;
}

/** True for `<scope>/.edges/compose/README.md`, including a composed repo's own entry. */
export function isComposeEntryReadme(file: string): boolean {
  return basename(file) === ENTRY_NAMES.readme
    && basename(dirname(file)) === "compose"
    && basename(dirname(dirname(file))) === ".edges";
}

/**
 * Module entry READMEs specialized by subclass. Add a row to give another
 * module its own entry node. This is not a plugin loader.
 */
export const README_ENTRY_MODELS: readonly ReadmeEntryModel[] = [
  { matches: isComposeEntryReadme, model: ComposeReadmeNode },
];

export function readmeModelFor(file: string): new (file: string) => ReadmeNode {
  return README_ENTRY_MODELS.find((entry) => entry.matches(file))?.model ?? ReadmeNode;
}

export function createReadmeNode(file: string): ReadmeNode {
  const Model = readmeModelFor(file);
  return new Model(file);
}
