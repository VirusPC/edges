import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { run } from "../../src/program.js";
import { publishArtifact } from "../../src/artifacts/utils/client.js";

test("root help lists artifacts", async () => {
  const result = await run(["--help"]);
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /^\s+artifacts\b/m);
});

test("artifacts help lists init publish rm", async () => {
  const result = await run(["artifacts", "--help"]);
  assert.equal(result.exitCode, 0);
  for (const verb of ["init", "publish", "rm"]) {
    assert.match(result.stdout, new RegExp(`^\\s+${verb}\\b`, "m"));
  }
});

test("artifacts init writes config and prints what the server needs", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-cli-"));
  const configPath = path.join(dir, "artifacts.env");
  const result = await run(
    ["artifacts", "init", "--config", configPath, "--base-url", "http://127.0.0.1:8787"],
    { env: { HOME: dir } },
  );
  assert.equal(result.exitCode, 0, result.stderr);
  const payload = JSON.parse(result.stdout) as {
    status: string;
    command: string;
    configPath: string;
    baseUrl: string;
    tokenCreated: boolean;
  };
  assert.equal(payload.status, "success");
  assert.equal(payload.command, "artifacts.init");
  assert.equal(payload.configPath, configPath);
  assert.equal(payload.baseUrl, "http://127.0.0.1:8787");
  assert.equal(payload.tokenCreated, true);
  const raw = await readFile(configPath, "utf8");
  const token = /EDGES_ARTIFACTS_TOKEN=([0-9a-f]+)/.exec(raw)?.[1];
  assert.ok(token && token.length === 64);
  assert.match(result.stderr, /EDGES_ARTIFACTS_TOKEN=/);
  assert.match(result.stderr, /Phone review needs a reachable URL/);
});

test("artifacts publish happy path posts JSON and prints the public URL", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-cli-"));
  const html = path.join(dir, "page.html");
  await writeFile(html, "<html>pub</html>");
  const posted: { url?: string; auth?: string; body?: unknown } = {};
  const published = await publishArtifact({
    baseUrl: "http://artifacts.test",
    token: "shared-token",
    files: [{ path: "page.html", content: "<html>pub</html>" }],
    ttlSeconds: 86_400,
    from: { kind: "cli", name: "edges-cli" },
    fetch: async (input, init) => {
      posted.url = String(input);
      posted.auth = (init?.headers as Record<string, string> | undefined)?.authorization;
      posted.body = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({
          id: "2c1d3e4f-5a6b-4c7d-8e9f-0123456789ab",
          url: "http://artifacts.test/artifacts/2c1d3e4f-5a6b-4c7d-8e9f-0123456789ab/",
          expiresAt: "2026-09-20T12:00:00.000Z",
          from: { kind: "cli", name: "edges-cli" },
        }),
        { status: 201, headers: { "content-type": "application/json" } },
      );
    },
  });
  assert.equal(posted.url, "http://artifacts.test/artifacts");
  assert.equal(posted.auth, "Bearer shared-token");
  assert.deepEqual(posted.body, {
    ttlSeconds: 86_400,
    files: [{ path: "page.html", content: "<html>pub</html>" }],
    from: { kind: "cli", name: "edges-cli" },
  });
  assert.equal(published.url, "http://artifacts.test/artifacts/2c1d3e4f-5a6b-4c7d-8e9f-0123456789ab/");
  assert.equal(published.id, "2c1d3e4f-5a6b-4c7d-8e9f-0123456789ab");
});

test("artifacts publish help lists --from-kind and --from-name", async () => {
  const result = await run(["artifacts", "publish", "--help"]);
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /--from-kind/);
  assert.match(result.stdout, /--from-name/);
});

test("artifacts publish defaults from to cli/edges-cli", async () => {
  const posted: { body?: unknown } = {};
  await publishArtifact({
    baseUrl: "http://artifacts.test",
    token: "shared-token",
    files: [{ path: "page.html", content: "<html>pub</html>" }],
    ttlSeconds: 86_400,
    from: { kind: "cli", name: "edges-cli" },
    fetch: async (_input, init) => {
      posted.body = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({
          id: "2c1d3e4f-5a6b-4c7d-8e9f-0123456789ab",
          url: "http://artifacts.test/artifacts/2c1d3e4f-5a6b-4c7d-8e9f-0123456789ab/",
          expiresAt: "2026-09-20T12:00:00.000Z",
          from: { kind: "cli", name: "edges-cli" },
        }),
        { status: 201, headers: { "content-type": "application/json" } },
      );
    },
  });
  assert.deepEqual((posted.body as { from: unknown }).from, { kind: "cli", name: "edges-cli" });
});

test("artifacts publish via run defaults from and forwards custom flags", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-cli-"));
  const configPath = path.join(dir, "artifacts.env");
  const html = path.join(dir, "page.html");
  await writeFile(html, "<html>from</html>");
  await writeFile(
    configPath,
    "EDGES_ARTIFACTS_TOKEN=cli-token\nEDGES_ARTIFACTS_BASE_URL=http://will-be-overridden\n",
  );

  const seen: Array<{ kind?: string; name?: string }> = [];
  const stub = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => {
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
        from?: { kind: string; name: string };
      };
      seen.push(body.from ?? {});
      res.writeHead(201, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          id: "2c1d3e4f-5a6b-4c7d-8e9f-0123456789ab",
          url: "http://127.0.0.1/artifacts/2c1d3e4f-5a6b-4c7d-8e9f-0123456789ab/",
          expiresAt: "2026-09-20T12:00:00.000Z",
          from: body.from,
        }),
      );
    });
  });
  await new Promise<void>((resolve) => stub.listen(0, "127.0.0.1", resolve));
  const address = stub.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const baseEnv = { HOME: dir, EDGES_ARTIFACTS_BASE_URL: `http://127.0.0.1:${port}` };
  try {
    const def = await run(["artifacts", "publish", html, "--config", configPath], { env: baseEnv });
    assert.equal(def.exitCode, 0, def.stderr + def.stdout);
    const custom = await run(
      [
        "artifacts",
        "publish",
        html,
        "--config",
        configPath,
        "--from-kind",
        "skill",
        "--from-name",
        "project-tasks-classify",
      ],
      { env: baseEnv },
    );
    assert.equal(custom.exitCode, 0, custom.stderr + custom.stdout);
    assert.deepEqual(seen, [
      { kind: "cli", name: "edges-cli" },
      { kind: "skill", name: "project-tasks-classify" },
    ]);
  } finally {
    await new Promise<void>((resolve, reject) => stub.close((err) => (err ? reject(err) : resolve())));
  }
});

test("artifacts publish --from-kind task forwards project and stem", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-cli-"));
  const configPath = path.join(dir, "artifacts.env");
  const html = path.join(dir, "page.html");
  await writeFile(html, "<html>task</html>");
  await writeFile(
    configPath,
    "EDGES_ARTIFACTS_TOKEN=cli-token\nEDGES_ARTIFACTS_BASE_URL=http://will-be-overridden\n",
  );

  const seen: Array<Record<string, unknown>> = [];
  const stub = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => {
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
        from?: Record<string, unknown>;
        task?: unknown;
      };
      seen.push({ from: body.from, hasTask: "task" in body });
      res.writeHead(201, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          id: "2c1d3e4f-5a6b-4c7d-8e9f-0123456789ab",
          url: "http://127.0.0.1/artifacts/2c1d3e4f-5a6b-4c7d-8e9f-0123456789ab/",
          expiresAt: "2026-09-20T12:00:00.000Z",
          from: body.from,
        }),
      );
    });
  });
  await new Promise<void>((resolve) => stub.listen(0, "127.0.0.1", resolve));
  const address = stub.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const baseEnv = { HOME: dir, EDGES_ARTIFACTS_BASE_URL: `http://127.0.0.1:${port}` };
  try {
    const result = await run(
      [
        "artifacts",
        "publish",
        html,
        "--config",
        configPath,
        "--from-kind",
        "task",
        "--task-project",
        "agent-clients-ux",
        "--task-stem",
        "2026-09-18--自建云服务器临时托管artifacts",
      ],
      { env: baseEnv },
    );
    assert.equal(result.exitCode, 0, result.stderr + result.stdout);
    assert.deepEqual(seen, [
      {
        from: {
          kind: "task",
          project: "agent-clients-ux",
          stem: "2026-09-18--自建云服务器临时托管artifacts",
        },
        hasTask: false,
      },
    ]);
    const payload = JSON.parse(result.stdout) as { from: Record<string, unknown>; task?: unknown };
    assert.deepEqual(payload.from, {
      kind: "task",
      project: "agent-clients-ux",
      stem: "2026-09-18--自建云服务器临时托管artifacts",
    });
    assert.equal("name" in payload.from, false);
    assert.equal("task" in payload, false);
  } finally {
    await new Promise<void>((resolve, reject) => stub.close((err) => (err ? reject(err) : resolve())));
  }
});

test("artifacts publish --from-kind task without task flags is VALIDATION_ERROR", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-cli-"));
  const configPath = path.join(dir, "artifacts.env");
  const html = path.join(dir, "page.html");
  await writeFile(html, "<html>partial</html>");
  await writeFile(
    configPath,
    "EDGES_ARTIFACTS_TOKEN=cli-token\nEDGES_ARTIFACTS_BASE_URL=http://127.0.0.1:1\n",
  );
  const result = await run(["artifacts", "publish", html, "--config", configPath, "--from-kind", "task"], {
    env: { HOME: dir },
  });
  assert.equal(result.exitCode, 2);
  const payload = JSON.parse(result.stdout) as { errorCode: string; reason: string };
  assert.equal(payload.errorCode, "VALIDATION_ERROR");
  assert.match(payload.reason, /task-project|task-stem|from-kind task/i);
});

test("artifacts publish task flags without --from-kind task is VALIDATION_ERROR", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-cli-"));
  const configPath = path.join(dir, "artifacts.env");
  const html = path.join(dir, "page.html");
  await writeFile(html, "<html>partial</html>");
  await writeFile(
    configPath,
    "EDGES_ARTIFACTS_TOKEN=cli-token\nEDGES_ARTIFACTS_BASE_URL=http://127.0.0.1:1\n",
  );
  const result = await run(
    [
      "artifacts",
      "publish",
      html,
      "--config",
      configPath,
      "--task-project",
      "agent-clients-ux",
      "--task-stem",
      "2026-09-18--x",
    ],
    { env: { HOME: dir } },
  );
  assert.equal(result.exitCode, 2);
  const payload = JSON.parse(result.stdout) as { errorCode: string; reason: string };
  assert.equal(payload.errorCode, "VALIDATION_ERROR");
  assert.match(payload.reason, /from-kind task/i);
});

test("artifacts publish --from-kind task rejects path separators", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-cli-"));
  const configPath = path.join(dir, "artifacts.env");
  const html = path.join(dir, "page.html");
  await writeFile(html, "<html>bad</html>");
  await writeFile(
    configPath,
    "EDGES_ARTIFACTS_TOKEN=cli-token\nEDGES_ARTIFACTS_BASE_URL=http://127.0.0.1:1\n",
  );
  const result = await run(
    [
      "artifacts",
      "publish",
      html,
      "--config",
      configPath,
      "--from-kind",
      "task",
      "--task-project",
      "_default",
      "--task-stem",
      "foo/bar",
    ],
    { env: { HOME: dir } },
  );
  assert.equal(result.exitCode, 2);
  const payload = JSON.parse(result.stdout) as { errorCode: string };
  assert.equal(payload.errorCode, "VALIDATION_ERROR");
});

test("artifacts publish missing path is VALIDATION_ERROR", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-cli-"));
  const configPath = path.join(dir, "artifacts.env");
  await writeFile(
    configPath,
    "EDGES_ARTIFACTS_TOKEN=cli-token\nEDGES_ARTIFACTS_BASE_URL=http://127.0.0.1:1\n",
  );
  const result = await run(["artifacts", "publish", path.join(dir, "missing.html"), "--config", configPath], {
    env: { HOME: dir },
  });
  assert.equal(result.exitCode, 2);
  const payload = JSON.parse(result.stdout) as { errorCode: string };
  assert.equal(payload.errorCode, "VALIDATION_ERROR");
});

test("artifacts publish via run uses a local HTTP stub", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-cli-"));
  const configPath = path.join(dir, "artifacts.env");
  const html = path.join(dir, "page.html");
  await writeFile(html, "<html>run</html>");
  await writeFile(
    configPath,
    "EDGES_ARTIFACTS_TOKEN=cli-token\nEDGES_ARTIFACTS_BASE_URL=http://will-be-overridden\n",
  );

  const stub = http.createServer((req, res) => {
    assert.equal(req.headers.authorization, "Bearer cli-token");
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => {
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as { files: { path: string }[] };
      assert.equal(body.files[0]?.path, "page.html");
      res.writeHead(201, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          id: "2c1d3e4f-5a6b-4c7d-8e9f-0123456789ab",
          url: "http://127.0.0.1/artifacts/2c1d3e4f-5a6b-4c7d-8e9f-0123456789ab/",
          expiresAt: "2026-09-20T12:00:00.000Z",
        }),
      );
    });
  });
  await new Promise<void>((resolve) => stub.listen(0, "127.0.0.1", resolve));
  const address = stub.address();
  const port = typeof address === "object" && address ? address.port : 0;
  try {
    const result = await run(["artifacts", "publish", html, "--config", configPath], {
      env: {
        HOME: dir,
        EDGES_ARTIFACTS_BASE_URL: `http://127.0.0.1:${port}`,
      },
    });
    assert.equal(result.exitCode, 0, result.stderr + result.stdout);
    const payload = JSON.parse(result.stdout) as { command: string; url: string };
    assert.equal(payload.command, "artifacts.publish");
    assert.equal(payload.url, "http://127.0.0.1/artifacts/2c1d3e4f-5a6b-4c7d-8e9f-0123456789ab/");
  } finally {
    await new Promise<void>((resolve, reject) => stub.close((err) => (err ? reject(err) : resolve())));
  }
});
