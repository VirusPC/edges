# 代码仓库中的 Agent Memory Benchmark 与 Memory 设计研究

> 续篇：[2026-09-15 第二轮调研](2026-09-15-agent-memory-benchmarks-round-2.md)。本文 §2.2、§5.3、§5.5、§6 的若干判断在那里被修订——现成的时间序仓库环境、SWE-bench 系列的污染边界、以及更细的 Memory 隔离对照组。

## 摘要

截至 2026 年 9 月，**真正把“代码仓库环境中的 Memory 能力”作为独立变量进行评估的公开 benchmark 仍然很少**。最直接的两个是：

1. **SWE-ContextBench**：评估 Coding Agent 能否从过去解决过的相关 GitHub issue/PR 中检索、选择、压缩并复用经验；这是目前最贴近“Agent 在一个代码仓库里越用越懂”的公开基准。
2. **MemGym 的 Coding tracks**：评估 Agent 在一次长时程仓库任务中，能否正确保留、压缩或遗忘工具输出和调试证据；它更偏向 working memory / context management，并通过 memory-isolated reward 尝试把 Memory 与模型推理、工具使用解耦。

此外，**CodeIF-Bench + CodeMEM**覆盖同一仓库内多轮需求迭代；**SWE-EVO**覆盖跨版本、跨文件的软件演化；**SWE-bench / SWE-bench Live / SWE-bench Pro**是很好的底层任务环境，但默认并不是 Memory benchmark。RepoMem、MemCoder、Confucius Code Agent 等工作在这些环境上验证了 Memory 设计，却没有都形成严格的 Memory 专项 benchmark。

核心判断是：如果目标是构建个人 benchmark，不应简单地给 SWE-bench Agent 接一个向量库并比较最终 Resolve Rate。更好的设计是同时测量三条链路：

- **仓库认知**：从历史代码、commit、issue、文档中形成可更新的 semantic memory；
- **经验学习**：从过去任务的成功与失败轨迹中形成 episodic / procedural memory；
- **当前执行**：在长轨迹中压缩 working memory，同时保留关键证据和状态。

最终指标不能只有任务成功率，还应包含检索准确率、采纳率、反事实 Memory Gain、负迁移率、token/时间成本和跨版本失效率。

---

## 1. 什么才算“在代码仓库里进行的 Memory benchmark”

本文采用较严格的判定标准。一个 benchmark 至少要满足以下三项中的前两项，才称为 repo-level Memory benchmark：

1. **环境真实性**：Agent 能读取、搜索、编辑和执行真实或完整代码仓库；
2. **时间性**：信息在多个步骤、轮次、任务或版本之间产生，后续行为需要复用过去信息；
3. **Memory 可归因性**：存在 no-memory、oracle-memory、错误 memory、不同压缩/检索策略等对照，能够区分“模型本来就会”与“Memory 带来的收益”。

这一区分非常重要：

- RepoBench、CoderEval、CrossCodeEval 等测试的是 **repository context utilization / retrieval**，通常没有跨时间的记忆形成与更新；
- SWE-bench 测试真实仓库问题解决，但每个 issue 默认是独立 episode；
- LoCoMo、LongMemEval、MemoryAgentBench 测长期记忆，但主要载体是对话或事实流，不是代码仓库；
- 只有任务之间存在因果关联或共享经验，并且显式控制 Memory，才能较可信地测“越做越会”。

因此，**长上下文不等于 Memory，仓库 RAG 不等于 Memory，保存完整轨迹也不等于有效 Memory**。Memory 至少涉及形成、组织、检索、更新、遗忘和使用中的一个闭环。

---

## 2. 最相关的公开 Benchmark

### 2.1 第一梯队：直接测代码 Agent Memory

| Benchmark | Memory 时间尺度 | 仓库环境 | 主要任务 | 是否隔离 Memory | 适合回答的问题 |
|---|---|---:|---|---:|---|
| **SWE-ContextBench** | 跨任务、跨 issue/PR | 是 | 真实 GitHub issue 修复 | 较强 | 过去经验能否被正确检索、压缩和迁移到相关新任务？ |
| **MemGym – SWE-Gym / CodeQA** | 单任务长轨迹 | 是 | 调试、工具交互、仓库 QA | 强 | 哪些消息应保留、总结或遗忘？压缩是否破坏后续行为？ |
| **CodeIF-Bench L-2 + CodeMEM 扩展** | 同一需求的多轮迭代 | 是 | 九轮可执行需求增量 | 中等 | Agent 能否记住旧约束，并在连续修改中避免遗忘和冲突？ |

#### SWE-ContextBench

SWE-ContextBench 是目前最直接的 repo-level experiential memory benchmark。它基于 SWE-bench Lite、Verified 和 Multilingual，包含 **1,100 个基础任务与 376 个相关任务，覆盖 51 个真实仓库和 9 种语言**；Lite 版包含 300 个基础任务与 99 个相关任务。任务之间的关联来自真实 issue/PR 的引用、依赖和递归关系，而不是人工制造的文本相似度。[论文](https://arxiv.org/abs/2602.08316)

它构建过去任务的完整 Agent 轨迹或摘要作为 experience pool，并设置：

- No Experience；
- Free Experience Retrieval；
- Oracle Experience；
- Free Summary；
- Oracle Summary。

这套设置的最大价值是把两个问题拆开：**Memory 本身是否有用**，以及 **Agent 能否找到正确的 Memory**。研究显示，正确选中的紧凑摘要能提高解决率并降低时间/成本；未过滤或错误选择的经验可能无效甚至有害。论文在 Lite 的 99 个相关任务上还比较了 Supermemory、OpenViking 和 mem0，说明它已经接近一个可插拔 Memory 系统评测框架。

局限也很明显：任务关系由 issue/PR 显式引用定义，可能偏向容易发现的关联；experience pool 的轨迹质量依赖基础 Agent；而且它主要测跨任务经验复用，不完全覆盖仓库知识随版本变化后的遗忘与修正。

#### MemGym

MemGym 将 Memory Manager 放在环境与 policy LLM 之间，统一包装 SWE-Gym、工具对话、WebArena，以及自建 CodeQA/Deep Research 任务。[论文与代码](https://arxiv.org/abs/2605.20833)

对 Coding Agent 而言，它的重要创新不是又做了一套 SWE 任务，而是：

- 固定推理模型，以 with-memory / no-memory 配对运行；
- 记录每次压缩事件、被遗忘的消息索引和摘要；
- 使用 replay-and-fork 观察在某个压缩点采取不同决策是否改变最终行为；
- 训练轻量 MemRM，估计一次压缩是 safe 还是 harmful，降低反复跑 Docker 的成本。

它最适合评估 **working memory formation**：终端输出、测试失败、工具调用结果、已验证假设和当前计划，哪些应继续驻留在上下文中。它不主要回答“几周前解决过的另一个 issue 能否帮助今天的任务”，而是回答“长轨迹里怎样不丢掉真正承载因果的信息”。

#### CodeIF-Bench 与 CodeMEM

CodeMEM 使用 CodeIF-Bench 的 L-2 repository-level 场景：40 段对话、360 条指令，每段围绕一个 Python 仓库任务连续给出 9 条可执行、互不冲突的需求；同时把 CoderEval 扩展为多轮仓库生成任务。[CodeMEM 论文](https://arxiv.org/abs/2601.02868)

它测的是 **同一开发会话中的增量约束保持**：新功能加入后，之前已经满足的要求是否被破坏。相比 SWE-ContextBench，它不是跨 issue 的经验迁移，更接近真实的“用户连续改需求”。它适合验证 session memory、diff memory 和 conflict detection，但任务规模与轮数仍有限。

### 2.2 第二梯队：不是 Memory benchmark，但可作为 Memory 试验场

| Benchmark / protocol | 原始目标 | 与 Memory 的关系 | 使用建议 |
|---|---|---|---|
| **SWE-bench Verified / Live / Pro** | 单 issue 真实仓库修复 | RepoMem、MemCoder、CCA 都在其上验证 Memory | 需要自行构造时序、对照组和防泄漏策略 |
| **SWE-EVO** | 从一个版本演化到下一版本 | 天然需要跨步骤状态、计划与架构知识 | 适合长时程 working memory 与版本化 semantic memory |
| **LoCoBench-Agent** | 长上下文软件工程交互 | Memory 是负载因素，但未被独立隔离 | 适合压力测试压缩与检索，不宜单独声称 Memory 提升 |
| **GitTaskBench** | 利用现有 GitHub 仓库完成真实工作流 | 适合测仓库知识和过程经验复用 | 任务少且异质，适合案例分析而非细粒度统计 |
| **RepoBench / CoderEval / DevEval** | 仓库级补全与生成 | 测静态代码上下文检索和利用 | 可测 semantic code memory，不足以测跨任务学习 |

#### SWE-EVO 为什么值得关注

SWE-EVO 从 7 个成熟 Python 项目的 release notes 和版本历史构建 48 个软件演化任务，平均涉及 21 个文件，并通过平均 874 个测试验证结果。[论文](https://arxiv.org/abs/2512.18470)

它不是显式 Memory benchmark，但比单 issue 的 SWE-bench 更适合测：

- 长计划在多轮修改中的保存与修正；
- 已完成子需求和未完成子需求的状态记忆；
- 架构约束、回归风险和跨文件依赖的语义记忆；
- 版本变化后旧知识的失效与更新。

如果将一个 release 拆成按真实 commit/PR 顺序到达的任务流，再加入 no-memory / persistent-memory / stale-memory 对照，SWE-EVO 可以被改造成很有价值的持续软件演化 Memory benchmark。

---

## 3. 对应的代码 Memory 设计论文

### 3.1 RepoMem：把 Git 历史变成仓库记忆

**Improving Code Localization with Repository Memory** 提出了两个互补存储：[论文](https://arxiv.org/abs/2510.01003)

- **Episodic memory**：过去 commit、patch、commit message、关联 issue 和时间戳；通过 `SearchCommit` 与 `ExamineCommit` 检索具体先例。
- **Semantic memory**：根据修改频率选择活跃文件，再为其生成高层功能摘要；通过 `SearchSummary` 与 `ViewSummary` 查询。

论文严格限制只使用目标 issue 的 base commit 之前的历史，并去除文本重叠和直接关联项以降低泄漏。在 SWE-bench Verified 上，RepoMem 将文件定位 Acc@5 从 LocAgent 的 71.6% 提高到 76.5%；在历史丰富的仓库中增益更明显，历史少或噪声多的仓库中可能下降。

这是目前最值得借鉴的 repo-native memory 设计，因为 Memory 的来源不是 Agent 自说自话的摘要，而是 Git 已验证历史。其不足是只优化 code localization，尚未证明最终补丁质量、跨版本一致性与长期更新策略。

### 3.2 MemCoder：历史人类经验 + 已验证新经验的闭环

**Your Code Agent Can Grow Alongside You with Structured Memory** 将 commit 历史结构化为“意图—修改—验证”的 Memory，并通过双阶段检索将历史经验用于需求具体化、测试生成和实现；被人类验证的解决方案再写回长期 Memory，形成持续演化闭环。[论文](https://arxiv.org/abs/2603.13258)

它代表一种更完整的设计：

1. 从历史贡献重建 developer cognition；
2. 按当前问题检索相似经验；
3. 用经验补全模糊需求和测试计划；
4. 将人类接受的最终实现固化为新 Memory。

论文在 SWE-bench Verified 上报告 DeepSeek-V3.2 的解决率从 68.4% 提升到 77.8%。但要谨慎解释：SWE-bench Verified 不是跨任务 Memory 专项 benchmark，总分同时受 scaffold、提示、测试生成和模型能力影响，难以把全部增益归因于 Memory。

### 3.3 CodeMEM：以 AST 与 Diff 为中心的双层会话记忆

CodeMEM 不把代码当普通文本。它把 Memory 分成：[论文](https://arxiv.org/abs/2601.02868)

- **Code Context Memory**：以函数/类 AST block 为单位，key 保存签名、属性、方法和注释，value 保存完整实现；根据 API 依赖选择和淘汰 block。
- **Code Session Memory**：保存用户指令、当前代码、AST diff 和修改说明，并按同一函数的演化串成序列。

其核心优势是 Memory 单位与代码结构、修改状态和接口依赖对齐，能检测“后续编辑把前一轮功能改没了”这类冲突。在 CodeIF-Bench 与扩展 CoderEval 上，它改善当前轮/全会话指令遵循并减少交互轮次。

这是 session memory 的强设计，但对 JavaScript/TypeScript、多语言 AST、重构导致符号迁移，以及跨仓库经验复用仍缺少证据。

### 3.4 Confucius Code Agent：工作记忆与持久笔记分离

CCA 明确区分：[论文](https://arxiv.org/abs/2512.10398)

- **Hierarchical working memory**：面向当前长轨迹，进行分层压缩；
- **Persistent Markdown notes**：由独立 NoteTaker 从会话中提炼成功策略和失败教训，供以后任务检索；
- **AX / UX 分离**：人看到完整日志和 diff，Agent 只看到压缩后的任务相关状态。

作者在 151 个 SWE-bench Pro 实例上做两次连续运行：第二次使用第一次生成的 notes，平均 turns 从 64 降至 61、token 从 104k 降至 93k、Resolve Rate 从 53.0% 升至 54.4%。这证明结构化 Markdown 笔记可能有价值，但“对同一题重跑”容易混入答案记忆，迁移性弱于相关但不同任务的评估。

### 3.5 通用经验记忆：Reflexion、ExpeL 与 Voyager

这些论文不是仓库级 Coding Memory 方案，但构成了后来设计的三条思想来源：

- **Reflexion**：根据测试或环境反馈生成语言反思，放入 episodic buffer，在下一次尝试中复用；曾在 HumanEval 上评估。[论文](https://arxiv.org/abs/2303.11366)
- **ExpeL**：从一组训练任务的成功与失败轨迹中归纳自然语言 insight，并在新任务中检索具体经验与抽象规则。[论文](https://arxiv.org/abs/2308.10144)
- **Voyager**：把经过执行验证的代码技能存进可检索 skill library，并持续组合和扩展；环境是 Minecraft，而不是软件仓库。[论文](https://arxiv.org/abs/2305.16291)

它们分别对应三类可迁移设计：失败反思、跨任务程序性规则、可执行技能库。直接迁入 Coding Agent 时，必须增加仓库作用域、版本绑定、测试证据和失效机制，否则会产生“看似合理但已过期”的经验污染。

---

## 4. 一个统一的 Repo-level Memory 分类

| Memory 层 | 典型内容 | 来源 | 生命周期 | 代表工作 |
|---|---|---|---|---|
| Working / execution | 当前计划、终端结果、测试失败、假设状态 | 当前轨迹 | 单任务 | MemGym、CCA working memory |
| Semantic repository | 模块职责、架构、不变量、热点文件、依赖图 | 当前代码、文档、历史统计 | 随版本更新 | RepoMem semantic、CodeMEM context |
| Episodic | 具体 issue、commit、失败尝试、解决 diff | Git 历史和 Agent 轨迹 | 跨任务 | RepoMem episodic、SWE-ContextBench |
| Procedural / skill | 调试流程、迁移 SOP、验证清单、可执行脚本 | 多个成功/失败 episode 的归纳 | 跨仓库或仓库内长期 | ExpeL、Voyager、CCA notes |
| Preference / intent | 代码风格、技术取舍、用户反馈、审核结论 | 人类交互和 accepted patch | 用户/团队长期 | MemCoder |

真正有效的 Coding Memory 往往不是单一向量库，而是五层的组合。至少应包含这些元数据：

- `repo_id`、branch、base commit、有效版本区间；
- 来源证据及其可验证状态；
- task / symbol / file / subsystem scope；
- 成功、失败、部分成功和人类采纳标签；
- 创建时间、最近使用时间、最后验证时间；
- 与其他 memory 的支持、冲突和替代关系。

---

## 5. 现有研究的关键缺口

### 5.1 Memory 与基础 Agent 能力严重纠缠

最终 Resolve Rate 同时受模型、提示词、搜索工具、执行预算、测试生成和 Memory 影响。只比较“Agent + Memory”和另一个公开 leaderboard 分数，几乎不能说明 Memory 是否有效。SWE-ContextBench 的 oracle/free 对照和 MemGym 的 replay-and-fork 是更可靠的方向。

### 5.2 缺少真实的顺序任务流

软件开发的 Memory 应面对连续到达的 issue、需求变更、revert、重构和版本升级。多数研究把静态 benchmark 任意排序，或者对同一道题再次运行。这无法测知识更新、灾难性干扰和跨版本失效。

### 5.3 负迁移和陈旧记忆没有被认真测量

Memory 可能让 Agent 更自信地做错。真正的 benchmark 应包含：

- 表面相似但根因不同的 hard negatives；
- 某一历史实践后来被废弃或 revert；
- API/架构迁移使旧经验失效；
- 用户偏好发生显式改变；
- 两条 Memory 互相冲突，需要依据版本和证据裁决。

### 5.4 过度关注“召回”，忽略“采纳与结果”

检索到了正确记录，不代表 Agent 使用了它；使用了也不代表结果更好。需要记录完整链路：

`可用 Memory → 被召回 → 被模型引用/采纳 → 改变了行动 → 测试通过 → 后续未回归`

### 5.5 Git 历史既是高价值数据，也是泄漏源

目标 patch、未来 commit 或直接关联 issue 一旦进入 Memory，benchmark 就退化为答案检索。RepoMem 的时间截断、直接关联过滤和文本重叠过滤应成为最低标准；还应对生成模型训练污染与公开 benchmark 记忆做时间隔离。

---

## 6. 推荐的个人 Benchmark：RepoMem-Eval

### 6.1 目标

评估同一个固定 Coding Agent 在持续参与代码仓库开发时，是否能够以更低成本、更少返工、更高成功率完成后续任务，同时避免过时经验造成负迁移。

### 6.2 最小可行版本

从一个有完整 Git history、issue/PR 和测试的熟悉仓库开始，按时间选择 30–50 个任务。严格按 `base_commit` 切分，每个任务只能读取当时及以前的信息。将任务构造成 4 类：

1. **Related-positive**：历史任务确实提供可复用的模块知识或解决模式；
2. **Unrelated**：没有相关历史，Memory 应选择不召回；
3. **Hard-negative**：文本或模块相似，但旧方案不适用；
4. **Stale/conflict**：旧知识后来被修改、废弃或 revert。

首版可只比较四组：

| 组别 | 设置 | 目的 |
|---|---|---|
| A | No memory | 固定基础能力基线 |
| B | Full raw history | 验证“把所有历史塞进去”是否产生噪声 |
| C | Retrieved structured memory | 测真实 Memory 系统 |
| D | Oracle memory | 给定人工标注的正确 Memory，测理论上限与使用能力 |

其中 C 组的 Memory 先做三层即可：

- `repo_semantics.md`：模块职责、约束、关键依赖，绑定 commit/version；
- `episodes/*.md`：问题、关键证据、失败路径、最终 diff、测试结果；
- `procedures/*.md`：从多个 episode 归纳出的 SOP、验证清单与适用/禁用条件。

这与 edges 的“文件系统是终极上下文”和人—AI共读思路高度兼容。Markdown 可以作为可审计的 canonical memory，BM25/embedding/graph 只是索引，不应成为唯一事实源。

### 6.3 指标体系

#### 任务结果

- `Resolve Rate / Pass@1`
- `FAIL_TO_PASS` 与 `PASS_TO_PASS`
- 首次正确率、回归数、人工返工分钟数

#### Memory 链路

- **Recall Precision / Recall@k**：正确 Memory 是否进入 top-k；
- **Adoption Rate**：召回后是否实际影响计划、文件定位或 patch；
- **Adoption Success Rate**：采纳后是否通过验证；
- **Negative Transfer Rate**：因错误或陈旧 Memory 导致原本可完成的任务失败；
- **Conflict Resolution Accuracy**：能否选择版本正确、证据更强的记录。

#### 因果与效率

- **Memory Gain**：同一任务、同模型、同预算下 `Score(memory) - Score(no-memory)`；
- **Oracle Gap**：`Score(oracle) - Score(retrieved)`，主要反映检索/路由损失；
- token、wall-clock、tool calls、测试轮次和美元成本；
- 与个人指标对齐的 **RTR** 与 **AINE**：Memory 是否真正减少返工，并带来净效率，而非只节省输入 token。

#### 长期质量

- 每条 Memory 的复用次数、成功次数、最后验证版本；
- Memory 更新延迟、重复率、失效率；
- 单位存储/构建成本带来的累计成功增益，可作为 COR 的一个局部代理。

### 6.4 实验纪律

- 固定模型版本、temperature、工具和预算；
- 每组至少多次运行，报告均值和置信区间；
- 任务严格按时间切分，禁止读取未来 commit；
- 将 retrieval、memory utilization、最终执行分别打日志；
- 对失败做因果标签：未召回、召回错误、理解错误、未采纳、工具失败、实现失败；
- 同时保留 oracle 组，否则无法判断瓶颈在记忆库、检索器还是执行 Agent。

---

## 7. 最终建议

如果现在只做一件事，应该先复现 **SWE-ContextBench Lite 的四组对照思想**，但不必立刻跑完整 399 个任务。先在一个熟悉的 TypeScript/前端仓库中按真实时间线构造 30–50 个任务，以 Markdown 为 canonical memory，加入版本作用域和测试证据，再测 no-memory、raw-history、retrieved-memory、oracle-memory。

技术设计上，优先组合：

1. **RepoMem** 的 Git-native episodic + semantic memory；
2. **CodeMEM** 的 AST/symbol/diff 级 session memory；
3. **CCA** 的 working memory 与持久笔记分离；
4. **SWE-ContextBench** 的 related-task 与 oracle/free 检索对照；
5. **MemGym** 的压缩事件与反事实评估思路。

不建议第一版就做复杂知识图谱或训练专用 Memory 模型。当前最大的不确定性不是“图数据库还是向量数据库”，而是：**什么经验真正能提升后续任务、什么时候会产生负迁移、如何用低成本验证 Memory 被召回并被有效采纳。**先把这三件事测清楚，再升级存储结构，长期价值更高。

---

## Sources

1. Liu et al. “[SWE Context Bench: A Benchmark for Context Learning in Coding](https://arxiv.org/abs/2602.08316).” 2026.
2. Xu et al. “[MemGym: a Long-Horizon Memory Environment for LLM Agents](https://arxiv.org/abs/2605.20833).” 2026.
3. Ding et al. “[CodeMEM: AST-Guided Adaptive Memory for Repository-Level Iterative Code Generation](https://arxiv.org/abs/2601.02868).” 2026.
4. Gao et al. “[Improving Code Localization with Repository Memory](https://arxiv.org/abs/2510.01003).” 2025.
5. “[Your Code Agent Can Grow Alongside You with Structured Memory](https://arxiv.org/abs/2603.13258).” 2026.
6. “[Confucius Code Agent: Scalable Agent Scaffolding for Real-World Codebases](https://arxiv.org/abs/2512.10398).” 2025/2026 revision.
7. Pham et al. “[SWE-EVO: Benchmarking Coding Agents in Long-Horizon Software Evolution Scenarios](https://arxiv.org/abs/2512.18470).” 2025/2026 revision.
8. Jimenez et al. “[SWE-bench: Can Language Models Resolve Real-World GitHub Issues?](https://arxiv.org/abs/2310.06770).” 2023/ICLR 2024.
9. Pan et al. “[Training Software Engineering Agents and Verifiers with SWE-Gym](https://arxiv.org/abs/2412.21139).” 2024.
10. Qiu et al. “[LoCoBench-Agent: An Interactive Benchmark for LLM Agents in Long-Context Software Engineering](https://arxiv.org/abs/2511.13998).” 2025.
11. Ni et al. “[GitTaskBench: A Benchmark for Code Agents Solving Real-World Tasks Through Code Repository Leveraging](https://arxiv.org/abs/2508.18993).” 2025.
12. Hu, Wang, and McAuley. “[MemoryAgentBench: Evaluating Memory in LLM Agents via Incremental Multi-Turn Interactions](https://github.com/HUST-AI-HYZ/MemoryAgentBench).” ICLR 2026.
13. Shinn et al. “[Reflexion: Language Agents with Verbal Reinforcement Learning](https://arxiv.org/abs/2303.11366).” NeurIPS 2023.
14. Zhao et al. “[ExpeL: LLM Agents Are Experiential Learners](https://arxiv.org/abs/2308.10144).” AAAI 2024.
15. Wang et al. “[Voyager: An Open-Ended Embodied Agent with Large Language Models](https://arxiv.org/abs/2305.16291).” 2023.
16. Zhang et al. “[RepoCoder: Repository-Level Code Completion Through Iterative Retrieval and Generation](https://arxiv.org/abs/2303.12570).” EMNLP 2023.
17. Tang et al. “[ML-Bench: Evaluating Large Language Models and Agents for Machine Learning Tasks on Repository-Level Code](https://arxiv.org/abs/2311.09835).” 2023.

