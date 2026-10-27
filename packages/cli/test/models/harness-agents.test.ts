import test from "node:test";
import assert from "node:assert/strict";
import { isProjectHarnessAgentsFile } from "../../src/domain/models/agents/harness-agents.js";

const harnessAgents = `# Scope

<!-- edges-local:start -->
## 本层系统维护信息

<!-- edges-local:end -->
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
