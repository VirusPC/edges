import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
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

/** Harness root for a scope: `<scope>/.harness` when that directory exists, else `scopeDir`. */
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
  const absPath = join(harnessRootForScope(scopeDir), material.path);
  if (existsSync(absPath)) {
    return { absPath, material };
  }
  if (material.optional) {
    return undefined;
  }
  throw new Error(`Required harness material missing: ${id} (expected ${absPath})`);
}

/** Absolute paths for materials that currently exist under the scope harness root. */
export function listHarnessMaterialAbsPaths(scopeDir: string): { id: string; absPath: string }[] {
  const cfg = loadHarnessMaterialsConfig();
  const out: { id: string; absPath: string }[] = [];
  for (const material of cfg.materials) {
    const hit = resolveHarnessMaterial(scopeDir, material.id);
    if (hit) out.push({ id: hit.material.id, absPath: hit.absPath });
  }
  return out;
}
