import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, realpath, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "../src/server.js";
import { run } from "../../../cli/src/program.js";

test("MCP discovery and note creation share CLI Project selection and boundaries", async (t) => {
  const root = await realpath(await mkdtemp(path.join(tmpdir(), "mcp-project-")));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, "AGENTS.md"), "# Scope\n");
  const project = async (face: ".edges/projects" | "projects", ...args: string[]) => {
    const result = await run(["--scope", root, ...args, "projects", "create", "--title", "Topic"], { env: {} });
    assert.equal(result.exitCode, 0, result.stdout + result.stderr);
    return path.relative(face, path.dirname(JSON.parse(result.stdout).path));
  };
  const parent = await project(".edges/projects");
  const child = await project(".edges/projects", "--project", parent);
  const superChild = await project("projects", "--super");
  const server = createMcpServer({
    scopeDir: root, cwd: root,
    cliEntry: fileURLToPath(new URL("../../../cli/src/index.ts", import.meta.url)),
    skillsPath: root, baseBranch: "main", mode: "direct", dryRun: false,
  });
  const client = new Client({ name: "note-test", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  t.after(async () => { await client.close(); await server.close(); });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  const tool = (await client.listTools()).tools.find((tool) => tool.name === "new_note")!;
  assert.ok(tool.inputSchema.properties?.project);
  assert.ok(tool.inputSchema.properties?.super);
  assert.equal(tool.inputSchema.properties?.scope, undefined);
  const create = async (args: Record<string, unknown>) => {
    const result = await client.callTool({ name: "new_note", arguments: args });
    const content = result.content as Array<{ type: string; text: string }>;
    return JSON.parse(content[0]!.text);
  };
  for (const [flags, folder] of [
    [{}, ".edges/notes"],
    [{ super: true }, "notes"],
    [{ project: child }, `.edges/projects/${child}/notes`],
    [{ project: superChild, super: true }, `projects/${superChild}/notes`],
  ] as const) {
    const result = await create({ title: "Stored", body: "Content", ...flags });
    assert.equal(result.status, "success", JSON.stringify(result));
    assert.equal(path.dirname(path.dirname(result.path)), folder);
    assert.match(await readFile(path.join(root, result.path), "utf8"), /Content/);
  }
  const before = (await readdir(root, { recursive: true })).sort();
  for (const project of ["missing", "..", root, `${parent}/../outside`]) {
    const result = await create({ title: "Rejected", project });
    assert.equal(result.status, "failed");
    assert.equal(result.errorCode, "VALIDATION_ERROR");
  }
  assert.deepEqual((await readdir(root, { recursive: true })).sort(), before);
});
