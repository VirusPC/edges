import test from "node:test";
import assert from "node:assert/strict";
import { messagesForRun, parseRunLog, resolveRunId } from "../src/tasks/runlog.js";
import { emptyRunLog } from "../src/tasks/write.js";

const STEM = "2026-09-11--CLI用Commanderjs重构";
const LOG = `# Run log: ${STEM}

| # | agent | started_at | ended_at | status | error_code |
|---|---|---|---|---|---|
| 1 | Coding Agent 专家 | 2026-09-11T19:15:00+08:00 | 2026-09-11T19:33:00+08:00 | completed |  |

## Notes

- 2026-09-11T19:16+08:00 Coding Agent 专家：已接 #16
- leftover without timestamp
`;

test("parseRunLog derives stem--n and does not use # as run-id", () => {
  const parsed = parseRunLog(LOG, STEM);
  assert.equal(parsed.runs.length, 1);
  assert.equal(parsed.runs[0]?.runId, `${STEM}--1`);
  assert.equal(parsed.runs[0]?.n, 1);
  assert.equal(parsed.runs[0]?.status, "completed");
});

test("explicit run-id column wins over derived id", () => {
  const md = `| run-id | # | agent | started_at | ended_at | status | error_code |
|---|---|---|---|---|---|---|
| run_abc | 1 | A | 2026-09-11T19:15:00+08:00 |  | running |  |
`;
  const parsed = parseRunLog(md, "stem");
  assert.equal(parsed.runs[0]?.runId, "run_abc");
});

test("resolveRunId splits on the last --<digits>", () => {
  const resolved = resolveRunId(`${STEM}--1`);
  assert.equal(resolved.stem, STEM);
  assert.equal(resolved.n, 1);
  const short = resolveRunId("1", STEM);
  assert.equal(short.runId, `${STEM}--1`);
});

test("messagesForRun attributes timestamped notes to the covering run", () => {
  const msgs = messagesForRun(parseRunLog(LOG, STEM), `${STEM}--1`);
  assert.equal(msgs.length, 2);
  assert.equal(msgs[0]?.seq, 1);
  assert.match(msgs[0]?.text ?? "", /已接 #16/);
});

test("parseRunLog empty sidecar has no runs", () => {
  const parsed = parseRunLog(emptyRunLog(STEM), STEM);
  assert.deepEqual(parsed.runs, []);
});
