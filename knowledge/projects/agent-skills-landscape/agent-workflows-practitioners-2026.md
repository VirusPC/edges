# Agent 高手的真实工作流

## 执行摘要

公开实践已经从“怎样写一个好提示词”转向“怎样设计一个不会轻易失控的工作系统”。Peter Steinberger、Jesse Vincent、Every、Garry Tan、Matt Pocock、Boris Cherny、Thariq Shihipar、Geoffrey Huntley、Andrej Karpathy 与 Armin Ronacher 的做法表面差异很大，底层却共享同一个结构：人决定目标与边界，Agent 获得可操作的环境，工作状态写入持久 artifact，执行被切成能独立验证的单元，结果必须经过外部反馈，最后把失败或新知识写回系统。

这与大规模真实使用数据相符。Anthropic 对 Claude Code 会话的分析显示，人在典型会话中承担约 70% 的规划决策，而 Agent 承担约 80% 的执行决策；典型会话约有四轮人机交互，每次用户提示会触发约十个 Agent 动作。[^1] 成熟工作流不是让人退出，而是把人的注意力从“逐行操作”上移到“问题选择、约束、验收与例外处理”。

真正拉开差距的不是 Agent 数量，而是五件事：

1. **工作是否先变成可审查的决策 artifact。** 模糊任务先访谈、原型或研究，明确任务才进入实现。
2. **并行是否只发生在可隔离的地方。** 搜索、独立模块和不同仓库适合并行；集成、共享环境、发布和最终验证通常要串行。
3. **反馈是否来自环境，而不是 Agent 自述。** 测试、浏览器、模拟器、指标、CI、线上健康与精确 Git 状态才是证据。
4. **循环是否有明确状态与退出条件。** 没有状态文件、预算和验收条件的“继续努力”只是昂贵的随机游走。
5. **一次工作是否改善下一次。** 项目规则、失败记录、评测集、解决方案文档和复盘是复利来源。

这些实践可以归纳为四种主流工作流：

| 范式 | 代表实践者 | 最适合 | 主要风险 |
| --- | --- | --- | --- |
| 规格驱动的受监督开发 | Jesse、Matt、Thariq | 新功能、架构变更、需求仍有歧义 | 前置讨论变成仪式，规格快速过时 |
| 带质量门的交付流水线 | Every、Garry | 稳定产品中的常规功能与 PR | 大框架侵入项目，重复已有流程 |
| 并行产能与维护者控制面 | Peter、Boris | 多仓、多 Issue、吞吐型维护 | 并行冲突、验证拥堵、协调成本 |
| 可度量的自治循环 | Geoffrey、Karpathy | 编译器补全、迁移、实验优化 | 错误规格被高效放大，成本失控 |

对 Edges，最值得复制的不是任何一整套框架，而是一个三车道工作流：小改动直接完成；普通任务走“澄清—实现—证据—沉淀”；只有具备机器可判定反馈、隔离环境和预算上限的任务才能进入自治循环。

## 研究边界与证据强度

本报告延续[上一份 Skills 调研](./agent-skill-practitioners-2026.md)的人物范围，但研究对象从 Skill 名称改为端到端工作过程。证据截至 2026 年 9 月 10 日，优先使用本人文章、本人仓库、团队仓库与官方研究；本人帖文无法直接访问时，使用明确链接到原帖的同期报道，并降低措辞强度。

“工作流”至少需要回答七个问题：任务怎样进入、谁做规划、状态放在哪里、怎样切分与并行、怎样验证、谁决定完成、经验怎样回流。只公开了零散技巧的人，不被强行拼成完整流程。

| 证据等级 | 含义 |
| --- | --- |
| A | 本人或团队公开了实际使用的端到端流程及其实现 |
| B | 本人公开了多个稳定环节，但完整流程需少量归纳 |
| C | 只有访谈、演示或第三方记录，适合描述原则，不适合声称固定流程 |

## 共同骨架：从对话到受控系统

把不同体系的专有名词去掉后，最稳健的骨架是：

`意图 → 澄清/探索 → 决策 artifact → 可领取工作单元 → 隔离执行 → 环境证据 → 独立评审 → 交付 → 经验回流`

这不是严格的瀑布模型。小任务可以跳过澄清和正式规格；实现中出现新信息可以退回重写决策；验证失败会把工作送回诊断环节。真正固定的是每个阶段的输入、输出和责任人，而不是所有任务都必须经过同样数量的步骤。

成熟工作流还会把三种状态分开：

- **意图状态**：为什么做、做成什么样、哪些不做，由 brief、spec、ADR 或 Issue 表达。
- **执行状态**：当前做到哪里、谁在做、哪些项被阻塞，由 Git、工单、锁、计划文件或任务系统表达。
- **证据状态**：测试、截图、浏览器录像、指标、CI、review findings 与线上健康，回答“凭什么说完成”。

仅靠聊天记录承载三种状态，会同时产生上下文腐化、不可并行和难以审计的问题。高手的共同选择是让对话负责协商，让文件、Git、工单和评测系统负责记忆事实。

## Boris Cherny：高质量计划之后，大规模并行执行

Boris 公开描述的个人流程最接近“高吞吐工程负责人”。他会同时运行约五个本地会话和五到十个云端会话，本地会话使用独立 checkout 避免冲突；报道也记录了约 10%–20% 的会话会因意外情况被放弃。[^2] 这说明并行的意义不是保证每条支线成功，而是把 Agent 当成有失败率的计算资源组合。

一个典型 PR 的路径是：

1. 在 Plan mode 中与 Agent 往返，直到计划满意。
2. 计划稳定后切换到自动接受编辑，让 Agent 完成大部分实现。
3. 高频内循环由项目命令封装，例如提交、推送、开 PR、简化和验证；确定性信息先由脚本收集，减少模型来回查询。
4. 写文件后由 hook 自动格式化，常用且安全的命令预先授权；只有在隔离沙箱中的长任务才放宽交互式权限。
5. 每项变更都要有实际反馈环路。Web 变更通过浏览器扩展运行、查看界面并继续迭代，而不是只看单测。
6. 团队把 PR 中学到的教训写回版本控制中的 `CLAUDE.md`，后续会话自动继承。

这个工作流的关键不是“同时开十五个窗口”，而是先把任务分成相互独立的上下文，再让人集中做计划审定、异常处理和最终 review。并行会扩大吞吐，也会扩大错误与注意力需求；没有隔离 checkout、可验证命令和清晰计划时，复制会话数量只会制造更多半成品。

证据等级：B。原始 X 帖无法在本次访问中直接读取，流程细节由链接原帖的 InfoQ 同期整理交叉确认。

## Peter Steinberger：根协调器、仓库负责人和公共动作闸门

Peter 的公开配置比一般“多 Agent 技巧”更像一个维护者操作系统。他明确区分单一任务与维护队列：一个 Issue、一个 PR 或一个连贯重构即使很复杂，也在当前会话直接完成；只有多个独立 Issue、多个仓库或持续维护队列才进入 orchestration。[^3]

### 控制面

进入编排模式后，根协调器先冻结范围：哪些仓库、哪些 Issue/PR、能否发现新工作、是否持续监控、哪些公开动作已获授权。每个条目被分为可自治、需要 owner 决策、无需处理或无效。这样 Agent 在并行之前已经知道哪些地方可以继续，哪些地方必须停。

Peter 倾向于每个仓库一个长期负责的项目线程，而不是每个 Issue 新建一个 worker。同仓任务默认串行，只有真正需要隔离时才拆开；支持型 subagent 负责盘点、分析和观察，不拥有提交、推送、合并、发布等公开动作。[^3]

### 判断与执行分层

在 Claude Code 中，他的 `codex-first` 路由把设计、API、命名、UX、规格和最终 review 留给 Claude，把冻结规格后的实现、修复、测试补齐、机械迁移与 Git 操作交给 Codex。每个 work order 必须自包含目标、路径、约束、非目标、验证命令和输出格式；worker 的完成报告只被视为线索，协调器仍要读真实 diff、执行测试并做隔离评审。[^4]

### 并行规则

私有调查、实现、本地测试和 review 可以并行。会造成共享状态歧义的动作则串行：向同一仓库推送、创建或更新 PR、批准或重跑 CI、合并、发布，以及占用有限外部环境。等待也有单一 owner，协调器不与 worker 重复轮询同一个 CI。

### 完成标准

最终 landing 要求：症状已复现或根因已建立、修复边界合理、有回归覆盖、变更面有足够的广泛检查、需要时提供真实 E2E 证据、隔离 autoreview 无待处理问题、精确到目标 head SHA 的 CI 为绿，并明确留下任何证据缺口。[^5]

这一体系的独特价值是把“自主”拆成权限、范围、责任和证据四个独立维度。Agent 可以在实现上非常自主，同时没有扩大任务范围、公开发布或降低验证门槛的权力。

证据等级：A。

## Jesse Vincent：以纪律换取可重复的软件开发

Superpowers 把传统软件工程纪律变成 Agent 默认行为。用户表达一个项目或任务后，Agent 不直接写代码，而是进入 brainstorm；形成一致理解后写计划，在 Git 仓库中自动创建 worktree，使并行任务不会互相覆盖。[^6]

执行有两种模式：人作为 PM 协调架构会话与实现会话，或者主 Agent 逐项派发 subagent。后者不是让多个 Agent 自由涌入仓库，而是一项任务一个实现 subagent，每项完成后立即代码评审，再进入下一项。整个实现过程坚持 RED/GREEN TDD：先出现失败测试，再写最小实现使其通过。

任务收尾时，系统明确给出创建 PR、合回源分支或停在当前 worktree 等选项。也就是说，写完代码不是自动发布授权；执行与交付是两个阶段。

更重要的是，Jesse 会测试工作流本身。Skill 先在没有相应规则的 subagent 上运行真实压力场景，观察它是否因时间压力、已有投入或自信而跳过流程；每次失败后强化 Skill，再重新测试。[^7] 这把“我们写了规则”升级为“规则在压力下确实改变行为”。

Superpowers 适合质量标准明确、愿意支付前置设计和测试成本的功能开发。它不适合一行改动，也不适合反馈无法自动获得的开放式探索。其风险不是纪律太多，而是把纪律机械应用到不需要仪式的小任务。

证据等级：A。

## Every：Plan—Work—Review—Compound 的组织闭环

Compound Engineering 的核心假设是，代码并不是一轮工作的唯一产物；计划、评审发现和解决方案知识都应该让下一项工作更便宜。Every 的标准链路是：

`ce-ideate（可选） → ce-brainstorm → ce-plan → ce-work → ce-simplify-code → ce-code-review → ce-compound`

brainstorm 先把产品行为决定下来，plan 再产出实现就绪的 guardrails，包括范围、单元、风险和测试场景。计划规定 WHAT，但不预写所有 HOW；`ce-work` 在真实代码面前决定实现方式，执行前做幂等检查，持续测试，完成后经过简化、评审、PR 和 CI。[^8]

这套分工避免两种常见失败。一是计划过细，把可能数周后才执行的具体签名和代码片段写死；二是计划过虚，只剩待办列表，Agent 仍要重新做产品决策。Every 把计划定义为“稳定决策的载体”，进度则从 Git 推导，而不是回写计划正文。

`lfg` 是自治版本：从已经 brainstorm 的真实需求开始，自动计划、实现、简化、应用 review 修复、做浏览器测试、提交、推送、创建 PR，并在有限预算内观察和修复 CI；它不会自动合并，修复预算耗尽时允许带着明确残留项结束。[^9] 这表明自治不是去掉门，而是把门和停止条件写进流水线。

最后，`ce-compound` 把可复用发现写入 `docs/solutions/`，后续 brainstorm、plan 和 work 会读取这些知识。工作流形成的不是“一个更长的会话”，而是跨会话、跨任务可检索的组织经验。

证据等级：A。

## Garry Tan：以产品角色为阶段的 Founder 交付流水线

gstack 把一个产品 sprint 拆成连续的专家视角：

`Think → Plan → Build → Review → Test → Ship → Reflect`

入口 `office-hours` 不接受表面功能请求，而是重构问题、寻找产品 wedge，并生成后续阶段继承的 brief。计划阶段可以分别经过 CEO、工程和设计 review，从产品价值、架构、失败模式、UX 与测试角度给方案施压。实现基于冻结 brief 进行，而不是边写边改变意图。[^10]

实现后的 `/review` 负责找 CI 可能漏掉的回归和完整性缺口；`/qa` 打开真实浏览器，以用户身份操作，修复发现的问题并为每个修复生成回归测试；`/ship` 同步主线、运行测试、审计覆盖率、推送并创建 PR；`/land-and-deploy` 等待 CI 和部署并验证生产健康，`/canary` 继续观察错误与性能；`/retro` 从整个 sprint 提取模式和改进方向。[^11]

gstack 的强项是让技术创始人不会因为代码生成变快就跳过产品审视、设计、QA 和发布纪律。角色不是为了模拟组织层级，而是作为一组不同的评审镜头。它的弱点也来自完整性：已有成熟工程流程的仓库可能同时出现两套规划、浏览器、提交和记忆机制，因此更适合借鉴阶段和检查表，而不是无条件整包接管。

证据等级：A。

## Matt Pocock：从“雾”到可领取垂直切片

Matt 的日常路径比大型流水线更模块化：

`grill-with-docs → to-spec → to-tickets → implement → code-review → human review`

如果问题大到一个上下文装不下，或当前甚至无法写出规格，则先进入 `wayfinder`。它把目标定义为 destination，把尚未解决的问题建成 decision tickets，把暂时无法精确表达的问题留在 fog of war。工单使用依赖边表达阻塞关系，当前可做的未阻塞项构成 frontier。每个会话只解决一个决策工单，研究工单可以并行；解决结果写回工单，地图只保存低分辨率索引。[^12]

当决策足够完整时，`to-spec` 从已有对话和代码库理解合成规格，不再重复访谈。规格包含用户问题、用户故事、实现决策、测试决策和非目标，但刻意避免容易过时的具体文件路径与代码片段。[^13]

`to-tickets` 再把规格切成 tracer-bullet 垂直切片：每张票都穿过需要的 schema、API、UI 和测试层，独立完成后可演示或验证，且能放进一个新上下文。横跨全仓的机械迁移则走 expand–migrate–contract，而不是强行垂直切分。切分先由人确认粒度与依赖，再发布到 tracker。[^14]

`implement` 本身很薄：针对规格或工单实现，在预先约定的 seam 使用 TDD，持续运行类型检查和单文件测试，最后跑全量测试，再调用独立 code review 并提交。[^15]

Matt 的关键设计是把“发现方向”和“执行工作”分开。Wayfinder 票回答决策问题，实施票交付行为；前者不偷偷写产品，后者不重新谈需求。与重型框架相比，这种模块化更容易嵌入已有仓库。

证据等级：A。

## Thariq Shihipar：访谈、可视化 artifact 与验证环境

Thariq 的起点不是写更长的 prompt，而是判断自己是否真的知道想要什么。需求模糊时，他用“interview me”让 Agent 连续追问受众、约束和遗漏的问题；活动记录显示，一项模糊产品需求可能经过 30–40 个问题。需求已经明确时，则不需要强迫 Agent 采访。[^16]

第二步是用低成本 artifact 缩小未知空间。他会先让 Agent 用 HTML 生成多个交互或视觉方向，人浏览、比较并选定方向，再投入数小时实现。HTML 规格可以包含目录、可折叠区域、代码路径、图表和 mockup，比终端中的长 Markdown 更容易被人认真审查。它不是交付物，而是人机共享的决策界面。

第三步是按“可验证性”设计系统。Thariq 展示的 verification environment 会隔离加载组件、执行动作并记录视频；React 状态与 UI 被拆开，使逻辑和呈现能独立验证。Claude Code 团队还让 review bot 检查每个 PR，关键区域保留 code owner 审批，复杂 PR 用 artifact 辅助人类 review；事故相关 PR 会进入评测集，使自动 review 不再犯同类错误。[^17]

这套流程可以概括为：

`承认未知 → Agent 访谈 → 便宜原型/HTML 规格 → 人选择 → 分阶段实现 → 独立验证环境 → 风险分级 review → 失败进入 eval`

它最有价值的地方是让人停留在循环中，但不要求人盯着 Agent 的每一个工具调用。人主要审查高信息密度 artifact 和关键风险点。

证据等级：B–C。访谈与团队 review 有公开视频或同期记录，但没有本人公开的固定命令仓库。

## Geoffrey Huntley：新上下文反复对齐同一个外部状态

Ralph 的流行版本经常被简化为“把 Agent 放进无限循环”，但 Geoffrey 的原始方法包含大量前置规格和外部状态设计。项目开始时，人先与模型长谈需求，再把规格拆成文件；执行时每轮使用新上下文，读取规格与 `fix_plan.md`，只选择一个最重要的未完成项。[^18]

主上下文尽量只做调度，昂贵的搜索、写入和总结交给 subagent。搜索和相互独立的写入可以高并发，但构建与测试限制为单一执行者，避免共享资源产生背压。每轮通过 Git、计划文件和测试结果观察世界，而不是依赖上一轮对话记忆。

循环的反馈是决定性部分：编译、测试、日志或中间表示把结果送回 Agent；发现新 bug 就修复或写入计划；反复学错命令时更新简短的 `AGENT.md`。如果计划已经偏离现实，操作者会删除或重写 TODO，而不是相信循环自行纠正。

Ralph 适合能够被逐项推进、能自动验证、允许多轮试错的长任务。它不适合产品目标仍在变化、外部动作不可逆、验证只能靠主观判断的任务。错误规格不会因为循环更长而变正确，只会被更彻底地执行。

证据等级：A。

## Andrej Karpathy：把自治约束成可比较实验

`autoresearch` 是自治循环中最干净的实验设计。人提供相对固定的评测环境和 `program.md`，Agent 只修改 `train.py`；实验在专用分支上运行，每轮先提交候选改动，再进行固定五分钟训练，读取 `val_bpb` 和显存指标，把结果写入 TSV。指标改善就保留提交，持平或变差就 reset，崩溃则记录并放弃或进行有限修复。[^19]

它有四个使自治成立的前提：

- 目标被压缩为可比较的主指标，同时保留显存和代码简洁性等约束。
- 实验预算固定，使不同方案公平比较，并能估算整夜成本。
- 可修改对象与评测器分离，Agent 不能轻易通过改评分规则作弊。
- 每轮有 Git 快照和结构化日志，失败可以丢弃，成功可以累积。

这不是通用“让 Agent 自己研究”。它本质上是带人工先验的贪心搜索，最适合反馈快速、结果可量化、实验相互可比的空间。产品策略、架构美感和长期可维护性无法被一个标量完整表达，因此不能照搬“指标变好就留下”。

证据等级：A。

## Armin Ronacher：非编码任务也让 Agent 写一次性代码

Armin 的工作流关注 Agent 如何操作非代码领域。他不给模型暴露大量高层 MCP 工具，而是提供隔离的 Python/Pyodide 环境、文件系统和少量安全资源，让 Agent 为当前任务编写一次性代码。模型已经熟悉 Python 生态，因此处理文档、图片、数据和转换任务时，可以组合成熟库，而不是为每个动作预先设计一个工具。[^20]

权限通过文件系统映射：某些远端资源以只读文件呈现，写入只开放给指定位置；沙箱本身没有任意网络访问，外部系统负责把安全请求映射进来。这样“Agent 会写任意代码”与“Agent 能访问任意资源”被分开。

长流程则需要 durable execution。Armin 建议把任务拆成可缓存步骤，为每一步保存状态；失败重试时读取已经完成的步骤，而不是从头执行。队列负责重新唤醒任务，明确 end condition 决定停止。[^20]

这为 Agent 工作流补上了一个常被忽略的层面：Skill 负责告诉 Agent怎样做，代码解释器提供组合能力，沙箱和文件系统决定它被允许碰什么，持久执行系统保证中断后还能继续。

证据等级：A（架构和实验实践），但它不是固定的软件 PR 流水线。

## Shreya Shankar：窄任务的“生成—自检—删减—评测”微循环

Shreya 维护的 plain-writing Skill 展示了另一种工作流尺度。Agent 写作或改写后，会检查自己的文本，并删除没有新增信息的内容；需要量化效果时，仓库提供独立 evals，而安装 Skill 本身不必携带评测数据。[^21]

这个案例的重要性不在写作规则，而在“微循环”设计：一个 Skill 可以只拥有局部质量闭环，不必接管整个项目。大工作流应该由多个有清楚输入输出的微循环组合，而不是由一个几千行指令文件包办所有判断。

证据等级：B。

## 横向比较

| 实践者 | 人主要负责 | Agent 主要负责 | 核心状态 artifact | 并行方式 | 完成证据 | 学习回流 |
| --- | --- | --- | --- | --- | --- | --- |
| Boris | 计划、会话调度、review | 大部分实现与浏览器迭代 | Plan、checkout、`CLAUDE.md` | 多个本地与云会话 | 测试、浏览器、CI | PR 教训写回项目指令 |
| Peter | 范围、设计、路由、公开决策 | 仓库内实现、修复、调查 | work order、线程、Git、review bundle | 每仓 owner，私有阶段并行 | 精确 head CI、E2E、autoreview | 指令、Skill、交接与复盘 |
| Jesse | brainstorm、方案确认、交付选择 | worktree 内逐任务实现 | 设计、计划、worktree | 任务级 subagent，逐项 review | RED/GREEN、代码评审 | Skill 压力测试后迭代 |
| Every | 产品决策与关键 guardrails | 计划落地、review 修复、PR | plan、Git、`docs/solutions` | 保守独立波次 | 测试、review、浏览器、CI | `ce-compound` |
| Garry | 产品 wedge、角色评审、发布决定 | 构建、真实 QA、交付机械步骤 | brief、plan、PR、retro | 角色/阶段分工 | 浏览器、回归测试、部署健康 | `retro`、`learn` |
| Matt | 回答关键问题、确认 seam 与工单 | 研究、垂直切片实现、review | map、decision ticket、spec、ticket | frontier 中的独立工单 | TDD、类型、全量测试、review | glossary、ADR、handoff |
| Thariq | 暴露未知、选择视觉方向、关键审批 | 访谈、原型、实现、自动 review | HTML spec、mockup、review artifact | 主会话 + 后台探索 | verification environment、录像、eval | 事故样本加入评测集 |
| Geoffrey | 规格、重写错误计划、观察异常 | 每轮一个任务、持续修复 | specs、`fix_plan.md`、Git | 搜索/写入高并发，验证串行 | 编译、测试、日志 | 简短 `AGENT.md` 与计划 |
| Karpathy | 目标函数、约束、实验组织提示 | 生成实验、运行、筛选 | `program.md`、分支、TSV | 可按 GPU/分支隔离 | 固定预算指标 | 保留成功提交与结果日志 |
| Armin | 能力边界、资源映射、结束条件 | 写一次性代码并组合工具 | 虚拟文件、步骤缓存 | 队列与可重试步骤 | 程序输出与 end condition | 缓存状态、可复用脚本 |

## 公开实践真正收敛的原则

### 人管“值不值得”和“什么算完成”，Agent 管“具体怎样做”

Anthropic 的真实使用数据不是“Agent 已经完全自治”，而是人和 Agent 的决策分工正在稳定：人保留多数规划决策，Agent承担多数执行决策。[^1] Peter、Every 和 Matt 都进一步把这种分工写进 artifact 合约：计划冻结 WHAT，执行者在代码面前决定 HOW。

### 前置工作没有消失，而是从写代码变成消除未知

Boris 在 Plan mode 来回修正，Jesse 先 brainstorm，Matt 用 grilling 和 decision tickets，Thariq 用访谈和便宜 mockup。共同逻辑是：生成代码已经很便宜，错误方向上的大量生成仍然昂贵。最有杠杆的人类工作发生在“决定是否值得让 Agent 跑几个小时”之前。

### 并行的单位是隔离的责任，不是窗口数量

Peter 按仓库分 owner，Matt 按 frontier decision ticket 分会话，Jesse 每项任务派一个 subagent，Anthropic 的 C 编译器实验用独立容器、仓库副本和任务锁协调多个 Claude。[^22] 并行的必要条件是独立写入面、唯一 owner、可合并状态和单一验证责任。

### 验证能力决定自治上限

Thariq 主张按可验证性拆代码；Boris 让 Agent 操作真实浏览器；Garry 将 QA、部署和 canary 纳入流程；Karpathy 固定评测器；Geoffrey 不断把编译与日志送回循环。模型更强并不会取消验证，反而让一次错误运行能走得更远，因此更需要提前建设环境反馈。

### Review 正从一次人工检查变成可训练系统

Claude Code 团队不是突然取消人工 review，而是从全部人工审查开始，逐步观察自动 review 在哪些文件上能稳定捕获问题；事故 PR 被加入 eval set，关键代码仍需 code owner。[^17] 可靠自治的路径是积累评测证据后逐步放权，而不是一次性打开全自动。

### 记忆必须从“保存对话”升级为“改变下一次行为”

`CLAUDE.md`、`AGENT.md`、`docs/solutions`、ADR、glossary、评测集和 Skill 都是不同时间尺度的记忆。好的回流不是记录所有发生过的事，而是把高复用、难以从代码推导、能改变未来行为的结论放到下一次必经的入口。

## 常见误读

### “高手都在同时跑十几个 Agent”

只有当任务能隔离、失败可丢弃、验证不争用且人有足够 review 带宽时，并行才提高吞吐。Boris 的并行会话存在显著放弃率；Peter 则对并行范围、worker ownership 和公开动作做了大量限制。普通任务更常见的最优解仍是一个强主会话加少量独立探索。

### “先写一份巨细无遗的计划”

Every 的计划只冻结决策与 guardrails，不冻结容易过时的实现细节；Matt 也避免在 spec 中写具体路径和代码。计划的目标是减少重复决策，不是抢在执行者看到真实代码前替它写完实现。

### “Ralph 就是无限循环”

循环只是外壳。规格、单项任务、外部状态、自动反馈、Git 回滚和人工重写错误计划才是系统。缺少这些条件时，无限循环只会无限消耗。

### “最终有人扫一眼 PR 就够了”

Agent 生成量提高后，人类逐行 review 会成为吞吐瓶颈，而且人很容易对大 diff 失去注意力。成熟体系把类型、测试、浏览器、模拟器、安全检查、独立 Agent review 和线上监控组合起来，人集中处理高风险与异常。

### “工作流越完整越专业”

一行 typo 不需要 brainstorm、CEO review、浏览器 QA 和 retro。Every、Peter 和 Matt 都有跳过或降级路径。工作流的专业性体现在能按风险和歧义选择深度，而不是所有任务都走最长路径。

## Edges 的建议工作流

Edges 已经具备研究、项目记忆、领域建模和 grilling 等能力。最需要补的是把这些能力接成显式控制流，并让证据成为一等 artifact。

### 三条执行车道

| 车道 | 触发条件 | 推荐流程 |
| --- | --- | --- |
| Direct | 改动小、目标明确、可立即验证、无外部副作用 | 读取约束 → 修改 → 聚焦验证 → diff 检查 → 报告 |
| Bounded | 有行为变化、跨文件、存在设计选择或需要研究 | 记忆/现状 → grilling 或 spec → 实施单元 → 隔离执行 → 验证 envelope → review → remember |
| Autonomous | 单元可重复、反馈机器可判、失败可回滚、环境隔离、预算明确 | 冻结目标和评分器 → 建基线 → 循环实验/实现 → keep/discard → 预算或完成条件停止 → 人审查 |

默认车道应是 Bounded。Direct 是低风险优化，Autonomous 是满足严格前置条件后的特权模式，不应由任务“看起来很大”自动触发。

### 五个 artifact 合约

1. **Decision brief**：问题、目标、非目标、关键取舍、验收条件；不塞容易过期的代码细节。
2. **Work order**：精确范围、允许修改的位置、禁止事项及失败逃生口、验证命令、预期输出。
3. **Result envelope**：改了什么、没有改什么、运行了哪些验证、结果、残余风险、阻塞。
4. **Evidence record**：与产物类型对应的最新证据；代码是测试和 diff，界面是实际交互，研究是可追溯来源，Skill 是触发与效果评测。
5. **Learning record**：只有未来无法从代码或 Git 推导、且会改变行为的结论才进入项目记忆或 Skill。

### 并行准入检查

只有同时满足以下条件才并行：任务输出可以独立描述；写入面不重叠或有独立 worktree；每个单元有唯一 owner；集成顺序明确；验证资源不会互相污染；失败可以单独重试或丢弃。否则应串行推进，或只把只读研究分出去。

### 完成证据门

任何任务在宣布完成前，都应回答四个问题：

- 证据是否刚刚生成，而不是引用旧结果？
- 证据是否覆盖了用户可见行为，而不只覆盖内部实现？
- review 是否与实现者的自述相互独立？
- 是否明确披露未验证部分和残余风险？

这比新增更多“角色 Skill”更能提高 Edges 的可靠性。

## 30 天试点

第一周只定义三车道路由和五个 artifact 模板，不引入新的大框架。选择一个文档任务、一个 Skill 维护任务和一个代码改动，记录当前返工点与验证缺口。

第二周为 Bounded 车道加入统一 result/evidence envelope，并用现有 project memory 区分短期 handoff 与长期结论。观察是否减少了“Agent 声称完成但证据不足”的情况。

第三周选一个有清晰自动反馈的小任务试验 Autonomous 车道，强制设置迭代次数、时间或成本预算，评分器与可修改对象分离，每轮保留结构化结果。不要用生产发布或主观产品设计作为首个试点。

第四周把真实失败加入工作流评测：哪些请求应走 Direct 却误触发重流程，哪些高风险任务错误跳过规格，哪些验证没有覆盖真实行为。只有评测显示明确增益的规则才保留，重复或低收益的步骤删掉。

## 最终判断

Agent 高手的工作流没有收敛到一个万能框架，而是收敛到一种控制论：目标由人定义，执行由 Agent 扩张，状态由 artifact 持久化，环境提供反馈，评审决定放权边界，经验改变下一次运行。

最值得学习的对应关系是：

- 向 Boris 学“先把计划谈清，再把执行并行化”。
- 向 Peter 学“并行私有工作，串行公共动作；自主不等于授权扩张”。
- 向 Jesse 学“把工程纪律写成默认行为，并测试规则是否真的生效”。
- 向 Every 学“每次交付都要给下一次留下可检索收益”。
- 向 Garry 学“用不同评审镜头补回一个人做产品时缺失的组织职能”。
- 向 Matt 学“把未知问题、决策和实现切片分成不同 artifact”。
- 向 Thariq 学“用可读的 artifact 让人高效留在循环里，用可验证性塑造代码”。
- 向 Geoffrey 和 Karpathy 学“只有反馈、状态、回滚和预算齐全时，长循环才是真自治”。
- 向 Armin 学“能力、权限和持久执行是三件不同的基础设施”。

对 Edges 而言，理想状态不是 Agent 跑得更久，而是每多跑一轮，系统更清楚自己为什么继续、凭什么完成，以及下一次怎样少犯一个错误。

## Sources

[^1]: Anthropic. “[How Claude Code is used in practice](https://www.anthropic.com/research/claude-code-expertise).” July 2026.
[^2]: Sergio De Simone, InfoQ. “[Inside the Development Workflow of Claude Code's Creator](https://www.infoq.com/news/2026/01/claude-code-creator-workflow/).” January 10, 2026. The article links Boris Cherny’s original X thread and follow-up clarifications.
[^3]: Peter Steinberger. “[Maintainer Orchestrator](https://github.com/steipete/agent-scripts/blob/main/skills/maintainer-orchestrator/SKILL.md).” `steipete/agent-scripts`, accessed September 10, 2026.
[^4]: Peter Steinberger. “[Codex First](https://github.com/steipete/agent-scripts/blob/main/skills/codex-first/SKILL.md).” `steipete/agent-scripts`, accessed September 10, 2026.
[^5]: Peter Steinberger. “[Agent Scripts repository instructions](https://github.com/steipete/agent-scripts/blob/main/AGENTS.MD).” GitHub, accessed September 10, 2026.
[^6]: Jesse Vincent. “[Superpowers: How I'm using coding agents in October 2025](https://blog.fsck.com/2025/10/09/superpowers/).” October 9, 2025.
[^7]: Jesse Vincent / Prime Radiant. “[Superpowers](https://github.com/obra/superpowers)” and “[writing-skills](https://github.com/obra/superpowers/blob/main/skills/writing-skills/SKILL.md).” GitHub, accessed September 10, 2026.
[^8]: EveryInc. “[ce-work guide](https://github.com/EveryInc/compound-engineering-plugin/blob/main/docs/guides/ce-work.md).” GitHub, accessed September 10, 2026.
[^9]: EveryInc. “[Compound Engineering Plugin](https://github.com/EveryInc/compound-engineering-plugin).” GitHub, accessed September 10, 2026.
[^10]: Garry Tan. “[gstack workflow](https://gstack.lol/).” Accessed September 10, 2026.
[^11]: Garry Tan. “[gstack](https://github.com/garrytan/gstack).” GitHub, accessed September 10, 2026.
[^12]: Matt Pocock. “[wayfinder](https://github.com/mattpocock/skills/blob/main/skills/engineering/wayfinder/SKILL.md).” `mattpocock/skills`, accessed September 10, 2026.
[^13]: Matt Pocock. “[to-spec](https://github.com/mattpocock/skills/blob/main/skills/engineering/to-spec/SKILL.md).” `mattpocock/skills`, accessed September 10, 2026.
[^14]: Matt Pocock. “[to-tickets](https://github.com/mattpocock/skills/blob/main/skills/engineering/to-tickets/SKILL.md).” `mattpocock/skills`, accessed September 10, 2026.
[^15]: Matt Pocock. “[implement](https://github.com/mattpocock/skills/blob/main/skills/engineering/implement/SKILL.md).” `mattpocock/skills`, accessed September 10, 2026.
[^16]: Carolina Cherry. “[How We Claude Code — Thariq's Workshop Recap](https://howborisusesclaudecode.com/recap).” Notes from Code w/ Claude Extended, May 7, 2026; quotes may be lightly edited from a voice recording.
[^17]: Simon Willison. “[A Fireside Chat with Cat and Thariq from the Claude Code team](https://simonwillison.net/2026/Jul/21/cat-and-thariq/).” July 21, 2026.
[^18]: Geoffrey Huntley. “[Ralph Wiggum as a ‘software engineer’](https://ghuntley.com/ralph/).” July 2025, accessed September 10, 2026.
[^19]: Andrej Karpathy. “[autoresearch program.md](https://github.com/karpathy/autoresearch/blob/master/program.md).” GitHub, accessed September 10, 2026.
[^20]: Armin Ronacher. “[Building an Agent That Leverages Throwaway Code](https://lucumr.pocoo.org/2025/10/17/code/).” October 17, 2025.
[^21]: DocWriter / Shreya Shankar. “[Plain writing skill](https://github.com/docwriter-org/plain-writing-skill).” GitHub, accessed September 10, 2026.
[^22]: Anthropic. “[Building a C compiler with a team of parallel Claudes](https://www.anthropic.com/engineering/building-c-compiler).” February 2026.
