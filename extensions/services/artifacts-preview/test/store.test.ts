import test from "node:test";
import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, readFile, rm, stat, symlink, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createArtifactStore } from "../src/store.js";

const FIXED_ID = "2c1d3e4f-5a6b-4c7d-8e9f-0123456789ab";

async function tempStore(nowMs: { current: number }) {
  const dataDir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-"));
  const store = createArtifactStore({
    dataDir,
    now: () => new Date(nowMs.current),
    idFactory: () => FIXED_ID,
  });
  return { store, dataDir };
}

test("put then getFile returns bytes before expiry", async () => {
  const nowMs = { current: Date.parse("2026-09-19T12:00:00.000Z") };
  const { store } = await tempStore(nowMs);
  const put = await store.put({
    ttlSeconds: 60,
    from: { type: "cli", name: "edges-cli" },
    files: [{ path: "index.html", content: "<html>ok</html>" }],
  });
  assert.equal(put.id, FIXED_ID);
  assert.equal(put.expiresAt, "2026-09-19T12:01:00.000Z");
  const file = await store.getFile(FIXED_ID, "index.html");
  assert.ok(file);
  assert.equal(file.bytes.toString("utf8"), "<html>ok</html>");
  assert.match(file.contentType, /text\/html/);
});

test("getFile returns null and deletes after expiry", async () => {
  const nowMs = { current: Date.parse("2026-09-19T12:00:00.000Z") };
  const { store } = await tempStore(nowMs);
  await store.put({
    ttlSeconds: 1,
    from: { type: "cli", name: "edges-cli" },
    files: [{ path: "index.html", content: "soon gone" }],
  });
  nowMs.current = Date.parse("2026-09-19T12:00:02.000Z");
  const file = await store.getFile(FIXED_ID, "index.html");
  assert.equal(file, null);
  const meta = await store.getMeta(FIXED_ID);
  assert.equal(meta, null);
});

test("sweepExpired removes only expired artifacts", async () => {
  const nowMs = { current: Date.parse("2026-09-19T12:00:00.000Z") };
  const dataDir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-"));
  let n = 0;
  const ids = [
    "11111111-1111-4111-8111-111111111111",
    "22222222-2222-4222-8222-222222222222",
  ];
  const store = createArtifactStore({
    dataDir,
    now: () => new Date(nowMs.current),
    idFactory: () => ids[n++] ?? ids[1],
  });
  await store.put({
    ttlSeconds: 1,
    from: { type: "cli", name: "edges-cli" },
    files: [{ path: "a.html", content: "a" }],
  });
  await store.put({
    ttlSeconds: 3600,
    from: { type: "cli", name: "edges-cli" },
    files: [{ path: "b.html", content: "b" }],
  });
  nowMs.current = Date.parse("2026-09-19T12:00:02.000Z");
  const removed = await store.sweepExpired();
  assert.equal(removed, 1);
  assert.equal(await store.getFile(ids[0], "a.html"), null);
  const kept = await store.getFile(ids[1], "b.html");
  assert.ok(kept);
  assert.equal(kept.bytes.toString("utf8"), "b");
});

test("getFile refuses an intermediate directory symlink", async () => {
  const nowMs = { current: Date.parse("2026-09-19T12:00:00.000Z") };
  const { store, dataDir } = await tempStore(nowMs);
  await store.put({
    ttlSeconds: 60,
    from: { type: "cli", name: "edges-cli" },
    files: [
      { path: "css/app.css", content: "body{}" },
      { path: "index.html", content: "ok" },
    ],
    entry: "index.html",
  });
  const cssDir = path.join(dataDir, FIXED_ID, "files", "css");
  await rm(cssDir, { recursive: true, force: true });
  await symlink("/etc", cssDir);
  const file = await store.getFile(FIXED_ID, "css/passwd");
  assert.equal(file, null);
});

test("created artifact dirs are 0700 and files are 0600", async () => {
  const nowMs = { current: Date.parse("2026-09-19T12:00:00.000Z") };
  const { store, dataDir } = await tempStore(nowMs);
  await store.put({
    ttlSeconds: 60,
    from: { type: "cli", name: "edges-cli" },
    files: [{ path: "index.html", content: "ok" }],
  });
  const dirMode = (await stat(path.join(dataDir, FIXED_ID))).mode & 0o777;
  const fileMode = (await stat(path.join(dataDir, FIXED_ID, "files", "index.html"))).mode & 0o777;
  assert.equal(dirMode, 0o700);
  assert.equal(fileMode, 0o600);
});

test("sweepExpired deletes orphan UUID dirs and invalid expiresAt", async () => {
  const nowMs = { current: Date.parse("2026-09-19T12:00:00.000Z") };
  const { store, dataDir } = await tempStore(nowMs);
  const orphan = "33333333-3333-4333-8333-333333333333";
  await mkdir(path.join(dataDir, orphan, "files"), { recursive: true });
  await writeFile(path.join(dataDir, orphan, "files", "stuck.txt"), "left behind");
  const removedOrphan = await store.sweepExpired();
  assert.equal(removedOrphan, 1);
  await assert.rejects(() => access(path.join(dataDir, orphan)));

  await store.put({
    ttlSeconds: 60,
    from: { type: "cli", name: "edges-cli" },
    files: [{ path: "index.html", content: "immortal" }],
  });
  await writeFile(
    path.join(dataDir, FIXED_ID, "meta.json"),
    `${JSON.stringify({ id: FIXED_ID, entry: "index.html", expiresAt: "not-a-date" })}\n`,
  );
  const file = await store.getFile(FIXED_ID, "index.html");
  assert.equal(file, null);
});

test("getFile refuses a symlink inside the artifact dir", async () => {
  const nowMs = { current: Date.parse("2026-09-19T12:00:00.000Z") };
  const { store, dataDir } = await tempStore(nowMs);
  await store.put({
    ttlSeconds: 60,
    from: { type: "cli", name: "edges-cli" },
    files: [{ path: "index.html", content: "real" }],
  });
  const target = path.join(dataDir, FIXED_ID, "files", "index.html");
  await unlink(target);
  await symlink("/etc/passwd", target);
  const file = await store.getFile(FIXED_ID, "index.html");
  assert.equal(file, null);
});

test("put rejects traversal file paths", async () => {
  const nowMs = { current: Date.parse("2026-09-19T12:00:00.000Z") };
  const { store } = await tempStore(nowMs);
  await assert.rejects(
    () =>
      store.put({
        ttlSeconds: 60,
        from: { type: "cli", name: "edges-cli" },
        files: [{ path: "../secret", content: "no" }],
      }),
    /relative POSIX|\.\.|empty segments|escapes/,
  );
});

test("put writes from into meta.json", async () => {
  const nowMs = { current: Date.parse("2026-09-19T12:00:00.000Z") };
  const { store, dataDir } = await tempStore(nowMs);
  await store.put({
    ttlSeconds: 60,
    from: { type: "skill", name: "project-tasks-classify" },
    files: [{ path: "index.html", content: "ok" }],
  });
  const meta = await store.getMeta(FIXED_ID);
  assert.deepEqual(meta?.from, { type: "skill", name: "project-tasks-classify" });
  const raw = JSON.parse(await readFile(path.join(dataDir, FIXED_ID, "meta.json"), "utf8")) as {
    from: { type: string; name: string };
  };
  assert.deepEqual(raw.from, { type: "skill", name: "project-tasks-classify" });
});

test("put rejects missing or empty from", async () => {
  const nowMs = { current: Date.parse("2026-09-19T12:00:00.000Z") };
  const { store } = await tempStore(nowMs);
  const files = [{ path: "index.html", content: "ok" }];
  await assert.rejects(() => store.put({ ttlSeconds: 60, files }), /from/);
  await assert.rejects(
    () => store.put({ ttlSeconds: 60, from: { type: "", name: "edges-cli" }, files }),
    /from\.type/,
  );
  await assert.rejects(
    () => store.put({ ttlSeconds: 60, from: { type: "cli", name: "   " }, files }),
    /from\.name/,
  );
});

test("put writes from.type task with project and stem", async () => {
  const nowMs = { current: Date.parse("2026-09-19T12:00:00.000Z") };
  const { store, dataDir } = await tempStore(nowMs);
  const from = {
    type: "task" as const,
    project: "agent-clients-ux",
    stem: "2026-09-18--自建云服务器临时托管artifacts",
  };
  const put = await store.put({
    ttlSeconds: 60,
    from,
    files: [{ path: "index.html", content: "ok" }],
  });
  assert.deepEqual(put.from, from);
  const meta = await store.getMeta(FIXED_ID);
  assert.deepEqual(meta?.from, from);
  const raw = JSON.parse(await readFile(path.join(dataDir, FIXED_ID, "meta.json"), "utf8")) as {
    from: Record<string, unknown>;
    task?: unknown;
  };
  assert.deepEqual(raw.from, from);
  assert.equal("name" in raw.from, false);
  assert.equal("task" in raw, false);
});

test("put named from has no top-level task", async () => {
  const nowMs = { current: Date.parse("2026-09-19T12:00:00.000Z") };
  const { store, dataDir } = await tempStore(nowMs);
  await store.put({
    ttlSeconds: 60,
    from: { type: "cli", name: "edges-cli" },
    files: [{ path: "index.html", content: "ok" }],
  });
  const raw = JSON.parse(await readFile(path.join(dataDir, FIXED_ID, "meta.json"), "utf8")) as {
    from: Record<string, unknown>;
    task?: unknown;
  };
  assert.deepEqual(raw.from, { type: "cli", name: "edges-cli" });
  assert.equal("task" in raw, false);
  assert.equal("project" in raw.from, false);
});

test("put rejects invalid from.type task", async () => {
  const nowMs = { current: Date.parse("2026-09-19T12:00:00.000Z") };
  const { store } = await tempStore(nowMs);
  const files = [{ path: "index.html", content: "ok" }];
  await assert.rejects(
    () => store.put({ ttlSeconds: 60, from: { type: "task", project: "agent-clients-ux" } as never, files }),
    /from\.stem/,
  );
  await assert.rejects(
    () => store.put({ ttlSeconds: 60, from: { type: "task", stem: "2026-09-18--x" } as never, files }),
    /from\.project/,
  );
  await assert.rejects(
    () => store.put({ ttlSeconds: 60, from: { type: "task", name: "edges-cli" } as never, files }),
    /from\.(project|stem)/,
  );
  await assert.rejects(
    () =>
      store.put({
        ttlSeconds: 60,
        from: { type: "task", project: "../etc", stem: "ok" },
        files,
      }),
    /from\.project/,
  );
  await assert.rejects(
    () =>
      store.put({
        ttlSeconds: 60,
        from: { type: "task", project: "_default", stem: "a/b" },
        files,
      }),
    /from\.stem/,
  );
});
