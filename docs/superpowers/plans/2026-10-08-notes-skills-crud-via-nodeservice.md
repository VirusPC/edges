# notes/skills CRUD 经 NodeService Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 消灭 notes/skills 对 NodeService 的旁路：CLI 的 create/get/update/delete 全部经 `NodeService`；删除 `services/note/records.ts` 与 `services/skills/records.ts`；改 ADR 0027；补短 ADR + 测试。

**Architecture:** CLI 命令层直接（或极薄 helper）调用 `NodeService.get/create/update/destroy` + `NoteNode`/`SkillNode`，对齐 memory `records` 已采用的模式。`notes create` 的 git/PR ingest **保留**；落盘已走 NodeService（核实后不重写 git 层）。skills create/update 改为真写 `SKILL.md`（默认落在当前 scope 的 `skills/managed/<name>/SKILL.md`，并登记父级 README）。

**Tech Stack:** Node 22、`node:test`、tsx、现有 Commander / NodeService。不新增依赖。

**Spec / grill 锁定（2026-10-08）：**
- Q1=C：CLI create 真写叶子（skills 含 create）
- Q2：delete → `destroy`（清父级登记，允许变严）
- Q3′=A：整删 note/skills `records.ts`
- Q4：新开短 ADR；CONTEXT 按需补 NodeService 门面术语
- Q6=A：skills 写到 skills 类型目录下的 `SKILL.md`
- Q7=B：skills create **与** update 都真写；改 ADR 0027
- Q8=A：ingest 保留；创建文档调用 create service（现状 `ingest.ts` 已 `service.create`/`update`/`import`，本卡以核实 + 回归为主）

**仓：** VirusPC/edges；经 PR 合入 main；Co-authored-by: 全栈开发专家 \<grok-bot@users.noreply.github.com\>

## Global Constraints

- 禁止在 notes/skills 命令或替代模块里 `readFileSync`/`writeFileSync`/`rmSync`/`readdir` 直改叶子或父索引（测试可证）。
- `NodeService.destroy` 删除；错误尽量映射为既有 `VALIDATION_ERROR`（not found / ambiguous / must be）。
- 不重做 artifacts；不大改 tasks/memory 编排。
- skills create 默认目录：`skills/managed/<kebab-name>/SKILL.md`（与 harness-materials `skills.managed` 对齐）；若需 `referenced`，用显式 flag（本卡最小：仅 managed，除非实现时发现 CLI 已有约定）。
- ADR 0027 中「skills create/update 只提示 remember」改为真写说明；`memory create/update`、`tasks delete` 提示语义不动。

## File map

| Path | Change |
| --- | --- |
| `extensions/cli/src/services/note/records.ts` | **Delete** |
| `extensions/cli/src/services/skills/records.ts` | **Delete** |
| `extensions/cli/src/commands/notes/{get,update,delete}.ts` | 改调 NodeService |
| `extensions/cli/src/commands/skills/{get,create,update,delete}.ts` | 改调 NodeService；create/update 真写 |
| `extensions/cli/src/services/note/git/ingest.ts` | 核实已用 NodeService；仅必要时小修 |
| `docs/adr/0027-facade-crud-verbs.md` | 更新 skills create/update |
| `docs/adr/00XX-content-leaf-crud-via-nodeservice.md` | **Create** 短 ADR |
| `CONTEXT.md` | 若缺「NodeService」术语则补一句 |
| `extensions/cli/test/...` | 旁路消失 + CRUD 行为回归 |
| `docs/superpowers/plans/2026-10-08-notes-skills-crud-via-nodeservice.md` | 本 plan 入库 |

---

### Task 1: ADR + CONTEXT

**Files:**
- Create: `docs/adr/00XX-content-leaf-crud-via-nodeservice.md`（编号取仓内下一个）
- Modify: `docs/adr/0027-facade-crud-verbs.md`
- Modify: `CONTEXT.md`（仅当术语缺失）

- [ ] **Step 1:** 写 ADR：内容叶子（Note/Skill）的 create/get/update/destroy 一律经 NodeService；禁止 records/扫盘旁路；skills create 落 `skills/managed`；ingest 保留 git/PR 但落盘经 NodeService。
- [ ] **Step 2:** 改 0027：skills create/update 改为「会写 SKILL.md」，删掉「只提示 remember」；注明 remember 仍可写 skill 类 memory，与 CLI skills 动词并行。
- [ ] **Step 3:** CONTEXT 补「NodeService：节点读写与组成登记的门面」若尚无等价条。
- [ ] **Step 4:** Commit `docs: note/skill CRUD via NodeService ADR`

---

### Task 2: notes get/update/delete → NodeService，删 records

**Files:**
- Delete: `extensions/cli/src/services/note/records.ts`
- Modify: `extensions/cli/src/commands/notes/get.ts`
- Modify: `extensions/cli/src/commands/notes/update.ts`
- Modify: `extensions/cli/src/commands/notes/delete.ts`
- Test: `extensions/cli/test/commands/notes-crud-nodeservice.test.ts`（或既有 note 测试目录）

**Pattern（对齐 memory）：**
```ts
const scope = resolveScope(ctx.env);
const managed = gitRoot(scope) ?? scope;
const service = new NodeService({ managedRoot: managed });
const file = path.resolve(scope, entryPath); // 仍校验 notes/.../INDEX.md
const node = await service.get(file, NoteNode);
if (!node) throw new Error(`note not found: ${entryPath}`);
// update: await service.update(node, { body / title via NoteNode setters then serialize fields })
// delete: await service.destroy(node)
```

- [ ] **Step 1:** 写失败测试：临时 fixture 仓内建 note；`get`/`update`/`delete` 成功；delete 后父级登记无死链；源码/模块中不存在 `services/note/records`。
- [ ] **Step 2:** 改三个命令，删除 `records.ts`，修所有 import。
- [ ] **Step 3:** 跑相关 test 至 PASS。
- [ ] **Step 4:** Commit `refactor(notes): route get/update/delete through NodeService`

---

### Task 3: skills get/create/update/delete → NodeService，删 records

**Files:**
- Delete: `extensions/cli/src/services/skills/records.ts`
- Modify: `extensions/cli/src/commands/skills/{get,create,update,delete}.ts`
- Test: `extensions/cli/test/commands/skills-crud-nodeservice.test.ts`

**create/update CLI 最小参数（实现时可微调，保持 VALIDATION_ERROR）：**
- create: `<name>` + `--description <text>`（必填，满足 SkillNode.validate）；可选 `--body`
- update: `<target>`（path 或 name）+ `--description` / `--body` 至少一个
- get/delete: 先 `NodeService.query` 按 name 消歧，或 path → `get`；多命中仍 `ambiguous`

- [ ] **Step 1:** 失败测试：create 写出 `skills/managed/<name>/SKILL.md` 且父 README 有登记；get/update/delete；无扫盘 records。
- [ ] **Step 2:** 实现四命令；删 `skills/records.ts`。
- [ ] **Step 3:** 跑 test PASS。
- [ ] **Step 4:** Commit `feat(skills): real create/update via NodeService; drop records bypass`

---

### Task 4: 核实 notes ingest + 回归

**Files:**
- Verify: `extensions/cli/src/services/note/git/ingest.ts`（已 create/update/import）
- Test: 既有 `extensions/cli/test/note/ingest.test.ts` 等

- [ ] **Step 1:** 确认无叶子级裸 writeFile；若有，改为 NodeService。
- [ ] **Step 2:** 跑 note ingest + notes/skills CRUD 相关测试。
- [ ] **Step 3:** Commit 仅当有代码改动。

---

### Task 5: PR

- [ ] 基于最新 main 开 PR；标题说明 notes/skills CRUD 收口 NodeService。
- [ ] 正文勾完成标准；链到任务卡路径与 ADR。
- [ ] Co-authored-by trailer。
- [ ] 把 PR 链接回任务记录员与用户。

## Done when

- [ ] note/skills `records.ts` 已删除且无引用
- [ ] notes get/update/delete 与 skills get/create/update/delete 经 NodeService
- [ ] delete 使用 destroy
- [ ] ADR 0027 已更新；新 ADR 已合入 PR
- [ ] 相关测试通过；PR 待合 main
