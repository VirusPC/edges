import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { run } from "../../src/program.js";

// Stop the first process at its first business read. A pipe handshake (not a
// timed sleep) holds it while another process attempts a sibling/child write.
function holder(root: string, args: string[]) {
  const code = `import fs from 'node:fs'; import {syncBuiltinESMExports} from 'node:module';
const read=fs.readFileSync; let held=false;
fs.readFileSync=function(file,...args){ if(!held && String(file)===${JSON.stringify(path.join(root, "AGENTS.md"))}) {held=true; process.send('reading'); fs.readSync(0,Buffer.alloc(1),0,1,null);} return read.call(this,file,...args); }; syncBuiltinESMExports();
const {run}=await import('./src/program.ts'); const result=await run(${JSON.stringify(args)},{env:{}}); process.send(result); process.disconnect();`;
  return spawn(
    process.execPath,
    ["--import", "tsx", "--input-type=module", "-e", code],
    { stdio: ["pipe", "pipe", "pipe", "ipc"] },
  );
}
for (const git of [false, true])
  test(`commands lock before reads across parent/child/sibling scopes (${git ? "Git" : "non-Git"})`, async (t) => {
    const root = fs.mkdtempSync(
      path.join(fs.realpathSync(tmpdir()), "command-lock-"),
    );
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    if (git) fs.mkdirSync(path.join(root, ".git"));
    for (const dir of ["", "child", "sibling"]) {
      fs.mkdirSync(path.join(root, dir), { recursive: true });
      fs.writeFileSync(path.join(root, dir, "AGENTS.md"), "# Scope\n");
    }
    const first = holder(root, [
      "--scope",
      root,
      "memory",
      "init",
      "--memory-types",
      "project",
    ]);
    t.after(() => first.kill());
    assert.equal((await once(first, "message"))[0], "reading");
    try {
      for (const scope of [
        root,
        path.join(root, "child"),
        path.join(root, "sibling"),
      ]) {
        const result = await run(
          ["--scope", scope, "memory", "init", "--memory-types", "project"],
          { env: {} },
        );
        assert.notEqual(result.exitCode, 0);
        assert.match(result.stdout, /write lock.*busy/i);
      }
      const readonly = await run(["--scope", root, "memory", "doctor"], {
        env: {},
      });
      assert.doesNotMatch(readonly.stdout, /write lock.*busy/i);
    } finally {
      first.stdin!.write("x");
    }
    const [result] = await once(first, "message");
    assert.equal(result.exitCode, 0, JSON.stringify(result));
    await once(first, "exit");
    assert.equal(
      (
        await run(
          ["--scope", root, "memory", "init", "--memory-types", "project"],
          { env: {} },
        )
      ).exitCode,
      0,
    );
  });

test("explicit memory targets choose the mutation tree; errors release the lock", async (t) => {
  const { acquireWriteLock } = await import("../../src/services/node-lock.js");
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(tmpdir()), "lock-target-"),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const other = path.join(root, "other"),
    actual = path.join(root, "actual");
  for (const dir of [other, actual]) {
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, "AGENTS.md"), "# Scope\n");
  }
  const release = await acquireWriteLock(actual);
  try {
    for (const args of [
      [
        "init",
        "--target-dir",
        actual,
        "--root-dir",
        root,
        "--memory-types",
        "project",
      ],
      ["doctor", "--target-dir", actual, "--apply"],
      ["migrate", "--target-dir", actual, "--root-dir", root],
      [
        "restore",
        "--repo-dir",
        actual,
        "--archive",
        path.join(root, "missing.tar.gz"),
      ],
      [
        "remember",
        "--target-dir",
        actual,
        "--type",
        "project",
        "--slug",
        "test",
        "--content",
        "test",
      ],
      [
        "add-type",
        "--target-dir",
        actual,
        "--name",
        "custom",
        "--description",
        "Custom",
      ],
    ]) {
      const result = await run(["--scope", other, "memory", ...args], {
        env: {},
      });
      assert.match(result.stdout, /write lock.*busy/i, JSON.stringify(args));
    }
    const readonly = await run(
      ["--scope", actual, "memory", "migrate", "--dry-run"],
      { env: {} },
    );
    assert.doesNotMatch(readonly.stdout, /write lock.*busy/i);
  } finally {
    await release();
  }
  const invalid = await run(
    [
      "--scope",
      actual,
      "memory",
      "restore",
      "--archive",
      path.join(root, "missing.tar.gz"),
    ],
    { env: {} },
  );
  assert.notEqual(invalid.exitCode, 0);
  await (
    await acquireWriteLock(actual)
  )();
  assert.equal(
    (
      await run(
        ["--scope", actual, "memory", "init", "--memory-types", "project"],
        { env: {} },
      )
    ).exitCode,
    0,
  );
});

test("independent Git worktrees can hold locks concurrently, including canonical aliases", async (t) => {
  const { acquireWriteLock, writeLockRoot } =
    await import("../../src/services/node-lock.js");
  const { execFileSync } = await import("node:child_process");
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(tmpdir()), "lock-worktrees-"),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const repo = path.join(root, "repo"),
    tree = path.join(root, "tree");
  fs.mkdirSync(repo);
  execFileSync("git", ["init", repo], { stdio: "ignore" });
  execFileSync(
    "git",
    [
      "-c",
      "user.name=Fixture",
      "-c",
      "user.email=fixture@example.com",
      "commit",
      "--allow-empty",
      "-m",
      "fixture",
    ],
    { cwd: repo, stdio: "ignore" },
  );
  execFileSync("git", ["worktree", "add", "--detach", tree], {
    cwd: repo,
    stdio: "ignore",
  });
  fs.symlinkSync(tree, path.join(root, "alias"));
  assert.equal(writeLockRoot(path.join(root, "alias", "missing")), tree);
  const release = await acquireWriteLock(repo);
  try {
    await (
      await acquireWriteLock(tree)
    )();
  } finally {
    await release();
  }
});

test(
  "lock compromise fails a live writer instead of reporting success",
  { timeout: 20000 },
  async (t) => {
    const { createHash } = await import("node:crypto");
    const root = fs.mkdtempSync(
      path.join(fs.realpathSync(tmpdir()), "lock-loss-"),
    );
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const child = spawn(
      process.execPath,
      [
        "--import",
        "tsx",
        "--input-type=module",
        "-e",
        `const {acquireWriteLock}=await import('./src/services/node-lock.ts'); await acquireWriteLock(${JSON.stringify(root)});process.send('locked');setInterval(()=>{},1000);`,
      ],
      { stdio: ["ignore", "pipe", "pipe", "ipc"] },
    );
    t.after(() => child.kill());
    let stderr = "";
    child.stderr!.on("data", (data) => {
      stderr += data;
    });
    assert.equal((await once(child, "message"))[0], "locked");
    const exited = once(child, "exit");
    fs.rmdirSync(
      path.join(
        fs.realpathSync(tmpdir()),
        "edges-node-write-locks",
        createHash("sha256").update(root).digest("hex") + ".lock",
      ),
    );
    const [code] = await exited;
    assert.notEqual(code, 0);
    assert.match(stderr, /ECOMPROMISED|ENOENT/);
  },
);

test("all node-writing command groups lock; validation and persistence failures release", async (t) => {
  const { acquireWriteLock } = await import("../../src/services/node-lock.js");
  const { syncBuiltinESMExports } = await import("node:module");
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(tmpdir()), "lock-errors-"),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, "AGENTS.md"), "# Scope\n");
  const release = await acquireWriteLock(root);
  try {
    for (const args of [
      [
        "note",
        "--title",
        "Test",
        "--content",
        "Body",
        "--co-author",
        "Codex <codex@example.com>",
        "--dry-run",
      ],
      ["tasks", "create", "--title", "Test"],
      ["tasks", "update", "test", "--title", "Test"],
      ["tasks", "status", "test", "done"],
      [
        "tasks",
        "project",
        "create",
        "demo",
        "--title",
        "Demo",
        "--description",
        "Demo",
      ],
      ["tasks", "project", "update", "demo", "--title", "Demo"],
    ])
      assert.match(
        (await run(["--scope", root, ...args], { env: {} })).stdout,
        /write lock.*busy/i,
        JSON.stringify(args),
      );
  } finally {
    await release();
  }
  const mock = t.mock.method(fs, "fsyncSync", () => {
    throw Error("injected save error");
  });
  syncBuiltinESMExports();
  try {
    const result = await run(
      ["--scope", root, "memory", "init", "--memory-types", "project"],
      { env: {} },
    );
    assert.notEqual(result.exitCode, 0);
    assert.match(result.stdout, /injected save error/);
  } finally {
    mock.mock.restore();
    syncBuiltinESMExports();
  }
  await (
    await acquireWriteLock(root)
  )();
});

test("non-Git lock roots ignore AGENTS symlinks and directories as scope markers", async (t) => {
  const { writeLockRoot } = await import("../../src/services/node-lock.js");
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(tmpdir()), "lock-markers-"),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const child = path.join(root, "child");
  fs.mkdirSync(child);
  fs.writeFileSync(path.join(child, "AGENTS.md"), "# Scope");
  fs.symlinkSync(path.join(child, "AGENTS.md"), path.join(root, "AGENTS.md"));
  assert.equal(writeLockRoot(child), child);
  fs.unlinkSync(path.join(root, "AGENTS.md"));
  fs.mkdirSync(path.join(root, "AGENTS.md"));
  assert.equal(writeLockRoot(child), child);
});
