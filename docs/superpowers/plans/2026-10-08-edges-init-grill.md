# edges init grill 问题清单

只读调研。对照任务卡 `edges-unified-init` 的最新正文（PR #189 分支 `cursor/rewrite-edges-init-task-body-94f5` 上的 `.harness/tasks/edges-cli-platform/backlog/2026-10-08--补充统一的-edges-init模块-init-只调-init-service/INDEX.md`），以及当前工作分支（PR #187，`cursor/commands-node-helpers-to-services-20cf`）里的实现。

这一份是整棵决策树一次交齐，方便一次拍板。标了「依赖」的题，选项会随前置答案收窄，但代价按今天的代码写死，可以一起定。

已定、本清单不再重开的约束：

- 根命令叫 `edges init`，不叫 `edges harness init`。
- `edges memory init` 与其他 `edges <domain> init` 是同族入口，只调 init service。
- 分层是 NodeService → 薄 service → commands 直调 service。
- `harness-materials.json` 不再归 memory 独享。
- 不改 notes / skills / projects 的 CRUD 行为，不重写 NodeService 合同。

---

❓ **Q1** — **init service 放哪、主文件叫什么**

**问题：** 与 memory 解耦的 init 主文件，是新建 `extensions/cli/src/services/init/service.ts`，还是继续留在 `services/memory/init.ts` 再被别人 re-export？

**为什么要定：** 今天唯一的模块初始化函数是 `initMemory`，定义在 `extensions/cli/src/services/memory/init.ts`，由 `extensions/cli/src/services/memory/index.ts` 再导出，命令 `extensions/cli/src/commands/memory/init.ts` 从这层 index 调用。`extensions/cli/src/services/memory/service.ts` 已经存在，但里面只有 `memoryNodes` / `prepareMemoryWrite`（写权限与私有目录策略），不是 init，也不是 barrel。另一个代理正在给各模块加 `services/<module>/service.ts`（re-export）。若 init 塞进 `services/memory/service.ts`，会和这份已有文件、以及那次 re-export 抢同一个路径；若继续把编排留在 `services/memory/init.ts`，notes/projects 的材料初始化就还挂在 memory 上，和任务卡「材料清单不再归 memory 独有」相反。

**选项 A：** 新建 `services/init/service.ts` 作为唯一主文件。`initMemory` 的通用部分搬进去；`services/memory/init.ts` 变成对它的薄调用，或直接删掉、由 memory 命令改调 init service。

- 代价：要改 memory 命令的 import，以及所有直接 `import { initMemory } from ".../services/memory/init.js"` 的测试（`extensions/cli/test/memory/core.test.ts`、`uniform-nodes.test.ts`、`adoption.test.ts`、`type-index-readme.test.ts`、`core-boundaries.test.ts`、`services/production-nodes.test.ts`、`services/directory-cli.test.ts`、`services/review-fixes.test.ts`）。任务卡要求「现有 memory init 测试不改断言」，搬函数时可以保留同名导出，让这些 import 仍指向一层兼容包装。
- 影响面：新目录只服务 init；不碰 `services/memory/service.ts`；不抢另一个代理的 notes/projects/skills re-export。

**选项 B：** 主实现仍留在 `services/memory/init.ts`，另加 `services/init/service.ts` 只做 `export { initMemory as initScope } from "../memory/init.js"`。

- 代价：文件位置满足「有一个 service.ts」，语义不满足。projects/notes 的 `ensureContentBoards` 仍住在 memory 文件里。后续 `edges notes init` 会反向依赖 memory。
- 影响面：diff 最小，但任务完成标准「材料清单不再归 `services/memory` 独有」过不了。

**选项 C：** 不建 init 模块，把「初始化某模块」做成各模块自己的 `services/<module>/service.ts` 方法，根命令自己编排。

- 代价：notes/projects 今天没有 `services/notes/`、`services/projects/`。CRUD 在 `extensions/cli/src/services/node/dated-leaf.ts`。根命令会变成编排者，违反「commands 不堆编排」。还要等另一个代理先把 service 主文件落稳。
- 影响面：和进行中的 re-export 工作绑在一起，本卡被卡住。

**推荐：A。** 主文件就是 `services/init/service.ts`。memory 侧保留同名 `initMemory` 包装，让现有测试 import 不用改断言。不要改 `services/memory/service.ts` 的职责，也不要在本卡新建 `services/notes/service.ts` 去跟另一个代理抢文件。

---

❓ **Q2** — **材料清单的归属：按模块登记，还是各模块自己交 init 描述**

**问题：** `extensions/cli/src/domain/config/harness-materials.json` 继续当挂载表，还是升级成 init 的模块登记？init 种子写在 JSON 里，还是写在各模块代码里？

**为什么要定：** 这份 JSON 今天已经不是 memory 私有的。读者包括：

- 超节点挂载：`extensions/cli/src/services/node/super-root.ts` 的 `listHarnessMaterialAbsPaths`
- 路径拼接：`extensions/cli/src/domain/config/harness-materials.ts` 的 `placeHarnessMaterial` / `materialHarnessRoot`
- tasks 目录名与「这是不是看板文件」：`tasksBoardDirName`、`isTasksBoardMaterial`，被 `extensions/cli/src/services/node/node-service.ts` 和 `extensions/cli/src/domain/models/layout.ts` 使用
- skills 落盘根：`extensions/cli/src/services/skills/service.ts` 的 `materialHarnessRoot`

JSON 的粒度是**材料文件**（`tasks`、`projects`、`notes`、`memory.feedbacks`、`memory.projects`、`memory.references`、`skills.managed`、`skills.referenced`、`evaluation`、`observation`、`readme`），字段只有 `id` / `path` / `optional`。

init 的粒度是另一套，而且是硬编码、三套对不齐：

- 推荐模块：`init.ts` 第 58 行 `["memory", "skills", "tasks", "projects", "notes"]`
- 真正顺手建文件的只有 `CONTENT_BOARDS`（同文件第 24–28 行）：`projects`、`notes`
- memory/skills 的类型 README 不走这份 JSON，走 `extensions/cli/src/services/memory/types.ts` 的 `MEMORY_TYPE_NAMES` / `SKILL_TYPE_NAMES` 和 `extensions/cli/src/services/memory/templates.ts` 的模板
- `tasks`、`evaluation`、`observation`、`readme` 在 JSON 里，init 不创建

不定的话，init service「接管材料清单」会把挂载表和初始化种子揉成一份，super / tasks / skills 的路径读者会被迫理解 init 种子；或者各模块各自写 path，和 JSON 漂移。

**选项 A：** JSON 升级为 init 登记。加上 `module`、种子标题、正文、是否登记到 AGENTS。init service 只读这一份。

- 代价：挂载表和初始化策略耦在一个文件。`optional: true` 今天的意思是「文件不在就不要挂」（`resolveHarnessMaterial`），不是「init 要不要建」。两种语义叠在同一字段上会误挂或误建。`memory.feedbacks` 这种类型材料没有单独的模块级种子，硬塞进同一数组会把类型选择再写一遍。
- 影响面：所有读 JSON 的测试（`extensions/cli/test/domain/harness-materials.test.ts`、`extensions/cli/test/memory/content-boards.test.ts`）和 super 挂载一起变。

**选项 B：** JSON 保持挂载表（id + path + optional），只从 `services/memory/` 的归属里挪走（它本来就在 `domain/config/`）。每个模块在自己的 service 里导出 init 描述（要建哪些 material id、种子正文、登记策略）。

- 代价：notes/projects 还没有自己的 service 主文件。描述若散落到 `dated-leaf.ts`、`tasks/project-meta.ts`、`memory/types.ts`，init service 要反向依赖这些模块，容易把 CRUD 卷进来（非目标）。path 若描述里再写一份，会和 JSON 分叉。
- 影响面：super 与 tasks 路径逻辑可以不动。

**选项 C：** 两层。命令面对的是模块（memory、notes、projects、tasks、skills）。挂载面对的仍是 JSON 里的材料 id。init 描述集中放在 init service 旁的一张表：模块 → material id 列表 + 种子 + 登记策略；path 只通过 `placeHarnessMaterial(scope, id)` 取，不复制。

- 代价：多一张表，要和 JSON 的 id 对齐（测试可以断言每个 init 用到的 id 都在 JSON 里）。memory 模块的「材料」仍是类型 README，不在 JSON 的模块级 id 里，这张表要允许 memory 走类型规格而不是单条 material。
- 影响面：JSON 的现有读者不变。init 不再硬编码第二份 path。

**推荐：C。** 挂载表继续给 super / tasks / skills 用。init 的模块表归 init service，用 material id 引用 JSON，不把种子写进 JSON，也不在本卡把描述拆进尚未存在的 `services/notes/service.ts`。

依赖：Q1 选 A 时，这张表放在 `services/init/` 下。

---

❓ **Q3** — **notes/projects 的组织清单到底是哪一个文件**

**问题：** 「初始化 notes/projects」是继续写 `<scope>/.harness/notes/README.md`（以及 projects 的对应文件），还是去准备内容面的 `<scope>/notes/README.md`？

**为什么要定：** 仓库里这两份同时存在，职责不同。

- init 今天写的是 harness 桩。`ensureContentBoards` 用 `placeHarnessMaterial(target, id)`，真系统的根是 `<scope>/.harness`（`harness-materials.ts` 的 `materialHarnessRoot`）。空目录跑 `edges memory init --memory-types project` 后，测试断言的是 `.harness/projects/README.md` 和 `.harness/notes/README.md`，并且根 `AGENTS.md` 里出现这两条链接（`extensions/cli/test/memory/content-boards.test.ts`）。本仓根 `AGENTS.md` 第 33–34 行就是这两条。
- `edges notes create` / `edges projects create` 写的是 `<scope>/notes/<date>--<slug>/INDEX.md` 和 `<scope>/projects/...`，见 `extensions/cli/src/services/node/dated-leaf.ts` 的 `createDatedLeaf`。叶子挂到谁，由 `extensions/cli/src/services/node/node-layout.ts` 的 `physicalParent` 决定：同目录若有带 `project-entries-*` 的 README，挂 README；否则挂 AGENTS。测试 `extensions/cli/test/commands/notes-skills-crud-nodeservice.test.ts` 把叶子登记在 `notes/README.md` 或 `notes/AGENTS.md`，不在 `.harness/notes/README.md`。
- 本仓内容面 `notes/README.md` 是手写散文（「待处理想法」），根 `README.md` 的 `project-entries-local` 指向它和 `tasks/README.md`（`extensions/cli/test/models/root-readme-entries.test.ts`）。`.harness/notes/README.md` 自己写明：叶子在 scope 的 `notes/`，自己的 `project-entries` 是空的。
- `project-memory-init` 的 SKILL.md 写明：Init **不会**在作用域根自动创建组织清单 `README.md`。

若把「notes init」理解成准备 `edges notes create` 的父索引，就会去写或改 `<scope>/notes/README.md`，可能盖掉手写散文，也改变叶子登记位置，碰到非目标「不改 notes/projects CRUD」。若只建 harness 桩，则 `edges notes init` 之后 CRUD 的父索引仍可能不存在，和「模块已初始化」的直觉不一致。

**选项 A：** 本卡只建 harness 材料桩（`.harness/notes/README.md`、`.harness/projects/README.md`），并登记到 scope 的 `AGENTS.md`。不创建、不改写 `<scope>/notes/README.md` 和 `<scope>/projects/README.md`。

- 代价：域 init 的「组织清单」不是 CRUD 的父索引。文档必须写清这是系统二材料，不是内容面。
- 影响面：与 `content-boards.test.ts`、现有根 `AGENTS.md` 一致；CRUD 路径不变。

**选项 B：** notes/projects init 改为确保内容面 `<scope>/notes/README.md`（空的 `project-entries` 种子）。harness 桩不再由 init 创建。

- 代价：空 scope 的文件布局和现有 memory init 测试不一致（测试要 `.harness/notes/README.md`）。本仓根 `notes/README.md` 是手写正文，刷新会毁内容。叶子父索引规则不用改，但「已有散文 README、没有 entries 标记」时 `physicalParent` 不会把它当组织清单。
- 影响面：notes/projects CRUD 的登记目标可能变，违反非目标。

**选项 C：** 两份都建。

- 代价：一个模块两次写盘，super 挂载（scope + `notes/README.md`）和 AGENTS 挂载（`.harness/notes/README.md`）会指向两份都叫组织清单的文件。和 SKILL「不在作用域根自动创建 README」冲突。
- 影响面：最大，且和 Q5 的 `--super` 路径叠在一起。

**推荐：A。** 本卡的 notes/projects init 等于今天的 `ensureContentBoards`。内容面 README 与叶子父索引留给后续卡。任务卡完成标准写的也是「`.harness` 下已登记模块的组织清单」。

依赖：Q2 的模块表里，notes 的 material id 就是 JSON 的 `notes`（path `notes/README.md`），放置规则仍用 `materialHarnessRoot`，不要另写路径。

---

❓ **Q4** — **`edges init` 的参数形状：无参、指定模块、类型选择、交互推荐**

**问题：** 无参 `edges init` 写什么？用什么旗标只初始化一个模块？memory/skills 的类型选择留在哪条命令上？「交互推荐」是 CLI 读 TTY，还是继续返回 JSON 让 skill 去问？

**为什么要定：** 今天没有根命令 `edges init`（`extensions/cli/src/program.ts` 只注册 notes、projects、tasks、memory、skills、artifacts、schema、forest）。memory init 的参数在 `extensions/cli/src/commands/memory/init.ts`：

- `--target-dir`（`commands/memory/utils/command.ts` 的 `scoped`）
- `--root-dir`、`--index-group local|descendant`、`--description`
- `--memory-types`、`--skill-types`
- 全局 `--scope` / `--super` / `--all` 在根上，但 init 动作不读 `ctx.super`（见 Q5）

没有 `--module`。也没有 TTY 提问。无类型且该层还没有已采用类型时，`initMemory` 返回 `selectionRequired: true` 和 `recommendations`，不写文件（`init.ts` 第 50–62 行）。`extensions/cli/test/memory/cli.test.ts` 断言此时目录为空。已有类型后再跑、不带旗标，则刷新已采用类型（`extensions/cli/test/memory/core.test.ts`「reruns preserve selected adoption」）。

任务完成标准要求：空 scope 上无参 `edges init` **要写盘**（根 `AGENTS.md`，以及至少 memory、notes、projects 的组织清单），同时又能只初始化指定模块，且 `edges <domain> init` 与之结果一致。这和无参 `edges memory init` 的「只推荐、不写」是两条命令、两种无参语义。另外 `LAYOUT.md`（`.claude/skills/project-memory-init/references/LAYOUT.md` 第 7–9 行）写明推荐模块不代表自动创建，官方六类不是每层必建。

CLI 输出信封也不一样：memory 用 `operation()` 打出 `{ ok: true, ... }`（`commands/memory/utils/command.ts`）；notes/skills 用 `succeed()` 打出 `{ status: "success", command, ... }`。memory 测试只断言 `selectionRequired` 和 `recommendations.modules` 含 projects/notes，没有快照整份 JSON。

**选项 A：** 无参 `edges init` 写默认模块集：AGENTS + notes 桩 + projects 桩 + 一批默认 memory 类型。指定模块用 `edges init <module>` 或 `--module <id>`（可重复）。类型旗标 `--memory-types` / `--skill-types` 在 `edges init` 和 `edges memory init` 上都保留。无 TTY；缺类型时 memory 子路径仍返回 `selectionRequired`。`edges memory init` 无参保持今天的不写盘。

- 代价：必须先定默认类型集（见下面的子选择）。无参根命令和 `LAYOUT`「不预建全部类型」可能冲突，要在 skill 里把「根 init 的默认集」和「memory init 的选择式」写成两句话。
- 影响面：`program.ts` 的帮助与 `ROOT_AFTER_HELP`、写锁清单 `commandWriteTarget`（今天只把 `memory init` 算写命令）。

**选项 B：** 无参 `edges init` 也只返回推荐 JSON、不写盘。要写盘必须带 `--module` 或类型旗标。另加 `--yes` 才按推荐集落盘。

- 代价：对不上任务完成标准「空 scope 执行 `edges init` 能生成……」。实现简单，和今天的 memory init 最像。
- 影响面：验收条款要改任务卡，否则卡关不上。

**选项 C：** 无参 `edges init` 只建 AGENTS + notes 桩 + projects 桩，**不**采用任何 memory/skill 类型。memory 的组织清单仍只由 `edges memory init --memory-types ...` 或 `edges init memory --memory-types ...` 创建。

- 代价：完成标准里的「至少 memory、notes、projects 的组织清单」里，memory 没有单独的 `memory/README.md`（JSON 里也没有这条；类型入口是 `memory/<plural>/README.md`）。无参跑完，memory 模块在磁盘上没有索引文件，只是 AGENTS 里可能还没有类型行。验收的人会说 memory 没初始化。
- 影响面：与「不预建六类」一致；与任务卡字面的 memory 组织清单不一致。

默认类型集（仅当 A）：

- A1：四个 `MEMORY_TYPE_NAMES`（user、feedback、project、reference）外加两个 skill 类型。user 在有 Git 时会写 `.gitignore`（`ensureTypeGitignore`）。冲击大，和「选择式、不预建全部」直接相反。
- A2：只采用 `project`、`feedback`、`reference`，不采用 `user`（私有、要 gitignore），也不采用 skill 类型。
- A3：只采用 `project`，与仓库里大多数测试的最小初始化一致。

**推荐：A + A2。** 无参 `edges init` 写 AGENTS、notes 桩、projects 桩，以及 feedback/project/reference 三个公开 memory 类型的 README。不默认建 user，不默认建 skills。指定模块：`edges init <module>`，可重复参数；`edges notes init` 等价于 `edges init notes`。类型旗标两边都收。不要做 TTY 交互。无参 `edges memory init` 继续 `selectionRequired`、不写盘，这样 `cli.test.ts` 的空目录断言还能过。

JSON 信封：`edges memory init` 继续 `{ ok: true, selectionRequired, recommendations, ... }`。新的 `edges init` 用 notes 那套 `{ status: "success", command: "init" }`，不要逼 memory 测试改断言。域 init 若只是转调，memory 仍走 memory 信封，notes/projects 走 success 信封。

依赖：Q3 选 A 时，这里的 notes/projects 都是 harness 桩。Q7 决定 memory init 是否额外再写 notes/projects。

---

❓ **Q5** — **`--super` 对 init 的写盘位置生不生效**

**问题：** `edges --super init` 是把材料写到 `<scope>/<material.path>`，还是照旧写到 `<scope>/.harness/`，还是直接拒绝？

**为什么要定：** `--super` 是根旗标，帮助文案写的是运行时超节点、不落盘（`program.ts` 第 92–95 行）。`initMemory` 不读 `ctx.super`，`ensureContentBoards` 调用 `placeHarnessMaterial` 时不传 `{ super: true }`，所以即使用了 `--super`，桩也在 `.harness/` 下。

与此同时，写路径并不统一：

- skills create 会把 `ctx.super` 传进 `materialHarnessRoot`（`extensions/cli/src/commands/skills/create.ts`、`services/skills/service.ts`）。`--super` 时技能在 `<scope>/skills/managed/`，不是 `.harness/skills/`。
- tasks 的约定是：无 `--super` 看板在 `<scope>/.harness/tasks`，有 `--super` 在 `<scope>/tasks`（SKILL.md；`services/tasks/paths.ts` 用 `placeHarnessMaterial(..., { super })`）。
- 记忆里的范围组合只有 `--scope` / `--super` / `--all`（`.harness/memory/feedbacks/feedback_scope_super_all/INDEX.md` 的索引说明）。init 若发明第四种放置开关，和这条约束冲突；若让 init 跟随 `--super`，又和「超节点不落盘」的帮助文案冲突——超节点本身不落盘，但它的材料路径是落在 scope 目录上的。

**选项 A：** init 忽略 `--super`，永远写 `<scope>/.harness/`。帮助里写明 init 不看这个旗标。

- 代价：`edges --super skills create` 与 `edges --super memory init --skill-types managed` 的技能索引不在同一棵树上。这个裂缝今天已经存在。
- 影响面：现有 memory init 测试不用改。超节点挂载逻辑不动。

**选项 B：** init 跟随 `--super`：真系统写 `.harness/`，`--super` 写 scope 目录（`notes/README.md` 会落在内容面，见 Q3）。

- 代价：无参 `edges --super init` 可能创建或撞上本仓那种手写 `notes/README.md`。和 Q3 的推荐 A 冲突。tasks 的放置会和 init 对齐，但 notes 内容面会被 init 碰到。
- 影响面：写锁目标仍是 scope（`commandWriteTarget`），文件却出现在 scope 根下各材料路径，review 时要单测两条根。

**选项 C：** init 若看到 `--super` 就用法错误退出，提示去掉该旗标。

- 代价：多一个拒绝分支。用户不能用一条命令「按超节点的材料路径初始化」。
- 影响面：最小。和「超节点不落盘」的字面最接近。

**推荐：A。** 本卡 init 只初始化真系统的 `.harness` 材料。`--super` 继续只影响 list/traverse 和那些已经显式把 `ctx.super` 传进写路径的命令（skills create、tasks 看板）。不要在本卡顺手统一 skills 的裂缝。帮助和 skill 里写一句：init 不读取 `--super`。

依赖：若 Q3 改成 B 或 C，这里不能再选 A。

---

❓ **Q6** — **再跑一次是缺了才建，还是刷新已有正文**

**问题：** 文件已在时，init 是跳过、只补缺失区块，还是按模板重写？

**为什么要定：** 今天三条路径语义不同。

- 内容桩：`ensureContentBoards` 见 `existsSync` 就 `continue`，不读、不刷新。`NodeService.create` 对已存在文件会抛 `Node target already exists`（`node-service.ts` 的 `create`）。本仓 `.harness/notes/README.md` 比代码里的种子多了一句「叶子写在 scope 的 notes/」；若改成重写正文，再跑 init 会盖掉这句。
- 类型索引：`refreshIndex`（`extensions/cli/src/services/memory/entries.ts`）会重算本层列表区块，保留其余正文。再跑 memory init 会更新已采用类型。
- AGENTS：`syncLoadedAgents`（`extensions/cli/src/services/memory/agents.ts`）对 foreign 文件返回 `needs-doctor` 且不覆盖；对已受管文件只 upsert 本层/下层区块，并 `ensureImportantBlock`（缺硬约束才补，不覆盖已有硬约束）。`core.test.ts` 断言第二次无参 init 后 `AGENTS.md` 字节不变。

doctor 的 `--apply` 是另一条修复路径（`services/memory/doctor.ts`），本卡非目标不改它。若 init 改成「总是重写」，会和 doctor 抢修复，也会破坏「硬约束手写保留」（`.claude/skills/project-memory-init/.harness/memory/projects/project_important_block/INDEX.md` 的索引说明，以及 SKILL.md「现有硬约束与手写正文不覆盖」）。

**选项 A：** 保持分裂语义。组织清单桩：不存在才建，存在则一行不改。类型索引：继续 `refreshIndex`。AGENTS：继续只补受管区块，foreign 仍 `needs-doctor`。

- 代价：同一次 init 里「刷新」和「跳过」并存，文档要写清。桩上的空列表不会在后来自动补上已有叶子（叶子本来也不挂在这张桩上，见 Q3）。
- 影响面：`core.test.ts` 的字节相等、`content-boards` 的「写过即可」都能过。

**选项 B：** 全部刷新。桩也按种子重写正文。

- 代价：盖掉 `.harness/notes/README.md`、`.harness/projects/README.md` 上已经写上的说明。foreign AGENTS 若也刷新，就破坏 doctor 的边界。
- 影响面：本仓根 harness 的 notes/projects README 在有人重新 init 根 scope 时会被改写。

**选项 C：** 全部改为缺了才建，连类型索引也不再刷新。

- 代价：`edges memory init` 在已采用层上不再修索引。SKILL 和 `LAYOUT.md` 第 38 行「已有层省略列表时只刷新已经采用的类型」变成假话。`complete: false` / `source-scan-error` 那条路径（`core.test.ts` 的 referenced 诊断）还在 `initMemory` 里，去掉刷新要连诊断一起改，测试断言会动。
- 影响面：和「不改现有断言」冲突。

**推荐：A。** 幂等的意思是：再跑不毁手写、不重复创建；类型索引与 AGENTS 受管区块仍按今天的规则修补。不要把 init 做成 doctor。

---

❓ **Q7** — **`edges memory init` 还要不要顺手建 notes/projects**

**问题：** 委托给 init service 之后，`edges memory init --memory-types project` 是否仍然创建 notes/projects 的 harness 桩并写进 `AGENTS.md`？

**为什么要定：** 这是任务卡里两句互相咬住的话。

- 「只把初始化 memory 模块交给 init service」
- 「`edges memory init` 的输出与改造前一致（现有 memory init 测试不改断言即通过）」

现状是：只要类型选择通过，`init.ts` 第 123 行总会 `ensureContentBoards`，与用户有没有「选择 notes 模块」无关。推荐 JSON 里虽然列出 `tasks`，但 tasks 文件不会被创建。`content-boards.test.ts` 同时断言推荐列表含 projects/notes，以及带 `--memory-types project` 后两个 harness README 和 AGENTS 链接存在。`uniform-nodes.test.ts` 也把 `.harness/projects/README.md`、`.harness/notes/README.md` 算进某层 list 的结果。

命令文件若自己再调三次 init service（memory、notes、projects），业务组合就留在 commands 里，违反「commands 下没有 init 业务逻辑」。若 service 的 memory 入口不再建桩，测试必须改。

**选项 A：** 兼容包放在 init service 的 memory 入口内部：初始化 memory 时仍创建 notes/projects 桩。命令只调用一次 init service。`edges init notes` 单独建 notes 桩。根 `edges init` 按 Q4 的默认集建，不依赖这次兼容。

- 代价：memory 入口在服务端仍知道 notes/projects。语义扭结从命令挪到了 service 的兼容层，没有消失。要在函数名或注释里写成兼容，避免以后的模块表把「memory 包含 notes」当成真模型。
- 影响面：现有测试不改断言。新的 `edges init notes` 与「只跑 memory」会建同一份桩（Q6 的存在即跳过，所以重复调用安全）。

**选项 B：** memory 入口只建 memory 类型和 AGENTS 上的类型行。notes/projects 只由 `edges init` 默认集或 `edges notes init` 创建。改测试断言。

- 代价：直接违反任务卡「不改断言」。`content-boards.test.ts`、`uniform-nodes.test.ts` 的 list 路径会少两个 README。SKILL 3.4.0 第 15 行「选定类型后还会生成 projects/notes 组织清单」也要改。
- 影响面：语义最干净。需要先改任务完成标准，否则这张卡做不完。

**选项 C：** memory 命令在参数层展开成多次 `initModule`，service 本身不知道这层兼容。

- 代价：`commands/memory/init.ts` 出现模块名单，完成标准「commands 中不出现材料清单读取或直接文件写入」可以勉强过（它不读 JSON），但「只初始化指定模块」和「命令里没有 init 业务逻辑」都站不住。
- 影响面：测试能过，分层评审过不了。

**推荐：A。** 本卡用 service 内的 memory 兼容包保住现有测试。根命令和域命令的模块表（Q2）不要把 notes 写成 memory 的子材料。兼容包只调用与 `edges init notes` / `edges init projects` 相同的函数。后续卡若改测试，删掉兼容包即可，命令不用再动。

依赖：Q3 为 A、Q6 为 A 时，兼容包只是「若桩不存在则建」。

---

❓ **Q8** — **哪些域要有 `<domain> init`；artifacts 与 evaluation/observation 怎么办**

**问题：** 本卡除了 `edges init` 和改薄的 `edges memory init`，还要不要加上 notes、projects、tasks、skills 的 init 子命令？

**为什么要定：** 今天带 `init` 子命令的只有两处：

- `edges memory init`（本卡的对象）
- `edges artifacts init`（`extensions/cli/src/commands/artifacts/init.ts`）：写客户端 token 和 `~/.config/edges/artifacts.env`，不是 harness 材料。记忆与 ADR 0013 把「没有 server init、客户端才是 `edges artifacts init`」当成已定规格。

notes、projects、tasks、skills 的命令文件只有 list/get/create/update/delete（tasks 另有 status、project、runs）。`extensions/AGENTS.md` 硬约束：不为 `evaluation` / `observation` 发明命令。这两项却在 `harness-materials.json` 里，本仓也有 `.harness/evaluation/README.md` 和 `.harness/observation/README.md`，是手写的，init 不生成。

任务卡正文写「后续 `edges <domain> init` 照此」，完成标准没有要求本卡把每个域的子命令都做完；用户本轮的约束则把域 init 说成同族入口。

**选项 A：** 本卡只做根 `edges init` + memory 入口改薄。notes/projects 只能通过 `edges init notes` 到达。tasks/skills 的子命令本卡不加。artifacts init 保持原样，不走 init service。evaluation/observation 不出现在 init 默认集，也不新命令。

- 代价：还没有 `edges notes init` 这条用户口头说的同族入口。根命令已经能指定模块，所以能力在，命令名不对称。
- 影响面：最小，且不碰 artifacts 的 token 合同。

**选项 B：** 本卡为 notes、projects 加 `edges notes init` / `edges projects init`，两者只转调 init service 的对应模块。memory 保持。tasks、skills、artifacts、evaluation、observation 不加新的域 init。

- 代价：多两个很薄的命令文件和帮助文本。tasks 仍只能靠懒创建（Q9），skills 的类型选择仍走 memory 的 `--skill-types`，短期内 `edges skills init` 不存在，而 `edges memory init --skill-types` 继续能建技能索引。这个不对称要写进帮助。
- 影响面：和「notes/projects 是被 memory 顺手建的、现在要有自己的入口」最贴。CRUD 命令文件不动。

**选项 C：** notes、projects、tasks、skills 全部加域 init，并让 artifacts init 改名或收进同一 service。

- 代价：tasks 的看板创建今天在 `services/tasks/project-meta.ts` 的 `ensureBoardMaterial`，还有特殊登记（Q9）。skills init 与 `--skill-types` 重叠。artifacts 改名破坏已发布的客户端命令和记忆里的规格。evaluation/observation 若跟着 JSON 全量 init 出现，就违反 extensions 硬约束。
- 影响面：超出本卡，且容易改到 tasks 行为（非目标虽未点名 tasks，但任务卡非目标是不改 notes/skills/projects CRUD；tasks 行为变了同样危险）。

**推荐：B。** 本卡的域入口是 memory（改薄）、notes、projects。根命令能按模块调用同一函数。不加 `edges tasks init`、`edges skills init`。`edges artifacts init` 保持 token 命令，帮助里不要把它写成标准 init。默认模块集不要包含 evaluation、observation。

依赖：Q4 的指定模块语法定了之后，notes/projects 子命令只是把模块名写死再转调。

---

❓ **Q9** — **tasks 材料的登记特例要不要进 init service**

**问题：** init 创建 tasks 看板时，是否绕过 `NodeService.create` 对 tasks 材料「不登记进 AGENTS」的特例？

**为什么要定：** `node-service.ts` 的 `#registration` 对 `isTasksBoardMaterial` 直接 `return undefined`（约第 424–426 行），注释写明看板由 tasks service 去挂，super 只挂载、不在这里挂。真正挂到 scope AGENTS 的逻辑在 `extensions/cli/src/services/tasks/project-meta.ts`：`ensureBoardMaterial` 创建或补 `project-entries`，`refreshProjectIndex` 再在 owner AGENTS 上补一条（约第 280–289 行）。memory init 的推荐列表含 `tasks`，但 `CONTENT_BOARDS` 不含它，所以今天 init 不建 `.harness/tasks/README.md`。

本仓 `.harness/tasks/README.md` 是手写长文，不是空种子。若 init 用 notes 那种短种子去「缺了才建」，已有文件会跳过（Q6），空 scope 则会得到一块新看板。`NodeService.create` 不会把它登记到 AGENTS；不额外调用 tasks 的挂接函数的话，`edges tasks list` 顺着 AGENTS children 会看不见这块新看板。

**选项 A：** 本卡 init 默认集不包含 tasks，init service 不创建看板，也不调用 `ensureBoardMaterial`。推荐 JSON 里可以继续提到 tasks，但要和「会写盘的模块」分开，避免再出现「推荐了却不建」而不说明。

- 代价：空 scope 的 `edges init` 之后仍没有 tasks 看板，要等第一次 tasks 写入才懒创建。和今天 memory init 的实际写盘一致。
- 影响面：tasks 路径、登记特例、手写 `.harness/tasks/README.md` 都不变。

**选项 B：** init 的 tasks 模块只调用现有 `ensureBoardMaterial`（以及它后面的挂接），不在 init service 里复制一份创建逻辑。

- 代价：init 依赖 tasks service 的懒创建副作用（它还会扫 project、改索引）。空 scope 上可能写出一块看板并挂到 AGENTS，和「init 只建空组织清单」不完全一样。要新测试证明不改已有 tasks CRUD/list 行为。
- 影响面：碰 tasks 写路径，评审面变大。

**选项 C：** 去掉 `isTasksBoardMaterial` 特例，让 init 和其他材料一样靠 `NodeService.create` 登记。

- 代价：改 NodeService 合同，任务卡明确不做。super 挂载与 tasks service 的二次挂接可能双登记。
- 影响面：所有看板创建路径。

**推荐：A。** tasks 不进本卡的默认集，也不进 Q8 的域 init。推荐列表若仍向用户展示 tasks，文案要写成「tasks 由 tasks 命令在首次需要时确保看板」，不要和 notes/projects 放在「本次会创建」的同一数组里而不加区分。今天 `recommendations.modules` 把它们放在一起，这是要改的展示结构；若改了数组内容，`content-boards.test.ts` 只要求 `includes("projects")` 和 `includes("notes")`，tasks 仍可留在数组里。

---

❓ **Q10** — **写盘是否全部经 NodeService；现有绕过怎么处理**

**问题：** init 路径上哪些写入必须改成 `NodeService.create/update`，哪些允许继续绕过？

**为什么要定：** 任务卡写「写盘经 NodeService」。今天 init 的主路径已经如此：

- AGENTS：`syncLoadedAgents` → `service.create` / `service.update`
- 类型 README：`service.create`，以及 `refreshIndex` 里的 create/update
- notes/projects 桩：`service.create(new ReadmeNode(...))`
- 父层索引：`syncIndexEntry` → `service.update`
- 最终字节由 `NodeService.#save` → `saveEntries`（`extensions/cli/src/services/node/node-files.ts`）原子写出

绕过点：

- 私有类型的 `.gitignore`：`types.ts` 的 `ensureTypeGitignore` 直接 `saveEntries`。`.gitignore` 不是节点，`NodeService.#boundary` 会因 `identifyNodeType` 失败拒绝。
- `refreshIndex` 在 create 前 `fs.mkdirSync`（`entries.ts` 约第 276–277 行）。`saveEntries` 自己也会 `mkdirSync` 父目录，这次 mkdir 是提前建目录，不是写正文。
- 模板只读：`templates.ts` 的 `templateRoot()` 读 CLI 自带模板或 skill 的 `references/templates`，不写用户 scope。

archive / migrate 的 `fs.writeFile` 不在 init 路径上。tasks 的看板写盘在 Q9，不在 memory init 里。

**选项 A：** 节点文件（AGENTS、类型 README、材料 README）继续只经 NodeService。`.gitignore` 继续 `saveEntries`，不包装成假节点。`refreshIndex` 的提前 `mkdirSync` 可留可删，本卡不专门清理。init service 不新增 `writeFileSync`。

- 代价：完成标准若被理解成「进程里任何 write 都要出现在 NodeService 调用栈」，gitignore 仍是例外，需要在 ADR 里写明。
- 影响面：与现有私有类型测试（`core-boundaries.test.ts` 的 user gitignore）一致。

**选项 B：** 为了字面「全部经 NodeService」，给 gitignore 做一个 NodeService 特判或伪节点。

- 代价：改 NodeService 合同。gitignore 没有 AGENTS/README 语义，塞进 `#boundary` 会污染节点类型判断。
- 影响面：违反非目标。

**选项 C：** init service 自己 `writeFile` 写 AGENTS 和 README，以「少绕一层 memory」为理由。

- 代价：把已经收口的写盘重新拆开。父索引不会更新，traverse 看不见新文件。和 #187 的方向相反。
- 影响面：不可接受。

**推荐：A。** ADR 里写一句例外：非节点文件（`.gitignore`）走 `saveEntries`，不走 `NodeService`。init service 不新增直接写 scope 正文的路径。

---

❓ **Q11** — **谁负责创建 `AGENTS.md`：每个模块 init，还是只有 memory**

**问题：** `edges notes init` / `edges init notes` 在 scope 还没有 `AGENTS.md` 时，要不要创建系统入口？

**为什么要定：** 今天 AGENTS 只由 memory init（以及 doctor `--apply`）写出。模板在 `loadAgentsTemplate` / `renderAgentsDocument`（`services/memory/blocks.ts`），种子来自 `AGENTS.tmpl.md`。`syncTargetAgents` 还会把已采用类型的索引行 upsert 进本层区块。内容桩是在 AGENTS 已经建好之后，由 `NodeService.create` 的 `#registration` 挂上去的（`physicalParent` 会走到 scope 的 `AGENTS.md`，因为路径里带 `.harness`，不会挂到同目录内容 README）。

若 notes init 在没有 AGENTS 时只写 `.harness/notes/README.md`，`#registration` 找不到父节点，桩会变成孤儿，traverse 从真 AGENTS 走不到它。若 notes init 总是创建一整份 AGENTS（含硬约束种子），则「初始化 notes」会把一个目录标成系统入口。这和已定记忆一致：任意目录由用户 init 才有 AGENTS，未 init 不伪造（`.harness/memory/feedbacks/feedback_harness_markers_not_task_project_indexes/INDEX.md`，以及 `project_grill_system_entry_q9b_q10_q11` 的 Q10）。无参 `edges memory init` 仍必须不创建 AGENTS（测试要求目录为空）。

**选项 A：** 凡是会写 harness 材料或类型索引的 init（包括 notes/projects，以及带类型的 memory）都确保 scope `AGENTS.md` 存在：没有就按模板创建，有则只补受管区块。不采用 memory 类型时，本层区块里没有类型行，只有随后登记上的材料。无参 `edges memory init` 在 `selectionRequired` 时仍什么都不写。

- 代价：`edges notes init` 在空目录会留下 `AGENTS.md`，而不只是一个 README。skill 里「谁该 init」要从「为了 memory/skills」改成「为了系统入口或任一 harness 模块」。
- 影响面：与「init 标记重点维护作用域」的 CONTEXT 定义一致。foreign AGENTS 仍 `needs-doctor`，不覆盖。

**选项 B：** 只有 memory init（带类型）和根 `edges init` 创建 AGENTS。`edges notes init` 在缺少 AGENTS 时失败，提示先跑 `edges init` 或 `edges memory init`。

- 代价：域入口不能单独用。空 scope 上 `edges notes init` 与 `edges init notes` 若要求结果一致，根命令的单模块形式也必须失败，无参根命令才能建 AGENTS。可以，但帮助文案别扭。
- 影响面：notes 命令重新依赖「先有 memory 式 init」，语义扭结还在。

**选项 C：** notes init 不建 AGENTS，桩写入后由调用方手动登记。

- 代价：登记逻辑进命令，或桩不可发现。两边都不符合分层。
- 影响面：差。

**推荐：A。** 创建/补齐 scope `AGENTS.md` 是 init service 的公共步骤，不是 memory 私有。无类型的 `edges memory init` 在选择推荐阶段提前返回，不进入这一步。硬约束区块仍是缺了才补、不覆盖。

依赖：Q6 的 AGENTS 语义、Q7 的兼容包（兼容包跑的是「带类型的 memory」，本来就会建 AGENTS）。

---

❓ **Q12** — **ADR、CONTEXT、skill、README 同步到哪一层**

**问题：** 新开 ADR，还是修订 0027 / 0030？`project-memory-init` 改到 PROTOCOL / LAYOUT / SKILL 的哪一层？CLI README 改不改？

**为什么要定：**

- `docs/adr/0027-facade-crud-verbs.md` 讲的是「已有专门命令的 CRUD 动词只提示、不再实现一套」（`tasks delete`、`memory create/update`）。init 是新的会写盘的标准动词，不是这种提示。
- `docs/adr/0030-content-leaf-crud-via-nodeservice.md` 讲 CRUD 旗标表和叶子经 NodeService，并写明「README / 组织列表、memory、tasks 以后照表跟随，本决定不改那些命令」。把 init 塞进这张旗标表，会让 0030 同时决定两件不同的事。
- 仓库里编号最高的是 0030，没有 0031。
- `CONTEXT.md` 第 8 行把系统入口 init 的命令写成 `edges memory init`。根命令落地后这句会过时。
- skill 修改顺序是硬约束：`PROTOCOL.md` → `LAYOUT.md` → `project-memory-init` → 其他非 doctor skill → doctor（`.claude/skills/project-memory-init/AGENTS.md`）。`PROTOCOL.md` 自己写明协议是发现形状，改实现不用碰它。
- `SKILL.md` 版本 3.4.0，面向名称是 project harness init，并写「命令仍为 `edges memory init`（不强制改 bin 子命令）」。第 15 行已经描述 notes/projects 桩。`references/runtime.md` 仍说 init 只采用显式选择的 memory/skill 类型。`references/LAYOUT.md` 第 7 行仍写推荐模块是 memory、skills、tasks，且「Tasks 和其他模块使用自己的契约」。三处已经不一致。
- `extensions/cli/README.md` 约第 177 行有 `memory init` 示例，没有 `edges init`。根 `README.md` 未写 init 命令。
- AGENTS 模板与类型模板仍以 skill `references/templates` 为源，CLI 构建时携带（`templates.ts`）。本卡若只改谁来调用、不改区块标记，就不必改模板。

**选项 A：** 新开 `docs/adr/0031-*.md`，只记「init 是标准命令、有根命令、域 init 委托同一 service、材料挂载表与 init 模块表分离、gitignore 例外」。CONTEXT 第 8 行补上 `edges init`，保留 `edges memory init` 为同族入口。skill 只改 `SKILL.md`、`references/runtime.md`、`references/LAYOUT.md` 里已经失真的命令与模块句。不改 `PROTOCOL.md`，不改模板，不改 doctor skill。CLI README 的示例加一条 `edges init`。根 README 本卡不动。

- 代价：多一份 ADR。0030 的旗标表仍不包含 init，读者要知道 init 在 0031。skill 有三处正文要一起改，否则 3.4.0 的「不强制改 bin」会和新根命令打架。
- 影响面：符合「协议形状不变则不改 PROTOCOL」。doctor 不跟着改。

**选项 B：** 修订 0030，把 init 加进标准命令表。不新开 ADR。CONTEXT 与 skill 仍按 A 的范围改。

- 代价：0030 的 Status/Decision 从「CRUD 旗标、先落地 notes 与 skills」膨胀成 init 架构。0027 更不合适（它是拒绝重复实现）。以后查「叶子 CRUD」会读到 init。
- 影响面：ADR 历史变脏。

**选项 C：** 新 ADR + 改 PROTOCOL，把「根命令 edges init」写进协议。

- 代价：PROTOCOL 声明改它意味着所有 skill 跟着改。发现形状（AGENTS 三块、两跳）并没有变，只是命令名变了。违反 skill 自己的「改实现不用碰协议」。
- 影响面：过大。

**推荐：A。** 新 ADR 0031。CONTEXT 只改 init 命令那一句，术语定义（系统入口、超节点、材料表路径）保持。skill 同步停在 SKILL + runtime + LAYOUT 的命令/模块段落，版本号跟着 skill 的现有习惯升。不改 PROTOCOL、不改模板、不改 doctor、不改根 README。

依赖：Q4、Q5、Q7、Q8 的拍板要写进 ADR 和 SKILL，避免再出现 LAYOUT 与 SKILL 各说各的模块名单。

---

## 建议的拍板顺序

1. Q1、Q2、Q3 一起定（服务放哪、材料模型、写哪份 README）。
2. Q5、Q6、Q10、Q11 一起定（放置、幂等、写盘门、谁建 AGENTS）。这些不依赖默认类型集。
3. Q4、Q7、Q8、Q9 一起定（命令面与兼容包）。
4. Q12 按前面的结论写 ADR 和 skill，不再单独立项。

## 现状速览

**数据流（今天）：** `edges memory init` → `initMemory`。无已采用类型且未给 `--memory-types` / `--skill-types` 时只返回推荐 JSON。一旦要写，就用 `memoryNodes()` 得到的 `NodeService` 创建类型 README 和 `AGENTS.md`（模板来自 `AGENTS.tmpl.md`，只补受管区块），再按硬编码列表创建 `.harness/projects/README.md` 与 `.harness/notes/README.md`，由 NodeService 登记进 AGENTS。`harness-materials.json` 提供 path，同时被超节点挂载、tasks、skills 读取；init 只借用其中 projects/notes 两个 id。tasks 看板不在这条链上，由 tasks 服务以后懒创建，并且 NodeService 故意不自动登记它。

**涉及的文件：**

- 任务正文：PR #189 分支上的 `.harness/tasks/edges-cli-platform/backlog/2026-10-08--补充统一的-edges-init模块-init-只调-init-service/INDEX.md`（当前工作树里没有这份重写正文）
- 初始化实现：`extensions/cli/src/services/memory/init.ts`、`agents.ts`、`blocks.ts`、`templates.ts`、`types.ts`、`entries.ts`、`service.ts`（仅 `memoryNodes`）、`index.ts`
- 材料表：`extensions/cli/src/domain/config/harness-materials.json`、`harness-materials.ts`
- 命令：`extensions/cli/src/commands/memory/init.ts`、`commands/memory.ts`、`commands/memory/utils/command.ts`、`program.ts`；对照用的 `commands/artifacts/init.ts`、`commands/notes.ts`、`commands/projects.ts`、`commands/skills.ts`、`commands/tasks.ts`
- 写盘与登记：`extensions/cli/src/services/node/node-service.ts`（`create` / `#registration`）、`node-files.ts`（`saveEntries`）、`node-layout.ts`（`physicalParent`）、`super-root.ts`、`services/node/dated-leaf.ts`、`services/skills/service.ts`、`services/tasks/project-meta.ts`、`services/tasks/paths.ts`
- 测试断言：`extensions/cli/test/memory/content-boards.test.ts`、`cli.test.ts`、`core.test.ts`、`uniform-nodes.test.ts`，以及多处只把 `initMemory` 当夹具的测试
- 术语与决策：`CONTEXT.md`（系统入口那段）、`docs/adr/0027-facade-crud-verbs.md`、`docs/adr/0030-content-leaf-crud-via-nodeservice.md`、`docs/adr/0029-recursive-system-two-entries.md`（init 仍是用户对目录的显式动作）
- Skill：`.claude/skills/project-memory-init/SKILL.md`、`references/runtime.md`、`references/LAYOUT.md`、`references/PROTOCOL.md`（本卡不应改）
- 仓库里已经被 init 碰过的产物示例：根 `AGENTS.md`（链到 `.harness/notes/README.md` 与 `.harness/projects/README.md`）、`.harness/notes/README.md`、`.harness/projects/README.md`；内容面 `notes/README.md` 与根 `README.md` 的 entries 不是这条 init 链写的

## 本轮参考过的项目记忆

- `.harness/memory/feedbacks/README.md`
- `.harness/memory/feedbacks/feedback_harness_markers_not_task_project_indexes/INDEX.md`
- `.harness/memory/projects/README.md`
- `.harness/memory/projects/project_grill_system_entry_q9b_q10_q11/INDEX.md`
- `.claude/skills/project-memory-init/.harness/memory/projects/project_development/INDEX.md`（索引与修改顺序）
- `.claude/skills/project-memory-init/.harness/memory/projects/project_important_block/INDEX.md`（索引说明：硬约束缺了才补）
- `.claude/skills/project-memory-init/.harness/memory/projects/project_type_set/INDEX.md`（索引说明：官方种子不是闭集、不要把示例写进默认种子）
