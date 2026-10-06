import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { NodeService } from "../../src/services/node-service.js";
import { TaskNode } from "../../src/domain/models/index.js";
function fixture(t: any) {
  const root = fs.realpathSync(
    fs.mkdtempSync(path.join(tmpdir(), "resource-review-")),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
function put(file: string, text: string) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}
for (const conflict of [
  "source",
  "destination-identity",
  "destination-content",
] as const) {
  test(`directory move preserves concurrent ${conflict} runlog changes and reports recovery`, async (t) => {
    const root = fixture(t),
      source = path.join(root, "tasks/_default/todo/task/index.md"),
      destination = path.join(root, "tasks/_default/done/task/index.md");
    const sourceLog = path.join(path.dirname(source), "run.log.md"),
      destLog = path.join(path.dirname(destination), "run.log.md");
    put(source, "Task");
    put(sourceLog, "Original log");
    let touched = false;
    const service = new NodeService({
      managedRoot: root,
      assertWrite: ({ operation, node }) => {
        if (operation !== "move" || node.path !== destination || touched)
          return;
        if (conflict === "source" && !fs.existsSync(destination)) {
          touched = true;
          put(sourceLog, "Human log");
          return;
        }
        if (conflict !== "source" && fs.existsSync(destination)) {
          touched = true;
          if (conflict === "destination-identity") {
            fs.renameSync(destLog, path.join(root, "original-log"));
            put(destLog, "Original log");
          } else put(destLog, "Human log");
          throw new Error("Concurrent policy rejection");
        }
      },
    });
    const node = (await service.get(source, TaskNode))!;
    node.description = "Pending caller edit";
    assert.strictEqual(await service.get(source, TaskNode), node);
    await assert.rejects(
      service.move(node, destination),
      conflict === "source" ? /resources changed/ : /recover directory/,
    );
    assert.equal(node.path, source);
    assert.equal(node.description, "Pending caller edit");
    if (conflict === "source") {
      assert.equal(fs.readFileSync(source, "utf8"), "Task");
      assert.equal(fs.readFileSync(sourceLog, "utf8"), "Human log");
    } else {
      assert.equal(
        fs.readFileSync(destLog, "utf8"),
        conflict === "destination-content" ? "Human log" : "Original log",
      );
      assert.equal(fs.readFileSync(destination, "utf8"), "Task");
    }
  });
}
test("move refuses a directory created during asynchronous preflight", async (t) => {
  const root = fixture(t),
    source = path.join(root, "old/index.md"),
    destination = path.join(root, "new/index.md");
  put(source, "source");
  const service = new NodeService({
    managedRoot: root,
    assertWrite: ({ operation, node }) => {
      if (operation === "move" && node.path === destination)
        put(path.join(root, "new/unrelated"), "concurrent");
    },
  });
  await assert.rejects(
    service.move((await service.get(source))!, destination),
    /exists/,
  );
  assert.equal(
    fs.readFileSync(path.join(root, "new/unrelated"), "utf8"),
    "concurrent",
  );
  assert.equal(fs.readFileSync(source, "utf8"), "source");
});
test("whole-directory import retains ordinary executable resource mode without a permission policy", async (t) => {
  const root = fixture(t);
  const source = path.join(root, "source/SKILL.md");
  put(source, "---\nname: fixture\ndescription: Test fixture\n---\nSkill");
  put(path.join(root, "source/run.sh"), "#!/bin/sh\n");
  fs.chmodSync(path.join(root, "source/run.sh"), 0o755);
  const service = new NodeService({ managedRoot: root });
  await service.import(source, path.join(root, "target/SKILL.md"), { indexGroup: "local" });
  assert.equal(
    fs.statSync(path.join(root, "target/run.sh")).mode & 0o777,
    0o755,
  );
  assert.equal(
    fs.readFileSync(source, "utf8"),
    "---\nname: fixture\ndescription: Test fixture\n---\nSkill",
  );
});
test("failed import preserves an intervening replacement directory instead of deleting it", async (t) => {
  const root = fixture(t),
    source = path.join(root, "source/SKILL.md"),
    destination = path.join(root, "target/SKILL.md");
  put(source, "---\nname: fixture\ndescription: Test fixture\n---\nSkill");
  const service = new NodeService({ managedRoot: root });
  const { default: mutableFs } = await import("node:fs");
  const { syncBuiltinESMExports } = await import("node:module");
  const cp = mutableFs.cpSync;
  const mocked = t.mock.method(
    mutableFs,
    "cpSync",
    (...args: Parameters<typeof cp>) => {
      cp(...args);
      fs.renameSync(path.dirname(destination), path.join(root, "copied"));
      put(path.join(root, "target/unrelated"), "keep");
      throw new Error("Intervening directory replacement");
    },
  );
  syncBuiltinESMExports();
  t.after(() => {
    mocked.mock.restore();
    syncBuiltinESMExports();
  });
  await assert.rejects(service.import(source, destination, { indexGroup: "local" }), /recovery remains/);
  assert.equal(
    fs.readFileSync(path.join(root, "target/unrelated"), "utf8"),
    "keep",
  );
  assert.equal(
    fs.readFileSync(source, "utf8"),
    "---\nname: fixture\ndescription: Test fixture\n---\nSkill",
  );
});
test("import detects source changes during asynchronous preflight before creating destination", async (t) => {
  const root = fixture(t),
    source = path.join(root, "source/SKILL.md"),
    destination = path.join(root, "target/SKILL.md");
  put(source, "---\nname: fixture\ndescription: Test fixture\n---\nOriginal");
  put(path.join(root, "source/asset"), "old");
  const service = new NodeService({
    managedRoot: root,
    assertWrite: ({ operation }) => {
      if (operation === "import") put(path.join(root, "source/asset"), "human");
    },
  });
  await assert.rejects(
    service.import(source, destination, { indexGroup: "local" }),
    /resources changed/,
  );
  assert.equal(fs.existsSync(path.dirname(destination)), false);
  assert.equal(
    fs.readFileSync(path.join(root, "source/asset"), "utf8"),
    "human",
  );
});
test("import rejects symlinks even inside unmodeled installation directories", async (t) => {
  const root = fixture(t),
    source = path.join(root, "source/SKILL.md"),
    destination = path.join(root, "target/SKILL.md");
  put(source, "---\nname: fixture\ndescription: Test fixture\n---\nSkill");
  put(path.join(root, "outside"), "outside");
  fs.mkdirSync(path.join(root, "source/.agents"));
  fs.symlinkSync(
    path.join(root, "outside"),
    path.join(root, "source/.agents/linked"),
  );
  await assert.rejects(
    new NodeService({ managedRoot: root }).import(source, destination, { indexGroup: "local" }),
    /symbolic/,
  );
  assert.equal(fs.existsSync(path.dirname(destination)), false);
});
