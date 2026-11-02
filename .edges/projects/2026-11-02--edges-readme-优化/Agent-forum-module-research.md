# Edges 模块设计研究：面向 Agent 技术论坛的汇报底稿

研究日期：2026-11-02。源码基线：[main@1211393](https://github.com/VirusPC/edges/commit/1211393af18984975bef6e2edefa0a7a28acb957)。对象是该提交下的框架实现；不以 npm 最新发布版本或某个宿主的实际接入状态代替源码现状。

本文承接[设计思想盘点](README-design-findings.md)与[深层设计研究](README-design-deep-research.md)，把共同原则下沉到十个模块的具体机制，供对外技术分享选材。没有改根 README，也没有把研究中发现的问题直接扩展为框架开发。

## 1. 汇报值得回答什么

建议题目：**从维护对象出发：Edges 如何组织 Agent 的上下文、工作与改进证据**。

开场问题可以很具体：同一个项目换了一次会话，Agent 应该继承什么？换成改进项目使用的 Skill，又应该读什么？当 Agent 说“完成了”，人该检查任务、执行记录、公开产物，还是评测结果？

Edges 值得讲的部分，是把这些问题落实为目录归属、索引、节点生命周期、独立状态和可检查的交接。文件与 Git 本身并不新；重点是采用它们之后必须承担的约束，以及哪些保证由代码实现、哪些仍由 Agent 和使用方执行。

本文将依据分成四类：

- **实现机制**：源码中存在的判断、数据结构与操作。
- **工作协议**：Skill 或接入文档要求 Agent／平台遵守，不能直接当成运行时强制保证。
- **验证证据**：已有测试断言与本轮实际执行的检查分别说明；测试存在不等于本轮通过。
- **待验证判断**：节省 token、减少错误、改善协作等价值假设，需要对照实验，不能由设计存在直接推出。

### 模块选题地图

| 模块 | 值得讲的问题 | 最有分量的机制或取舍 | 汇报位置 |
| --- | --- | --- | --- |
| Notes | 总结后怎样还能纠正过去的理解？ | 原材料、取舍、行动指南分别保留；记录先于结论 | 贯穿例子 |
| Projects | 一项持续工作怎样形成可接续的材料单元？ | 目录叶子、正文与资源共同生命周期；复用 Notes 的存储路径 | 贯穿例子 |
| Memory | 哪些筛选可以提前做，哪些只能结合当前问题做？ | 写时维护带描述索引，读时按适用范围选择 | 主讲 |
| Skills | 方法被发现、被安装、被允许修改是一回事吗？ | 来源归属、索引失败保留、随 CLI 交付的接入技能 | 主讲 |
| Tasks | 一次执行成功能否代表目标完成？ | Task／Run 分离；分类建议、人审、写回分离 | 主讲 |
| Routines | 持续采用新方法与单次执行一致性如何兼得？ | 跨运行跟随 ref，单次读取固定 commit 的接入协议 | 短讲 |
| Compose | 共享后如何保留归属、版本与查询边界？ | submodule 版本选择、有限展开、逐仓结果 | 主讲 |
| Observation | 不同 Agent 会话能否直接放进一套分析？ | 归一化适配与信息损失、采集边界 | 与 Evaluation 合讲 |
| Evaluation | 如何证明 harness 帮助了实际工作？ | 实验边界、消融、质量与成本门槛、保留缺失证据 | 主讲 |
| Artifacts | 保存产物、公开产物、验收产物如何衔接？ | 草稿／发布／过期状态，TTL 从发布开始 | 演示或短讲 |

## 2. 公共底座：先讲清三种关系与三层写入保护

### 2.1 目录归属、组成发现、维护关系分别建模

一份 Skill 可以被多个项目引用，但不因此出现多个原文所有者。它可以参与项目工作，也可以拥有维护自己方法的材料。把这三种关系压进一棵普通目录树，容易让“能找到”变成“要加载”，或让“被复用”变成“应搬到公共根”。

现行节点模型以目录表达物理单元，`children` 表达登记的组成，`harness` 单独表达维护关系。遍历沿已登记关系运行；默认不沿每个节点的 harness 继续展开。`active` 检测当前路径上的环，`seen` 避免重复目标，多根共用遍历身份；类型筛选仍允许经过不匹配的组织节点。异步生成器按需加载，调用方提前停止时不必读完整个图。

**技术价值：** 先把当前问题允许展开的结构范围确定，再由 Agent 判断具体正文是否相关。它为上下文选择提供显式边界。**代价：** 登记需要维护，描述可能写错，漏登记的材料可能不可发现。默认不跨维护关系也不等于文件访问沙箱；系统根发现仍可能扫描目录。

证据：[遍历实现](../../../packages/cli/src/domain/operations/traverse.ts)第 57 行起；[遍历测试](../../../packages/cli/test/operations/traverse.test.ts)覆盖延迟读取、菱形引用、环与类型导航；[双入口测试](../../../packages/cli/test/operations/traverse-dual-entry.test.ts)区分内容入口、维护入口与显式视角；[目录节点决定](../../../.edges/memory/projects/project_node_resource_unit_decision/INDEX.md)记录三种关系的取舍。

### 2.2 普通文件易于接入，可靠修改却需要额外工程

Agent 操作 Markdown 时，正文、父索引、相对引用、附件与资源目录会一起变化。只有文件内容写成功，还不足以说明这次修改正确。Edges 将这些操作交给 NodeService，形成三层保护：

| 层次 | 当前机制 | 解决的具体问题 | 不能据此承诺 |
| --- | --- | --- | --- |
| CLI 写命令 | 按工作树获取协作锁；竞争立即失败；非 Git 写入共用临时锁 | 多个遵守同一入口的命令同时写 | 能锁住任意编辑器或跨机器写入 |
| NodeService 读取快照 | 保存正文、设备／inode、规范路径；移动删除还核对资源快照 | 读取后文件被换掉，即使字节相同也不应悄悄覆盖 | 用户数小时前审过的 JSON 仍对应当前文件 |
| 文件持久化与恢复 | 单文件原子替换；多文件失败后恢复，必要时保留恢复副本并报告路径 | 部分修改失败时能定位和恢复 | 整批命令或跨仓操作是数据库事务 |

资源快照包含文件身份、目录、软链接目标及普通文件内容哈希。查询可以避免给未选资源做完整快照；需要移动、删除时再显式读取升级。因此性能与破坏性操作前的核对也有分工。直接实例化 NodeService 不自动获得 CLI 命令锁。

这是适合论坛深入讲的工程点：**选择文件作为共享状态，就要明确协作锁、乐观核对、原子写与恢复各自的覆盖范围。** 代价是额外 I/O、哈希成本和恢复逻辑；大附件很多时不能假定代价可忽略。

证据：[命令加锁](../../../packages/cli/src/program.ts)第 272 行、[锁范围](../../../packages/cli/src/services/node/node-lock.ts)、[文件快照与恢复](../../../packages/cli/src/services/node/node-files.ts)、[资源快照](../../../packages/cli/src/services/node/node-resources.ts)、[查询与资源快照](../../../packages/cli/src/services/node/node-cache.ts)。[资源单元测试](../../../packages/cli/test/services/owned-units.test.ts)覆盖外部资源变化、部分失败恢复、恢复副本和引用迁移；[原子写测试](../../../packages/cli/test/services/node-files-atomic.test.ts)覆盖写入、fsync、rename 失败。

### 2.3 共用生命周期，不抹平业务含义

Notes 与 Projects 通过同一个 `dated-leaf` 实现创建、定位、查询、更新与删除；各领域服务只选择模型和模块规格。模块目录由同一材料定位规则得出，默认查询复用登记树，森林查询另有明确的范围语义。复用的收益是少维护一套路径判断，而非把笔记、项目、任务都降为无差别 Markdown。

公共节点机制已经存在，但完整模块插件化仍未完成；新模块还涉及材料表、识别规则与专属服务。各模块任意路径 CRUD 的一致性也仍有[高优任务](../../../.edges/tasks/edges-extensions/backlog/2026-11-02--统一各模块路径规则默认受控并保留显式兜底/INDEX.md)。不能把“抽了公共函数”讲成“所有入口已经有同一保证”。

证据：[dated-leaf](../../../packages/cli/src/services/node/dated-leaf.ts)、[Notes 服务](../../../packages/cli/src/services/notes/service.ts)、[Projects 服务](../../../packages/cli/src/services/projects/service.ts)、[范围回归](../../../packages/cli/test/commands/dated-leaf-scope.test.ts)、[CRUD 决策](../../../docs/adr/0030-content-leaf-crud-via-nodeservice.md)。

## 3. Notes：保留以后改变结论所需的材料

### 值得讲的思考

只保存会话结论很省篇幅，但下一次遇到不同条件时，读者无法知道当时有哪些备选方案、为什么没选。Edges 的对话整理 Skill 将过程记录与复盘提炼分开：过程保留真实取舍，所学与行动指南另补适用条件，并留下原始材料指针。

这里选择的是可回看、可纠正的记录，接受篇幅增加；不强迫输入刚被捕获时就有成熟结论。原材料、记忆判断、可执行方法分别有职责，Notes 不自动晋升成 Memory 或 Skill。

### 技术落点与边界

内容规则主要由 Skill 执行。CLI 负责本地叶子与索引写入，不判断正文是否完整保留了推理，也不承诺来源链接永久可用。Note 标题从 Markdown H1 读取／设置，避免再手工维护一份独立标题；正文和资源属于同一目录单元。创建命令不顺便 commit、push 或发布。

证据：[整理 Skill](../../../packages/skills/edges-conversation-to-notes/SKILL.md)第 33–82 行、[保留取舍 ADR](../../../packages/skills/edges-conversation-to-notes/docs/adr/0008-tradeoffs-supplement-not-compress.md)、[保留原材料 ADR](../../../packages/skills/edges-conversation-to-notes/docs/adr/0010-keep-source-material-refs.md)、[Note 模型](../../../packages/cli/src/domain/models/notes/note-node.ts)、[本地写入机制](../../../packages/cli/src/services/node/dated-leaf.ts)。

**适合展示：** 一段讨论中保留“曾考虑 A，因条件 X 选择 B”；条件变为 Y 后，Agent 能回看依据重新判断。这个例子展示材料组织，不等于已通过实验证明它一定提高推理质量。

## 4. Projects：持续工作的材料单元，复用通用内容机制

### 值得讲的思考

一项研究会积累范围、方案、证据、反馈和附件，寿命通常长于一次 Task 执行。Projects 给这些材料一个持续归属，Task 则表达具体目标及其推进状态。二者可以关联，但当前代码没有强制的一体化项目管理模型。

本次 README 项目就是公开例子：两份设计研究、文案选择和后续论坛材料都回到同一目录，接手者从入口找到当前进展与原始依据。既不把长篇研究塞进任务状态字段，也不要求复制出一套独立存储系统。

### 技术落点与边界

Projects 与 Notes 共用日期目录命名、模块定位和 NodeService 生命周期，项目领域模型只增加其自身类型与 H1 标题处理。更新标题不要求跟着改变既有目录 stem。NodeService 的目录单元能力适用于附件随节点移动／删除；不能据此声称 `projects create` 已支持附件导入，也不能声称拥有自动依赖图、预算、进度计算或任务关联同步。

证据：[项目服务](../../../packages/cli/src/services/projects/service.ts)、[Project 模型](../../../packages/cli/src/domain/models/projects/project-node.ts)、[项目 CRUD 测试](../../../packages/cli/test/commands/projects-crud-nodeservice.test.ts)、[本项目入口](INDEX.md)。

**适合展示：** 从本项目入口走到一份研究稿及其源码证据，再解释为什么它与 Task Project 分类元数据不是同一个概念。技术讨论重点放在业务语义与存储机制各自复用到哪里。

## 5. Memory：把可预计算的工作放在写入时

### 5.1 写入适用描述，运行时选择相关正文

把全部记忆塞进 prompt，会把筛选成本和错误适用的风险带到每次工作。Edges 要求条目有 `description`，从 frontmatter 生成类型索引；Agent 先判断当前对象与问题，再根据描述决定打开什么。这个描述是一次检索决策的输入，应说明“何时需要读”，而不仅是把标题改写一遍。

`buildEntryFields` 校验描述，`buildEntryIndex` 和 `refreshIndex` 维护发现入口；同一 slug 更新时刷新已有登记。语义相关性判断留给 Agent，CLI 的 list 仍是结构遍历。对于如何写内容，remember Skill 优先保留不能轻易从代码恢复的判断、理由、纠正和确认意图。

**取舍：** 写入时多做描述与索引维护，运行时少做盲目展开；但坏描述仍会误导读取，也没有现成证据证明比特定向量检索方案更好。适用范围能帮助选择，不自动解决召回率和排序。

证据：[条目与索引生成](../../../packages/cli/src/services/memory/entries.ts)第 158、201、233、259 行；[列表实现](../../../packages/cli/src/services/memory/records.ts)；[检索 Skill](../../../packages/skills/edges-memory-ask/SKILL.md)；[记忆测试](../../../packages/cli/test/memory/core.test.ts)；[类型索引测试](../../../packages/cli/test/memory/type-index-readme.test.ts)。

**需要收紧的说法：** Skill 与协议中的“固定两跳”落后于当前入口布局。当前常见路径为 `AGENTS → .edges/README → 类型 README → 正文`，且遍历可沿登记继续。对外应讲“分层索引、按描述选择”，不保证固定跳数。

### 5.2 自定义类型把存储契约留在本地入口

默认类型不足时，可以新增当前作用域的类型，其名称、格式、可写性与 Git 忽略选择保存在该类型 README 的元数据中。自定义类型缺 `writable` 或 `gitignore` 时拒绝推断；新类型不靠另一份中央分类表才能被发现。

这扩展的是内容存储和发现契约。新建一个类型不等于获得新的领域服务；`.gitignore` 也只控制默认提交选择，不是访问控制。远程外部类型来源仍有限制。

证据：[ADR 0006](../../../docs/adr/0006-extensible-project-memory-types.md)、[类型发现与校验](../../../packages/cli/src/services/memory/types.ts)第 79、162、213 行、[类型创建](../../../packages/cli/src/services/memory/add-type.ts)、[类型边界测试](../../../packages/cli/test/memory/core-boundaries.test.ts)。

**可讲例子：** 在一个维护对象下增加自定义类型，写入后沿原有索引发现；移除权限元数据时展示明确失败。未来评测应比较相同可用内容与相近上下文预算下的选择质量，不能把“输入更少”单独当成结构优势的证明。

## 6. Skills：发现、安装与维护权限需要分别成立

### 6.1 谁负责原文，比“技能存在哪里”更重要

`managed` 承载本作用域维护的方法；`referenced` 登记来源方维护的技能。相同 Skill 格式可以有不同写入责任，登记成功也不表示宿主已安装、已加载或会按预期触发。

Memory 的 remember 入口拒绝写 referenced；NodeService 在同一实例内沿只读引用读取后，保留只读状态。这些是代码机制，不只是一句提示词。

**本轮实际复现的缺口：** referenced 索引指向本作用域中的普通实际文件时，`updateSkill` 按名称及显式路径都可改写来源。名称发现与后续读取使用不同 NodeService 实例，只读状态没有完整传递；路径分支则直接读取。这个结果不意味着软链接保护失效，也不代表所有来源都可写。对外只能说职责上区分受管与引用，不能承诺所有 Skills 更新路径都已强制保护来源。

证据：[Skills 解析与更新](../../../packages/cli/src/services/skills/service.ts)第 45–70 行、[remember 路径校验](../../../packages/cli/src/services/memory/entries.ts)第 108 行、[NodeService 只读传播](../../../packages/cli/src/services/node/node-service.ts)第 175、279 行、[同实例只读测试](../../../packages/cli/test/services/node-service.test.ts)第 318、590 行。复现条件与输出见第 15 节。

### 6.2 扫描失败与成功扫描为空，不能合并成一种结果

安装链接暂时断开或来源不可读时，用空数组刷新索引会把已有发现入口清掉。现行实现区分失败和空集合：扫描报错，保留原索引；通过 realpath 对别名去重，但不因为同名就把不同来源合并。

这是很好讲的小技术点：保持最后已知状态，接受它可能过时，并显式报告失败。它不自动修复安装或保证来源可用。

证据：[来源扫描](../../../packages/cli/src/services/memory/types.ts)第 324 行起、[先计算后刷新](../../../packages/cli/src/services/memory/entries.ts)第 275 行附近、[别名与失败保留测试](../../../packages/cli/test/memory/core-boundaries.test.ts)第 280、303 行。

### 6.3 使用说明随可执行版本交付

接入 Skill 若独立跟随另一条最新分支，可能教 Agent 使用尚未安装的参数。发布构建把随包技能放入 CLI 包；源码与发行环境分别选来源，禁止静默使用陈旧构建副本，安装复用固定版本的生态安装器。

这是版本一致性的工程选择，不意味着所有宿主兼容性已经验证，也不自动把每份新沉淀的 managed Skill 都安装到宿主。证据：[随包安装](../../../packages/cli/src/services/skills/install-bundled.ts)第 88 行起、[来源与退出码测试](../../../packages/cli/test/skills/install-bundled.test.ts)。

## 7. Tasks：目标、尝试与归属建议分别保留

### 7.1 Task 保存持续目标，Run 保存一次尝试

同一个目标可以多次失败、换 Agent、改标题和状态。Task stem 保持身份，状态与优先级独立变化，Run 单独记录一次执行。移动任务时正文和执行记录属于同一目录单元；标题变化不自动重命名 stem。

身份范围是看板内，不是全球 UUID。Run notes 归属还有时间段推断，缺失时间时可能归到最后一次 Run，不能称为严格逐消息事件溯源。框架也没有“Run 成功自动等于 Task done”的机制。

证据：[任务写入](../../../packages/cli/src/services/tasks/write.ts)第 57、223、237 行、[状态移动](../../../packages/cli/src/services/tasks/move.ts)、[Run 解析](../../../packages/cli/src/services/tasks/runlog.ts)第 52、139、169 行、[移动测试](../../../packages/cli/test/tasks/utils/move.test.ts)、[Run 测试](../../../packages/cli/test/tasks/utils/runlog.test.ts)。

### 7.2 允许先捕获，再形成验收契约

开卡时要求真实背景和目标，动作与完成标准可后补，避免 Agent 为满足表单编造确定性。准备交给持续执行时，再澄清可观察、可证伪的完成条件。这是 Skill 的分阶段工作协议；CLI 不解析自然语言验收标准，也不自动阻止无标准任务进入执行。

证据：[对话转任务 Skill](../../../packages/skills/edges-conversation-to-tasks/SKILL.md)第 19–31 行、[目标与循环验收约定](../../../.edges/memory/projects/project_tasks_align_goal_and_loop_engineering/INDEX.md)、[Task 字段校验](../../../packages/cli/src/domain/models/tasks/task-node.ts)。

### 7.3 分类建议、人类决定、受控写回分离

Agent 对照已有 Project 的标题和描述提建议，审阅页允许人在同一来源范围内调整，导出 JSON 后才通过 CLI 应用。前端与载荷解析都检查来源边界；同 stem、不同来源的任务保持区分。单 HTML 内联应用资源和载荷，能独立打开；托管服务无需访问原仓库，但会持有页面中嵌入的任务内容快照。

导出只表达分组决定，不顺带改状态。**但载荷没有 commit/hash 前置条件，也没有整批 compare-and-swap。** 审阅后的仓库若变化，应用方仍要重新核对。NodeService 的读写快照不能保护一份此前导出的旧建议。

证据：[分类 Skill](../../../packages/skills/edges-tasks-classify/SKILL.md)、[载荷解析与单 HTML](../../../packages/cli/src/services/tasks/review-page.ts)第 151、180 行、[导出与来源边界](../../../packages/apps/tasks-review-app/src/export.ts)、[审阅导出测试](../../../packages/apps/tasks-review-app/test/export.test.ts)、[页面测试](../../../packages/cli/test/tasks/utils/review-page.test.ts)。

**推荐演示：** 两个 scope 各放同 stem 的任务，调整其中一个来源的 Project，展示另一个不变；尝试跨来源拖放；导出载荷并解释其版本限制。演示应在隔离夹具中准备，不用真实待办。

## 8. Routines：方法持续更新，单次读取固定版本

### 8.1 记录定义，复用平台触发与执行

Routine 记录何时做、引用什么 Skill。平台保存来源与读取规则，仓库继续维护方法，避免每个平台各复制一份完整执行提示词。日程保留平台原生表达，不建立一套由 Edges 翻译所有平台的 cron schema。

代价是平台配置、日程变更同步与实际运行必须另验。当前模块是定义 CRUD，没有内置调度器、重试器或运行服务。写下 Routine 不等于平台已经启用它。

证据：[例程协议](../../../packages/skills/edges/references/routines.md)第 40–59 行、[Routine 模型](../../../packages/cli/src/domain/models/routines/routine-node.ts)、[例程测试](../../../packages/cli/test/commands/routines.test.ts)第 57、282 行。

### 8.2 跨次采用新方法，单次避免混用两个版本

协议要求每次运行先将 branch/tag 解析为 commit，再从同一 commit 读取 Routine 与 Skill；默认下次跟随最新，显式固定版本则等待人工更新。所需文件读不到时停止报告，不悄悄回退到旧提示词。

这解决了“读完日程后分支前进，读到另一版方法”的一致性问题。**它目前是接入方协议，不是 Edges 已实现的远程固定快照读取器。** 现有本地 CRUD 测试不能证明平台遵守了这个步骤。

**演示选择：** 用两次 commit 展示一次运行固定 A、下次采用 B；如编写平台适配器，必须标为演示适配器，不能包装成框架自带能力。建议论坛用时序图讲清协议，省去现场平台配置。

## 9. Compose：复用入口，同时保留版本与所有权

### 9.1 默认恢复记录版本，显式要求才跟随远端

仓内 remote 组合使用 Git submodule，主仓 gitlink 表达所选版本；普通 update 执行 `submodule update --init`，显式 `--remote` 才追远端；这时若子模块已在分支上，则附加 `--merge` 保留该分支。知识不会因为使用一次就隐式更新。

经验写回源仓检出目录，提交与推送仍是该仓的 Git 操作。更新远端后，主仓的新 gitlink 也要提交。无 remote 的本地路径只登记，不获得 submodule 的可重建保证；有 remote 的 add 会涉及 Git 暂存操作，因此不能宣称 Compose 完全不碰暂存区。

证据：[add/update 实现](../../../packages/cli/src/services/compose/service.ts)第 304、390 行、[版本与分支测试](../../../packages/cli/test/commands/compose.test.ts)第 221、287、297、335 行、[写入不自动提交测试](../../../packages/cli/test/commands/compose-write.test.ts)、[ADR 0042](../../../docs/adr/0042-compose-on-git-submodule.md)。

### 9.2 挂载入口与展开全部内容是两步

Compose 节点的 `childTraversal()` 返回 `leaf`；默认遍历到共享仓 README 入口就停，不继续把整仓材料递归灌入当前查询。森林可以把首层组合仓作为独立系统处理，更深组合另有停止边界。

因此“已经 Compose”只说明共享入口可发现，不能推出默认 memory list 自动纳入所有共享记忆；继续读具体材料或切换 scope 是后续选择。这个取舍限制无意展开，但也要求调用方理解可发现与已加载的差别。

证据：[Compose 节点](../../../packages/cli/src/domain/models/compose/compose-readme-node.ts)第 195 行、[入口停止测试](../../../packages/cli/test/models/compose-node.test.ts)第 89 行、[组合与森林测试](../../../packages/cli/test/commands/compose.test.ts)第 478、528 行。

### 9.3 部分失败必须保留在结果协议里

批量更新逐仓捕获错误后继续，结果分别标为成功或失败。混合结果只要至少一条成功，命令可能 exit 0；自动化消费方必须读逐条结果，不能只看退出码。`compose list` 的布尔字段 `initialized` 只检查目录存在且非空，不代表版本、入口和内容健康；它不同于 update 完成初始化步骤后的 `action: "initialized"`。

证据：[逐仓处理](../../../packages/cli/src/services/compose/service.ts)第 261、290 行、[命令结果](../../../packages/cli/src/commands/compose/git-result.ts)、[混合失败测试](../../../packages/cli/test/commands/compose.test.ts)第 345、444 行。

**推荐演示：** 上游增加提交后，比较普通 update 与 `--remote`；展示主仓 gitlink diff；再用一个有效、一个失败来源说明为什么仅凭 exit 0 不够。

## 10. Observation：统一分析入口，保留来源差异

### 10.1 归一化要解释字段语义，也要承认信息损失

不同 Agent 的事件粒度、计时和 usage 字段并不相同。仓内 `langfuse_sink` 将 Codex exec JSON 与 pi JSONL 转成无 Langfuse 专名的 `Trace / Span / Usage`，再由 exporter 映射到后端。共享消费者无需直接理解每家格式，平台专属属性集中在出口。

代价是映射不无损：Codex span 时间为合成的 1 ms 间隔；pi 有 timestamp 与 duration 时保留真实时间，缺失时也回退。未知事件会被忽略，适配器最多产生 40 个 span，导出输入／输出文本另有 8,000 字符上限。当前没有完整的 synthetic／truncated 数据质量标志。因此不能用合成 span 计算真实工具耗时，也不能把仓内两种事件适配器泛化为所有宿主的统一会话协议。

证据：[通用模型](../../../packages/observation/langfuse_sink/model.py)第 31 行、[Codex 适配器](../../../packages/observation/langfuse_sink/codex.py)第 31 行、[pi 适配器](../../../packages/observation/langfuse_sink/pi.py)第 44、184、226、291 行、[字段裁剪](../../../packages/observation/langfuse_sink/exporter.py)、[适配测试](../../../packages/observation/langfuse_sink/tests/test_langfuse_sink.py)第 361、464、475 行。

### 10.2 缺失不是零，展示层不等于计量层

Usage 模型允许缺失值；版本、model、provider 等来源字段有值才导出。缓存 token 在 exporter 中另行映射，避免后端把总输入与缓存重复相加；pi 的成本来自上游报告，不对未知成本编造价格。

但消融实验从观测适配器提取 usage，复用了 40 span 上限。**本轮实际复现：** 单独的 `turn.completed` 报告 input 100、output 9 时正常；在它前面插入 40 个工具事件，同一份 usage 会变成全缺失。只报告 output 9 时，input 又被累计初值变成 0。由此可见，“模型支持 None”不等于整条计算链路都保留了缺失语义。

这是一个具体的复用边界：展示轨迹可以裁剪，实验计量却需要独立考虑完整性。未来可把全量计量与有限展示分开，为每个指标保留 observed/missing 和覆盖率；这是候选方向，本轮未实现。

证据：[usage 汇总](../../../packages/evaluation/experiments/harness_memory_ablation/answer.py)第 35–56 行、[适配器截断](../../../packages/observation/langfuse_sink/codex.py)第 31–52 行、[缓存映射与成本测试](../../../packages/observation/langfuse_sink/tests/test_langfuse_sink.py)第 686 行、[来源按实记录](../../../packages/evaluation/experiments/retrieval_eval/trace.py)第 152 行。第 15 节保留可复现输入和输出。

### 10.3 遥测故障不改判分，缺失遥测仍要可见

exporter 定义 `sent / skipped / failed`，配置不完整时 no-op，传输异常转为失败结果；消融 runner 还捕获 exporter 异常并写 stderr，不改写实验 verdict。这样实验是否达标不依赖观测后端是否在线。

但消融本地报告没有完整记录 export 状态，丢掉 stderr 后不能仅凭报告确认遥测是否收齐。Webhook 路径另有自己的 langfuse_status，不能混用两条路径的保证；当前也没有持久队列或送达保证。

证据：[Exporter 协议与映射](../../../packages/observation/langfuse_sink/exporter.py)第 29、64、83、179 行、[消融上报隔离](../../../packages/evaluation/experiments/harness_memory_ablation/run.py)第 299 行、[上报失败仍保留分数测试](../../../packages/evaluation/tests/test_retrieval_eval.py)第 581 行、[观测 ADR](../../../docs/adr/0038-observation-trace-exporter.md)。

## 11. Evaluation：用明确实验回答具体维护问题

### 11.1 评测目标不同，实验现场也不能随意统一

路径检索、依据记忆回答问题、遵守运营约束，以及写入新记忆后再使用，是不同构念。路径检索可以在缓存 clone 中 checkout ref，金标准允许“每个必要簇中命中任一有效文档”，减少对合法替代路径的误判；主分为 R@5，空 gold 负例另看。

Memory 消融则直接使用外部准备的 A/B 目录，不 clone/reset，以免将实验特意移除的 memory 恢复。prompt 只给问题和读取说明，让 Agent 自己发现材料；它拒绝把路径检索题直接当作自由作答题。这里复用客户端，但保留不同实验的准备职责。

**边界：** runner 不保证 A/B 只差 memory，甚至没有禁止同一路径；报告记录 commit 与 dirty，但没有完整 dirty diff 快照。当前先跑全部 off 再跑 on，没有随机交错。两题 smoke 不足以证明收益；答案也可能仍存在于 ADR 或代码里，必须审查题目是否真的依赖被消融材料。

证据：[检索评分](../../../packages/evaluation/experiments/retrieval_eval/score.py)第 18、40、81 行、[检索 clone/ref](../../../packages/evaluation/experiments/retrieval_eval/git_repo.py)、[消融运行](../../../packages/evaluation/experiments/harness_memory_ablation/run.py)第 120、153、322 行、[消融 prompt](../../../packages/evaluation/experiments/harness_memory_ablation/prompt.py)、[题型校验](../../../packages/evaluation/experiments/harness_memory_ablation/cases.py)、[保留实验现场测试](../../../packages/evaluation/tests/test_harness_memory_ablation.py)第 388 行、[smoke 不等于收益证明](../../../docs/adr/0008-evaluation-smoke-is-not-benchmark-proof.md)。

### 11.2 默认开启的标准包括质量、开销与无关任务退化

当前 Memory 消融把以下 gates 并列，全部明确通过才给出 `worth_default_on=true`：

| Gate | 当前实验的策略 |
| --- | --- |
| 相关题质量 | memory-dependent 正确率至少提升 10 个百分点 |
| 输入 token | 聚合后的增长不超过 15% |
| Agent 作答耗时 | 聚合后的增长不超过 10% |
| 无关题 | 正确率不下降，违反次数不增加 |

这些阈值是实验策略，尚不是跨场景定理。质量先按题合并重复运行，再在类别内等权聚合；token／耗时先取题内中位数，再对有效配对题的两侧分别取中位数，**不是每题相对增幅的中位数**。耗时围绕 Agent 调用计量，不包含 Judge 与 exporter；输入 token 是成本代理，不是全部账单金额。

缺 Judge 判定保留 `unscored`，`partial` 不算正确。Judge 接收问题、答案、criteria 与 violations，不直接接收条件标签或 memory 正文。`worth_default_on=false` 可能是证据不足，也可能是质量、开销或退化未过门槛，必须解释各项 gates。

**两项容易漏讲的限制：** 缺 token／耗时的题会从有效配对中剔除，目前没有最低覆盖率 gate；`conflict-stale` 的退化会报告，但不阻止主 verdict 为 true。结合上一节的 usage 截断问题，不能仅凭总 verdict 或少量低成本样本宣称已证明值得默认开启。当前也没有置信区间或显著性推断。

证据：[评分与聚合](../../../packages/evaluation/experiments/harness_memory_ablation/score.py)第 25、64、79、108、118、189 行、[Judge 输入](../../../packages/evaluation/experiments/harness_memory_ablation/judge.py)第 66 行、[stale 退化仍允许主 verdict 通过的测试](../../../packages/evaluation/tests/test_harness_memory_ablation.py)第 191–229 行。

**适合演示：** 固定合成 trials，让质量提升但 token 超阈值，再让无关题退化，最后关掉 Judge，展示不同 gates。应明确它演示评分合同，不是真实收益数据。

### 11.3 在线数据到改进采纳之间，还需要语义交接

当前服务可从 Langfuse Dataset 按名称路由到已注册实验，转换输入、运行并回传结果。`run_ok` 表示运行链路成功，`worth_default_on` 表示当前实验 gates 是否通过，两者分开。HTTP 202 只表示接收，进程内执行没有持久队列；超时也不自动取消已启动 runner。

从线上 trace 自动清洗题集、按维护对象设定通用目标、通过 Routine 定期评测仍在规划。旧 done 卡名字虽然包含“产生 Dataset”，正文明确从 trace 生成 Dataset 不在那张卡内。也没有统一的 Task Run → 原始会话 → dataset item → 修改 → 采纳 commit 自动关联协议。

证据：[服务契约](../../../packages/services/evaluation/README.md)、[Dataset 路由](../../../packages/services/evaluation/experiment_webhook/registry.py)、[执行与超时](../../../packages/services/evaluation/experiment_webhook/dispatch.py)第 152–189 行、[消融适配器](../../../packages/services/evaluation/experiment_webhook/runners/harness_memory_ablation.py)、[线上清洗与定期评测待办](../../../.edges/tasks/evaluation/backlog/2026-11-02--Personal-Evaluation自定义目标线上数据自动清洗与定期评测/INDEX.md)、[已有任务的范围说明](../../../.edges/tasks/evaluation/done/2026-10-25--评测-Skill收集用户数据并产生-Dataset/INDEX.md)。

可把未来工作收束为几个研究问题：什么线上失败值得进入题库？怎样脱敏又保留因果条件？何种改善足以采纳？怎样避免用自己生成的题作为独立验证？这些比一句“已经闭环”更适合技术讨论。

## 12. Artifacts：把公开状态放进 Agent 交付契约

### 12.1 草稿不消耗审阅有效期，发布时才起算 TTL

上传文件不意味着已经准备好公开。Artifacts 支持先保存草稿，发布时才生成公开 URL 并计算 expiresAt。服务端对草稿与过期产物的公开 GET 返回 404，允许用户把准备阶段与审阅窗口分开。

草稿没有 TTL，会留到删除；从本地路径一步 publish 内部仍是 create 再 publish，两次 HTTP 不是事务，后一步失败可能留下草稿。这些限制不妨碍小契约有用，但需要讲清生命周期。

证据：[草稿与发布存储](../../../packages/services/artifacts-preview/src/store.ts)第 193、225、253 行、[公开读取](../../../packages/services/artifacts-preview/src/server.ts)第 207 行、[CLI 发布](../../../packages/cli/src/commands/artifacts/publish.ts)第 104–118 行、[服务测试](../../../packages/services/artifacts-preview/test/server.test.ts)第 55、125 行、[TTL 测试](../../../packages/services/artifacts-preview/test/store.test.ts)。

### 12.2 发布、浏览器验收和业务写回保持独立

CLI 收集资源，服务端校验相对路径与入口，客户端检查响应状态及返回的 id/url；目前不会回读公开 URL，也不会做浏览器行为验收。自包含审阅页可以本地打开或临时托管，审阅结果再通过对应模块处理；服务不直接修改任务正文。

这种分工允许替换托管实现，也避免为了一个任务分类页造一套内容编辑后端。代价是接入方仍需做页面、网络可达性与业务效果验收。UUID+TTL 不提供保密访问控制；公开链接可被访问和保存，临时失效不能撤回已下载副本。

证据：[资源收集](../../../packages/cli/src/commands/artifacts/utils/collect.ts)、[HTTP 响应校验](../../../packages/cli/src/commands/artifacts/utils/client.ts)第 124 行、[独立渲染 ADR](../../../docs/adr/0012-task-project-review-page-is-render-only-cli.md)、[临时托管 ADR](../../../docs/adr/0013-artifacts-preview-service.md)、[持久看板边界](../../../docs/adr/0021-persistent-tasks-board-site.md)。

**推荐演示：** 草稿上传后 404，发布后可读，到期后 404；另解释“HTTP 成功但外链资源失效”为什么仍需浏览器检查。现有服务 README 部分“上传→URL”及旧字段说明落后于实现，准备正式听众入口前应另行修订。

## 13. 30 分钟的内容取舍与演示安排

时长尚未由用户确认，以下暂按 30 分钟设计，包含问答；不是已经排定的演讲日程。

| 时间 | 讲什么 | 让听众带走什么 |
| --- | --- | --- |
| 0–3 分钟 | 项目工作与改进调研 Skill 的两个场景；Notes／Projects 作材料载体 | 维护对象决定上下文 |
| 3–8 分钟 | 三种关系、按需遍历、NodeService 三层写入保护 | 目录约定背后的具体工程责任 |
| 8–13 分钟 | Memory 的写时索引、Skills 的来源责任、Compose 的版本与展开 | 共享知识如何仍可维护 |
| 13–18 分钟 | Tasks 的目标与尝试、分类审阅；Routines 的版本协议 | Agent 交接需要什么契约 |
| 18–24 分钟 | Observation 与 Evaluation；usage/token 计量反例 | 证据怎样支持或限制改进判断 |
| 24–26 分钟 | Artifacts 草稿／发布／验收；回到同一研究例子 | 如何把结果交给人并留下后续入口 |
| 26–30 分钟 | 问答与现有边界 | 能力、协议、规划各自到哪一步 |

建议最多做一个操作演示和一个短反例回放，避免十模块各点一次命令。优先选 Compose 版本差异或 Tasks 来源边界；成本统计反例用预录输出即可。Routines 用两次运行的版本图说明，明确协议责任。

如只有 15 分钟，保留对象与关系、Memory／Compose、Task／Run、评测证据四个段落；其他模块列为备份。45–60 分钟可增加 NodeService 失败恢复、来源扫描失败和 Artifacts 发布状态的演示，仍应先完成彩排。

### 贯穿案例

使用一个公开、虚构的数据集：“为项目改进调研方法”。先用 Notes 保留讨论原料、Projects 归集长期研究；把用户确认的选择写入 Memory，把可重复步骤放进 Skill；Task 保存改进目标和尝试，Compose 固定外部共享方法的版本，Routine 表达后续复查计划；Observation 提供会话材料，Evaluation 比较特定改动，Artifacts 交付审阅页面。

这是解释各模块职责的叙事，**不是声称已实现端到端自动流水线**。实际演示应只连接完成验证的环节，明确人或 Agent 承担的交接。

## 14. 论坛可能追问的问题

| 问题 | 可以给出的回答 |
| --- | --- |
| 不就是 Markdown 加 Git？ | 存储基础确实如此。技术内容在关系、发现、索引维护、目录单元生命周期、写入核对、失败恢复与工作交接；采用文件后仍要处理这些问题。 |
| 为什么不直接用向量数据库？ | 当前先显式表达归属与适用范围，描述选择由 Agent 完成。向量检索可用于候选召回，但不能自动替代写入权限、维护边界和版本选择；仓库没有证明它在所有检索任务上优于向量方案。 |
| 能保证 Agent 不乱读、不乱写吗？ | 代码能约束经过特定入口的操作，Skill 提供执行协议；目录索引不是安全沙箱，通用 Skills 更新还存在已复现的只读传播缺口。 |
| 是否已经自进化？ | 已有记录、方法维护、观测和特定实验能力；每轮提出改进、验证、采纳、进入下一轮的完整自动闭环并未由这些模块的存在直接证明。 |
| 多 Agent 同时改安全吗？ | CLI 协作锁、读取快照和失败恢复覆盖各自范围；不等于跨命令事务、跨机器一致性或延迟审阅的版本保护。 |
| 省了多少 token，效果提高多少？ | 本次研究没有得出收益数字。需固定任务与实验条件，报告质量、成本、时间、退化及缺失样本；当前计量边界也必须先处理。 |
| Task Project 和 Projects 是一回事吗？ | 前者是任务看板的分组元数据，后者是持续工作的材料叶子；名字相近，但领域职责与命令契约不同。 |
| 所有模块能只登记一次就成为插件吗？ | 当前共用节点与生命周期，但新模块仍有多个契约点；完整插件化和跨模块路径一致性还有待办。 |

## 15. 本轮验证、反例与正式汇报前的补充工作

### 验证记录

本轮对十模块阅读源码、测试断言、ADR、Skill 和适用记忆；没有运行真实 Agent/Judge 收益实验，没有访问线上会话，没有连接 Langfuse 或公开发布演示。

在未改源码的研究基线上，实际执行下面 5 个既有测试文件：

```sh
# 在 packages/cli 下，安装锁文件约束的依赖后执行
node --import tsx --test --test-concurrency=1 \
  test/services/dated-leaf.test.ts \
  test/services/node-files-atomic.test.ts \
  test/services/owned-units.test.ts \
  test/operations/traverse.test.ts \
  test/operations/traverse-dual-entry.test.ts
```

Node v26.12.1：61 项，60 通过、1 失败；Node v24.22.1 复跑同样结果。失败均为 `node-files-atomic.test.ts` 的资源导入测试，`NodeService.import` 的 `fs.cpSync` 返回 `ERR_FS_CP_EEXIST`。因此本轮不能宣称全部生命周期测试通过，也不把失败简单归因于某一个 Node 大版本。移动恢复、读取漂移、遍历和范围相关断言通过，不代表所有命令或所有平台已验证。

测试原始日志保留于本工作区临时研究目录；以上命令、版本、基线和失败位置是可重复检查的记录。正式演示前应重新运行所选链路。

### Skills 普通来源文件的只读传播反例

在 `packages/cli` 目录执行，夹具创建于临时目录并在结束时删除；不操作真实安装技能：

```sh
node --import tsx --input-type=module <<'JS'
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { updateSkill } from './src/services/skills/service.ts';
const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'edges-forum-ref-'));
const put = (p, s) => {
  fs.mkdirSync(path.dirname(path.join(root, p)), { recursive: true });
  fs.writeFileSync(path.join(root, p), s);
};
try {
  put('AGENTS.md', '# Scope\n<!-- edges-local:start -->\n## 本层系统维护信息\n- [skills](.edges/skills/referenced/README.md) — installed\n<!-- edges-local:end -->\n');
  put('.edges/skills/referenced/README.md', '# Refs\n<!-- edges-memory-type:start -->\nname: referenced\nmodule: skills\nwritable: false\ngitignore: false\nformat: skills\n<!-- edges-memory-type:end -->\n<!-- edges-entries-local:start -->\n## 本层内容\n- [installed](../../../.agents/skills/installed/SKILL.md) — Installed method\n<!-- edges-entries-local:end -->\n');
  put('.agents/skills/installed/SKILL.md', '---\nname: installed\ndescription: Installed method\n---\nOriginal method\n');
  for (const target of ['installed', '.agents/skills/installed/SKILL.md']) {
    await updateSkill({ EDGES_SCOPE: root }, target, { body: 'Changed through ' + target }, {});
    console.log(JSON.stringify({ target, result: 'allowed', changed:
      fs.readFileSync(path.join(root, '.agents/skills/installed/SKILL.md'), 'utf8')
        .includes('Changed through ' + target) }));
  }
} finally { fs.rmSync(root, { recursive: true, force: true }); }
JS
```

本轮在研究基线实际输出：

```json
{"target":"installed","result":"allowed","changed":true}
{"target":".agents/skills/installed/SKILL.md","result":"allowed","changed":true}
```

这个复现只覆盖领域服务的普通实际文件来源，不是操作系统权限绕过，也没有证明软链接写入检查失效。

### Usage 完整性反例

在框架根执行，纯内存、无网络：

```sh
python3 -B <<'PY'
import sys, json
sys.path[:0] = ['packages/evaluation', 'packages/evaluation/experiments', 'packages/observation']
from harness_memory_ablation.answer import usage_from_events
usage = {'type': 'turn.completed', 'usage': {'input_tokens': 100, 'output_tokens': 9}}
tool = {'type': 'item.completed', 'item': {'type': 'command_execution',
        'command': 'echo demo', 'aggregated_output': 'demo', 'exit_code': 0, 'status': 'completed'}}
cases = [('normal', [usage]), ('after_40_tools', [tool] * 40 + [usage]),
         ('partial', [{'type': 'turn.completed', 'usage': {'output_tokens': 9}}])]
for name, events in cases:
    print(name, json.dumps(usage_from_events('codex', '\n'.join(map(json.dumps, events)))))
PY
```

本轮实际结果：

| 输入 | input_tokens | output_tokens | cached_input_tokens | reasoning_tokens |
| --- | ---: | ---: | ---: | ---: |
| normal | 100 | 9 | 0 | 0 |
| after_40_tools | null | null | null | null |
| partial | 0 | 9 | 0 | 0 |

它证明当前提取路径在这些输入下的行为，不代表真实业务 token 消耗为零或已经测得收益退化。

### 正式对外讲述前值得补齐的证据

1. 用隔离数据完成所选演示彩排，记录源码 commit、Node/Python 版本、输入和实际输出；不以阅读测试代替彩排。
2. 若主讲“只读引用”，先修复并验证 Skills 通用更新入口，或者明确作为当前实现反例讲述。
3. 若展示成本收益数字，先修复／隔离 usage 截断与缺失字段口径，检查整条实验链路。没有这些条件就只讲实验设计，不给收益百分比。
4. 把“固定两跳”和 Artifacts 旧发布说明等文档漂移单列修订；不要把旧文档当作现行能力证据。
5. Routine 若演示真实平台，分别验收记录、平台配置和真实执行；记录本次解析 commit。线上会话自动变数据集、定期运行若仍属规划，保持规划标签。

这些是准备正式汇报的候选动作，本轮没有自动创建任务、修复源码、配置调度或发布演讲内容。

## 16. 本轮实际参考的项目记忆

根层：[README 方向](../../../.edges/memory/projects/project_root_readme_direction/INDEX.md)、[节点目录单元](../../../.edges/memory/projects/project_node_resource_unit_decision/INDEX.md)、[Git 管理范围](../../../.edges/memory/projects/project_git_memory_management/INDEX.md)、[作用域与维护关系](../../../.edges/memory/projects/project_scoped_systems_and_harness/INDEX.md)、[自定义 Memory Type](../../../.edges/memory/projects/project_extensible_memory_types/INDEX.md)、[发现链路](../../../.edges/memory/projects/project_agents_md_to_skill_to_cli/INDEX.md)、[任务目标与验收](../../../.edges/memory/projects/project_tasks_align_goal_and_loop_engineering/INDEX.md)。评测下层还参考了评测审查清单与 online write→use 的设计记忆。模块下层记忆用于解释设计理由，当前能力以本文链接的基线源码为准；不引用本机私密 users 正文或内部部署信息。
