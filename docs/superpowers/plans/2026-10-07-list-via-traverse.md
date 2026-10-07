# List 只走树遍历或森林遍历 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用户命令的范围只由 `--scope`、`--super`、`--all` 的组合决定。list 只调用现成的 `traverse` 或 `buildSystemForest`。

**Architecture:** `--scope` 选定主体。`--super` 把主体换成该 scope 上的虚拟系统一，材料挂在 scope 目录上。不传 `--all` 时用 `NodeService.query`（内部就是 `traverse`）。`--all` 用 `buildSystemForest`，森林从当前 `--scope` 出发。这三个开关同级，挂在根命令上。缺文件的登记边在 query 的 resolve 里跳过。Tasks 只看主体系统：一般写入 `<scope>/.harness/tasks`；`--scope <仓库根> --super` 写入 `<仓库根>/tasks`。实现完成后再交仓库根与 `.harness` 的实测报告，实现前不跑。

**Tech Stack:** TypeScript、Node ≥22、`node:test`、tsx、`edges-cli`。

**Spec:** [docs/superpowers/specs/2026-10-07-list-via-traverse.md](../specs/2026-10-07-list-via-traverse.md)

## Global Constraints

- 工作区是独立 git worktree。当前草稿在 `.worktrees/fix-super-follows-scope`（分支 `fix/super-follows-scope`）。执行时以本计划为准，草稿与计划冲突就按计划改，不要再叠第三套。
- 相对 import 写 `.js`。
- commit：`type: subject`，AI 参与加 `Co-authored-by`。
- 不改 `posts/`。
- `--scope`、`--super`、`--all` 的组合形成一切。三个开关同级，挂在根命令上。帮助文案和测试只写这三个。不要再引入用途、index-group 或另一套范围开关。
- 实测矩阵在实现任务完成之前不要跑。

## File Structure

| 文件 | 职责 |
| --- | --- |
| `extensions/cli/src/services/node/node-service.ts` | `query` 的 resolve：目标不存在则跳过 |
| `extensions/cli/src/domain/config/harness-materials.ts` | 超节点材料 = `join(scopeDir, path)`；`harnessRootForScope` 仍只找 `<scope>/.harness` |
| `extensions/cli/src/context.ts` | `ctx.all` |
| `extensions/cli/src/program.ts` | 根选项 `--all` |
| `extensions/cli/src/commands/tasks/list.ts` | 读 `--all`：单树或森林，滤 `TaskNode` |
| `extensions/cli/src/commands/tasks/project/list.ts` | 读 `--all`：单树或森林，滤项目 `ReadmeNode` |
| `extensions/cli/src/services/memory/records.ts` | `listMemoryEntries` 改为 query / 森林，滤 `memory` |
| `extensions/cli/src/commands/skill/list.ts` | 读 `--all`：query / 森林，滤 `skill` |
| `extensions/cli/src/commands/note/list.ts` | 读 `--all`：query / 森林，滤 `note` |
| `extensions/cli/README.md` | 超节点 children 的仓库根例子 |
| `extensions/cli/src/domain/models/README.md` | 原则 5 与上句一致 |

`listRepositoryTaskNodes` 不再被 list 命令调用。`taskBoardQuery` 若只剩写路径/单板 get 在用，留在那里，不要为 list 再包一层。

---

### Task 1: 遍历跳过不存在的登记

**Files:**
- Modify: `extensions/cli/src/services/node/node-service.ts`（`query` 的 resolve）
- Test: `extensions/cli/test/services/node-service.test.ts`

**Interfaces:**
- Consumes: `traverse` 的 resolve 返回 `undefined` 即不进入该边
- Produces: `query` / `list` 在缺文件时仍返回其余节点

- [ ] **Step 1: Write the failing test**

在 `global query omits out-of-root references...` 里，把「missing local entries still fail」改成跳过：

```ts
write('AGENTS.md', index('- [missing](missing/AGENTS.md)'));
const skipped = await new NodeService({ managedRoot: root }).query(root, { includeHarness: true }).value();
assert.deepEqual(skipped.map(node => node.path), [path.join(root, 'AGENTS.md')]);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd extensions/cli && node --test --import tsx --test-name-pattern 'missing local entries' ./test/services/node-service.test.ts`

Expected: FAIL，`Missing referenced node`

- [ ] **Step 3: Skip in query resolve**

在 `query` 里 `traverse` 的 resolve 开头：

```ts
if (!fs.existsSync(reference.id)) return undefined;
```

不要改 `#reference` 的抛错。`move` 等写路径仍然因缺文件失败。

- [ ] **Step 4: Run test to verify it passes**

同一条命令。Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/cli/src/services/node/node-service.ts extensions/cli/test/services/node-service.test.ts
git commit -m "$(cat <<'EOF'
fix: skip missing entries during traverse

EOF
)"
```

---

### Task 2: 超节点材料挂在 scope 目录上

**Files:**
- Modify: `extensions/cli/src/domain/config/harness-materials.ts`
- Test: `extensions/cli/test/domain/harness-materials.test.ts`
- Test: `extensions/cli/test/services/super-agents-node.test.ts`
- Test: `extensions/cli/test/services/system-forest-service.test.ts`

**Interfaces:**
- Consumes: `harness-materials.json` 的 `path`
- Produces: `resolveHarnessMaterial(scopeDir, id)` 返回 `join(scopeDir, path)` 上存在的文件；`harnessRootForScope(scopeDir)` 仍返回 `<scope>/.harness`（若存在）

- [ ] **Step 1: Write the failing test**

```ts
test("super materials use the scope directory; the scope's own harness is one level down", () => {
  const root = mkdtempSync(path.join(tmpdir(), "hm-"));
  fs.mkdirSync(path.join(root, ".harness/tasks"), { recursive: true });
  fs.mkdirSync(path.join(root, "tasks"), { recursive: true });
  fs.writeFileSync(path.join(root, ".harness/tasks/README.md"), "# maintenance\n");
  fs.writeFileSync(path.join(root, "tasks/README.md"), "# content\n");
  assert.equal(harnessRootForScope(root), path.join(root, ".harness"));
  assert.equal(resolveHarnessMaterial(root, "tasks")?.absPath, path.join(root, "tasks/README.md"));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd extensions/cli && node --test --import tsx --test-name-pattern 'super materials use the scope' ./test/domain/harness-materials.test.ts`

Expected: FAIL，实际路径是 `root/.harness/tasks/README.md`

- [ ] **Step 3: Join scopeDir, not harnessRootForScope**

`resolveHarnessMaterial` 里：

```ts
const absPath = join(scopeDir, material.path);
```

`harnessRootForScope` 保留，给「这个 scope 自己的维护目录」用，超节点的 `listHarnessMaterialAbsPaths` 不调用它。

- [ ] **Step 4: Align super and forest tests**

`super-agents-node.test.ts`：同时写下 `<root>/tasks/README.md` 与 `<root>/.harness/tasks/README.md`，`list(root, { super: true })` 包含前者、不包含后者、不包含根 `AGENTS.md`。

`system-forest-service.test.ts` 的 Super 树断言同样改成 `<root>/tasks/README.md`。

- [ ] **Step 5: Run tests**

Run: `cd extensions/cli && node --test --import tsx ./test/domain/harness-materials.test.ts ./test/services/super-agents-node.test.ts ./test/services/system-forest-service.test.ts ./test/operations/traverse-dual-entry.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add extensions/cli/src/domain/config/harness-materials.ts \
  extensions/cli/test/domain/harness-materials.test.ts \
  extensions/cli/test/services/super-agents-node.test.ts \
  extensions/cli/test/services/system-forest-service.test.ts
git commit -m "$(cat <<'EOF'
fix: mount super materials on the scope directory

EOF
)"
```

---

### Task 3: tasks list 改为一次遍历或一片森林

**Files:**
- Modify: `extensions/cli/src/context.ts`
- Modify: `extensions/cli/src/program.ts`
- Modify: `extensions/cli/src/commands/tasks/list.ts`
- Test: `extensions/cli/test/tasks/super-flag.test.ts`

**Interfaces:**
- Consumes: 根选项 `--all` 写入 `ctx.all`。`NodeService.query(scope, { types: ["task"], super? })`；`buildSystemForest(scope, { includeSuper, form: "independent" })`
- Produces: stdout 仍是 `{ status, command: "list", tasks }`。每条至少有 `stem`、`path`、`title`、`status`、`priority`、`project`。`status` / `--priority` / `--project` / `--sort priority` / `--group-by` 在这个数组上做。

- [ ] **Step 1: Write the failing test**

仓库根有真 `AGENTS.md`，下层登记 `tasks/AGENTS.md`，该入口的组成里有一条 Task；同时存在 `.harness/tasks/` 上的另一条 Task。不传 `--super` 的 list 必须包含下层那条（路径含 `tasks/` 且不是只打开维护板才能看见）。`--super` 的 list 来自 scope 上的材料 README，不把 `.harness/tasks/` 并进同一次结果，除非材料 path 自己指到那里。

```ts
test("tasks list follows descendant systems through traverse", async (t) => {
  const root = fixtureWithDescendantTask(t);
  const listed = await run(["--scope", root, "tasks", "list"], { env: {} });
  assert.equal(listed.exitCode, 0, listed.stdout);
  assert.ok(JSON.parse(listed.stdout).tasks.some((task: { path: string }) => task.path.startsWith("tasks/")));
});
```

`fixtureWithDescendantTask` 按现有 `super-flag` fixture 的写法：根 `AGENTS.md` 的 descendant 指向 `tasks/AGENTS.md`，再指向一条 `INDEX.md` Task。

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL。当前 list 只打开 `<root>/.harness/tasks/`。

- [ ] **Step 3: Replace the board walk**

根命令增加 `--all`，与 `--scope`、`--super` 一样在 `preAction` 里写入上下文（`ctx.all`）。`tasks list` 不再自己声明森林开关。

`list` 的 action：

- 无 `--all`：`new NodeService({ managedRoot: gitRoot(scope) ?? scope }).query(scope, { types: ["task"], ...(ctx.super ? { super: true } : {}) })`，滤 `TaskNode`。
- 有 `--all`：`buildSystemForest(scope, { includeSuper: ctx.super === true, form: "independent" })`，展平后滤 `TaskNode`。森林起点是当前 `--scope`，不另跳 Git 根。
- 结果不按用途筛选，也不再输出用途字段。
- 删除对 `listTasksService`、`listRepositoryTasksWithDocs`、`listTasksWithDocs` 的调用。

- [ ] **Step 4: Run test to verify it passes**

加上 `./test/tasks/super-flag.test.ts`。Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/cli/src/context.ts extensions/cli/src/program.ts \
  extensions/cli/src/commands/tasks/list.ts extensions/cli/test/tasks/super-flag.test.ts
git commit -m "$(cat <<'EOF'
fix: list tasks with traverse or forest

EOF
)"
```

---

### Task 4: 其余 list 同一条路

**Files:**
- Modify: `extensions/cli/src/commands/tasks/project/list.ts`
- Modify: `extensions/cli/src/services/memory/records.ts`（只改 `listMemoryEntries`）
- Modify: `extensions/cli/src/commands/skill/list.ts`
- Modify: `extensions/cli/src/commands/note/list.ts`

**Interfaces:**
- Consumes: Task 3 的 `ctx.all`、query / forest 用法
- Produces: `project.list` 的 `projects[]` 仍含 `project`、`title`、`description`、`path`；`memory.list` 仍含 `type`、`slug`、`path`；`skill.list` 仍含 `name`、`path`；`note.list` 仍含既有条目字段

- [ ] **Step 1: Project list**

无 `--all`：`query(scope, { types: ["readme"], super })`。有 `--all`：`buildSystemForest(scope, { includeSuper: ctx.super === true, form: "independent" })` 后展平。留下路径中含 `tasks/`、文件名是 `README.md`、父目录不是 `tasks` 的节点（项目 README，不是看板 README）。`project` 取父目录名，`_default` 写成 `default`。

- [ ] **Step 2: Memory list**

无 `--all`：`query(target, { types: ["memory"], super })`。有 `--all`：同一片森林，滤 `memory`。`--type` 滤 `memoryType`。slug 规则沿用现有 `slugOf`。不要再 `listTypeFiles` 扫盘。

- [ ] **Step 3: Skill list**

无 `--all`：`query(scope, { types: ["skill"], super })`。有 `--all`：同一片森林，滤 `skill`。`listSkills` 的目录扫描若仍被 get 使用，get 先不动。

- [ ] **Step 4: Note list**

无 `--all`：`query(scope, { types: ["note"], super })`。有 `--all`：同一片森林，滤 `note`。不要再扫 `notes/` 目录。

- [ ] **Step 5: Smoke the tree path only**

只确认单树能退出 0。仓库根与 `.harness` 的完整矩阵留给 Task 6，这里不要跑。

```bash
cd extensions/cli
node --import tsx src/index.ts --scope "$PWD/../.." tasks list
node --import tsx src/index.ts --scope "$PWD/../.." --super tasks list
```

Expected: 两条都退出 0。缺文件不导致失败。

- [ ] **Step 5: Commit**

```bash
git add extensions/cli/src/commands/tasks/project/list.ts \
  extensions/cli/src/services/memory/records.ts \
  extensions/cli/src/commands/skill/list.ts \
  extensions/cli/src/commands/note/list.ts
git commit -m "$(cat <<'EOF'
fix: list projects, memory, skills, and notes via traverse

EOF
)"
```

---

### Task 5: README 与原则 5

**Files:**
- Modify: `extensions/cli/README.md`（「查询遵循索引」）
- Modify: `extensions/cli/src/domain/models/README.md` 原则 5

- [ ] **Step 1: Write the scope example**

在 CLI README 用本仓库根写死两种 scope：

- `--scope <仓库根> --super` 的 children 只有根上存在的 `tasks/README.md` 与 `README.md`。`.harness/tasks/README.md` 不在这层。
- `--scope <仓库根>/.harness --super` 的 children 是该目录下存在的 `tasks/README.md`、`memory/*`、`skills/*`、`evaluation/README.md`、`observation/README.md`。

并写明：默认 list 是从真 `AGENTS.md` 的一次 traverse；`--all` 是从当前 `--scope` 出发的森林；`--super` 只换根。最全是 `--scope <仓库根> --super --all`。`--scope <仓库根>/.harness` 是下一层，不与仓库根写成同一份 children。

- [ ] **Step 2: Commit**

```bash
git add extensions/cli/README.md extensions/cli/src/domain/models/README.md
git commit -m "$(cat <<'EOF'
docs: describe super children and list via traverse

EOF
)"
```

---

### Task 6: 写到节点指向的 harness tasks

**Files:**
- Modify: `extensions/cli/src/commands/tasks.ts`（去掉用途选项和 `--index-group`）
- Modify: `extensions/cli/src/commands/memory/doctor.ts`（去掉 `--index-group`）
- Modify: `extensions/cli/src/services/node/node-service.ts`（`#registration` 自己选分组）
- Modify: `extensions/cli/src/services/tasks/paths.ts`（看板目录由根节点决定）
- Modify: `extensions/skills/conversation-to-tasks/SKILL.md`
- Modify: `extensions/skills/project-tasks-classify/SKILL.md`
- Modify: `extensions/cli/README.md`、仓库根 `README.md` 里仍把任务写成用途二选一、或要求调用方选择 index-group 的句子
- Test: `extensions/cli/test/tasks/`、`extensions/cli/test/services/` 里仍传这两个选项的用例

**Interfaces:**
- Consumes: 主体系统。一般是 `--scope` 上的真 AgentsNode，其 harness 为 `harnessRootForScope(scope)`。`--scope <仓库根> --super` 的主体是虚拟系统一，其 harness 就是该 scope 目录。
- Produces: 普通 `edges --scope <dir> tasks create` 写入 `<dir>/.harness/tasks`。`edges --scope <仓库根> --super tasks create` 写入 `<仓库根>/tasks`。get / update / status / project 用同一块板。tasks 源码里不出现用途或 index-group。

- [ ] **Step 1: Point writes at the subject system's harness tasks**

`tasks` 不再声明用途选项和 `--index-group`，也不再把这两个概念传给服务。`memory doctor` 同样去掉 `--index-group`。`NodeService.create` / `import` 不再从调用方读取 `indexGroup`；若仍要补父级链接，服务按主体系统处理，tasks 不选择分组。

看板只由主体系统决定：

- 一般：主体是 `--scope` 上的真系统，看板 = `join(harnessRootForScope(scope), "tasks")`，即 `<scope>/.harness/tasks`。
- 主体是仓库之外的虚拟系统一：`--scope <仓库根> --super` 建立 `SuperAgentsNode`。这个虚拟系统的 harness 就是传入的 scope 目录，看板 = `join(scope, "tasks")`，即 `<仓库根>/tasks`。

`conversation-to-tasks` 与 `project-tasks-classify` 只传 `--scope`。只有主体是这套虚拟系统一时才加 `--super`。

- [ ] **Step 2: Retarget tests**

测试里写 `<scope>/.harness/tasks` 的，只传 `--scope`。写 `<仓库根>/tasks` 的，传 `--scope <仓库根> --super`。删掉对用途和 `--index-group` 的传参。帮助文案和 README 只写主体系统与它的 `.harness/tasks`。

- [ ] **Step 3: Run one create smoke**

用临时目录各写一条，确认两个目录，然后删掉临时目录。不要对本仓库的任务板做写入。

- [ ] **Step 4: Commit**

```bash
git add extensions/cli/src/commands/tasks.ts extensions/cli/src/commands/memory/doctor.ts \
  extensions/cli/src/services/node/node-service.ts extensions/cli/src/services/tasks/paths.ts \
  extensions/skills/conversation-to-tasks/SKILL.md \
  extensions/skills/project-tasks-classify/SKILL.md \
  extensions/cli/README.md README.md extensions/cli/test/tasks extensions/cli/test/services
git commit -m "$(cat <<'EOF'
fix: write tasks into the node harness board

EOF
)"
```

---

### Task 7: 交仓库根与 `.harness` 的实测报告

实现任务完成之前不要跑。这是验收，不是探路。

**Files:**
- 不改仓库。报告只在会话里交给用户。

- [ ] **Step 1: Run the matrix**

Scope 用本仓库。四列是默认、`--super`、`--all`、`--super --all`。两行是仓库根、`<仓库根>/.harness`。每格跑 `tasks list`、`tasks project list`、`memory list`、`skill list`、`note list`。

- [ ] **Step 2: Write the report**

每格写：退出码、条数、直接 children（相对路径 + 类型）。`--all` 写森林每棵树的根，以及超节点在不在里面。任务路径落在 `tasks/` 还是 `.harness/tasks/`，或更下层。缺文件被跳过时写出来。点明最全的一格是 `--scope <仓库根> --super --all`，并写出它比另外七格多覆盖了什么。仓库根与 `.harness` 的 children 分开写，不要并成一份名单。
