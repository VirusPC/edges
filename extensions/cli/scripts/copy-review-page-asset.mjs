import { cpSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const from = path.join(root, "../src/commands/tasks/project/assets");
const to = path.join(root, "../dist/commands/tasks/project/assets");
mkdirSync(to, { recursive: true });
cpSync(from, to, { recursive: true });

const materialsFrom = path.join(root, "../src/domain/config/harness-materials.json");
const materialsToDir = path.join(root, "../dist/domain/config");
mkdirSync(materialsToDir, { recursive: true });
cpSync(materialsFrom, path.join(materialsToDir, "harness-materials.json"));
