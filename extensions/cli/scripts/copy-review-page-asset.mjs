import { cpSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const from = path.join(root, "../src/tasks/project/assets");
const to = path.join(root, "../dist/tasks/project/assets");
mkdirSync(to, { recursive: true });
cpSync(from, to, { recursive: true });
