# notes/skills CRUD 经 NodeService Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 消灭 notes/skills 对 NodeService 的旁路：CLI 的 create/get/update/delete 全部经 `NodeService`；删除 `services/note/records.ts` 与 `services/skills/records.ts`；**整段丢掉** notes 的 git/PR ingest，`notes create` 改为纯本地 `NodeService.create`；改 ADR 0027；补短 ADR + 测试。CLI 旗标按动词对齐：create/update 用 metadata + `--body`（只加该类型真正需要的旗标）；get/delete 只收目标；list 用与其他 list 相同的 `--filter` / `--group-by` 信封，再加全局 `--scope` / `--super` / `--all`。不另造 notes/skills 专用 list 旗标，也不并列发明 `--content` 这类名字。

**Architecture:** CLI 命令层直接（或极薄 helper）调用 `NodeService.get/create/update/destroy` + `NoteNode`/`SkillNode`，对齐 memory `records` 已采用的模式。标准节点面是 **metadata + body**；正文旗标统一用 `--body`。create/update 用这套面，类型扩展只在该类型真正需要时出现（note 标题走正文 H1 或一个 helper；skill 用 name / description）。get/delete 只收目标。list 复用既有 `--filter` / `--group-by` 信封（ADR 0028）和全局 scope 旗标，不并列发明 `--content` 或另一套 list 旗标。`notes create` 整段丢掉 git/PR ingest，只做本地 `NodeService.create`。删掉 `services/note/git/*`，并去掉 `--import-entry`、`--co-author`、`--mode`、`--dry-run` 以及 notes create 上的 token/auth 旗标（鉴权归 CLI，不在 create 上再做一套）。skills create/update 改为真写 `SKILL.md`（默认落在当前 scope 的 `skills/managed/<name>/SKILL.md`，并登记父级 README）。

**Tech Stack:** Node 22、`node:test`、tsx、现有 Commander / NodeService。不新增依赖。

**Spec / grill 锁定（2026-10-08）：**
- Q1=C：CLI create 真写叶子（skills 含 create）
- Q2：delete → `destroy`（清父级登记，允许变严）
- Q3′=A：整删 note/skills `records.ts`
- Q4：新开短 ADR；CONTEXT 按需补 NodeService 门面术语
- Q6=A：skills 写到 skills 类型目录下的 `SKILL.md`
- Q7=B：skills create **与** update 都真写；改 ADR 0027
- Q8：整段丢掉 notes git/PR ingest。`notes create` 只做本地 `NodeService.create`。去掉 `--import-entry`、`--co-author`、`--mode`、`--dry-run`，以及 notes create 的 token/auth 旗标（CLI 自有鉴权）。一并去掉 `--content` / `--content-file` / `--markdown`。
- 旗标按动词对齐：create/update = metadata + `--body`（加类型旗标：note 标题经正文 H1 或 helper；skill 的 name / description）。get/delete 只收目标。list 用与其他 list 相同的 `--filter` / `--group-by` 信封，外加全局 `--scope` / `--super` / `--all`。不用 `--content`，不为 notes/skills 另造 list 旗标。

**仓：** VirusPC/edges；经 PR 合入 main；Co-authored-by: 全栈开发专家 \<grok-bot@users.noreply.github.com\>

## Global Constraints

- 禁止在 notes/skills 命令或替代模块里 `readFileSync`/`writeFileSync`/`rmSync`/`readdir` 直改叶子或父索引（测试可证）。
- `NodeService.destroy` 删除；错误尽量映射为既有 `VALIDATION_ERROR`（not found / ambiguous / must be）。
- 不重做 artifacts；不大改 tasks/memory 编排。
- skills create/update 真写 `skills/managed/<kebab-name>/SKILL.md`（与 harness-materials `skills.managed` 对齐）并登记父级 README。本卡不加 `referenced` 或其他特殊旗标。
- ADR 0027 中「skills create/update 只提示 remember」改为真写说明；另写短 ADR。`memory create/update`、`tasks delete` 提示语义不动。
- CLI 旗标对齐：create/update 只走 metadata + `--body` 加类型旗标；get/delete 只有目标参数，不挂 body/filter。list 调用既有 `list-query` 的 `--filter` / `--group-by`（先滤后分组，同字段 OR、异字段 AND），范围只用全局 `--scope` / `--super` / `--all`。不发明 `--content` 或 notes/skills 专用 list 旗标。
- `notes create` 不做 git commit、push 或 PR，只 `NodeService.create` 写本地叶子。标准面是 metadata + `--body`；note 标题经正文 H1 或类型 helper。不保留 `--import-entry`、`--co-author`、`--mode`、`--dry-run`、`--content`、`--content-file`、`--markdown`，也不在 create 上挂 `--token-file` / `--token-stdin`（鉴权归 CLI）。

## File map

| Path | Change |
| --- | --- |
| `extensions/cli/src/services/note/records.ts` | **Delete** |
| `extensions/cli/src/services/skills/records.ts` | **Delete** |
| `extensions/cli/src/commands/notes/create.ts` | 本地 `NodeService.create`；标准面 metadata + `--body`；标题经 H1 或 helper；去掉 ingest / `--import-entry` 旗标 |
| `extensions/cli/src/commands/notes/{get,update,delete}.ts` | 改调 NodeService；update 用 metadata + `--body`；get/delete 只收目标 |
| `extensions/cli/src/commands/notes/list.ts` | 对齐共享 `--filter` / `--group-by`；不加专用 list 旗标 |
| `extensions/cli/src/commands/skills/{get,create,update,delete}.ts` | 改调 NodeService；create/update 真写 `skills/managed`（metadata + `--body` + name/description）；get/delete 只收目标 |
| `extensions/cli/src/commands/skills/list.ts` | 对齐共享 `--filter` / `--group-by`；不加专用 list 旗标 |
| `extensions/cli/src/services/note/git/*` | **Delete** ingest 路径（`ingest.ts`、`pr.ts`、`exec.ts`、`markers.ts`、`slug.ts`） |
| `extensions/cli/src/services/note/service.ts`、`auth.ts`（及只服务 ingest 的校验） | 删掉或收掉 ingest 包装与 token 校验 |
| `extensions/cli/src/commands/notes.ts`、`program.ts` | 帮助文本去掉 git/PR ingest 与 `--import-entry` |
| `docs/adr/0027-facade-crud-verbs.md` | 更新 skills create/update |
| `docs/adr/00XX-content-leaf-crud-via-nodeservice.md` | **Create** 短 ADR |
| `CONTEXT.md` | 若缺「NodeService」术语则补一句 |
| `extensions/cli/test/...` | 旁路消失 + CRUD 回归；删掉 ingest / git / PR 测试并改帮助断言 |
| `docs/superpowers/plans/2026-10-08-notes-skills-crud-via-nodeservice.md` | 本 plan 入库 |

---

### Task 1: ADR + CONTEXT

**Files:**
- Create: `docs/adr/00XX-content-leaf-crud-via-nodeservice.md`（编号取仓内下一个）
- Modify: `docs/adr/0027-facade-crud-verbs.md`
- Modify: `CONTEXT.md`（仅当术语缺失）

- [ ] **Step 1:** 写 ADR：内容叶子（Note/Skill）的 create/get/update/destroy 一律经 NodeService；标准面是 metadata + body；禁止 records/扫盘旁路；skills create/update 真写 `skills/managed`；notes create 只写本地叶子，不走 git/PR ingest，也不在 create 上做 token 鉴权。
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
- Modify: `extensions/cli/src/commands/notes/list.ts`（只对齐共享 list 信封）
- Test: `extensions/cli/test/commands/notes-crud-nodeservice.test.ts`（或既有 note 测试目录）

**旗标：** update 用 metadata + `--body`（标题经 H1 或 helper）。get/delete 只有目标路径。list 复用 `--filter` / `--group-by`，范围靠全局 `--scope` / `--super` / `--all`。

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
- Modify: `extensions/cli/src/commands/skills/list.ts`（只对齐共享 list 信封）
- Test: `extensions/cli/test/commands/skills-crud-nodeservice.test.ts`

**旗标（保持 VALIDATION_ERROR，不加别的特殊旗标）：**
- create/update：metadata + `--body`，外加 skill 类型旗标。正文不用 `--content`。
- create: `<name>` + `--description <text>`（满足 SkillNode.validate）；`--body` 可选
- update: 目标 + `--description` / `--body` / metadata 至少一项
- get/delete：只收目标。目标可以是 path，或 name（`NodeService.query` 消歧，多命中仍 `ambiguous`）。不挂 body、metadata 或 filter 旗标。
- list：`--filter` / `--group-by` 与其他 list 相同；范围只用全局 `--scope` / `--super` / `--all`。

- [ ] **Step 1:** 失败测试：create 写出 `skills/managed/<name>/SKILL.md` 且父 README 有登记；get/update/delete；无扫盘 records。
- [ ] **Step 2:** 实现四命令；删 `skills/records.ts`。
- [ ] **Step 3:** 跑 test PASS。
- [ ] **Step 4:** Commit `feat(skills): real create/update via NodeService; drop records bypass`

---

### Task 4: 去掉 notes git/PR ingest，`notes create` 改为本地 NodeService.create

**Files:**
- Modify: `extensions/cli/src/commands/notes/create.ts`
- Delete: `extensions/cli/src/services/note/git/*`（`ingest.ts`、`pr.ts`、`exec.ts`、`markers.ts`、`slug.ts`）
- Delete or slim: `extensions/cli/src/services/note/service.ts`、`auth.ts`，以及只为 ingest 存在的 input 校验
- Modify: `extensions/cli/src/commands/notes.ts`、`extensions/cli/src/program.ts`（帮助里的 ingest / co-author / mode / `--import-entry` 说明）
- Delete: `extensions/cli/test/note/utils/git-ingest.test.ts`、`git-pr.test.ts`、`git-markers.test.ts`、`git-slug.test.ts`、`auth.test.ts`
- Modify: 仍断言 `--co-author` / `--mode` / `--dry-run` / token / `--import-entry` 或 `runNoteIngest` 的测试（`cli.test.ts`、`run.test.ts`、`parse.test.ts`、`production-nodes.test.ts` 等）

**`notes create` 参数（标准面 + note 类型旗标，保持 VALIDATION_ERROR）：**
- 正文用 `--body`（不用 ingest 的 `--content`）。标题写在正文 H1，或用一个类型 helper（例如 `--title`）写入 H1。metadata 走标准 metadata 面。
- 不接受 `--import-entry`、`--co-author`、`--mode`、`--dry-run`、`--content`、`--content-file`、`--markdown`，也不接受 `--token-file` / `--token-stdin`。鉴权留在 CLI，不在 notes create 上再挂一套。
- 不 commit、不 push、不开 PR。只 `NodeService.create` 写当前 scope 的本地 Note 叶子，并登记父级 README。不加别的特殊旗标。

- [ ] **Step 1:** 失败测试：`notes create` 用 `--body`（标题经 H1 或 helper）写出本地叶子且父级有登记；`--import-entry`、`--co-author`、`--mode`、`--dry-run`、`--content` 与 token 旗标被拒绝或从帮助中消失；进程不调用 git commit/push/PR；源码无 `services/note/git` ingest 入口。
- [ ] **Step 2:** 重写 `notes create`；删除 git ingest 路径与只服务它的 auth/包装；改帮助文案（含 update 描述里的 “without git ingest”）。
- [ ] **Step 3:** 删掉 ingest 测试并改相关帮助/解析断言；跑 notes/skills CRUD 相关测试至 PASS。
- [ ] **Step 4:** Commit `refactor(notes): drop git/PR ingest; create via NodeService`

---

### Task 5: PR

- [ ] 基于最新 main 开 PR；标题说明 notes/skills CRUD 收口 NodeService。
- [ ] 正文勾完成标准；链到任务卡路径与 ADR。
- [ ] Co-authored-by trailer。
- [ ] 把 PR 链接回任务记录员与用户。

## Done when

- [ ] note/skills `records.ts` 已删除且无引用
- [ ] notes get/update/delete 与 skills get/create/update/delete 经 NodeService
- [ ] create/update 为 metadata + `--body`（加类型旗标）；get/delete 只收目标；notes/skills list 使用共享 `--filter` / `--group-by`，外加全局 scope 旗标，无专用 list 旗标
- [ ] `notes create` 只经本地 `NodeService.create`；标准面是 metadata + `--body`（不用 `--content`）；标题经正文 H1 或类型 helper
- [ ] `services/note/git/*` ingest 路径已删除；无 `--import-entry`、`--co-author`、`--mode`、`--dry-run`，也无 notes create 的 token/auth 旗标；相关帮助与测试已去掉
- [ ] 无额外特殊旗标（不含 referenced、content-file、markdown 保全）
- [ ] delete 使用 destroy
- [ ] ADR 0027 已更新；新 ADR 已合入 PR
- [ ] 相关测试通过；PR 待合 main
