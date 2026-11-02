---
name: project_recursive_projects
description: >-
  递归 Project 已实现并验证：直属材料、全局 --project、按最早 Task 日期迁移七组；163 Task、160
  日志及共享图片保真。说明归属、删除与迁移恢复边界。
metadata:
  edges-title: 递归 Project：直属材料分组与统一选择
  edges-type: project
  edges-agent-client: codex
  edges-username: VirusPC
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-11-02T12:34:45+08:00'
---

# 递归 Project 与统一归属：已实现约定

Project 是按主题聚合材料的递归组成容器，用来统一各模块的分组；全局 `--project` 从 `--scope` 下选择目标 Project；Tasks 退出独立的 Task Project 分组。它不要求成为独立维护系统。顶层 CLI 命令不都对应目录材料，Artifacts 不参与此次目录重构。本次实现已按此约定验证；版本发布另行进行。

**Why:** 当前通用 Project 与 Task Project 是两套归属概念。用户希望各模块行为一致、尽可能受控，并通过复用减少代码；让 Project 递归拥有各模块，比为每种模块增加分组模型更容易扩展。

**How to apply:** 2026-11-02 用户明确回复“实现吧”，批准本总审方案及先预览、检查冲突再迁移的执行顺序。使用这一归属约定继续维护。迁移不包含真实 Project 删除；跨模块定位继续复用 HarnessMaterial 与 NodeService，避免恢复第二套分组模型。

## 1. 用户已确定的目标

- Project 可以嵌套多层 Project；同一 Project 可以组织 notes、tasks、skills、memory、routines 等目录材料模块，也包括 projects 自己。
- 在 CLI 顶层增加 `--project <relative-path>`，与 `--scope` 同级，所有已有目录操作共用，包括创建、读取、列表、更新与删除。参数只选择范围，不表示移动归属。
- 参数以 `<scope>/.edges/projects` 为根解析相对路径，用于选择在哪个 Project 下操作。
- Tasks 不再拥有独立 Project 分组。去掉 `_default` 层，布局为 `tasks/<状态>/<任务>/INDEX.md`。没有指定 Project 的任务留在当前 scope。
- Project 可不指定：默认材料根为 `<scope>/.edges`。指定 P 时使用直属组成 `P/notes`、`P/tasks`、`P/projects`，不改成 P/.edges/<module>。
- 直接复用已有 HarnessMaterial 配置与公共路径函数；不新增一套模块注册表、Project 配置体系或逐模块分支。
- 设计目标是统一、受控、复用；不为各模块复制一套 Project 定位函数。
- 用户随后指出 Artifacts 本身不是目录；经代码核对，其 create/publish 上传给远端服务，来源字段也不用于定位任务。因此 Artifacts 整体退出本次重构范围：不新增 `.edges/artifacts`，不改服务、CLI 协议和存量元数据。将来需要可解析的任务来源链接时，再单独设计。
- 七个旧 Task Project 按原分组提升为同名主题 Project；每个新 Project 的目录日期取该组最早 Task 的日期。_default 的 18 条任务留在上层，只去层。执行前生成预览并检查冲突。
- 含下级材料或用户资源的非空 Project，普通 delete 拒绝，必须显式 --recursive。这里确认命令行为，不是实际数据删除指令。

## 2. 已确认：直属组成布局

用户明确选择 `P/<module>`。Project 主要解决 tasks、notes 等材料的分组；不是为每个主题默认建立一套独立 harness。

统一定位：先选材料根，再拼现有 material 配置中的相对路径。未指定 Project 时材料根为 scope/.edges；指定 Project 时材料根为该 Project 目录。材料种类和入口路径继续使用现有配置。

目标布局（只有启用的模块才出现）：

```text
scope/
  .edges/
    tasks/backlog/<未归入项目的任务>/INDEX.md
    projects/
      README.md
      P/
        INDEX.md
        notes/...
        tasks/backlog/<任务>/INDEX.md
        memory/...
        skills/...
        routines/...
        projects/
          README.md
          Q/
            INDEX.md
            notes/...
            tasks/...
```

选择子项目 Q 的参数是 `--project 'P/projects/Q'`，相对 `<scope>/.edges/projects` 按真实路径解析；不把 P/Q 偷换成别名，也不新增全局项目名注册表。

全局选择接口如下：

```sh
edges --scope /repo --project P notes create ...
edges --scope /repo --project P tasks create ...
edges --scope /repo --project P projects create ...
edges --scope /repo --project 'P/projects/Q' memory remember ...
```

创建子项目时，`--project P` 选的是父容器；新项目本身继续由 `projects create` 的参数指定。未传 `--project` 时保留原 scope 行为。

## 3. 公共选择器与受控边界（已落实）

1. 在命令根统一解析 `--scope` 与 `--project`，先算候选目录，在现有锁保护下验证，再统一选择材料根与查询入口。保留基础 scope 的约束；不能只把 scope 改为 P 后继续追加 .edges，也不靠暗开 --super 实现 Project 分组。模块路径复用现有 material 配置和公共辅助函数。
2. 不接受绝对 Project 路径、空值、父级逃逸、指向非 Project 的目录或穿越到根外的软链接；目标必须是已经存在且可验证的 Project。不存在时明确报错，不隐式创建。
3. Project 选择基准固定为 scope/.edges/projects；选中后的材料根固定为 Project 目录。未指定 Project 的显式 --super 沿用旧规则。建议明确优先级：选中 Project 后，以其材料根和组成入口为准，同时传 --super 不再改变这两个选择，也不把 Project 转成虚拟系统；避免新增组合布局或另造目录解析分支。
4. 当前基线只有 `compose add --path`，不是所有 create 已有此参数；它与未来通用目标路径均应受所选 Project 和模块边界约束。现有 `--target-dir` / `--repo-dir` 与全局选择冲突时拒绝，不能悄悄覆盖。上传源文件等输入参数保留既有 cwd 基准，不与目标目录混用。
5. 全局选择不等于移动：`tasks update` 不再以 `--project` 表示重新分组。跨 Project 归属移动复用受控目录移动能力，单独明确来源和目标。
6. 保留已有查询语义：默认递归查询所选入口已登记的 local + descendants 组成树，包含登记可达的子 Project。Project 直接作为组成容器进入，不必先转成 AGENTS 系统。`includeHarness:false` 仍禁止自动进入内容自身的维护关系。`--all` 保留原组成树并额外发现所选物理范围内的独立系统，不回到原根扩大范围，也不能遗漏没有 AGENTS 的 Project 容器。它不是“开启递归”。
7. 最小入口建议保留现有 Project/INDEX.md 和正文，复用 README 的显式 entries 能力登记各模块，避免迁移项目入口及外链。创建不默认生成 AGENTS/.edges，不安装整包 skills 或铺满模块；如果以后要专门维护 P，仍可显式 init，自己的 .edges 与直属组成分开。
8. Memory/Skills 沿用现有类型与目录合同。把原 scope 的有效性/约束与材料位置解耦，类型索引在所选材料根定位并登记到组成入口；不能为复用路径而伪造 Project AGENTS、忽略 TypeSpec 或增加第二套类型体系。

## 4. 模块覆盖与服务边界

| 模块 | 本次应交付的归属行为 | 必须注意的边界 |
| --- | --- | --- |
| projects | 可在选定 Project 中创建子 Project，并按明确的递归查询范围发现 | 不固定深度；Project 路径验证必须依据真实类型，不能只看祖先路径含 projects |
| notes | 本地 CRUD 使用选定材料根中的 notes | 保留入口文件名与目录资源单元 |
| tasks | 使用选定材料根中的单块板；直接按状态组织 | 删除 Task Project CLI、元数据、索引模型及 `_default` 层 |
| skills | 使用选定材料根中的技能类型目录 | 创建/登记与安装技能是不同动作；不能每建 Project 自动安装技能 |
| memory | 使用选定材料根中的类型与规则 | 沿用 TypeSpec 与索引合同；不能把材料归属与必须创建 AGENTS 绑定 |
| routines | 定义归属所选材料根，引用按其明确基准校验 | 触发和执行仍交外部平台 |
| artifacts | 完全不参与本次目录重构；继续上传显式文件或目录 | 服务、CLI 协议和存量元数据不改；来源字段目前只是可选元数据 |
| evaluation | 现有 `evaluation server` 不因 Project 嵌套而改造 | 目前是服务入口，不据此推导必须新增 Project 本地评测 CRUD；已有文件仍按明确路径使用 |

本次统一的是有目录归属的材料模块，不是把所有顶层命令改造成目录。Artifacts 的存储、上传、发布、TTL、权限与源文件路径规则保持原合同；evaluation 同样保留现有服务职责。不因本次 Project 重构新增这两种本地内容合同，也不把共享发布、runner 或观测服务按 Project 重复部署。全局参数对不涉及目录归属的服务命令不应声称会改变其资源归属；任务来源的可解析身份不在本次范围内。

## 5. 删除旧 Task Project，而非隐藏旧分组

- 移除 `tasks project ...`、Tasks 局部的 `--project`、`TaskProjectId/Record`、`edges-task-project` 及专用 Project metadata/bootstrap 逻辑；顶层 `--project` 统一代表真实 Project 选择。
- 板索引直接登记任务，状态变化只在所属板内移动。Task 的状态、优先级、stem、正文、附件与 Run Log 保持原语义。
- 看板与列表按真实 owner scope/Project 路径组织。同名 stem 必须结合 owner 定位；不能继续使用旧 scope/purpose/project/stem 身份而只改文案。
- 分类 skill 与审阅页同步改为选择真实 Project。既有前端禁止跨 source 拖动，需要真正受控的跨 scope 应用能力，不能保留无法应用的导出按钮。
- Artifact 来源是可选元数据，当前 `{type: task, id, project}` 只经过校验、存储与回显，不用于查询任务、访问目录或生成回跳。此次不改来源协议；历史元数据保留旧语义，不把旧 slug 重解释成新 Project 路径。重写任务工作流时，不再照搬旧 Task Project 来源示例，按现成的无来源模式发布即可。
- 旧布局在普通 CRUD 中明确提示迁移，不做静默双写。旧迁移脚本曾把 `tasks/<状态>` 搬进 `_default`，必须停用或按版本隔离，不能反向破坏新结构。

## 6. 数据迁移（必须先预览）

以框架仓基线 `1211393` 为例，当前根板有 163 条任务、160 份 Run Log。7 个命名组共 145 条任务；`_default` 有 18 条。这是迁移前基线；执行结果见文末验收记录。

1. 生成清单：`旧 board + 分组 → 目标 Project`。本次按已确认的七组一一提升为新 Project；已有目标视为冲突，不按名称自动合并。预览列出任务、空组、目标路径和引用变化。
2. `_default` 的任务留在上层 scope，只去掉那一层。命名组迁入对应真实 Project，原标题、description、其它正文及独立维护材料保留。新 Project 日期取组内最早 Task stem 的 YYYY-MM-DD 日期，不取迁移当天、文件修改时间或 updated-at；本仓全部 163 条任务都有有效前缀。遇空组或日期缺失时预览列为待指定项，不能丢组或猜日期。
3. 搬运并映射组内全部材料，保留任务 stem、状态、优先级、附件和历史 Run Log；已有 3 条无日志的任务不补造日志。尤其保留 agent-clients-ux/done/img/ 下四张共享图片，随组进入新 Project 的 tasks/done/img，保持任务正文的 ../img 相对引用有效。
4. 使用 NodeService 的目录资源移动和受管引用更新，范围限定在共同祖先内；目标冲突则停止，不覆盖或悄悄改名。
5. 普通 Markdown、外部 URI 等未纳入受管图的引用单独报告或按映射处理；不能承诺所有外链自动修复。已发布 Artifact 的 UUID URL 不受任务目录移动影响，其存量元数据无需迁移。
6. 迁移可预览、可重复运行、失败可恢复；真实内容的 apply 在方案确认、检查无冲突后进行，不在研究阶段直接搬迁。

## 7. 复用与必要修补

- 共用 CLI 根 preAction、现有 `resolveScope`、HarnessMaterial 配置、材料根函数与工作树锁；不在各模块加入 Project 路径拼接，不把配置扩成新的用户注册系统。
- 复用 NodeService、README entries、系统森林与目录移动/删除，不新造 ProjectTree、第二套递归 walker 或新的虚拟节点。
- 当前 layout 的 notes/projects 正则会让外层模块污染内层类型；按最近真实模块边界识别并校验，防止 projects CRUD 接受内部 Note 或未知评测条目。
- 复用 entries codec 时，仅识别显式受管区块；已有 Project 正文中的普通标题和普通链接不能变成组成，更不能在往返解析时丢失。常规正文更新保留组成登记。
- 保留任务改归属能力：建议继续用 tasks update，以 --to-project 指定目标、--to-default 返回上层未归属板；全局 --project 只选来源范围。目的地仍由同一材料定位函数和 NodeService.move 控制，不新增一套通用 move CLI，不恢复 _default 目录。
- 已确认：默认拒绝删除非空 Project；显式 --recursive 才允许连子 Project、任务、资源和维护材料一起删除，并展示影响范围。只有自身正文和生成索引的空容器可直接删除，未登记资源也计入非空判断。
- `--exclude` 在嵌套查询中按真实模块边界生效；不能因相对根第一段是 projects，就漏排后代 tasks。
- CLI 帮助、手动 argv 扫描、schema、审阅 payload、skills 与现行术语同步改；不为此修改 Artifact 协议。历史决策保留历史身份，并标明由新合同取代。

## 8. 实施顺序与验收

1. 本总审稿确认后，按已记录的设计和 ADR 实施。Artifacts/evaluation 的服务职责不作为目录重构的前置设计事项。
2. 做共享选择器与 Project 入口/初始化，落实两至三层嵌套和类型边界测试。
3. 同步移除 Task Project 模型，调整任务路径、schema、看板与分类；避免中间态让旧 `--project` 与全局参数冲突。调用方不再照搬旧 Task Project 来源示例，Artifacts 协议保持原样。
4. 提供迁移预览与显式 apply；先用夹具验证冲突、重跑、失败恢复，再迁移仓库真实任务。
5. 跑 CLI 相关测试、schema 合同与审阅前端测试。回归默认 scope、Project、子 Project、super、all、exclude、软链接与同名任务，并确认全局参数处理不影响原有服务命令。

验收必须覆盖：目录材料模块共享同一选择结果；未指定 Project 的内容保持上层归属；嵌套无深度特判；任务无 `_default` 和第二套 Project 元数据；迁移前后任务/日志数量一致且身份不串；非空删除受控；Artifacts 无来源发布和既有 evaluation 服务行为不因目录重构而改变。

## 9. 代码核对依据

调研基线：框架 `1211393`。只读研究工作树另有 README 研究提交 `eb21c91`，本方案所查代码与该基线相同。

- `packages/cli/src/program.ts`、`services/scope.ts`：全局参数、执行上下文与锁。
- `packages/cli/src/domain/config/edges-materials.ts`、`layout.ts`：统一材料根与节点类型识别。
- `packages/cli/src/domain/models/projects/project-node.ts`、`services/node/node-layout.ts`：Project 与物理父关系。
- `packages/cli/src/services/tasks/{paths,write,board,project-meta,grouped}.ts`：旧 Task Project 的路径与归属。
- `packages/apps/tasks-review-app/src/export.ts`：现有跨 source 移动限制。
- `packages/cli/src/commands/artifacts/utils/from.ts`、`packages/services/artifacts-preview/src/from.ts`：旧来源合同。

来源：2026-11-02 用户关于递归 Project、全局 `--project` 与去掉 `_default` 的明确指示，以及随后指出 Artifacts 并非目录模块的纠正；实施建议已在总审中确认。

## 10. Grill 决策树：第 1 轮已回答

已确定的根：Project 递归组织目录材料；顶层 `--project` 相对 scope/.edges/projects 选择目标；Tasks 去掉 Task Project 和 `_default`；Artifacts 排除。

用户明确回答：

- **Q1：直属布局。** Project 是为了解决分组问题，按某个主题聚合材料；采用 P/notes、P/tasks、P/projects。未指定 Project 仍放 scope/.edges。
- **Q2：按推荐。** 所有已有目录操作共用 --project，包括创建、读取、列表、更新和删除。`--project P projects delete Q` 的目标是 P 内的 Q，参数不代表跨项目移动。
- **实现约束：** 用户要求直接复用已有 harness material 配置，保持简单、不增加额外体系。此前推荐的 P/.edges 布局作废。

下一层议题：

- 最小入口采用现有 INDEX 与共享 entries 的实施建议，不额外增加独立 scope 初始化。嵌套物理路径由已定布局直接得到 P/projects/Q。
- 入口登记复用既有组成查询；跨 Project 移动仍需明确来源与目标。默认递归已登记组成树，all 补充物理范围内独立系统；不把它改成仅查当前 Project 直接归属的内容。
- 布局与移动合同 → 真实迁移映射、目标冲突、旧看板和分类工作流的接续。
- 项目内容边界 → 非空删除、资源跟随、迁移失败恢复。

迁移策略与非空删除行为随后已在第 2 轮确认；剩余实现建议在总审中统一确认，不重复提问已决定的事项。

## 11. Grill 第 2 轮已回答：迁移与删除边界

### Q3：旧分组提升为同名主题 Project

已确认七个命名组一一提升，保留原有分类，不重新分配单条任务。现有 Code Review 与 Edges README 优化两个 Project 的范围都不能完整容纳任何一组，不整组并入它们。

以下目标相对 scope/.edges/projects；按用户补充要求，目录日期取该组最早 Task 的日期，已通过全部 Task stem 的有效日期前缀核对。七个目标目录在基线工作树中均不存在，与现有 Project 无冲突；执行前仍重算预览。Task 与 Run 本身的日期不变。

| 旧任务组 | Task 数 | 新 Project 目录 |
| --- | ---: | --- |
| agent-clients-ux | 31 | 2026-09-09--agent-clients-ux |
| edges-extensions | 43 | 2026-09-09--edges-extensions |
| edges-tasks | 22 | 2026-09-11--edges-tasks |
| evaluation | 19 | 2026-09-11--evaluation |
| observation | 4 | 2026-09-13--observation |
| project-memory | 25 | 2026-09-08--project-memory |
| edges-routines | 1 | 2026-10-11--edges-routines |

迁移形状：

```text
.edges/tasks/<group>/<status>/<stem>/
→ .edges/projects/<组内最早Task日期>--<group>/tasks/<status>/<stem>/

.edges/tasks/_default/<status>/<stem>/
→ .edges/tasks/<status>/<stem>/
```

原 _default 共 18 条任务，只去层、不提升为 Default Project。7 组共 145 条任务，各组标题和描述完整保留；已有 2 个 Project 不改变归属。Code Review 正文里指向旧 edges-extensions 任务的链接列入引用修复，不据此改变任务归属。

用户已确认按原分组提升，并指定上述日期规则；执行仍先走预览和冲突检查。最早 Task 的具体证据保存在本任务的迁移预览材料中。共享图片也属于迁移清单；历史迁移文档里的 source 记录不当作有效内容链接批量改写。

### Q4：非空 Project 的删除

已确认普通 delete 只删除没有下级材料或用户资源的 Project；只有自身正文和生成索引的空容器可删除。含任务、子 Project 或附件时拒绝，要求显式 --recursive 才能删除整棵目录，并列明范围。目标仍必须位于所选范围内。

这里确定命令行为，不执行任何真实删除。

## 12. 实施总审：剩余建议与验收顺序

既有能力应延续，不再增加独立的模块或配置体系。总审包含以下剩余实现建议：

1. **保留任务跨 Project 调整归属。** 全局 --project 选择源容器；tasks update 以 --to-project <相对路径> 选择目标，或 --to-default 返回当前 scope 的未归属板。两者互斥，未提供则只改原位字段；这不恢复 _default 目录。继续用公共 Project 选择器和 NodeService.move，状态、stem、资源与日志跟随，分类审阅用同一入口落地。
2. **明确参数优先级。** Project 一旦选中，就使用它的材料根和组成入口；--super 不改这个选择。未选 Project 时保留 --super 的既有行为。--all 仍只用于读取，不扩大到选择范围之外；--target-dir/--repo-dir 与已选 Project 冲突时明确报错。现有通用 --path 扩展另有任务，不借本次扩大为全模块任意目录写入。
3. **所有操作沿真实归属校验。** 同名任务 stem 不擅自选第一个；有歧义就要求项目选择或明确路径。读、写、移动和删除都使用同一模块与入口验证，不因祖先目录包含 projects 就把内部 Note 当 Project。

实施顺序：公共定位/节点组成 → 各目录模块接入 → Tasks 模型与审阅页/skills 同步 → 迁移脚本及预览 → 在无冲突时迁移框架仓任务 → 文档与回归验证 → 交付可审阅变更。真实 Project 删除不属于本次执行内容。

本次实施的验收必须包含：根/P/子Project 的同名类型不串写；Project create 不隐式初始化独立 harness；旧正文与共享图片不丢；迁移后仍有 163 条 Task 和 160 份既有 Run Log；重复运行无新增变更；目标冲突与中途失败可恢复；完整执行 CLI、schema 和任务审阅前端的相关检查。

2026-11-02 用户回复“实现吧”，总审通过，开始按本稿实施。此前已确认的决定不再重复请示；出现目标冲突或超出既定映射的内容时保留现场并报告。

## 13. 实施验收与后续维护

按确认的七组及最早 Task 日期完成迁移；根层保留 18 条任务。实际目录与 CLI 均核对为 163 条 Task，160 份原有 Run Log 和 4 张共享图片的 SHA-256 均不变，同一迁移计划复跑无新增变更。默认组旧说明留在根任务板的明确历史段中；现行任务入口的说明已按新归属修订。

原索引有 2 条失效引用、4 条任务漏登记。迁移保留失效引用原文并补登记真实存在的任务，不凭相似标题猜测链接目标。后续整理旧索引时，要把已有问题与迁移产生的问题区分开。

迁移、恢复与冲突处理使用 `pnpm migrate:recursive-projects`，先保存计划再 apply；不要重跑已退役的 Task Project 索引迁移。具体步骤见 `scripts/migrations/recursive-projects.md`，设计理由见 ADR 0052。
