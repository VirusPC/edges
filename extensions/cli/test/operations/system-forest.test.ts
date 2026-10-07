import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  collectSystemRoots,
  isProjectHarnessAgentsFile,
} from "../../src/domain/operations/system-forest.js";

const harnessAgents = `# Scope

<!-- project-harness-local:start -->
## 本层系统维护信息

<!-- project-harness-local:end -->
`;

const plainAgents = `# Plain

Just prose, no harness markers.
`;

test("isProjectHarnessAgentsFile detects harness start markers", () => {
  assert.equal(
    isProjectHarnessAgentsFile("/x/AGENTS.md", harnessAgents),
    true,
  );
  assert.equal(
    isProjectHarnessAgentsFile("/x/AGENTS.md", plainAgents),
    false,
  );
  assert.equal(
    isProjectHarnessAgentsFile("/x/README.md", harnessAgents),
    false,
  );
});

test("collectSystemRoots returns only marked AGENTS.md paths, sorted", (t) => {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(tmpdir()), "sys-forest-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (rel: string, body: string) => {
    const file = path.join(root, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, body);
  };
  write("AGENTS.md", harnessAgents);
  write("notes/AGENTS.md", plainAgents);
  write("teaching/AGENTS.md", harnessAgents);
  write("node_modules/pkg/AGENTS.md", harnessAgents);
  write(".git/AGENTS.md", harnessAgents);

  const roots = collectSystemRoots(root);
  assert.deepEqual(
    roots.map((p) => path.relative(root, p)),
    ["AGENTS.md", "teaching/AGENTS.md"],
  );
});
