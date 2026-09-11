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
