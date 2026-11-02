import { indexTaskFixtureBoard, writeFixtureIndex } from "./helpers.js";
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { run } from "../../../src/program.js";
import { generateTasksSite } from "../../../src/services/tasks/generate-site.js";

test("generateTasksSite writes HTML with review payload and created title", async () => {
  const repo = await mkdtemp(path.join(realpathSync(tmpdir()), "edges-site-"));
  try {
    const env = { ...process.env, EDGES_REPO: repo };
    const created = await run(
      ["--super", "tasks", "create", "--title", "Board Alpha", "--status", "todo"],
      { env },
    );
    assert.equal(created.exitCode, 0);
    await writeFixtureIndex(path.join(repo, "AGENTS.md"), ["tasks/README.md"]);
    const outPath = path.join(repo, "tasks/_site/index.html");
    const result = await generateTasksSite({ repoPath: repo, outPath, env });
    assert.equal(result.path, path.resolve(outPath));
    assert.ok(result.groupCount >= 1);
    assert.ok(result.itemCount >= 1);
    const html = await readFile(outPath, "utf8");
    assert.match(html, /edges-review-payload/);
    assert.match(html, /Board Alpha/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("aggregate site preserves duplicate stems with portable scope/purpose/project identities", async () => {
  const repo = await mkdtemp(path.join(realpathSync(tmpdir()), "edges-site-all-"));
  try {
    const { execFileSync } = await import("node:child_process");
    execFileSync("git", ["init", "-q", repo]);
    const env = { EDGES_REPO: repo };
    for (const purpose of ["domain", "maintenance"]) {
      const result = await run(
        [
          "--scope",
          repo,
          ...(purpose === "domain" ? ["--super"] : []),
          "tasks",
          "create",
          "--title",
          "Same",
        ],
        { env },
      );
      assert.equal(result.exitCode, 0, result.stdout);
    }
    const createdProject = await run(["--scope",repo,"projects","create","--title","Theme"],{env});
    assert.equal(createdProject.exitCode,0,createdProject.stdout);
    const project = path.relative(path.join(repo,".edges/projects"),path.dirname(path.join(repo,JSON.parse(createdProject.stdout).path)));
    const inProject = await run(["--scope",repo,"--project",project,"tasks","create","--title","Same"],{env});
    assert.equal(inProject.exitCode,0,inProject.stdout);
    await writeFixtureIndex(path.join(repo,'AGENTS.md'), ['tasks/README.md','.edges/README.md']);
    const outPath = path.join(repo, "site/index.html");
    await generateTasksSite({ repoPath: repo, outPath, env });
    const html = await readFile(outPath, "utf8");
    const payload = JSON.parse(
      html.match(
        /<script type="application\/json" id="edges-review-payload">([\s\S]*?)<\/script>/,
      )![1]!,
    );
    assert.equal(payload.items.length, 3);
    assert.equal(new Set(payload.items.map((item: any) => item.id)).size, 3);
    assert.equal(payload.items[0].stem, payload.items[1].stem);
    assert.deepEqual(
      payload.items.map((item: any) => item.source.purpose).sort(),
      ["domain", "maintenance", "maintenance"],
    );
    assert.ok(
      payload.items.every(
        (item: any) =>
          item.source.scope === "." &&
          (item.project === undefined || item.project === project),
      ),
    );
    assert.ok(!JSON.stringify(payload).includes(repo));
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("standalone scope aggregate resolves nested sources relative to selected root", async () => {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const root = await mkdtemp(path.join(realpathSync(tmpdir()), "edges-standalone-"));
  try {
    const child = path.join(root, "packages/evaluation");
    await mkdir(child, { recursive: true });
    await writeFixtureIndex(path.join(child,'AGENTS.md'), ['.edges/tasks/AGENTS.md']);
    for (const scope of [root, child]) {
      const result = await run(
        ["--scope", scope, "tasks", "create", "--title", "Same"],
        { env: {} },
      );
      assert.equal(result.exitCode, 0, result.stdout);
    }
    await writeFixtureIndex(path.join(root,'AGENTS.md'), ['.edges/tasks/AGENTS.md'], ['packages/evaluation/AGENTS.md']);
    const outPath = path.join(root, "site/index.html");
    await generateTasksSite({ repoPath: root, outPath });
    const html = await readFile(outPath, "utf8");
    const payload = JSON.parse(
      html.match(
        /<script type="application\/json" id="edges-review-payload">([\s\S]*?)<\/script>/,
      )![1]!,
    );
    assert.deepEqual(
      payload.items.map((item: any) => item.source.scope).sort(),
      [".", "packages/evaluation"],
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
