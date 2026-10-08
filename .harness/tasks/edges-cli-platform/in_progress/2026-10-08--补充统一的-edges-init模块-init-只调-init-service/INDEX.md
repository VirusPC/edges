---
metadata:
  edges-type: task
  edges-task-project: edges-cli-platform
  edges-updated-at: '2026-10-08T03:52:06.951Z'
  edges-title: 统一 edges init：init 成为标准命令（含根命令），域 init 委托同一 init service
  edges-tasks-status: in_progress
  edges-task-priority: none
name: edges-unified-init
description: >-
  把模块初始化从 edges memory init 上移到统一的 init 标准命令。根命令 edges init 是统一入口，各 edges
  <domain> init 只委托同一 init service；NodeService 底层、service 薄封装、commands 直调
  service。
---

**背景：**
2026-10-08 凌晨，用户在审 notes/skills CRUD 收口到 NodeService 的叠层 PR（#185 notes/skills → #186 projects CLI + 根 harness/init → #187 commands node 下沉 service）。先问的是「为什么 commands 层有 `node.ts`」，于是把 `commands/{notes,projects,skills}/node.ts` 下沉到 service，开了 #187。接着用户追问：「我只看到 CLI 改了，根目录的 `.harness` 以及 init 命令有改吗？」核对后，#186 确实改了：根 `.harness` 新增 `projects/README.md`、`notes/README.md` 并登记进根 `AGENTS.md`；`extensions/cli/src/services/memory/init.ts` 与 `extensions/cli/src/domain/config/harness-materials.json` 把 projects、notes 加进了 `edges memory init` 的推荐模块；`project-memory-init` skill 升到 3.4.0。

问题也就在这里：notes、projects 的初始化是挂在 `memory init` 下面「顺手」生成的。它们不是 memory 的子概念，只是和 memory 共用 `.harness` 材料清单。结果是语义拧着：要改 harness 布局，得先去摸 memory 的 init。用户据此判断 init 本身也要改：补一个 `edges init`，`edges memory init` 或其他 `edges xxx init` 只是调用 `edges init` 背后的 service 来初始化某个具体模块。讨论中曾考虑叫 `edges harness init`，用户定的是 `edges init`。

随后用户补了两条约束：

1. 分层与 node CRUD 一样：NodeService 提供底层能力，service 层只做薄封装，commands 层直接调用 service，不在 commands 里堆编排。
2. 这样一来，init 也成了一个标准命令（和 list / get / create / update / delete 同级的命令约定），并且拥有根命令 `edges init`。各 `edges <domain> init` 是同一命令族的域入口，不是 memory 的私有特例。

- 现状（可核对）：模块初始化入口只有 `edges memory init`；材料清单在 `harness-materials.json`，由 memory 的 init service 消费；#186 往这条路径里加了 projects、notes。
- 已有同类做法：#187 把 notes/projects 收进 `services/node/dated-leaf.ts`、skills 收进 `services/skills/service.ts`，commands 只做参数解析与结果映射（错误码映射在 `commands/node-result.ts`）。本卡的 init 应沿用同一分层。
- 已有标准命令约定：CRUD 是 list（统一 filter/group + scope）、get / delete（`<target>`）、create / update（metadata + `--body`）。init 将作为新的标准命令加入这套约定。
- 预期收益：harness 布局与模块初始化有单一归属；新增内容区时只需登记材料，不必改 memory；CLI 语义与目录结构一致。
- 非目标：不改 notes / skills / projects 的 CRUD 行为；不重写 NodeService 核心合同；不在本卡补 edges / archive 等新内容区的 CLI。
- 关联：#185、#186、#187；兄弟卡 `2026-10-08--projects-CLI-对齐-notes并根-harness-init-含-projects-与-notes`、`2026-10-07--notesskills-的-creategetupdatedelete-收口到-NodeService`、`2026-10-07--CLI-与根-harness-补齐-notes-edges-projects-archive`；ADR 0027（notes/skills CLI 经 NodeService）。

**目标：**
init 成为 Edges CLI 的标准命令：根命令 `edges init` 是统一初始化入口，`edges memory init` 等各域 init 只是同族入口，委托同一个 init service 初始化指定模块。分层为 NodeService（底层）→ 薄 init service → commands（直调 service）。

**动作：**
- 抽出与 memory 解耦的 init service，接管材料清单（今天的 `harness-materials.json`）与「按模块初始化」逻辑；写盘经 NodeService
- 新增根命令 `edges init`
- `edges memory init` 改为薄入口，只把「初始化 memory 模块」交给 init service；后续 `edges <domain> init` 照此
- 在 ADR / CONTEXT 记下：init 为标准命令、拥有根命令、域 init 委托同一 service；必要时同步 `project-memory-init` skill 与 README

**决策记录：**
用户睡前授权，只读 grill 清单共 12 题，由 Grok Bot 于 2026-10-08 03:07（UTC+8）逐题拍板。全文见 [plan](../../../../docs/superpowers/plans/2026-10-08-edges-unified-init.md)。

- Q1 主文件放哪：新建 `services/init/service.ts`，memory 留薄包装。见 plan Q1。
- Q2 材料清单模型：挂载表不动，init 模块表用 material id。见 plan Q2。
- Q3 notes/projects 写哪：只建 `.harness` 桩。见 plan Q3。
- Q4 无参写什么：AGENTS、notes/projects 桩、feedback/project/reference；memory 无参仍不写盘。见 plan Q4。
- Q5 `--super`：init 不读。见 plan Q5。
- Q6 再跑：缺了才建，类型索引仍刷新。见 plan Q6。
- Q7 memory 兼容包：原结论是选定类型后仍建 notes/projects 桩。用户审 #190 后推翻，原话「不顺手创建，明确划分模块，简化模型」。现为 memory init 只初始化 memory。见 plan Q7 修订。
- Q8 域入口：原结论是只有 memory、notes、projects。用户审 #190 后推翻，原话「各管各的，简化心智」。现为 memory、skills、tasks、notes、projects 各自 init，只建本模块。见 plan Q8 修订。
- Q9 tasks：仍不进无参 `edges init` 的默认集，帮助里和「本次会创建」分开。Q8 修订后另有 `edges tasks init`，只建任务看板。见 plan Q9。
- Q10 写盘：节点经 NodeService，`.gitignore` 仍走 `saveEntries`。见 plan Q10。
- Q11 AGENTS：init service 的公共步骤。见 plan Q11。
- Q12 文档：新 ADR 0031；CONTEXT 只改 init 那一句；skill 只改命令与模块段。见 plan Q12。

**完成标准：**
- [x] `edges init --help` 可用；在空 scope 执行 `edges init` 能生成根 `AGENTS.md` 与 `.harness` 下已登记模块（至少 memory、notes、projects）的组织清单
- [x] `edges init` 可只初始化指定模块（参数形状在 grill 时定），结果与 `edges <domain> init` 一致
- [x] `edges memory init` 只调用 init service，并且只初始化 memory（Q7 修订后不再与「顺手建桩」的旧输出比较）
- [x] commands 下没有 init 业务逻辑：`extensions/cli/src/commands` 中不出现材料清单读取或直接文件写入；材料清单不再归 `services/memory` 独有
- [x] ADR 或 CONTEXT 写明 init 标准命令约定
- [ ] 相关测试通过；经 PR 合入 main

注：完成标准里「memory 的组织清单」指 feedback / project / reference 三个类型 README（`.harness/memory/feedbacks/README.md`、`.harness/memory/projects/README.md`、`.harness/memory/references/README.md`），不是单独的 memory 总入口。

注：第 4 条按「commands 不读 harness-materials」勾上。审阅页 HTML 与 artifacts token 配置的直接写入与材料清单无关，留在 plan 待确认，本次不搬。合入 main 那条仍不勾。
