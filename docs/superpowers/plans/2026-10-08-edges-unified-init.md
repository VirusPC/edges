# edges init 成为标准命令 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 根命令 `edges init` 成为标准初始化入口；各域 init 只委托同一个 init service 里本模块那一段。无参 `edges init` 写 AGENTS、notes/projects 的 `.harness` 桩，以及 memory 的 feedback/project/reference。

> **2026-10-08 修订（用户审 #190）：** Q7、Q8 的原结论已推翻，见下方「修订」。`edges memory init` 不再建 notes/projects。有 harness 材料的模块各自 init，只建本模块。

**Architecture:** `services/init/service.ts` 持有 init 模块表和写盘编排。挂载表 `harness-materials.json` 仍只提供 path，经 `placeHarnessMaterial` 取用。notes/projects 的 `service.ts` 只增加薄转调 `initNotes` / `initProjects`。`initMemory` 留在 memory 侧作同名薄包装，内部兼容包仍顺手建 notes/projects 桩。节点文件经 NodeService；`.gitignore` 继续走 `saveEntries`。

**Tech Stack:** Node 22、`node:test`、tsx、现有 Commander / NodeService。不新增依赖。

**Spec:** 任务卡 `.harness/tasks/edges-cli-platform/backlog/2026-10-08--补充统一的-edges-init模块-init-只调-init-service/INDEX.md`（`edges-unified-init`）。Grill 全文：[2026-10-08-edges-init-grill.md](2026-10-08-edges-init-grill.md)。

**仓：** VirusPC/edges；经 PR 合入 main；Co-authored-by: 全栈开发专家 \<grok-bot@users.noreply.github.com\>

## 决策记录

流程：用户睡前授权，只读 grill 清单共 12 题，由 Grok Bot 于 2026-10-08 03:07（UTC+8）逐题拍板。决策者是 Grok Bot（primary），用户授权它代为决策。原文见附件决策记录；理由不改写。

### Q1

- 问题：init service 的主文件放在哪里。
- 备选项：A 新建 `services/init/service.ts`；B 实现留在 memory、init 只 re-export；C 不建 init 模块，拆进各域 service 由根命令编排。
- 选择和理由：Q1: A —— 主文件新建 `services/init/service.ts`；memory 侧保留同名 `initMemory` 薄包装保测试 import。不把 init 塞进 `services/memory/service.ts`。

### Q2

- 问题：材料清单是升级成 init 登记，还是挂载表与 init 模块表分开。
- 备选项：A JSON 升级为 init 登记；B 各域 service 自带 init 描述；C 挂载表不动，init 模块表集中在 `services/init/`，用 material id 引用。
- 选择和理由：Q2: C（修正）—— `harness-materials.json` 继续只做挂载表；init 模块表（模块→material id + 种子 + 登记策略）集中在 `services/init/`，path 只经 `placeHarnessMaterial`。#187 已有各域 `service.ts`，但不要把种子/path 拆进 notes/projects/skills 的 service（避免和 CRUD 搅在一起）。域 `service.ts` 若需要，只允许薄 `initNotes`/`initProjects` 等转调 init service（与域命令同构），描述表本身仍归 init。

### Q3

- 问题：notes/projects 的组织清单写 harness 桩还是内容面 README。
- 备选项：A 只建 `.harness/notes|projects/README.md`；B 改写内容面 `<scope>/notes|projects/README.md`；C 两份都建。
- 选择和理由：Q3: A —— 只建 `.harness/notes|projects/README.md` 桩并登记 AGENTS；不建不改内容面 `<scope>/notes|projects/README.md`。

### Q4

- 问题：无参 `edges init` 写什么，如何指定模块，类型旗标和交互放哪。
- 备选项：A 无参写默认集，单模块用 `edges init <module>`，无 TTY，memory 无参仍 selectionRequired；B 无参只推荐不写盘；C 无参不采用 memory 类型。默认类型集 A1 六类全建、A2 三个公开 memory 类型、A3 只 project。
- 选择和理由：Q4: A + A2 —— 无参 `edges init` 写 AGENTS、notes/projects 桩，以及 feedback/project/reference 三个公开 memory 类型；不建 user、不建 skills。单模块用 `edges init <module>`（可重复）。类型旗标两边都收。无 TTY。无参 `edges memory init` 仍 `selectionRequired`、不写盘。信封各自保持（memory 用 ok；根 init 用 success）。

### Q5

- 问题：`--super` 是否改变 init 的写盘位置。
- 备选项：A 忽略 `--super`，永远写 `.harness`；B 跟随 `--super` 写到 scope 目录；C 看到 `--super` 就拒绝。
- 选择和理由：Q5: A —— init 不读 `--super`，只写真系统 `.harness`；帮助写明。本卡不统一 skills/tasks 的 `--super` 裂缝。

### Q6

- 问题：再跑一次是缺了才建，还是重写正文。
- 备选项：A 桩缺了才建，类型索引继续 refresh，AGENTS 只补受管区块；B 全部按模板重写；C 连类型索引也不再刷新。
- 选择和理由：Q6: A —— 幂等：桩缺了才建；类型索引继续 refreshIndex；AGENTS 只补受管区块、foreign 仍 needs-doctor。不做 doctor。

### Q7

- 问题：`edges memory init` 委托之后还要不要顺手建 notes/projects。
- 备选项：A 兼容包留在 memory 入口内部；B memory 不再建桩并改测试；C 命令层展开多次调用。
- 选择和理由：Q7: A —— memory 入口内兼容包仍顺手建 notes/projects 桩（调与 `edges init notes|projects` 同一函数）；模块表不要把 notes 写成 memory 子材料。后续卡可删兼容包。

#### 修订

- 原结论（Grok Bot）：Q7: A，memory 入口内兼容包仍顺手建 notes/projects 桩。
- 用户推翻原话：「不顺手创建，明确划分模块，简化模型」
- 新结论：`edges memory init`（含兼容包装）只初始化 memory。不创建、不登记 `.harness/notes/README.md` 与 `.harness/projects/README.md`。兼容包代码删除。无参 `edges init` 仍创建这两份桩，因为它们在默认模块列表里，由 notes 与 projects 自己的 init 创建。
- 理由：明确模块边界，简化心智模型。顺手创建会让 memory 看起来拥有 notes 和 projects。

### Q8

- 问题：本卡给哪些域加 init 子命令。
- 备选项：A 只有根命令和改薄的 memory；B 再加上 notes、projects；C 连 tasks、skills、artifacts 一起收。
- 选择和理由：Q8: B —— 本卡域入口：memory（改薄）、notes、projects。不加 tasks/skills init。`edges artifacts init` 仍是 token 命令，不进标准 init。默认集不含 evaluation/observation。

#### 修订

- 原结论（Grok Bot）：Q8: B，域入口只有 memory、notes、projects，不加 tasks/skills init。
- 用户推翻原话：「各管各的，简化心智」
- 新结论：每个有 harness 材料的领域模块自己 init，只建、只登记本模块。已落地的入口是 memory、skills、tasks、notes、projects。`edges init <module>` 与 `edges <module> init` 写同一批文件。根 `edges init` 只编排公共 AGENTS 步骤，再按 memory → skills → tasks → projects → notes 调用各模块 init，没有跨模块副作用。默认集仍是 memory、notes、projects（Q4 未改）。Q9「tasks 不进域 init」里「不进域 init」被本修订收窄：tasks 仍不进默认集，帮助仍把它和「本次会创建」分开，但因为它有 `.harness/tasks/README.md`，所以有 `edges tasks init`。
- 理由：明确模块边界，简化心智模型。各管各的之后，调用方不用记住哪条命令会顺手带上别的模块。

### Q9

- 问题：tasks 看板的登记特例要不要进 init。
- 备选项：A 默认集不含 tasks，不调用看板懒创建；B init 调用现有 `ensureBoardMaterial`；C 去掉 NodeService 对 tasks 材料不登记的特例。
- 选择和理由：Q9: A —— tasks 不进默认集、不进域 init；看板仍由 tasks 懒创建。推荐展示要把「本次会创建」和 tasks（首次写入才确保）分开说明。Q8 修订之后：仍不进默认集，帮助分栏保留；域 init 改为 `edges tasks init` 只建看板。首次 tasks 写入的懒创建保留。

### Q10

- 问题：哪些写入必须经 NodeService。
- 备选项：A 节点文件经 NodeService，`.gitignore` 继续 `saveEntries`；B 把 gitignore 做成伪节点；C init 自己 writeFile。
- 选择和理由：Q10: A —— 节点文件一律 NodeService；唯一例外非节点 `.gitignore` 走 `saveEntries`，ADR 写明。init 不新增 writeFileSync 写正文。

### Q11

- 问题：没有 `AGENTS.md` 时，notes/projects init 要不要创建系统入口。
- 备选项：A 任何会写材料的 init 都确保 AGENTS；B 只有 memory 和根 init 创建，notes 缺 AGENTS 就失败；C notes 不建 AGENTS。
- 选择和理由：Q11: A —— 创建/补齐 scope `AGENTS.md` 是 init service 的公共步骤（notes/projects 也会触发）；无参 memory init 在 selectionRequired 时仍不写。硬约束缺了才补。

### Q12

- 问题：ADR、CONTEXT、skill、README 同步到哪一层。
- 备选项：A 新开 ADR 0031，CONTEXT 只改 init 那一句，skill 只改 SKILL/runtime/LAYOUT；B 修订 0030；C 连 PROTOCOL 一起改。
- 选择和理由：Q12: A —— 新开 ADR 0031；CONTEXT 只改 init 命令那一句；`project-memory-init` 只同步 SKILL、runtime、LAYOUT 的命令/模块段并升版本；不改 PROTOCOL、模板、doctor、根 README。CLI README 加 `edges init` 示例。

## Global Constraints

2026-10-08 审 #190 之后，下面与 Q7、Q8 冲突的旧句子已被修订取代：memory init 不再建 notes/projects 桩；skills 与 tasks 有自己的 init；相关测试断言按新边界改。其余约束仍有效。

- 不改 notes / skills / projects 的 CRUD 行为，不重写 NodeService 合同。NodeService 仍不自动登记 tasks 看板；tasks init 只把这一份文件挂到 scope AGENTS。
- `initMemory` 的返回形状保持：无类型且未采用时 `selectionRequired: true` 且不写盘。选定类型后只写 memory。传入 `skillTypes` 直接失败。
- init 不读取 `ctx.super`。帮助写明 does not read `--super`。
- 命令只从对应 `services/<module>/service.ts` 进入。commands 的 init 文件不 import `harness-materials`，不 `writeFileSync`。
- `edges artifacts init` 保持 token 命令，不进 harness 编排。不为 evaluation / observation 发明命令。
- 不改 PROTOCOL、模板、doctor、根 README。
- skill 真源只有 `extensions/skills/project-memory-init`（`.claude/skills` 与 `.agents/skills` 是指向它的符号链接）。版本 `3.5.0` → `3.6.0`。

## File map

| Path | Change |
| --- | --- |
| `extensions/cli/src/services/init/modules.ts` | **Create** 模块表：notes/projects → material id、标题、描述、种子正文 |
| `extensions/cli/src/services/init/service.ts` | **Create** `initMemory` / `initScope` / `ensureHarnessBoard` |
| `extensions/cli/src/services/memory/init.ts` | 改为动态 import 的薄包装 |
| `extensions/cli/src/services/notes/service.ts` | 增加 `initNotes` 转调 |
| `extensions/cli/src/services/projects/service.ts` | 增加 `initProjects` 转调 |
| `extensions/cli/src/commands/init.ts` | **Create** 根命令 |
| `extensions/cli/src/commands/notes/init.ts` | **Create** |
| `extensions/cli/src/commands/projects/init.ts` | **Create** |
| `extensions/cli/src/commands/notes.ts`、`projects.ts`、`program.ts` | 注册命令、写锁、帮助示例 |
| `extensions/cli/test/commands/init-service.test.ts` | **Create** |
| `docs/adr/0031-edges-init-standard-command.md` | **Create** |
| `CONTEXT.md` | 只改系统入口那一句里的命令 |
| `extensions/cli/README.md` | 分层登记 init，加示例 |
| `extensions/skills/project-memory-init/SKILL.md`、`references/runtime.md`、`references/LAYOUT.md` | 命令与模块段，版本 3.5.0 |
| `docs/superpowers/plans/2026-10-08-edges-init-grill.md` | grill 全文 |
| 任务卡 INDEX 与 `.log.md` | `edges tasks` 移到 in_progress，追加决策摘要 |

## 待确认

决策没有写死、本卡按「对现有行为改动最小」处理的点：

1. `edges init notes` 的 JSON `command` 是 `init`，`edges notes init` 是 `notes.init`。skills、tasks 同样：根入口是 `init`，域入口是 `skills.init` / `tasks.init`。memory init 仍是 `ok: true`。「结果一致」按文件和共享字段比较，不要求 `command` 字符串相同。
2. **已按「各管各的」改定。** `--memory-types` 要求本次包含 memory 模块，否则失败且不写盘，文案仍是 `Type flags require the memory module`。`--skill-types` 要求本次包含 skills 模块，文案是 `Type flags require the skills module`。无参 `edges init` 只把默认 memory 类型交给 memory，不传 skill 类型。`edges memory init --skill-types` 不再是合法旗标。
3. **已撤销。** Q7 修订删掉了 memory 路径上的 notes/projects 兼容包。`edges memory init` 与 `edges init memory` 都不建这两份桩。无参 `edges init` 仍建它们，因为 notes 与 projects 在默认模块列表里。
4. `edges notes init` / `edges projects init` / `edges skills init` / `edges tasks init` 接受 `--target-dir`、`--root-dir`、`--index-group`、`--description`，以便嵌套 scope 登记 AGENTS。只有 skills init 接受 `--skill-types`。这些域入口不接受另一个模块的类型旗标。
5. 执行顺序固定为 memory、skills、tasks、projects、notes，不跟参数顺序走。返回的 `modules` 仍保持调用方或默认集的顺序。
6. **已按「各管各的」改定。** 祖先类型行刷新只发生在该模块自己的 `runTypeInit` 里，而且仅当目标不是根、根上已有 AGENTS、根的类型里已经有这个模块时，才 `syncTargetAgents(root)`。这次调用仍会重写根上已经发现的类型行，不会创建另一个模块尚不存在的材料。notes、projects、tasks 不刷新根上的类型行。每个模块都会在需要时用 `syncIndexEntry` 把子层系统入口登记到父层。`layerTypeSpecs` 仍校验磁盘上全部类型文件，所以损坏的 skill 索引仍可能让随后的 `initMemory()` 抛错；这是既有校验，不在本修订里改。
7. **已定（用户 2026-10-08 确认「改一下」）。** `commands/tasks/list.ts` 与 `commands/tasks/project/list.ts` 不再 import `harness-materials`，也不在命令里用 fs 判断看板 README。看板目录名、README 绝对路径、文件是否存在、节点是否为看板 README，由 `services/tasks/board-material.ts` 提供，经 `services/tasks/service.ts` 导出。`commands` 下不得再出现 `domain/config/harness-materials` 的 import，由守护测试守住。完成标准第 4 条按此勾上。
8. 任务 sidecar `.log.md` 没有 CLI 动词。状态和正文走 `edges tasks`；log 条目按既有 Markdown 格式直接追加。
9. 材料表里有 id 的官方类型（feedback、project、reference、managed、referenced）写盘路径经 `placeHarnessMaterial`。`user` 和自定义类型没有 material id，仍用 `TypeSpec.indexFile`。两条路径在现有官方类型上与原来的 `.harness/.../README.md` 相同。
10. evaluation 与 observation 在 `harness-materials.json` 里有可选材料，但没有领域 CLI。`extensions/AGENTS.md` 写明不为这两处发明命令，所以没有 `edges evaluation init` / `edges observation init`。`readme` 是内容面 README 的挂载项，不是 init 模块。
11. `edges artifacts init` 已有语义：只写本机 artifacts token 配置（`~/.config/edges/artifacts.env`，ADR 0013）。它没有 harness 材料，不改成 harness init，也不进 `edges init` 的编排。按「只管 artifacts 自己」看，这条命令已经收敛，本次不改它的行为。
12. **留下不搬。** 扫过 `extensions/cli/src/commands/**` 之后，与 harness 材料无关、又要大改的直接文件写入有两处：`commands/tasks/project/review-page.ts` 读审阅 JSON 并写出 HTML；`commands/artifacts/utils/config.ts` 创建目录并写入 artifacts token 配置。本次只把材料清单读取从命令下沉，不改这两处的流程。`commands/artifacts/utils/collect.ts` 与 `commands/memory/remember.ts` 会读取调用方给出的文件，不是写入，也不是挂载表，同样不动。`commands/tasks/list.ts` 仍用 `existsSync` 判断 scope 的 `AGENTS.md` 在不在，这不是看板材料。

---

### Task 1: 失败测试

**Files:**
- Create: `extensions/cli/test/commands/init-service.test.ts`

- [x] **Step 1:** 覆盖 `edges init --help`（含 does not read `--super`，以及 tasks 与「本次会创建」分栏）、空 scope 无参产物、`edges init notes` 与 `edges notes init` 文件一致、`edges init memory` 不建 notes 桩、幂等重跑、`--super` 仍写 `.harness`、init 命令源码不读材料清单、写锁把新 init 当写命令。
- [x] **Step 2:** 跑该测试，确认因命令不存在而失败。

### Task 2: init service 与命令

**Files:**
- Create: `extensions/cli/src/services/init/modules.ts`
- Create: `extensions/cli/src/services/init/service.ts`
- Modify: `extensions/cli/src/services/memory/init.ts`
- Modify: `extensions/cli/src/services/notes/service.ts`
- Modify: `extensions/cli/src/services/projects/service.ts`
- Create: `extensions/cli/src/commands/init.ts`
- Create: `extensions/cli/src/commands/notes/init.ts`
- Create: `extensions/cli/src/commands/projects/init.ts`
- Modify: `extensions/cli/src/commands/notes.ts`
- Modify: `extensions/cli/src/commands/projects.ts`
- Modify: `extensions/cli/src/program.ts`

**Interfaces:**
- `initMemory(options)`：与今天相同的返回值；`compatBoards: true`。
- `initScope({ targetDir, rootDir?, description?, indexGroup?, modules?, memoryTypes?, skillTypes? })`：`modules` 省略时为 `memory`、`notes`、`projects`；memory 类型省略时为 `feedback`、`project`、`reference`。
- `initNotes` / `initProjects`：`initScope({ modules: ["notes"|"projects"] })`。

- [x] **Step 3:** 模块表只用 material id。`ensureHarnessBoard` 用 `placeHarnessMaterial` 取 path，文件已存在则返回 preserved，否则 `NodeService.create`。
- [x] **Step 4:** `runMemoryInit` 保持今天的选择、类型索引、`refreshIndex`、AGENTS、`syncIndexEntry` 顺序。仅把桩创建换成 `ensureHarnessBoard`，并由 `compatBoards` 开关控制。
- [x] **Step 5:** 根命令与域命令只 import 各自主文件。`commandWriteTarget` 把根 `init`、`notes init`、`projects init` 算作写命令；`--target-dir` 作为锁路径。
- [x] **Step 6:** 跑新测试与 `extensions/cli/test/memory/content-boards.test.ts`、`cli.test.ts`、`core.test.ts` 至 PASS。

### Task 3: ADR、CONTEXT、skill、CLI README

- [x] **Step 7:** 写 `docs/adr/0031-edges-init-standard-command.md`。CONTEXT 系统入口句只把命令改成 `edges init`，并保留 `edges memory init` 为同族入口。
- [x] **Step 8:** CLI README 分层段登记 init；memory 示例前加 `edges init`。
- [x] **Step 9:** skill 真源升到 3.5.0，只改 SKILL、runtime、LAYOUT 的命令与模块段。

### Task 4: 任务卡与全量对比

- [x] **Step 10:** `edges tasks status` 把 `edges-unified-init` 移到 in_progress。`edges tasks update --body` 追加决策摘要（链到本 plan），并注明无参 init 的 memory 组织清单指 feedback/project/reference 三个类型 README。不改背景和目标。勾上已达成的完成标准。log 记下 grill、决策、实现。合入前留在 in_progress。
- [x] **Step 11:** `extensions/cli` 下 `tsc --noEmit`。先跑本分支 `pnpm test`，结束后再在独立 worktree 跑 main 的 `pnpm test`。本分支有而 main 没有的失败必须为空。
