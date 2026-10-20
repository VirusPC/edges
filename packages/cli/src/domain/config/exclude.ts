import { isAbsolute, relative, resolve, sep, basename, join, normalize } from "node:path";
import { ENTRY_NAMES } from "./layout.js";

/** Module names `--exclude` accepts. Orthogonal to node `--types`. */
export const EXCLUDABLE_MODULES = [
  "compose",
  "memory",
  "skills",
  "notes",
  "projects",
  "tasks",
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

/** True when `file` sits in one of `exclude` under `scopeDir` (`.harness/<module>` or a super `<module>`). */
export function pathHitsExcludedModule(
  file: string,
  scopeDir: string,
  exclude: ReadonlySet<string> | undefined,
): boolean {
  if (!exclude || exclude.size === 0) return false;
  const rel = relative(scopeDir, file);
  if (!rel || rel.startsWith("..") || isAbsolute(rel)) return false;
  const parts = rel.split(sep);
  const name = parts[0] === ".harness" ? parts[1] : parts[0];
  return !!name && exclude.has(name);
}

/**
 * A composed checkout is `<scope>/.harness/compose/<name>/…`.
 * The module entry `<scope>/.harness/compose/README.md` is not a checkout.
 */
export function composedCheckoutRoot(file: string): string | undefined {
  const parts = normalize(file).split(sep);
  for (let i = 0; i < parts.length - 2; i++) {
    if (parts[i] === ".harness" && parts[i + 1] === "compose" && parts[i + 2] && parts[i + 2] !== ENTRY_NAMES.readme)
      return parts.slice(0, i + 3).join(sep);
  }
  return undefined;
}

export function isInsideComposedCheckout(file: string): boolean {
  const root = composedCheckoutRoot(file);
  if (!root) return false;
  const rel = relative(root, normalize(file));
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

/** The scope's own `.harness/<module>` directory, or that module at the scope root (super). */
export function isScopeModuleDir(
  parentDir: string,
  name: string,
  scopeDir: string,
): boolean {
  if (!(EXCLUDABLE_MODULES as readonly string[]).includes(name)) return false;
  const parent = resolve(parentDir);
  return parent === resolve(join(scopeDir, ".harness")) || parent === resolve(scopeDir);
}

export function isHarnessComposeDir(parentDir: string, name: string): boolean {
  return name === "compose" && basename(parentDir) === ".harness";
}
