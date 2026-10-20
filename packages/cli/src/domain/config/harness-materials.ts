import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

export type HarnessMaterial = {
  id: string;
  path: string;
  optional?: boolean;
};

export type HarnessMaterialsConfig = {
  materials: HarnessMaterial[];
};

const CONFIG_PATH = join(dirname(fileURLToPath(import.meta.url)), "harness-materials.json");

function assertMaterial(raw: unknown, index: number): HarnessMaterial {
  if (!raw || typeof raw !== "object") {
    throw new Error(`harness-materials.json materials[${index}] must be an object`);
  }
  const { id, path: materialPath, optional } = raw as Record<string, unknown>;
  if (typeof id !== "string" || id.trim() === "") {
    throw new Error(`harness-materials.json materials[${index}].id must be a non-empty string`);
  }
  if (typeof materialPath !== "string" || materialPath.trim() === "") {
    throw new Error(`harness-materials.json materials[${index}].path must be a non-empty string`);
  }
  if (optional !== undefined && typeof optional !== "boolean") {
    throw new Error(`harness-materials.json materials[${index}].optional must be a boolean when set`);
  }
  return {
    id,
    path: materialPath,
    ...(optional === undefined ? {} : { optional }),
  };
}

export function loadHarnessMaterialsConfig(): HarnessMaterialsConfig {
  const parsed = JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as unknown;
  if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { materials?: unknown }).materials)) {
    throw new Error("harness-materials.json must be an object with a materials array");
  }
  const materials = (parsed as { materials: unknown[] }).materials.map(assertMaterial);
  return { materials };
}

/**
 * This scope's own maintenance directory: `<scope>/.harness` when it exists.
 * A super node does not use this. The scope directory is already that node's harness.
 */
export function harnessRootForScope(scopeDir: string): string {
  const harness = join(scopeDir, ".harness");
  return existsSync(harness) ? harness : scopeDir;
}

export function resolveHarnessMaterial(
  scopeDir: string,
  id: string,
): { absPath: string; material: HarnessMaterial } | undefined {
  const cfg = loadHarnessMaterialsConfig();
  const material = cfg.materials.find((m) => m.id === id);
  if (!material) {
    throw new Error(`Unknown harness material id: ${id}`);
  }
  const absPath = join(scopeDir, material.path);
  if (existsSync(absPath)) {
    return { absPath, material };
  }
  if (material.optional) {
    return undefined;
  }
  throw new Error(`Required harness material missing: ${id} (expected ${absPath})`);
}

export function harnessMaterialById(id: string): HarnessMaterial {
  const material = loadHarnessMaterialsConfig().materials.find((m) => m.id === id);
  if (!material) throw new Error(`Unknown harness material id: ${id}`);
  return material;
}

/** Real systems place materials under `<scope>/.harness` even before that directory exists. Super places them in the scope directory. */
export function materialHarnessRoot(scopeDir: string, options: { super?: boolean } = {}): string {
  return options.super === true ? scopeDir : join(scopeDir, ".harness");
}

/** Join a harness root with a material path from config. The relative path is the only entry name. */
export function placedMaterialPath(
  scopeDir: string,
  materialPath: string,
  options: { super?: boolean } = {},
): string {
  return join(materialHarnessRoot(scopeDir, options), materialPath);
}

export function placeHarnessMaterial(
  scopeDir: string,
  id: string,
  options: { super?: boolean } = {},
): { material: HarnessMaterial; absPath: string } {
  const material = harnessMaterialById(id);
  return { material, absPath: placedMaterialPath(scopeDir, material.path, options) };
}

/** Last directory segment of the tasks material, e.g. `tasks` from `tasks/README.md`. */
export function tasksBoardDirName(): string {
  const materialPath = harnessMaterialById("tasks").path;
  const dir = dirname(materialPath);
  const name = basename(dir);
  if (dir === "." || name === "" || name === ".") {
    throw new Error(`tasks material path must include a directory: ${materialPath}`);
  }
  return name;
}

/** True when absPath is the tasks material for this scope, on the real harness or on super. */
export function isTasksBoardMaterial(absPath: string, scopeDir: string): boolean {
  const rel = harnessMaterialById("tasks").path;
  const norm = (file: string) => file.split(sep).join("/");
  const file = norm(absPath);
  return file === norm(join(scopeDir, ".harness", rel)) || file === norm(join(scopeDir, rel));
}

/** Materials at scope + configured path. For a super node, that scope directory is the harness. */
export function listHarnessMaterialAbsPaths(scopeDir: string): { id: string; absPath: string }[] {
  const cfg = loadHarnessMaterialsConfig();
  const out: { id: string; absPath: string }[] = [];
  for (const material of cfg.materials) {
    const hit = resolveHarnessMaterial(scopeDir, material.id);
    if (hit) out.push({ id: hit.material.id, absPath: hit.absPath });
  }
  return out;
}
