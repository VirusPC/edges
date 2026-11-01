import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { run } from "../../src/program.js";

type Module = "notes" | "projects";
type Leaf = { path: string; title: string; body: string };

function scope(t: test.TestContext): string {
  const root = mkdtempSync(path.join(realpathSync(tmpdir()), "dated-leaf-scope-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function call(root: string, module: Module, superScope: boolean, args: string[]) {
  return run(["--scope", root, ...(superScope ? ["--super"] : []), module, ...args], { env: {} });
}

async function successful<T>(result: ReturnType<typeof run>): Promise<T> {
  const output = await result;
  assert.equal(output.exitCode, 0, output.stdout + output.stderr);
  return JSON.parse(output.stdout) as T;
}

async function paths(root: string, module: Module, superScope: boolean, all = false): Promise<string[]> {
  const output = await successful<{ items: Leaf[] }>(run(
    ["--scope", root, ...(superScope ? ["--super"] : []), ...(all ? ["--all"] : []), module, "list"],
    { env: {} },
  ));
  return output.items.map((item) => item.path).sort();
}

for (const module of ["notes", "projects"] as const) {
  test(`${module} create in an existing scope stays discoverable through nested organization indexes`, async (t) => {
    const root = scope(t);
    writeFileSync(path.join(root, "AGENTS.md"), "# Scope\n");
    for (const superScope of [false, true]) {
      const made = await successful<Leaf>(call(root, module, superScope, ["create", "--title", "Grouped leaf"]));
      const folder = superScope ? module : `.edges/${module}`;
      assert.equal(path.dirname(path.dirname(made.path)), folder);
      assert.deepEqual(await paths(root, module, superScope), [made.path]);

      const stem = path.basename(path.dirname(made.path));
      const group = path.join(root, folder, "group");
      mkdirSync(group);
      renameSync(path.dirname(path.join(root, made.path)), path.join(group, stem));
      const entries = (link: string) => `# Organization\n\n<!-- edges-entries-local:start -->\n## 本层内容\n\n- [child](${link}) — child\n<!-- edges-entries-local:end -->\n`;
      writeFileSync(path.join(root, folder, "README.md"), entries("group/README.md"));
      writeFileSync(path.join(group, "README.md"), entries(`${stem}/INDEX.md`));
      assert.deepEqual(await paths(root, module, superScope), [`${folder}/group/${stem}/INDEX.md`]);
    }
  });

  test(`${module} CRUD and list isolate default and --super directories`, async (t) => {
    const root = scope(t);
    await successful(call(root, module, false, ["init"]));
    const leaves = new Map<boolean, Leaf>();
    for (const superScope of [false, true]) {
      const body = superScope ? "Public body" : "Maintenance body";
      const made = await successful<Leaf>(call(root, module, superScope, [
        "create", "--title", "Same title", "--body", body,
      ]));
      const expectedFolder = superScope ? module : `.edges/${module}`;
      assert.equal(path.dirname(path.dirname(made.path)), expectedFolder);
      assert.match(path.basename(path.dirname(made.path)), /^\d{4}-\d{2}-\d{2}--same-title$/);
      assert.match(readFileSync(path.join(root, expectedFolder, "README.md"), "utf8"), /same-title\/INDEX\.md/);
      const got = await successful<Leaf>(call(root, module, superScope, ["get", made.path]));
      assert.match(got.body, new RegExp(body));
      leaves.set(superScope, made);
    }
    assert.notEqual(leaves.get(false)!.path, leaves.get(true)!.path);

    for (const superScope of [false, true]) {
      const made = leaves.get(superScope)!;
      const other = leaves.get(!superScope)!;
      const before = readFileSync(path.join(root, other.path), "utf8");
      for (const args of [
        ["get", other.path],
        ["update", other.path, "--body", "Wrong directory"],
        ["delete", other.path],
      ]) {
        const rejected = await call(root, module, superScope, args);
        assert.notEqual(rejected.exitCode, 0, rejected.stdout + rejected.stderr);
        assert.equal(readFileSync(path.join(root, other.path), "utf8"), before);
      }
      await successful(call(root, module, superScope, [
        "update", made.path, "--title", superScope ? "Updated public" : "Updated maintenance",
        "--body", "Changed in selected directory",
      ]));
      const got = await successful<Leaf>(call(root, module, superScope, ["get", made.path]));
      assert.equal(got.title, superScope ? "Updated public" : "Updated maintenance");
      assert.match(got.body, /Changed in selected directory/);
      assert.equal(readFileSync(path.join(root, other.path), "utf8"), before);
      assert.deepEqual(await paths(root, module, superScope), [made.path]);
      for (const all of [false, true]) {
        const excluded = await successful<{ items: Leaf[] }>(run([
          "--scope", root, ...(superScope ? ["--super"] : []), ...(all ? ["--all"] : []),
          "--exclude", module, module, "list",
        ], { env: {} }));
        assert.deepEqual(excluded.items, []);
      }
    }

    const maintenance = leaves.get(false)!;
    const content = leaves.get(true)!;
    await successful(call(root, module, false, ["delete", maintenance.path]));
    assert.equal(existsSync(path.join(root, maintenance.path)), false);
    assert.deepEqual(await paths(root, module, false), []);
    assert.deepEqual(await paths(root, module, true), [content.path]);
    assert.doesNotMatch(readFileSync(path.join(root, ".edges", module, "README.md"), "utf8"), /same-title\/INDEX\.md/);
    await successful(call(root, module, true, ["delete", content.path]));
    assert.equal(existsSync(path.join(root, content.path)), false);
    assert.deepEqual(await paths(root, module, true), []);
  });

  test(`${module} init ignores --super and create reuses its harness index`, async (t) => {
    const root = scope(t);
    await successful(call(root, module, true, ["init"]));
    const index = path.join(root, ".edges", module, "README.md");
    assert.match(readFileSync(index, "utf8"), /edges-entries-local:start/);
    assert.equal(existsSync(path.join(root, module)), false);
    const made = await successful<Leaf>(call(root, module, false, ["create", "--title", "Initialized leaf"]));
    assert.equal(path.dirname(path.dirname(made.path)), `.edges/${module}`);
    assert.match(readFileSync(index, "utf8"), /initialized-leaf\/INDEX\.md/);
    assert.equal(existsSync(path.join(root, module)), false);
    assert.deepEqual(await paths(root, module, false), [made.path]);
    assert.deepEqual(await paths(root, module, true), []);
    await successful(call(root, module, true, ["init"]));
    assert.match(readFileSync(index, "utf8"), /initialized-leaf\/INDEX\.md/);
    assert.deepEqual(await paths(root, module, false), [made.path]);
  });

  test(`${module} list honors --exclude compose through explicitly linked indexes`, async (t) => {
    const root = scope(t);
    const composed = path.join(root, ".edges/compose/demo");
    mkdirSync(composed, { recursive: true });
    for (const selected of [root, composed]) {
      await successful(call(selected, module, false, ["init"]));
    }
    const remote = await successful<Leaf>(call(composed, module, false, ["create", "--title", "Composed leaf"]));
    const remotePath = path.relative(root, path.join(composed, remote.path));
    for (const superScope of [false, true]) {
      await successful(call(root, module, superScope, ["create", "--title", "Local leaf"]));
      const index = path.join(root, ...(superScope ? [] : [".edges"]), module, "README.md");
      const link = path.relative(path.dirname(index), path.join(composed, ".edges", module, "README.md"));
      writeFileSync(index, readFileSync(index, "utf8").replace(
        "<!-- edges-entries-local:end -->",
        `- [Composed](${link}) — linked contents\n<!-- edges-entries-local:end -->`,
      ));
    }
    for (const superScope of [false, true]) {
      for (const all of [false, true]) {
        assert.ok((await paths(root, module, superScope, all)).includes(remotePath));
        const excluded = await successful<{ items: Leaf[] }>(run([
          "--scope", root, ...(superScope ? ["--super"] : []), ...(all ? ["--all"] : []),
          "--exclude", "compose", module, "list",
        ], { env: {} }));
        assert.ok(excluded.items.length > 0);
        assert.ok(excluded.items.every((item) => !item.path.startsWith(".edges/compose/")), JSON.stringify(excluded));
      }
    }
  });

  test(`${module} --all keeps a composed checkout without expanding its nested Compose indexes`, async (t) => {
    const root = scope(t);
    await successful(call(root, module, false, ["init"]));
    const own = await successful<Leaf>(call(root, module, false, ["create", "--title", "Host maintenance"]));
    const content = await successful<Leaf>(call(root, module, true, ["create", "--title", "Host content"]));
    const checkout = ".edges/compose/demo";
    const local = `${checkout}/.edges/${module}/local/INDEX.md`;
    const nested = `${checkout}/.edges/compose/nested/.edges/${module}/nested/INDEX.md`;
    const put = (file: string, body: string) => {
      const abs = path.join(root, file);
      mkdirSync(path.dirname(abs), { recursive: true });
      writeFileSync(abs, body);
    };
    const entries = (links: string[]) => `# Contents\n\n<!-- edges-entries-local:start -->\n## 本层内容\n\n${links.map((link) => `- [child](${link}) — child`).join("\n")}\n<!-- edges-entries-local:end -->\n`;
    put(`${checkout}/AGENTS.md`, `# Composed\n\n<!-- edges-local:start -->\n## 本层系统维护信息\n\n- [Contents](.edges/${module}/README.md) — contents\n<!-- edges-local:end -->\n`);
    put(`${checkout}/.edges/${module}/README.md`, entries([
      "local/INDEX.md",
      `../compose/nested/.edges/${module}/README.md`,
    ]));
    put(local, "# Composed local\n");
    put(`${checkout}/.edges/compose/nested/.edges/${module}/README.md`, entries(["nested/INDEX.md"]));
    put(nested, "# Nested composed leaf\n");

    for (const superScope of [false, true]) {
      assert.deepEqual(
        await paths(root, module, superScope, true),
        [own.path, local, ...(superScope ? [content.path] : [])].sort(),
      );
      const excluded = await successful<{ items: Leaf[] }>(run([
        "--scope", root, ...(superScope ? ["--super"] : []), "--all",
        "--exclude", "compose", module, "list",
      ], { env: {} }));
      assert.deepEqual(
        excluded.items.map((item) => item.path).sort(),
        [own.path, ...(superScope ? [content.path] : [])].sort(),
      );
    }
  });

  test(`${module} --super --all keeps the Compose boundary when scope is inside a checkout`, async (t) => {
    const root = scope(t);
    const checkout = path.join(root, ".edges/compose/demo");
    const selected = path.join(checkout, "feature");
    const nested = path.join(checkout, ".edges/compose/nested");
    const local = await successful<Leaf>(call(selected, module, true, ["create", "--title", "Local"]));
    await successful(call(nested, module, true, ["create", "--title", "Remote"]));
    const index = path.join(selected, module, "README.md");
    const link = path.relative(path.dirname(index), path.join(nested, module, "README.md"));
    writeFileSync(index, readFileSync(index, "utf8").replace(
      "<!-- edges-entries-local:end -->",
      `- [Nested](${link}) — nested Compose\n<!-- edges-entries-local:end -->`,
    ));
    assert.deepEqual(await paths(selected, module, true, true), [local.path]);
  });

  test(`${module} parent and child scopes keep their own default and --super leaves`, async (t) => {
    const root = scope(t);
    const child = path.join(root, "child");
    mkdirSync(child);
    const made = new Map<string, Leaf>();
    for (const selected of [root, child]) {
      await successful(call(selected, module, false, ["init"]));
      for (const superScope of [false, true]) {
        const leaf = await successful<Leaf>(call(selected, module, superScope, [
          "create", "--title", "Same title", "--body", selected === root ? "Parent body" : "Child body",
        ]));
        made.set(`${selected}:${superScope}`, leaf);
      }
    }
    for (const superScope of [false, true]) {
      const childLeaf = made.get(`${child}:${superScope}`)!;
      const parentLeaf = made.get(`${root}:${superScope}`)!;
      const parentBefore = readFileSync(path.join(root, parentLeaf.path), "utf8");
      await successful(call(child, module, superScope, ["update", childLeaf.path, "--body", "Child changed"]));
      assert.equal(readFileSync(path.join(root, parentLeaf.path), "utf8"), parentBefore);
      assert.deepEqual(await paths(child, module, superScope), [childLeaf.path]);
      const attemptedParent = await call(child, module, superScope, ["delete", `../${parentLeaf.path}`]);
      assert.notEqual(attemptedParent.exitCode, 0, attemptedParent.stdout);
      assert.equal(readFileSync(path.join(root, parentLeaf.path), "utf8"), parentBefore);
    }
    const rootMaintenance = made.get(`${root}:false`)!.path;
    const rootContent = made.get(`${root}:true`)!.path;
    const childMaintenance = made.get(`${child}:false`)!.path;
    assert.deepEqual(await paths(root, module, false, true), [rootMaintenance, `child/${childMaintenance}`].sort());
    assert.deepEqual(await paths(root, module, true), [rootContent]);
    assert.deepEqual(await paths(root, module, true, true), [rootMaintenance, rootContent, `child/${childMaintenance}`].sort());
    assert.deepEqual(await paths(child, module, false, true), [childMaintenance]);
  });
}
