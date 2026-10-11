import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, realpath } from "node:fs/promises";
import { realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createTask, updateTask } from "../../src/services/tasks/write.js";
import {
  getTask,
  listTasks,
  relativePathInsideScope,
  useTaskBoardRealpathForTests,
} from "../../src/services/tasks/board.js";
import { nodeBoardFs, nodeBoardWriter } from "./utils/helpers.js";
import { TasksError } from "../../src/domain/models/tasks/types.js";

// Linux test hosts are case-sensitive, so a differently cased --scope path does not exist.
// The board realpath seam stands in for macOS: JS realpath keeps the caller's casing,
// native realpath returns the directory spelling. path.relative is case-sensitive and
// turns that mismatch into a ".." path.
function flipCase(value: string): string {
  const flipped = [...value]
    .map((char) => {
      const upper = char.toUpperCase();
      return char === upper ? char.toLowerCase() : upper;
    })
    .join("");
  if (flipped === value) throw new Error(`cannot simulate a casing alias for ${value}`);
  return flipped;
}

function callerCasing(resolved: string, repo: string, callerRoot: string): string {
  if (resolved === repo) return callerRoot;
  const prefix = repo + path.sep;
  return resolved.startsWith(prefix) ? callerRoot + resolved.slice(repo.length) : resolved;
}

test("scope casing alias keeps listed task paths inside the scope", async () => {
  const repo = await realpath(await mkdtemp(path.join(tmpdir(), "edges-scope-case-")));
  const callerRoot = path.join(path.dirname(repo), flipCase(path.basename(repo)));
  const fs = nodeBoardFs();
  const writer = nodeBoardWriter();
  const now = new Date(2026, 9, 11, 12, 0, 0);
  try {
    await mkdir(path.join(repo, "tasks/_default/todo"), { recursive: true });
    const created = await createTask(
      repo,
      { title: "Scope case", status: "todo" },
      { fs: writer, now },
    );
    const wanted = `tasks/_default/todo/${created.stem}/INDEX.md`;
    assert.equal(created.path, wanted);
    assert.ok(
      path.relative(callerRoot, path.join(repo, wanted)).startsWith(".."),
      "the casing alias must be one path.relative would escape",
    );
    useTaskBoardRealpathForTests({
      javascript: (target) => callerCasing(realpathSync(target), repo, callerRoot),
      native: (target) => realpathSync.native(target),
    });

    const items = await listTasks(repo, {}, fs);
    assert.equal(items.length, 1);
    assert.equal(items[0]?.path, wanted);
    assert.equal(items[0]?.path.includes(".."), false);
    assert.equal(items[0]?.sidecarPath, `tasks/_default/todo/${created.stem}/.${created.stem}.log.md`);

    const fetched = await getTask(repo, items[0]!.path, fs);
    assert.equal(fetched.stem, created.stem);
    assert.equal(fetched.title, "Scope case");

    const updated = await updateTask(
      repo,
      items[0]!.path,
      { title: "Scope case renamed" },
      { fs: writer, now: new Date(2026, 9, 11, 13, 0, 0) },
    );
    assert.equal(updated.path, wanted);
    const again = await getTask(repo, updated.path, fs);
    assert.equal(again.title, "Scope case renamed");
  } finally {
    useTaskBoardRealpathForTests();
    await rm(repo, { recursive: true, force: true });
  }
});

test("matching scope spelling stays a relative path inside the scope", () => {
  assert.equal(
    relativePathInsideScope(
      "/repo/Scope",
      "/repo/Scope/tasks/_default/todo/stem/INDEX.md",
    ),
    "tasks/_default/todo/stem/INDEX.md",
  );
});

test("a task path outside the scope is rejected instead of returned as ..", () => {
  assert.throws(
    () =>
      relativePathInsideScope(
        "/repo/Scope",
        "/other/tasks/_default/todo/stem/INDEX.md",
      ),
    (error: unknown) => error instanceof TasksError && error.errorCode === "VALIDATION_ERROR",
  );
});

test("mixed realpath casing cannot bypass the scope check", () => {
  assert.throws(
    () =>
      relativePathInsideScope(
        "/repo/scope",
        "/repo/Scope/tasks/_default/todo/stem/INDEX.md",
      ),
    (error: unknown) => error instanceof TasksError && error.errorCode === "VALIDATION_ERROR",
  );
});
