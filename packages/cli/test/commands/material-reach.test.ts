import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { run } from "../../src/program.js";
import {
  AgentsNode, ComposeReadmeNode, MemoryNode, NoteNode, ProjectNode, ReadmeNode, RoutineNode, SkillNode, TaskNode,
} from "../../src/domain/models/index.js";

const modules = ["notes", "projects", "tasks", "memory", "skills", "routines"] as const;
type Module = typeof modules[number];
type Materials = Record<Module, string>;

/** One declared graph exercises every CLI adapter against identical ownership boundaries. */
function fixture(t: test.TestContext) {
  const root = mkdtempSync(path.join(realpathSync(tmpdir()), "material-reach-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (file: string, body: string) => {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, body);
  };
  const refs = (files: string[]) => files.map((id) => ({ id }));
  const index = (file: string, children: string[]) => put(file, new ReadmeNode(file).create({
    localChildren: refs(children),
  }, { operation: "create" }).serialize());
  const agents = (directory: string, children: string[], descendants: string[] = []) => {
    const file = path.join(directory, "AGENTS.md");
    put(file, new AgentsNode(file).create({
      localChildren: refs(children), descendantChildren: refs(descendants),
    }, { operation: "create" }).serialize());
  };
  const materials = (directory: string, label: string, selectedModules: readonly Module[] = modules) => {
    const files: Materials = {
      notes: path.join(directory, "notes", label, "INDEX.md"),
      projects: path.join(directory, "projects", label, "INDEX.md"),
      tasks: path.join(directory, "tasks/todo", label, "INDEX.md"),
      memory: path.join(directory, "memory/projects", `project_${label}`, "INDEX.md"),
      skills: path.join(directory, "skills/managed", label, "SKILL.md"),
      routines: path.join(directory, "routines", label, "INDEX.md"),
    };
    const context = { operation: "create" } as const;
    const documents: Record<Module, string> = {
      notes: new NoteNode(files.notes).create({ body: `# ${label}\n` }, context).serialize(),
      projects: new ProjectNode(files.projects).create({ body: `# ${label}\n` }, context).serialize(),
      tasks: new TaskNode(files.tasks).create({ title: label, status: "todo" }, context).serialize(),
      memory: new MemoryNode(files.memory).create({ name: label, description: label, memoryType: "project" }, context).serialize(),
      skills: new SkillNode(files.skills).create({ name: label, description: label }, context).serialize(),
      routines: new RoutineNode(files.routines).create({ name: label, description: label }, context).serialize(),
    };
    const indexes = selectedModules.map((module) => {
      put(files[module], documents[module]);
      const parents = { tasks: "tasks", memory: "memory/projects", skills: "skills/managed" };
      const file = path.join(directory, module in parents ? parents[module as keyof typeof parents] : module, "README.md");
      index(file, [files[module]]);
      return file;
    });
    index(path.join(directory, "README.md"), indexes);
    return { files, indexes };
  };
  const system = (directory: string, label: string, selectedModules: readonly Module[] = modules) => {
    const result = materials(path.join(directory, ".edges"), label, selectedModules);
    agents(directory, [path.join(directory, ".edges/README.md")]);
    return result;
  };
  const project = (directory: string, label: string) => {
    const result = materials(directory, label);
    const file = path.join(directory, "INDEX.md");
    put(file, new ProjectNode(file).create({ localChildren: refs(result.indexes) }, { operation: "create" }).serialize());
    return result;
  };
  const listed = async (module: Module, flags: string[]) => {
    const result = await run(["--scope", root, ...flags, module, "list"], { env: {} });
    assert.equal(result.exitCode, 0, `${module} ${flags.join(" ")}: ${result.stdout}${result.stderr}`);
    const payload = JSON.parse(result.stdout) as { items?: Array<{ path: string }>; tasks?: Array<{ path: string }> };
    const items = module === "tasks" ? payload.tasks : payload.items;
    assert.ok(items, `${module}: missing list result`);
    const paths = items.map((item) => path.resolve(root, item.path)).sort();
    assert.equal(new Set(paths).size, paths.length, `${module}: a material reached twice must occur once`);
    return paths;
  };
  return { root, put, index, agents, materials, system, project, listed };
}

test("directory modules share default, super and all selection with Compose boundaries", async (t) => {
  const f = fixture(t);
  const own = f.system(f.root, "harness");
  const flat = f.materials(f.root, "flat");
  const registered = f.system(path.join(f.root, "registered"), "registered");
  const independent = f.system(path.join(f.root, "independent"), "independent");
  // Exclusion must stop physical discovery too: these systems live inside the excluded material.
  const embedded = Object.fromEntries(modules.map((module) => [module,
    f.system(path.dirname(independent.files[module]), `embedded-${module}`, [module]).files[module],
  ])) as Materials;
  const checkout = path.join(f.root, ".edges/compose/vendor");
  const vendor = f.system(checkout, "vendor");
  f.system(path.join(checkout, ".edges/compose/nested"), "nested-vendor");
  // The registered child is also discovered as a forest root and must occur once.
  f.agents(f.root, [path.join(f.root, ".edges/README.md")], [path.join(f.root, "registered/AGENTS.md")]);

  for (const module of modules) await t.test(module, async (t) => {
    const forest = [own.files[module], registered.files[module], independent.files[module], embedded[module], vendor.files[module]];
    const cases: Array<[string[], string[]]> = [
      [[], [own.files[module], registered.files[module]]],
      [["--super"], [flat.files[module]]],
      [["--all"], forest],
      [["--super", "--all"], [flat.files[module], ...forest]],
      [["--all", "--exclude", "compose"], forest.filter((file) => file !== vendor.files[module])],
      [["--super", "--all", "--exclude", "compose"], [flat.files[module], ...forest.filter((file) => file !== vendor.files[module])]],
      [["--exclude", module], []],
      [["--all", "--exclude", module], []],
      [["--super", "--exclude", module], []],
      [["--super", "--all", "--exclude", module], []],
    ];
    for (const [flags, expected] of cases) {
      await t.test(flags.join(" ") || "default", async () => {
        assert.deepEqual(await f.listed(module, flags), expected.sort());
      });
    }
  });
});

test("directory modules share Project composition and keep super on its own projects tree", async (t) => {
  const f = fixture(t);
  f.system(f.root, "outside");
  const parent = path.join(f.root, ".edges/projects/parent");
  const child = path.join(parent, "projects/child-group");
  const direct = f.project(parent, "direct");
  const nested = f.project(child, "nested");
  f.index(path.join(parent, "projects/README.md"), [direct.files.projects, path.join(child, "INDEX.md")]);
  const independent = f.system(path.join(parent, "independent"), "independent");
  const checkout = path.join(parent, "compose/vendor");
  const vendor = f.system(checkout, "vendor");
  f.system(path.join(checkout, ".edges/compose/nested"), "nested-vendor");
  f.system(path.join(f.root, "sibling"), "sibling");

  for (const module of modules) await t.test(module, async (t) => {
    const composition = [direct.files[module], nested.files[module], ...(module === "projects" ? [path.join(child, "INDEX.md")] : [])];
    const forest = [independent.files[module], vendor.files[module]];
    const cases: Array<[string[], string[]]> = [
      [[], composition],
      [["--all"], [...composition, ...forest]],
      [["--all", "--exclude", "compose"], [...composition, independent.files[module]]],
      [["--exclude", "projects"], module === "projects" ? [] : [direct.files[module]]],
      [["--all", "--exclude", module], []],
    ];
    for (const flags of [["--super"], ["--super", "--all"]]) {
      const missed = await run(["--scope", f.root, "--project", "parent", ...flags, module, "list"], { env: {} });
      assert.notEqual(missed.exitCode, 0, `${module} ${flags.join(" ")} must not reuse the harness Project`);
    }
    for (const [flags, expected] of cases) {
      await t.test(flags.join(" ") || "default", async () => {
        assert.deepEqual(await f.listed(module, ["--project", "parent", ...flags]), expected.sort());
      });
    }
  });
});

test("all excludes a custom Compose checkout registered by an independent child system", async (t) => {
  const f = fixture(t);
  const own = f.system(f.root, "host", ["notes"]);
  const child = path.join(f.root, "independent");
  const independent = f.system(child, "independent", ["notes"]);
  const checkout = path.join(child, "vendor");
  const vendor = f.system(checkout, "vendor", ["notes"]);
  f.index(path.join(checkout, "README.md"), [path.join(checkout, ".edges/README.md")]);
  const file = path.join(child, ".edges/compose/README.md");
  const compose = new ComposeReadmeNode(file).create({ body: "# Shared repositories\n" }, { operation: "create" });
  compose.addChild({ name: "vendor", href: path.relative(path.dirname(file), checkout), description: "Shared notes" });
  f.put(file, compose.serialize());
  f.index(path.join(child, ".edges/README.md"), [...independent.indexes, file]);
  assert.deepEqual(await f.listed("notes", ["--all"]), [own.files.notes, independent.files.notes, vendor.files.notes].sort());
  assert.deepEqual(await f.listed("notes", ["--all", "--exclude", "compose"]), [own.files.notes, independent.files.notes].sort());
});
