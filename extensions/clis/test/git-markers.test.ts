import test from "node:test";
import assert from "node:assert/strict";
import { formatMarkerStdout, parseMarkers } from "../src/git/markers.js";

test("formatMarkerStdout writes the four bash markers", () => {
  const stdout = formatMarkerStdout({
    filePath: "knowledge/notes/2026-09-11--hello.md",
    branch: "ingest/2026-09-11-hello",
    prStatus: "created",
    prUrl: "https://github.com/org/repo/pull/1",
  });
  assert.match(stdout, /__EDGES_FILE__=knowledge\/notes\/2026-09-11--hello\.md/);
  assert.match(stdout, /__EDGES_BRANCH__=ingest\/2026-09-11-hello/);
  assert.match(stdout, /__EDGES_PR_STATUS__=created/);
  assert.match(stdout, /__EDGES_PR_URL__=https:\/\/github.com\/org\/repo\/pull\/1/);
});

test("parseMarkers reads markers and leaves diagnostics", () => {
  const parsed = parseMarkers(
    "📝 Mode: Direct commit to main\n__EDGES_FILE__=knowledge/notes/a.md\n__EDGES_BRANCH__=main\n__EDGES_PR_STATUS__=direct_commit\n__EDGES_PR_URL__=\n",
  );
  assert.equal(parsed.filePath, "knowledge/notes/a.md");
  assert.equal(parsed.branch, "main");
  assert.equal(parsed.prStatus, "direct_commit");
  assert.match(parsed.diagnostics, /Mode: Direct commit/);
});
