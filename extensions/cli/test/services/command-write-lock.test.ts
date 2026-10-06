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
    fs.mkdirSync(path.join(dir, ".git"), { recursive: true });
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
  const { acquireWriteLock, writeLockPath } =
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
  assert.equal(
    writeLockPath(path.join(root, "alias", "missing")),
    path.join(tree, ".edges-write.lock"),
  );
  const release = await acquireWriteLock(repo);
  assert.equal(
    fs.statSync(path.join(repo, ".edges-write.lock")).isDirectory(),
    true,
  );
  try {
    await (
      await acquireWriteLock(tree)
    )();
  } finally {
    await release();
  }
  assert.equal(fs.existsSync(path.join(repo, ".edges-write.lock")), false);
});

test(
  "lock compromise fails a live writer instead of reporting success",
  { timeout: 20000 },
  async (t) => {
    const { writeLockPath } = await import("../../src/services/node-lock.js");
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
    fs.rmdirSync(writeLockPath(root));
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
        "create",
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
  const { writeLockPath } = await import("../../src/services/node-lock.js");
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(tmpdir()), "lock-markers-"),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const child = path.join(root, "child");
  fs.mkdirSync(child);
  fs.writeFileSync(path.join(child, "AGENTS.md"), "# Scope");
  fs.symlinkSync(path.join(child, "AGENTS.md"), path.join(root, "AGENTS.md"));
  assert.equal(
    writeLockPath(child),
    path.join(fs.realpathSync(tmpdir()), ".edges-write.lock"),
  );
  fs.unlinkSync(path.join(root, "AGENTS.md"));
  fs.mkdirSync(path.join(root, "AGENTS.md"));
  assert.equal(
    writeLockPath(child),
    path.join(fs.realpathSync(tmpdir()), ".edges-write.lock"),
  );
});

test("lock normalization follows scope/env literals and explicit Memory home expansion", async (t) => {
  const { acquireWriteLock } = await import("../../src/services/node-lock.js");
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(tmpdir()), "lock-normalize-"),
  );
  const cwd = process.cwd(),
    home = process.env.HOME;
  t.after(() => {
    process.chdir(cwd);
    if (home === undefined) delete process.env.HOME;
    else process.env.HOME = home;
    fs.rmSync(root, { recursive: true, force: true });
  });
  const literal = path.join(root, "~", "scope"),
    expanded = path.join(root, "home", "scope");
  for (const dir of [literal, expanded, path.join(root, "home")]) {
    fs.mkdirSync(path.join(dir, ".git"), { recursive: true });
    fs.writeFileSync(path.join(dir, "AGENTS.md"), "# Scope\n");
  }
  process.chdir(root);
  process.env.HOME = path.join(root, "home");
  const cases: { target: string; args: string[]; env: NodeJS.ProcessEnv }[] = [
    {
      target: literal,
      args: [
        "--scope",
        "~/scope",
        "memory",
        "init",
        "--memory-types",
        "project",
      ],
      env: {},
    },
    {
      target: literal,
      args: ["memory", "init", "--memory-types", "project"],
      env: { EDGES_SCOPE: "~/scope" },
    },
    {
      target: literal,
      args: ["memory", "init", "--memory-types", "project"],
      env: { EDGES_REPO: "~/scope" },
    },
    {
      target: expanded,
      args: [
        "memory",
        "init",
        "--target-dir",
        "~/scope",
        "--memory-types",
        "project",
      ],
      env: {},
    },
    {
      target: path.join(root, "~"),
      args: [
        "memory",
        "init",
        "--target-dir",
        "~",
        "--memory-types",
        "project",
      ],
      env: {},
    },
    {
      target: expanded,
      args: [
        "memory",
        "restore",
        "--repo-dir",
        "~/scope",
        "--archive",
        "missing.tar.gz",
      ],
      env: {},
    },
    {
      target: path.join(root, "home"),
      args: [
        "memory",
        "restore",
        "--repo-dir",
        "~",
        "--archive",
        "missing.tar.gz",
      ],
      env: {},
    },
  ];
  for (const { target, args, env } of cases) {
    const release = await acquireWriteLock(target);
    try {
      const result = await run(args, { env });
      assert.match(
        result.stdout,
        /write lock.*busy/i,
        JSON.stringify({ args, env, result }),
      );
    } finally {
      await release();
    }
  }
});

test("fresh non-Git ancestor init shares a stable lock before and after creating markers", async (t) => {
  const { acquireWriteLock, writeLockPath } =
    await import("../../src/services/node-lock.js");
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(tmpdir()), "lock-bootstrap-"),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const child = path.join(root, "child");
  fs.mkdirSync(child);
  const before = writeLockPath(child);
  const release = await acquireWriteLock(root);
  try {
    const blocked = await run(
      [
        "memory",
        "init",
        "--target-dir",
        child,
        "--root-dir",
        root,
        "--memory-types",
        "project",
      ],
      { env: {} },
    );
    assert.match(blocked.stdout, /write lock.*busy/i);
    assert.equal(fs.existsSync(path.join(root, "AGENTS.md")), false);
  } finally {
    await release();
  }
  const result = await run(
    [
      "memory",
      "init",
      "--target-dir",
      child,
      "--root-dir",
      root,
      "--memory-types",
      "project",
    ],
    { env: {} },
  );
  assert.equal(result.exitCode, 0, result.stdout);
  assert.equal(fs.existsSync(path.join(root, "AGENTS.md")), false);
  assert.equal(fs.existsSync(path.join(child, "AGENTS.md")), true);
  assert.equal(writeLockPath(child), before);
  assert.equal(writeLockPath(root), before);
});

test("persistence diagnostics survive a simultaneous lock release failure", async (t) => {
  const { writeLockPath } = await import("../../src/services/node-lock.js");
  const { syncBuiltinESMExports } = await import("node:module");
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(tmpdir()), "lock-double-failure-"),
  );
  fs.mkdirSync(path.join(root, ".git"));
  fs.writeFileSync(path.join(root, "AGENTS.md"), "# Scope\n");
  const lock = writeLockPath(root);
  t.after(() => {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(lock, { recursive: true, force: true });
  });
  const mock = t.mock.method(fs, "fsyncSync", () => {
    fs.writeFileSync(path.join(lock, "obstruction"), "x");
    throw Error("injected persistence cause");
  });
  syncBuiltinESMExports();
  try {
    const result = await run(
      ["--scope", root, "memory", "init", "--memory-types", "project"],
      { env: {} },
    );
    assert.notEqual(result.exitCode, 0);
    const output = result.stdout + result.stderr;
    for (const text of [
      "injected persistence cause",
      "Affected:",
      "Recovery copies:",
      "Reload affected nodes",
      "Node write lock release failed",
    ])
      assert.ok(output.includes(text), `${text}: ${output}`);
  } finally {
    mock.mock.restore();
    syncBuiltinESMExports();
  }
});

test(
  "another process cannot enter non-Git init after ancestor marker creation",
  { timeout: 20000 },
  async (t) => {
    const root = fs.mkdtempSync(
      path.join(fs.realpathSync(tmpdir()), "lock-bootstrap-process-"),
    );
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const childDir = path.join(root, "child");
    fs.mkdirSync(childDir);
    const code = `import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';const link=fs.linkSync;fs.linkSync=(a,b)=>{link(a,b);if(String(b)===${JSON.stringify(path.join(childDir, "AGENTS.md"))}){process.send('created');fs.readSync(0,Buffer.alloc(1),0,1,null);}};syncBuiltinESMExports();const {run}=await import('./src/program.ts');process.send(await run(${JSON.stringify(["memory", "init", "--target-dir", childDir, "--root-dir", root, "--memory-types", "project"])},{env:{}}));process.disconnect();`;
    const first = spawn(
      process.execPath,
      ["--import", "tsx", "--input-type=module", "-e", code],
      { stdio: ["pipe", "pipe", "pipe", "ipc"] },
    );
    t.after(() => first.kill());
    assert.equal((await once(first, "message"))[0], "created");
    try {
      assert.match(
        (
          await run(
            ["--scope", root, "memory", "init", "--memory-types", "project"],
            { env: {} },
          )
        ).stdout,
        /write lock.*busy/i,
      );
    } finally {
      first.stdin!.write("x");
    }
    const [result] = await once(first, "message");
    assert.equal(result.exitCode, 0, result.stdout);
    await once(first, "exit");
  },
);
