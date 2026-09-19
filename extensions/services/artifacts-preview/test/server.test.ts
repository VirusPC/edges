import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, symlink, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { listenArtifactsServer } from "../src/server.js";

const TOKEN = "test-shared-token-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const FIXED_ID = "2c1d3e4f-5a6b-4c7d-8e9f-0123456789ab";

async function startServer(nowMs: { current: number }) {
  const dataDir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-http-"));
  const listening = await listenArtifactsServer({
    token: TOKEN,
    dataDir,
    baseUrl: "http://artifacts.test",
    now: () => new Date(nowMs.current),
    idFactory: () => FIXED_ID,
    sweepIntervalMs: null,
    listen: { host: "127.0.0.1", port: 0 },
  });
  return { ...listening, dataDir };
}

test("POST upload then unauthenticated GET returns the file", async () => {
  const nowMs = { current: Date.parse("2026-09-19T12:00:00.000Z") };
  const { url, close } = await startServer(nowMs);
  try {
    const created = await fetch(`${url}/artifacts`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        ttlSeconds: 60,
        files: [{ path: "index.html", content: "<html>hello</html>" }],
      }),
    });
    assert.equal(created.status, 201);
    const body = (await created.json()) as { id: string; url: string; expiresAt: string };
    assert.equal(body.id, FIXED_ID);
    assert.equal(body.url, `http://artifacts.test/artifacts/${FIXED_ID}/`);
    assert.equal(body.expiresAt, "2026-09-19T12:01:00.000Z");

    const page = await fetch(`${url}/artifacts/${FIXED_ID}/`);
    assert.equal(page.status, 200);
    assert.equal(await page.text(), "<html>hello</html>");
    assert.match(page.headers.get("content-type") ?? "", /text\/html/);
  } finally {
    await close();
  }
});

test("POST without Bearer is 401", async () => {
  const nowMs = { current: Date.parse("2026-09-19T12:00:00.000Z") };
  const { url, close } = await startServer(nowMs);
  try {
    const created = await fetch(`${url}/artifacts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ files: [{ path: "index.html", content: "x" }] }),
    });
    assert.equal(created.status, 401);
    const body = (await created.json()) as { errorCode: string };
    assert.equal(body.errorCode, "AUTH_MISSING");
  } finally {
    await close();
  }
});

test("POST with wrong token is 401", async () => {
  const nowMs = { current: Date.parse("2026-09-19T12:00:00.000Z") };
  const { url, close } = await startServer(nowMs);
  try {
    const created = await fetch(`${url}/artifacts`, {
      method: "POST",
      headers: {
        authorization: "Bearer wrong-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({ files: [{ path: "index.html", content: "x" }] }),
    });
    assert.equal(created.status, 401);
    const body = (await created.json()) as { errorCode: string };
    assert.equal(body.errorCode, "AUTH_INVALID_TOKEN");
  } finally {
    await close();
  }
});

test("expired artifact GET is 404", async () => {
  const nowMs = { current: Date.parse("2026-09-19T12:00:00.000Z") };
  const { url, close } = await startServer(nowMs);
  try {
    const created = await fetch(`${url}/artifacts`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        ttlSeconds: 1,
        files: [{ path: "index.html", content: "bye" }],
      }),
    });
    assert.equal(created.status, 201);
    nowMs.current = Date.parse("2026-09-19T12:00:02.000Z");
    const page = await fetch(`${url}/artifacts/${FIXED_ID}/index.html`);
    assert.equal(page.status, 404);
  } finally {
    await close();
  }
});

test("GET traversal path does not escape the artifact root", async () => {
  const nowMs = { current: Date.parse("2026-09-19T12:00:00.000Z") };
  const { url, close } = await startServer(nowMs);
  try {
    const created = await fetch(`${url}/artifacts`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ files: [{ path: "index.html", content: "ok" }] }),
    });
    assert.equal(created.status, 201);
    const escaped = await fetch(`${url}/artifacts/${FIXED_ID}/../../../../etc/passwd`);
    assert.ok(escaped.status === 404 || escaped.status === 400);
    const text = await escaped.text();
    assert.doesNotMatch(text, /root:/);
  } finally {
    await close();
  }
});

test("GET refuses a symlink inside the artifact dir", async () => {
  const nowMs = { current: Date.parse("2026-09-19T12:00:00.000Z") };
  const { url, close, dataDir } = await startServer(nowMs);
  try {
    const created = await fetch(`${url}/artifacts`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ files: [{ path: "index.html", content: "ok" }] }),
    });
    assert.equal(created.status, 201);
    const target = path.join(dataDir, FIXED_ID, "files", "index.html");
    await unlink(target);
    await symlink("/etc/passwd", target);
    const page = await fetch(`${url}/artifacts/${FIXED_ID}/index.html`);
    assert.equal(page.status, 404);
  } finally {
    await close();
  }
});

test("DELETE requires auth and removes the artifact", async () => {
  const nowMs = { current: Date.parse("2026-09-19T12:00:00.000Z") };
  const { url, close } = await startServer(nowMs);
  try {
    const created = await fetch(`${url}/artifacts`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ files: [{ path: "index.html", content: "ok" }] }),
    });
    assert.equal(created.status, 201);

    const denied = await fetch(`${url}/artifacts/${FIXED_ID}`, { method: "DELETE" });
    assert.equal(denied.status, 401);

    const removed = await fetch(`${url}/artifacts/${FIXED_ID}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${TOKEN}` },
    });
    assert.equal(removed.status, 204);
    const page = await fetch(`${url}/artifacts/${FIXED_ID}/`);
    assert.equal(page.status, 404);
  } finally {
    await close();
  }
});

test("GET /health is unauthenticated", async () => {
  const nowMs = { current: Date.parse("2026-09-19T12:00:00.000Z") };
  const { url, close } = await startServer(nowMs);
  try {
    const health = await fetch(`${url}/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { ok: true });
  } finally {
    await close();
  }
});
