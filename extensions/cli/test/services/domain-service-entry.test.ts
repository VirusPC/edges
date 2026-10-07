import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
import { getNote } from "../../src/services/notes/service.js";
import { getProject } from "../../src/services/projects/service.js";
import { createManagedSkill } from "../../src/services/skills/service.js";
import { initMemory, migrateMemory } from "../../src/services/memory/service.js";
import { initMemory as initMemoryFromModule } from "../../src/services/memory/init.js";
import { updateTask } from "../../src/services/tasks/service.js";
import { updateTask as updateTaskFromModule } from "../../src/services/tasks/write.js";
import { loadServerEnv } from "../../src/services/artifacts/service.js";
import { loadServerEnv as loadServerEnvFromModule } from "../../src/services/artifacts/server/env.js";
import { buildSystemForest } from "../../src/services/forest/service.js";
import { buildSystemForest as buildSystemForestFromModule } from "../../src/services/node/system-forest-service.js";

test("note and project services reject paths outside their leaf folder", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "edges-domain-service-"));
  try {
    const env = { EDGES_SCOPE: root };
    await assert.rejects(() => getNote(env, "projects/x/INDEX.md"), /note path must be notes\/<stem>\/INDEX\.md/);
    await assert.rejects(() => getProject(env, "notes/x/INDEX.md"), /project path must be projects\/<stem>\/INDEX\.md/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("domain service entry re-exports the module implementation", () => {
  assert.equal(initMemory, initMemoryFromModule);
  assert.equal(typeof migrateMemory, "function");
  const memoryService = readFileSync(path.resolve(here, "../../src/services/memory/service.ts"), "utf8");
  assert.match(memoryService, /import\("\.\/migrate\.js"\)/);
  assert.doesNotMatch(memoryService, /from ["']\.\/migrate\.js["']/);
  assert.equal(typeof createManagedSkill, "function");
  assert.equal(updateTask, updateTaskFromModule);
  assert.equal(loadServerEnv, loadServerEnvFromModule);
  assert.equal(buildSystemForest, buildSystemForestFromModule);
});

test("commands import services only through each module service.ts", () => {
  const root = path.resolve(here, "../../src/commands");
  const files = walk(root);
  const bad: string[] = [];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(/from ["']([^"']*\/services\/[^"']+)["']/g)) {
      if (!match[1]!.endsWith("/service.js")) bad.push(`${path.relative(root, file)}: ${match[1]}`);
    }
    for (const match of text.matchAll(/import\(["']([^"']*\/services\/[^"']+)["']\)/g)) {
      if (!match[1]!.endsWith("/service.js")) bad.push(`${path.relative(root, file)}: ${match[1]}`);
    }
  }
  assert.deepEqual(bad, []);
});

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(abs));
    else if (entry.name.endsWith(".ts")) out.push(abs);
  }
  return out;
}
