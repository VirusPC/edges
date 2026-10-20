import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promises as fs } from "node:fs";
import { runEdgesNote } from "../src/cliAdapter.js";
import { classifyError } from "../src/errors.js";
import type { RuntimeConfig } from "../src/types.js";

const mcpPackageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

test("runEdgesNote spawns the CLI entry with flags and parses JSON", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "edges-mcp-cli-"));
  const mockCli = path.join(tmp, "mock-edges.mjs");
  const capturePath = path.join(tmp, "capture.json");
  await fs.writeFile(
    mockCli,
    [
      "import { writeFileSync } from 'node:fs';",
      "const args = process.argv.slice(2);",
      "writeFileSync(process.env.EDGES_CAPTURE_PATH, JSON.stringify({ args, cwd: process.cwd() }));",
      "if (args[0] !== 'notes') { console.error('missing notes'); process.exit(1); }",
      "if (process.env.EDGES_AUTH_TOKEN) { console.error('auth leaked'); process.exit(1); }",
      "if (process.env.EDGES_SCOPE !== '/repo') { console.error('scope leaked'); process.exit(1); }",
      "if (process.env.EDGES_REPO !== '/repo') { console.error('repo'); process.exit(1); }",
      "const json = {",
      "  status: 'success',",
      "  command: 'notes.create',",
      "  path: 'notes/2026-09-11--demo/INDEX.md',",
      "  title: 'Demo'",
      "};",
      "process.stdout.write(JSON.stringify(json) + '\\n');",
    ].join("\n"),
  );

  const config: RuntimeConfig = {
    repoPath: "/repo",
    baseBranch: "main",
    cliEntry: mockCli,
    skillsPath: "/repo/extensions/skills",
    mode: "pr",
    dryRun: true,
    authToken: "secret-should-not-leak",
  };

  const previousCwd = process.cwd();
  process.chdir(tmp);
  try {
    const result = await runEdgesNote(
      {
        title: "Demo",
        body: "Body",
      },
      config,
      {
        ...process.env,
        EDGES_AUTH_TOKEN: "secret-should-not-leak",
        GITHUB_TOKEN: "ghs_x",
        EDGES_CAPTURE_PATH: capturePath,
        EDGES_SCOPE: "/unrelated/ambient-child",
      },
    );

    assert.equal(result.path, "notes/2026-09-11--demo/INDEX.md");
    assert.equal(result.title, "Demo");

    const capture = JSON.parse(await fs.readFile(capturePath, "utf8")) as {
      args: string[];
      cwd: string;
    };
    assert.deepEqual(capture.args, [
      "notes",
      "create",
      "--title",
      "Demo",
      "--body",
      "Body",
      "--json",
    ]);
    assert.equal(capture.cwd, await fs.realpath(tmp));
  } finally {
    process.chdir(previousCwd);
  }
});

test("runEdgesNote maps CLI failure JSON to a thrown error with errorCode", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "edges-mcp-cli-fail-"));
  const mockCli = path.join(tmp, "mock-edges.mjs");
  await fs.writeFile(
    mockCli,
    "process.stdout.write(JSON.stringify({status:'failed',errorCode:'GIT_FAILURE',reason:'boom'})+'\\n'); process.exit(1);\n",
  );

  const config: RuntimeConfig = {
    repoPath: "/repo",
    baseBranch: "main",
    cliEntry: mockCli,
    skillsPath: "/skills",
    mode: "direct",
    dryRun: false,
  };

  await assert.rejects(
    () =>
      runEdgesNote(
        {
          title: "Demo",
          body: "Body",
        },
        config,
        { ...process.env },
      ),
    (err: Error & { errorCode?: string; stdout?: string }) => {
      assert.match(err.message, /boom/);
      assert.equal(err.errorCode, "GIT_FAILURE");
      assert.equal(
        classifyError({ stdout: err.stdout, message: err.message }),
        "GIT_FAILURE",
      );
      return true;
    },
  );
});

test("runEdgesNote maps a missing CLI entry to SCRIPT_NOT_FOUND", async () => {
  const config: RuntimeConfig = {
    repoPath: "/repo",
    baseBranch: "main",
    cliEntry: path.join(
      os.tmpdir(),
      "edges-cli-missing",
      `index-${Date.now()}.js`,
    ),
    skillsPath: "/skills",
    mode: "direct",
    dryRun: false,
  };

  try {
    await runEdgesNote(
      {
        title: "Demo",
        body: "Body",
      },
      config,
      { ...process.env },
    );
    assert.fail("expected runEdgesNote to throw");
  } catch (error) {
    const err = error as NodeJS.ErrnoException & {
      stdout?: string;
      stderr?: string;
    };
    assert.equal(
      classifyError({
        stdout: err.stdout,
        stderr: err.stderr,
        message: err.message,
        code: err.code,
      }),
      "SCRIPT_NOT_FOUND",
    );
  }
});

test("default MCP target follows captured caller scope, with implementation resources kept separate", async () => {
  const { loadConfig } = await import("../src/config.js");
  const { execFileSync } = await import("node:child_process");
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "edges-mcp-real-")),
  );
  const previousCwd = process.cwd();
  try {
    execFileSync("git", ["init", "-q", root]);
    execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
    execFileSync("git", ["config", "user.email", "test@example.com"], {
      cwd: root,
    });
    const child = path.join(root, "projects/child");
    await fs.mkdir(child, { recursive: true });
    await fs.writeFile(
      path.join(child, "AGENTS.md"),
      [
        "# Child",
        "",
        "<!-- project-harness-local:start -->",
        "## 本层系统维护信息",
        "",
        "<!-- project-harness-local:end -->",
        "",
        "<!-- project-harness-descendants:start -->",
        "## 下层系统维护信息",
        "",
        "<!-- project-harness-descendants:end -->",
        "",
      ].join("\n"),
    );
    process.chdir(child);
    const config = loadConfig({
      EDGES_DRY_RUN: "true",
      EDGES_CLI: path.resolve(mcpPackageRoot, "../../cli/src/index.ts"),
    });
    // Stops the old implementation before it could mutate the source checkout.
    assert.equal(config.repoPath, undefined);
    assert.equal(config.scopeDir, undefined);
    assert.equal(config.cwd, child);
    assert.equal(
      config.skillsPath,
      path.resolve(mcpPackageRoot, "../../skills"),
    );
    process.chdir(previousCwd);
    const result = await runEdgesNote(
      {
        title: "Caller Scope",
        body: "Fixture",
      },
      config,
      {
        ...process.env,
        EDGES_SCOPE: "/unrelated/ambient",
        EDGES_REPO: "/unrelated/ambient",
      },
    );
    assert.match(
      result.path,
      /^notes\/\d{4}-\d{2}-\d{2}--caller-scope\/INDEX\.md$/,
    );
    assert.equal(result.title, "Caller Scope");
    assert.match(
      await fs.readFile(path.join(child, result.path), "utf8"),
      /Fixture/,
    );
    assert.throws(() =>
      execFileSync("git", ["rev-parse", "--verify", "HEAD"], {
        cwd: root,
        encoding: "utf8",
        stdio: "pipe",
      }),
    );
  } finally {
    process.chdir(previousCwd);
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("MCP with no target and no cwd owner returns actionable validation instead of writing installation", async () => {
  const { loadConfig } = await import("../src/config.js");
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "edges-mcp-no-owner-"));
  const previousCwd = process.cwd();
  try {
    process.chdir(tmp);
    const config = loadConfig({
      EDGES_DRY_RUN: "true",
      EDGES_CLI: path.resolve(mcpPackageRoot, "../../cli/src/index.ts"),
    });
    assert.equal(config.repoPath, undefined);
    process.chdir(previousCwd);
    await assert.rejects(
      () =>
        runEdgesNote(
          {
            title: "No owner",
            body: "Fixture",
          },
          config,
          {},
        ),
      (error: Error & { errorCode?: string }) =>
        error.errorCode === "VALIDATION_ERROR" &&
        error.message.includes("--scope"),
    );
    await assert.rejects(fs.access(path.join(tmp, "knowledge")));
  } finally {
    process.chdir(previousCwd);
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
