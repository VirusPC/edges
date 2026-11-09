import { existsSync } from "node:fs";
import { isAbsolute, relative, resolve, sep, basename, join, normalize } from "node:path";
import { ENTRY_NAMES } from "./layout.js";
import { identifyNodeType } from "../models/node/layout.js";

/** Module names `--exclude` accepts. Orthogonal to node `--types`. */
export const EXCLUDABLE_MODULES = [
  "compose",
  "memory",
  "skills",
  "notes",
  "projects",
  "tasks",
  "routines",
] as const;

export type ExcludableModule = (typeof EXCLUDABLE_MODULES)[number];

const MODULE_LIST = EXCLUDABLE_MODULES.join(", ");

export function parseExcludedModules(values: readonly string[] | undefined): ReadonlySet<ExcludableModule> {
  const found = new Set<ExcludableModule>();
  if (!values || values.length === 0) return found;
  for (const value of values) {
    for (const part of value.split(",")) {
      const name = part.trim();
      if (!name)
        throw new Error(`--exclude needs a module name. Expected ${MODULE_LIST}.`);
      if (!(EXCLUDABLE_MODULES as readonly string[]).includes(name))
        throw new Error(`Unknown module in --exclude: ${name}. Expected ${MODULE_LIST}.`);
      found.add(name as ExcludableModule);
    }
  }
  return found;
}

/** Material boundaries along a relative composition path, including nested Projects. */
function moduleSegments(parts: readonly string[]): string[] {
  let index = parts[0] === ".edges" ? 1 : 0;
  const modules: string[] = [];
  while (index < parts.length) {
    const name = parts[index]!;
    if (!(EXCLUDABLE_MODULES as readonly string[]).includes(name)) break;
    modules.push(name);
    if (name !== "projects" || !parts[index + 1] || parts[index + 1] === ENTRY_NAMES.readme) break;
    index += 2;
    if (parts[index] === ".edges") index++;
  }
  return modules;
}

/** True when an excluded material contains `file` within the selected composition. */
export function pathHitsExcludedModule(
  file: string,
  scopeDir: string,
  exclude: ReadonlySet<string> | undefined,
): boolean {
  if (!exclude || exclude.size === 0) return false;
  const rel = relative(scopeDir, file);
  if (!rel || rel.startsWith("..") || isAbsolute(rel)) return false;
  const parts = rel.split(sep);
  return moduleSegments(parts).some((name) => exclude.has(name));
}

/**
 * A composed checkout is `<scope>/.edges/compose/<name>/…`.
 * The module entry `<scope>/.edges/compose/README.md` is not a checkout.
 */
export function composedCheckoutRoot(file: string): string | undefined {
  const parts = normalize(file).split(sep);
  for (let i = 1; i < parts.length - 1; i++) {
    if (isHarnessComposeDir(parts.slice(0, i).join(sep), parts[i]!) && parts[i + 1] && parts[i + 1] !== ENTRY_NAMES.readme)
      return parts.slice(0, i + 2).join(sep);
  }
  return undefined;
}

export function isInsideComposedCheckout(file: string): boolean {
  const root = composedCheckoutRoot(file);
  if (!root) return false;
  const rel = relative(root, normalize(file));
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

/** The scope's own `.edges/<module>` directory, or that module at the scope root (super). */
export function isScopeModuleDir(
  parentDir: string,
  name: string,
  scopeDir: string,
): boolean {
  if (!(EXCLUDABLE_MODULES as readonly string[]).includes(name)) return false;
  const parent = resolve(parentDir);
  if (parent === resolve(join(scopeDir, ".edges")) || parent === resolve(scopeDir)) return true;
  const rel = relative(scopeDir, parent);
  if (rel.startsWith("..") || isAbsolute(rel)) return false;
  const parts = rel.split(sep);
  if (parts.at(-1) === ".edges") parts.pop();
  const prefix = parts[0] === ".edges" ? 1 : 0;
  // The direct modules of P, P/projects/Q, etc. obey the same exclusion policy.
  return parts.length > prefix && (parts.length - prefix) % 2 === 0 &&
    parts.slice(prefix).every((part, index) => index % 2 !== 0 || part === "projects");
}

export function isHarnessComposeDir(parentDir: string, name: string): boolean {
  if (name !== "compose") return false;
  if (basename(parentDir) === ".edges") return true;
  if (identifyNodeType(join(parentDir, ENTRY_NAMES.leaf)) === "project") return true;
  // Super face: <scope>/compose next to AGENTS.md, not under .edges.
  return existsSync(join(parentDir, ENTRY_NAMES.internal));
}
