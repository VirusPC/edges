import test from "node:test";
import assert from "node:assert/strict";
import { repoPathFromRemote, buildCompareUrl, createPullRequest } from "../src/git/pr.js";

test("repoPathFromRemote accepts ssh and https", () => {
  assert.equal(repoPathFromRemote("git@github.com:VirusPC/edges.git"), "VirusPC/edges");
  assert.equal(repoPathFromRemote("https://github.com/VirusPC/edges.git"), "VirusPC/edges");
});

test("buildCompareUrl encodes title and body", () => {
  const url = buildCompareUrl({
    remoteUrl: "https://github.com/VirusPC/edges.git",
    baseBranch: "main",
    branch: "ingest/2026-09-11-hello",
    title: "Hello World",
    body: "Auto-ingested with AI assistance.\n\nCo-authored-by: A <a@b.c>",
  });
  assert.ok(url);
  const parsed = new URL(url);
  assert.equal(parsed.pathname, "/VirusPC/edges/compare/main...ingest/2026-09-11-hello");
  assert.equal(parsed.searchParams.get("expand"), "1");
  assert.equal(parsed.searchParams.get("title"), "Hello World");
});

test("createPullRequest uses gh stdout URL when auth status succeeds", async () => {
  const calls: string[][] = [];
  const result = await createPullRequest({
    title: "Hello",
    body: "Body",
    branch: "ingest/x",
    baseBranch: "main",
    remoteUrl: "https://github.com/VirusPC/edges.git",
    exec: async (file, args) => {
      calls.push([file, ...args]);
      if (file === "gh" && args[0] === "auth") return { stdout: "ok", stderr: "" };
      if (file === "gh" && args[0] === "pr") {
        return { stdout: "https://github.com/VirusPC/edges/pull/9\n", stderr: "" };
      }
      throw new Error(`unexpected ${file} ${args.join(" ")}`);
    },
  });
  assert.equal(result.created, true);
  assert.equal(result.htmlUrl, "https://github.com/VirusPC/edges/pull/9");
  assert.ok(calls.some((c) => c[0] === "gh" && c[1] === "pr"));
});

test("createPullRequest runs gh in the given cwd and env", async () => {
  const opts: Array<{ cwd?: string; env?: NodeJS.ProcessEnv } | undefined> = [];
  const result = await createPullRequest({
    title: "Hello",
    body: "Body",
    branch: "ingest/x",
    baseBranch: "main",
    remoteUrl: "https://github.com/VirusPC/edges.git",
    cwd: "/repo",
    env: { PATH: "/bin" },
    exec: async (file, args, options) => {
      opts.push(options);
      if (file === "gh" && args[0] === "auth") return { stdout: "ok", stderr: "" };
      if (file === "gh" && args[0] === "pr") {
        return { stdout: "https://github.com/VirusPC/edges/pull/9\n", stderr: "" };
      }
      throw new Error(`unexpected ${file} ${args.join(" ")}`);
    },
  });
  assert.equal(result.created, true);
  assert.ok(opts.length >= 2);
  assert.ok(opts.every((o) => o?.cwd === "/repo"));
  assert.ok(opts.every((o) => o?.env?.PATH === "/bin"));
});

test("createPullRequest falls back to compare URL when token fetch throws", async () => {
  const result = await createPullRequest({
    title: "Hello",
    body: "Body",
    branch: "ingest/x",
    baseBranch: "main",
    remoteUrl: "https://github.com/VirusPC/edges.git",
    githubToken: "ghs_test",
    exec: async (file) => {
      if (file === "gh") throw Object.assign(new Error("not found"), { code: "ENOENT" });
      return { stdout: "", stderr: "" };
    },
    fetchJson: async () => {
      throw new Error("network down");
    },
  });
  assert.equal(result.created, false);
  assert.match(result.compareUrl ?? "", /VirusPC\/edges\/compare\/main\.\.\.ingest\/x/);
});

test("createPullRequest falls back to token fetch then compare URL", async () => {
  const result = await createPullRequest({
    title: "Hello",
    body: "Body",
    branch: "ingest/x",
    baseBranch: "main",
    remoteUrl: "https://github.com/VirusPC/edges.git",
    githubToken: "ghs_test",
    exec: async (file) => {
      if (file === "gh") throw Object.assign(new Error("not found"), { code: "ENOENT" });
      return { stdout: "", stderr: "" };
    },
    fetchJson: async (url, init) => {
      assert.equal(url, "https://api.github.com/repos/VirusPC/edges/pulls");
      assert.equal(init.method, "POST");
      assert.equal(init.headers.Authorization, "token ghs_test");
      return { html_url: "https://github.com/VirusPC/edges/pull/3" };
    },
  });
  assert.equal(result.created, true);
  assert.equal(result.htmlUrl, "https://github.com/VirusPC/edges/pull/3");
});
