# Agent Memory Benchmark 第二轮调研：现成环境、隔离协议与可信度边界

调研日期：2026-09-15。这是 [2026-09-09 那份笔记](2026-09-09-repo-level-agent-memory-benchmarks.md) 的续篇，不覆盖它。上一轮回答「有哪些 benchmark」，这一轮回答三个更要紧的问题：**哪些环境现在就能直接用、怎么把 Memory 的贡献从模型能力里隔离出来、哪些数字不能引用**。

证据纪律：全部 arXiv 编号都由调研 Agent 实际抓取 `arxiv.org/abs/` 页面核对过标题、作者、日期；核实不了的单列在第 10 节，正文不出现。厂商博客只能证明「它公开这样描述自己」，不等于性能被独立验证。

---

## 0. 这一轮改了上一份笔记的什么

| 上一份的判断 | 本轮修订 |
| --- | --- |
| §6「从一个熟悉仓库按时间线自建 30–50 个任务」 | **不必从零建。** 2026 年出现了三个自带真实时间序任务流的环境，其中 ChainSWE 连对照组都定义好了（第 1 节） |
| §2.2「SWE-bench 系列是很好的底层任务环境」 | **需要加限定。** OpenAI 已于 2026-02 停报 SWE-bench Verified、2026-07 撤回对 SWE-bench Pro 的推荐（第 2 节） |
| §5.5「Git 历史既是高价值数据也是泄漏源」 | **补一条容器级泄漏。** 参考补丁可能直接躺在评测容器的 `.git` 里，不只是预训练污染（第 2.3 节） |
| §6.2 四组对照（无记忆 / 全量历史 / 检索 / oracle） | **不够。** 现有文献已经跑出至少十种更细的控制，且其中三种成本极低、鉴别力极高（第 3 节） |
| §5.3「负迁移和陈旧记忆没有被认真测量」 | **确认，且比原来写的更彻底。** 这是本轮唯一没有被 2026 年工作填上的缺口（第 8 节） |
| —— | **新增一条最重要的**：多篇彼此独立的工作各自得出「复杂记忆架构打不过朴素基线」。这是本轮最一致的横向信号，直接决定你的基线怎么设（第 7 节） |

---

## 1. 现成的时间序仓库环境

上一轮的结论是「SWE-EVO 可以被改造」。现在不用改造了——2026 年有三个工作直接提供了真实 release / commit 时序的任务流，且都是 repo-level、可执行、带测试验证。

| 环境 | 来源 | 规模 | 时间序来源 | 自带的记忆对照 | 改造成本 |
| --- | --- | --- | --- | --- | --- |
| **SWE-Milestone** | [arXiv 2603.13428](https://arxiv.org/abs/2603.13428)、[GitHub](https://github.com/DeepCommit-ai/SWE-Milestone) | 98 milestone / 7 仓库 / 5 语言 / 109 条依赖边 | 真实 release 区间（例：scikit-learn 1.5.2 → 1.6.0），commit 聚合成 Milestone DAG | 无，但全程单容器不重置 | 极低，已有 checkpoint 抽取与适配器层 |
| **ChainSWE** | [arXiv 2607.02606](https://arxiv.org/abs/2607.02606) | 304 issue / 54 个 Python 项目，链长 3–5 | 按时间排序的 issue 链 | **有：ORACLE / SEQ / SEQ+MEM 三档** | 接近零 |
| **EvoArena（SWE-Chain-Evo track）** | [arXiv 2606.13681](https://arxiv.org/abs/2606.13681) | 50 条链 / 12 仓库 / 493 chain-step / 145 唯一 milestone，链长均值 9.86 | 原始 commit 时序 | 有：自带 EvoMem（patch 式记忆）baseline | 极低 |

### 1.1 三者的分工不同，别混用

**SWE-Milestone 测的是技术债累积。** agent 被放进一个持久化 Docker 容器，打 git tag 宣告完成某个 milestone，watcher 静默抓快照在一次性容器里验证，再异步解锁下游任务。它的官方 prompt 明写「你保有对所有先前任务、决策和代码改动的完整记忆」。评分是 F2P/P2P 的 precision-recall 结构，同时惩罚「少做」和「做坏」。要测 memory，加的对照是把持久会话换成每个 milestone 重启。

**EvoArena 反过来，测的是纯粹的演化适应。** 它的关键设计是 oracle-state progression——第 t 步评完之后，用参考补丁而不是 agent 的补丁生成第 t+1 步的仓库状态。这刻意把「跟上代码库演化」从「早期烂补丁的误差滚雪球」里剥离出来。所以：**问「memory 能不能帮 agent 跟上演化」用 EvoArena，问「memory 能不能抑制技术债」用 SWE-Milestone。**

**ChainSWE 是唯一把记忆对照写进论文定义的。** ORACLE（每个 bug 前给 oracle 补丁，隔离误差传播）、SEQ（代码库累积 agent 自己的补丁，但 harness 每个 bug 重启）、SEQ+MEM（代码库累积 + 会话 transcript 跨 bug 保留）。ORACLE 与 SEQ 的差值量化「带着自己制造的烂状态干活」的代价，SEQ 与 SEQ+MEM 的差值量化 transcript 级记忆的价值。

### 1.2 ChainSWE 的实证结果是对朴素记忆假设的当头一棒

七个模型三种配置平均下来：**per-bug 准确率从 ORACLE 的 58.9% 掉到 SEQ 的 36.5%**（相对下降约 38%，21 个 model×configuration 组合无一例外都在掉），而 **SEQ+MEM 是 36.9%——几乎没有改善**，论文的措辞是「会话记忆只对 GPT-5.5 有帮助」。

这条结论要认真对待：**把上一轮完整 transcript 原样保留下来，不是 memory。** 它同时是一个必须加进基线的档位——见第 7 节。

### 1.3 坑

SWE-Milestone 一次完整评测用 Claude Opus 4.5 约 500 美元，做消融要乘以对照组个数；它的 milestone DAG 是把真实 commit 重排分组得到的，论文自陈「应用重排后的补丁经常导致编译或测试收集失败」，构造脆弱性高于 SWE-bench；且**没有显式的训练污染防护声明**。ChainSWE 的官方代码仓库没找到（第 10 节），且完全继承上游 SWE-bench 系数据的污染问题。EvoArena 的 EvoMem baseline 平均只涨 1.5%、chain-level 涨 3.7%，**这个幅度别当成 memory 有效的证据**。

### 1.4 次一级但值得知道的

- **LoopsBench**（[arXiv 2608.00267](https://arxiv.org/abs/2608.00267)）：112 任务 / 8 语言。它的 runtime 把「回归义务」显式建模——沿 ready frontier 释放测试，**已完成节点保留为持续的回归义务**，这是 stability-plasticity 张力的可执行版本。只有 PR Sequences 那一类来源是真实 git 时序，另两类（课程作业、论文实现）的时间序是构造的。
- **SWE-STEPS**（[arXiv 2604.03035](https://arxiv.org/abs/2604.03035)）：168 任务 / 963 PR / 6 个 Python 仓库，链长 3–11。有个对本议题直接有用的量化结论：**孤立评测相比链式评测虚高最多 20 个百分点**。
- **SWE-Bench-CL**（[arXiv 2507.00014](https://arxiv.org/abs/2507.00014)）：8 序列 / 273 任务，已经是显式的持续学习基准，改造成本为零。但它完全继承 SWE-bench Verified，污染最严重，且仓库 2025-05 后停更。
- **RoadmapBench**（[arXiv 2605.15846](https://arxiv.org/abs/2605.15846)）：真实版本升级，中位改动 3,700 行跨 51 文件，规模可观。但论文明说**各 target 没有规定执行顺序**，恰好抹掉了你要的因果时序。

### 1.5 一个引用陷阱：EvoCodeBench 现在指两个无关的工作

[arXiv 2404.00599](https://arxiv.org/abs/2404.00599)（2024，北大）是演化式 repo-level 代码生成，275 样本 / 25 仓库；它承诺每 6 个月滚动更新，**但从未兑现**——只发过 EvoCodeBench-2403 一版，GitHub 2024-08-15 后再无推送。[arXiv 2605.24110](https://arxiv.org/abs/2605.24110)（2026，UniPat）是完全无关的多轮 Harbor 基准，26 任务 / 227 轮，时间性是合成的。引用时必须写清年份和作者。

---

## 2. 干净的任务源与污染边界

### 2.1 底层环境的可信度比上一份笔记写的更糟

OpenAI 在 [2026-02-23 的官方博文](https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/)里停止报告 SWE-bench Verified 分数，并建议其他模型开发者也这么做。两条理由：一是测试拒绝正确解——审计了 o3 在 64 次独立运行中未能稳定解决的 138 道题（占 27.6%），每道至少 6 位资深工程师独立审阅，**至少 59.4% 存在实质性的测试设计或题面问题**（35.5% 是强制特定实现的 narrow test，18.8% 是检查题面未指定功能的 wide test）；二是**他们测试的所有前沿模型都能复现原始 gold patch，或逐字复现某些任务的题面细节**。

更值得注意的是，同样是 OpenAI，[2026-07-08 的博文](https://openai.com/index/separating-signal-from-noise-coding-evaluations/)对自己五个月前推荐的 SWE-Bench Pro 做了同样审计后**撤回了推荐**：流水线标记 200 道（27.4%）破损，人工标注标记 249 道（34.1%），综合估计约 30% 破损；731 道公开题上前沿模型通过率**八个月内从 23.3% 涨到 80.3%**。

学术侧的直接探测证据：SWE-Bench Illusion（[arXiv 2506.12286](https://arxiv.org/abs/2506.12286)）发现 SOTA 模型**仅凭 issue 描述、不给仓库结构**就能在 Verified 上达到 76% 的文件路径识别准确率，而在 SWE-bench 之外的仓库上只有 53%；函数复现任务的连续 5-gram 逐字重叠率在 Verified/Full 上最高 35%，其他类似基准只有 18%。另一篇（[arXiv 2512.10218](https://arxiv.org/abs/2512.10218)）用 Claude 模型对照，同样是流行开源 Python 项目，Verified 上的表现是 BeetleBox 和 SWE-rebench 的 3 倍，无项目上下文时定位被编辑文件的能力是 6 倍。更早的 SWE-Bench+（[arXiv 2410.06992](https://arxiv.org/abs/2410.06992)）人工筛查发现 32.67% 的成功补丁涉及 solution leakage（解法直接写在 issue 或评论里），过滤后 SWE-Agent+GPT-4 从 12.47% 掉到 3.97%。

### 2.2 两个还在滚动更新的干净任务源

| 数据源 | 机制 | 当前规模 | 许可 |
| --- | --- | --- | --- |
| [SWE-bench-Live](https://github.com/microsoft/SWE-bench-Live)（[arXiv 2505.23419](https://arxiv.org/abs/2505.23419)） | 自 2025-09-17 起**每月往 test split 加 50 条新验证 issue**，`lite` / `verified` 冻结保证榜单可比 | MultiLang 1,077 实例 / 431 仓库 / 8 语言（2026-08-21）；Windows 66 实例 / 48 仓库 | MIT |
| [SWE-rebench](https://swe-rebench.com/about)（[arXiv 2505.20411](https://arxiv.org/abs/2505.20411)） | **把 issue/PR 创建日期与模型发布日期比对，可能污染的评测在榜单上显式标记** | 训练集 2 万+ 任务；榜单按滚动时间窗（2026-05 窗口 111 题 / 65 仓库） | 公开 |

SWE-bench-Live 是目前**唯一能让你造出「模型训练截止日之后」的 repo-level 任务流的公开数据源**——这对「用 Git 历史做 memory」是必要前提，否则你测的是记忆力还是回忆力根本分不开。它的底座是 RepoLaunch（[arXiv 2603.05026](https://arxiv.org/abs/2603.05026)），跨语言 78% 构建成功率。SWE-rebench 的日期标注方法论可以直接抄：**给 experience pool 里每条经验打来源时间戳，评测时按模型 cutoff 划线**。注意它自陈因为自动收集，不保证每道题可解或描述清晰，成功率会低于人工精选的 Verified。

### 2.3 容器级泄漏：对「用 Git 历史做 memory」的硬约束

DeepSWE（[arXiv 2607.07946](https://arxiv.org/abs/2607.07946)，Datacurve，2026-07-08）指出一个与预训练污染不同的打包风险：**相当一部分 Claude Opus rollout 直接从评测容器附带的仓库 `.git` 历史中恢复出了参考修复**。

这条要写进实验纪律：**给 agent 喂 git 历史时，容器里绝不能存在 base commit 之后的对象。** DeepSWE 的做法是容器只装 base commit 处的 shallow clone。这比「时间截断 + 直接关联过滤 + 文本重叠过滤」这套 RepoMem 式的最低标准更底层——前者是在内容层面过滤，这一条是在文件系统层面堵。

### 2.4 三条防污染路线是互斥取舍

| 路线 | 代表 | 保住了什么 | 牺牲了什么 |
| --- | --- | --- | --- |
| 持续演化 + 日期窗口 | SWE-bench-Live、SWE-rebench | 真实 git 时序 + 可控污染边界 | 需持续重采集，任务随模型 cutoff 推进而过期 |
| 访问与许可壁垒 | SWE-Bench Pro（公开 731 + held-out 858 + 私有 276） | 时序 | 壁垒挡不住质量问题，已被官方撤回推荐 |
| 从零手写任务 | DeepSWE（113 任务，手写 verifier）、Terminal-Bench 2.0（[arXiv 2601.11868](https://arxiv.org/abs/2601.11868)，89 任务，对抗测试防偷看未来版本） | 污染最干净 | **杀死了真实 git 时序**，规模上不去 |

对 repo-level memory 而言只有第一条路走得通——这是本份笔记的推断，不是任一论文的结论。

---

## 3. 评测协议：怎么把 Memory 隔离出来

这是本轮最大的收获，比任何一个新数据集都有价值。下面每一条都写明**做法**、**它能排除什么混淆**、**谁在用**。上一份笔记的四组对照可以直接升级成这张清单。

### 3.1 三个成本极低、鉴别力极高的（建议列为必做）

**空记忆对照（DC-∅）——拆开 scaffold 增益和记忆增益。** 用完全相同的生成器提示词模板，只把记忆占位符替换成字面量「(empty cheatsheet)」。Dynamic Cheatsheet（[arXiv 2504.07952](https://arxiv.org/abs/2504.07952)，EACL 2026）在 Game of 24 上 GPT-4o 是 **10% → 19% → 99%**：scaffold 值 9 个点，记忆值 80 个点。排除的混淆是：绝大多数论文的 `w/o memory` 同时也删掉了为承载记忆而写的那套提示词脚手架，于是记忆的功劳里混进了提示词工程。

**等量安慰剂——排除「上下文里多了一坨字」本身的效应。** Training-Free GRPO（[arXiv 2510.08191](https://arxiv.org/abs/2510.08191)）用同一个模型直接生成同样数量的经验条目，不经过组内对比优化，其余完全一致。结果 AIME24/25 上是 79.8 / 67.3，而完全不加记忆的 ReAct 是 **80.0 / 67.9——加了未经优化的记忆比不加还略差**。长度效应、语气锚定、格式暗示都被这一条扣掉。

**随机记忆对照——区分「检索对了」和「有示例就行」。** Memp（[arXiv 2508.06433](https://arxiv.org/abs/2508.06433)，ACL 2026 Findings）在 TravelPlanner 上，GPT-4o 是：无记忆 71.93 → **随机抽取 74.59** → Key=Query 73.38 → Key=AveFact 76.02。随机抽取吃掉了大半增益，甚至超过了基于 query 向量的检索。**如果随机 ≈ 检索，你做的其实是 few-shot prompting，不是记忆系统。**

### 3.2 针对负迁移与陈旧的

**有害记忆注入的剂量曲线。** ACE（[arXiv 2510.04618](https://arxiv.org/abs/2510.04618)，ICLR 2026）挂一个被显式指示每隔 X 步注入对抗性条目的「有害 Reflector」，然后扫 X。FiNER 上（DeepSeek-V3.1，基线 70.7）：

| 投毒频率 | 每 1 步 | 每 5 步 | 每 10 步 | 每 25 步 | 每 50 步 | 不投毒 |
| --- | --- | --- | --- | --- | --- | --- |
| 准确率 | **66.7（低于基线 4.0）** | 76.1 | 77.0 | 77.8 | 78.2 | 78.3 |

这是目前唯一把记忆机制的鲁棒边界量化成曲线而不是一句「我们很鲁棒」的做法。ACE 正文还记录了一个真实灾难案例：Dynamic Cheatsheet 在 AppWorld 上从第 60 步的 18,282 token 突然坍缩到 122 token，准确率 66.7 → 57.1，**低于不做任何自适应的 63.7 基线**。

**受控记忆腐蚀 + leak-verified floor。** MERIT（[arXiv 2609.05441](https://arxiv.org/abs/2609.05441)）用自动 leak check 验证任务确实依赖早期 episode 的事实（把 floor 压到 0.00），再加入受控腐蚀。它的一个数字对代码场景很有参照价值：在「更新后事实」上，embedding 检索**不可预测地崩塌**（跨模型 0.30–0.95，最大种子间差距 0.45），而 update-on-write 型存储稳定在 0.70–1.00；**换一个记忆实现，任务成功率可以动 60 个百分点**。

### 3.3 针对「记忆到底被用了吗」

**冻结下游策略 + 实例级 no-skill 基线 + 行为对齐判据。** CODESKILL（[arXiv 2605.25430](https://arxiv.org/abs/2605.25430)）把归因写进了方法本身：下游 coding agent 全程冻结，对每个实例先跑 4 次 no-skill rollout 求平均分作为该实例基线，技能奖励定义为「技能条件 rollout − 该实例基线」的配对差分。更值得抄的是它对残留混淆的处理——论文明说执行改进本身有归因问题（agent 可能因无关原因解出题），于是加了一个由 LLM 判定 **rollout 是否真的命中该技能的触发条件、是否真的遵循其流程**的对齐因子，再与执行改进相乘。**这相当于把「记忆被实际使用了吗」做成了可测量的中介变量**，正好补上上一份笔记 §5.4 提的那条链路。

**restore counterfactual——区分不可逆损失与可恢复的检索失败。** What Eviction Destroys（[arXiv 2609.08279](https://arxiv.org/abs/2609.08279)）把 gold evidence 重新注入 read-time 上下文、用同一个 reader 重跑。LongMemEval-S 上 80k 预算 + top-k 检索时，FIFO / random / redundancy-aware 的不可逆占比 0.67–0.73，LLM-importance 0.60；到 8k 时四种策略全部为 1.00。它还点出一个方法论陷阱：**可恢复错误只在 top-k 检索下出现、在强制注入 gold 时按构造不存在，所以不报告检索机制的 budget-accuracy 结果彼此不可比。**

**三层解耦。** A-TMA / LTP（[arXiv 2607.01935](https://arxiv.org/abs/2607.01935)）主张 bank / retrieval / answer 三层分别评测，理由是最终 QA 准确率会掩盖失败发生在哪一层。MemConflict（[arXiv 2605.20926](https://arxiv.org/abs/2605.20926)）用的是黑盒答案 + 白盒支撑记忆检索排序的双层，并报告这两层**经常分离**——答案正确率和检索排序质量对不上。

### 3.4 针对可比性与统计

**单变量协议。** MemDelta（[arXiv 2606.29914](https://arxiv.org/abs/2606.29914)）在 LongMemEval-S 上一次只动一个组件，结论见第 6.2 节。它给出的三条建议可以直接抄进实验纪律：**跨比较时固定 embedding 模型、按模型族分层、在把收益归因给架构之前先报告写入路径成本。**

**配对显著性检验。** 只有一篇做了（[arXiv 2605.18854](https://arxiv.org/abs/2605.18854)），结论恰恰是不显著（第 7 节）。本轮核查的十几篇工作里，`w/o X −2.2pp` 这类结论普遍落在 500 题量级的噪声范围内却被当作确定性叙述。

**跨模型记忆迁移。** Memp 把 GPT-4o 构建的程序性记忆交给 Qwen2.5-14B-Instruct 用（完成率 +5%、平均步数 −1.6）；CODESKILL 换下游冻结策略仍保持 +8.93。逻辑很硬：**如果强模型写的记忆能提升弱模型，这部分增益就不可能归因于弱模型自身的能力。**

**gain metric。** CL-Bench（[arXiv 2606.05661](https://arxiv.org/abs/2606.05661)）把任务刻意构造成共享一个可学习的隐结构（代码库布局、对手策略等），使有状态系统能在线发现而无状态系统不能，再用 gain metric 把「在线学到的」从「模型本来就会的」里剥离。这是本轮看到的最干净的隔离设计。

### 3.5 scaffold 分层阶梯

Memento（[arXiv 2508.16153](https://arxiv.org/abs/2508.16153)）的消融是四层阶梯而非二元开关：离线 executor → 在线 executor（接工具）→ 加 planner 但无记忆 → 加 case 记忆。结果诚实得反直觉：**planner 贡献 +11.0 ~ +32.5 F1，而 CBR 记忆只贡献 +3.7 ~ +6.7 F1**。这是少数让读者看清「记忆在整个系统增益里占多小比例」的工作。

---

## 4. 经验记忆系统：归因体检

这批系统的架构设计上一份笔记已覆盖大半，这里只记评测可信度。

| 工作 | 来源 | 评测 benchmark | 报告数字（含底座） | 归因可信度 |
| --- | --- | --- | --- | --- |
| **SWE-Exp** | [2507.23361](https://arxiv.org/abs/2507.23361) | SWE-Bench Verified | Pass@1 42.0%（DeepSeek-V3-0324）/ 73.0%（Claude-4-Sonnet）；`w/o 经验抽取` −6.0pp | 中：有仓库+时序防泄漏，但消融混入双 agent 架构（−2.2pp）和 LLM 重排（−3.8pp） |
| **ExpeRepair** | [2506.10484](https://arxiv.org/abs/2506.10484)（FSE 2026） | SWE-Bench Lite / Verified | Claude-3.5-Sonnet 48.3% / 57.2%；`w/o 全记忆` 42.3% / 50.4% | 中高：消融同底座同 harness，且有中间指标交叉验证 |
| **Agent KB** | [2507.06229](https://arxiv.org/abs/2507.06229) | GAIA、SWE-bench Lite 等 | GAIA pass@3 55.2% → 73.9% | **低**：见 4.1 |
| **CODESKILL** | [2605.25430](https://arxiv.org/abs/2605.25430) | EnvBench、SWE-Bench Verified、Terminal-Bench 2 | 冻结 Qwen3.5-35B-A3B 29.57 → 39.26；换冻结 GPT-5.4-mini 仍 +8.93 | **高**：见 3.3 |
| **ACE** | [2510.04618](https://arxiv.org/abs/2510.04618)（ICLR 2026） | AppWorld、FiNER 等 | AppWorld DeepSeek-V3.1 ReAct 42.4 → 59.4 | 中高：扣分在离线设定用了训练集 GT 标签 |
| **Dynamic Cheatsheet** | [2504.07952](https://arxiv.org/abs/2504.07952)（EACL 2026） | AIME、GPQA-D、Game of 24 等 | 见 3.1 | 高 |
| **Training-Free GRPO** | [2510.08191](https://arxiv.org/abs/2510.08191) | AIME、WebWalkerQA | 见 3.1 | 高，但**无代码 benchmark** |
| **Memp** | [2508.06433](https://arxiv.org/abs/2508.06433) | TravelPlanner、ALFWorld | 见 3.1 | 高（就设计而言），但**非代码场景** |
| **Memento** | [2508.16153](https://arxiv.org/abs/2508.16153) | GAIA、HLE、SimpleQA | GAIA val 87.88% Pass@3 | 中高，非代码场景 |
| **AWM** | [2409.07429](https://arxiv.org/abs/2409.07429) | Mind2Web、WebArena | WebArena 绝对 +12.0pp | 中，2024 年工作底座已过时 |

### 4.1 必须标注的引用陷阱：Agent KB 的 pass@3

Agent KB 被广泛引用的「GAIA +18.7pp」是 pass@1 → pass@3，而它的协议是：**pass@2 用第一次尝试的失败诊断丰富知识库，pass@3 用扩充后的检索池重访未解决的案例**。也就是说 pass@2/@3 时记忆库里装着这道题自己上一次失败的诊断。这衡量的是「带自我反思的多次重试」，不是跨任务经验迁移。它真正的跨任务数字是 pass@1 那栏：SWE-bench Lite 上 OpenHands 24.3% → 28.3%，**+4.0pp**。

它有两个设计倒是值得借鉴：**自动蒸馏 vs 人工标注的对照**（GAIA 上 75.15% vs 76.97%，Level 3 上自动反超）直接回答了「记忆必须人写吗」；`w/ Raw Workflow` 对照（58.18 vs 完整 61.21）测的是「未经抽象的原始工作流日志够不够用」。

### 4.2 三个名实不符，别当记忆工作引

LocAgent（[2503.09089](https://arxiv.org/abs/2503.09089)）和 CoSIL（[2503.22424](https://arxiv.org/abs/2503.22424)）是单任务内的上下文管理与图索引，**无跨任务记忆**。[arXiv 2507.14897](https://arxiv.org/abs/2507.14897) 的 AgentFly 是 RL 训练框架，不是记忆系统——名称撞车的来源是 Memento 的原 GitHub 组织名为 `Agent-on-the-Fly`，且 ACE 论文的参考文献把 2508.16153 引作「AgentFly」。**统一用 Memento + arXiv 2508.16153。**

### 4.3 这批工作在评测上的共性缺陷

- **几乎无人报显著性**，唯一做了的那篇给的是负结果。
- **经验库常常就建在测试集上**：SWE-Exp 在 Verified 上跑 SWE-Search 采集轨迹再在同一个 Verified 上评测；CODESKILL 在评测流上在线构建；ExpeRepair 用测试集前 5 个 issue 初始化并把这 5 个也算进最终解决率。这些不是错误，但衡量的是 transductive 设定，与「先在历史仓库积累、再面对全新问题」不是一回事。
- **设定跨越式比较**：ExpeRepair 的消融全在 Claude-3.5-Sonnet 下做，头条用的是 Claude-4-Sonnet 的数字；SWE-Exp 的消融在 DeepSeek 下做（省 API 费），宣传的是 Claude-4-Sonnet 的 73.0%。两篇都没明示消融结论在强底座上是否同样成立——**换底座后记忆的边际价值大概率会缩小，这是推测，两篇都没测。**
- **成本几乎只当脚注**，而唯一把成本当一等指标的那篇发现这才是真正的区分维度。

---

## 5. 通用记忆基准：新增的与该淘汰的

只列对代码场景有方法论迁移价值的。完整的对话式记忆基准不是本项目重点。

| 基准 | 来源 | 增量价值 | 关键局限 |
| --- | --- | --- | --- |
| **HaluMem** | [2511.03506](https://arxiv.org/abs/2511.03506) | **把幻觉从端到端 QA 拆到 extraction / updating / QA 三层**，各自定义 gold，可定位失败层 | 由 MemTensor 制作而 MemOS 是同机构系统，在几乎每个指标上大幅领先——**不是 MemOS 优于 Mem0 的独立证据**；无 no-memory 基线 |
| **BEAM** | [2510.27246](https://arxiv.org/abs/2510.27246) | 10 项能力含 contradiction resolution / knowledge update / abstention / temporal，长度推到 10M | 对话全合成；LIGHT 与 BEAM 同篇提出 |
| **MemoryBench（THUIR）** | [2510.17281](https://arxiv.org/abs/2510.17281) | **唯一把「从用户反馈中持续学习」当主轴**的，有 vanilla 无记忆基线与 off/on-policy 双设定 | 反馈由 LLM 模拟，模拟器偏差未单独验证；2026-09-07 换了 judge 分支，此前结果不可直接比 |
| **MemConflict** | [2605.20926](https://arxiv.org/abs/2605.20926) | 最对口冲突消解：dynamic / static / conditional × 时效/事实/情境 | 全合成；题量与代码可用性未核实；作者与 HaluMem 同属 MemTensor 体系，**两者不是独立来源** |
| **CL-Bench** | [2606.05661](https://arxiv.org/abs/2606.05661) | 隔离设计最扎实（第 3.4 节） | SWE track 只有 19 个 issue，太小 |
| **MERIT** | [2609.05441](https://arxiv.org/abs/2609.05441) | **把记忆有没有用变成可测量的边际效用**，带完整 token / 美元计量（23,440 episode，$42.57） | 三个域自建，外部效度未知 |
| **PA-Bench** | [2609.05767](https://arxiv.org/abs/2609.05767) | 指出压缩类基准的**问题泄漏**：压缩时 prompt 里已含未来要问的问题 | 只有 100 段对话 |
| **Total Recall at What Cost?** | [2608.11879](https://arxiv.org/abs/2608.11879) | 唯一系统性测服务成本：盈亏平衡点从「几十轮」到「400 轮内永不」不等，**无系统在成本和准确率两轴同时赢** | 665 道 LoCoMo 题，继承 LoCoMo 的问题 |
| **Agent Memory Leaderboard** | [站点](https://agentmemoryleaderboard.ai/home)、[GitHub](https://github.com/AML-memory/agent-memory-leaderboard) | 目前唯一成形的标准化 arena：参赛方只实现 Add / Search，平台锁定 answer model、prompt、evaluator、数据套件、Top-K 与聚合规则 | 公信力取决于私有题质量与审核独立性，均无法外部验证；套件里有四个数据集来源不明（第 10 节） |

**值得单记的一个细节**：Agent Memory Leaderboard 的数据套件用的是 `locomo_refined` 和 `longmemeval_refined`——**修订版而非原版**。这本身就是对下一节那些批评的间接确认。

**该淘汰的**：MSC（[2107.07567](https://arxiv.org/abs/2107.07567)）、PerLTQA（[2402.16288](https://arxiv.org/abs/2402.16288)）早于当前记忆系统范式，现在主要作为别人的子数据集出现。LongLaMP（[2407.11016](https://arxiv.org/abs/2407.11016)）真实存在但它是个性化长文本生成基准，放进记忆条线会稀释概念——要谈个性化用 PrefEval（[2502.09597](https://arxiv.org/abs/2502.09597)，ICLR 2025 oral）或 PersonaMem（[2504.14225](https://arxiv.org/abs/2504.14225)，COLM 2025）。MemoryBank / SiliconFriend（[2305.10250](https://arxiv.org/abs/2305.10250)）论文真实，但其量化评估是 ChatGPT 扮演用户生成的模拟对话，**不是可复用的 benchmark 工件**。

---

## 6. 已有基准的可信度

### 6.1 LoCoMo 的答案键本身是错的

一手证据是官方 repo 的 [snap-research/locomo#27](https://github.com/snap-research/locomo/issues/27)（dial481 于 2025-12-06 提交，**至今 open**），逐条给出标注错误并附行号与原文。几个代表：答案键写「Psychology, counseling certification」而原文只有「counseling or working in mental health」；答案键写「The sunday before 25 May 2023」而原文明写 "last Saturday"；问 Caroline 分享了什么画而原文是 Melanie 分享的——**一个纠正了归属错误的聪明模型反而会被判错**。

独立审计 [dial481/locomo-audit](https://github.com/dial481/locomo-audit) 给出量化：

| 指标 | 数字 |
| --- | --- |
| score-corrupting 错误 | 1,540 道非对抗题中 **99 条（6.4%）**（33 幻觉 / 26 日期计算错 / 24 说话人归属错 / 13 歧义 / 3 不完整） |
| 完美系统的理论上限 | ~93.57% |
| **judge 误接受率** | 对全部题目生成「刻意错误但话题相邻」的答案，用原评测同款 judge 与 prompt，**接受 62.81%**；具体事实错误能抓住约 89%，但「说对话题、细节全错」的模糊答案近三分之二通过 |
| 统计效力 | 最大类目（single-hop n=841）是最小类目（open-domain n=96）的 8.8 倍；Wilson 95% CI 下 **56% 的相邻对比统计上不可区分** |
| Category 5 | 446 道对抗题（占 22.5%）**从未被任何已发表结果评测过**——444/446 缺 `answer` 字段，原始代码的格式化器引用了不存在的字段 |

该审计自述由 Claude Opus 4.6 执行、人工复核，分析脚本公开。这不削弱那些逐条可对着原数据核的标注错误，但引用时应说明。

**引用纪律：LoCoMo 上 10 分以内的差距不能用来排序。** 另外要注意，原始 LoCoMo 论文用的是 F1 / ROUGE / FActScore，**根本没有 LLM judge**——现在厂商挂在嘴边的「J score」是 mem0 论文后加的。上游仓库自 2024-08 起已无提交。

### 6.2 LongMemEval 没有答案键问题，但比分不可比

这组批评更有意思：不是数据集错了，而是**分数的方差来源不在被比较的系统上**。

MemDelta（[arXiv 2606.29914](https://arxiv.org/abs/2606.29914)）在 LongMemEval-S（500 题、三个模型族）做单变量控制：逐字 RAG 与 full-context GPT-4o-mini 打平（47.2% vs 49.8%，p=0.34），但**这个排序跨模型会翻转**（Gemini 从 full context 拿 +14pp，Sonnet 从 RAG 拿 +31pp，部分因为 Sonnet 对 63% 的 full-context 查询直接拒答）；**只换 embedding 模型、管线不变，准确率移动 +6.2pp（p=0.004）**；agent self-memory（42%）不如 basic retrieval（47%）。

RENDER（[arXiv 2608.23568](https://arxiv.org/abs/2608.23568)）指出一个几乎没人控制的混淆变量：同一段历史可以被渲染成 memory entry、summary、typed record 或原始摘录，而评测通常把这当实现细节。500 道题 9 个模型上，同等预算下 resolved packet 比按时间截断的原始对话高 42.4–72.6 分；**有三个模型在形式化 ledger packet 上得 0%，同样的事实用自然语言 entry 呈现就能答对 45.4–53.4%**。

The Sleeping Agent（[arXiv 2608.11775](https://arxiv.org/abs/2608.11775)）给了一个机制级佐证：gist 压缩在多跳和单跳事实题上明显好过截断，但时序题严重退化，原因是抽象 prompt 保留了关系与事件结构却丢弃了日期时间。**加一句话改 prompt，时序表达保留率从 3.05% 涨到 62.39%（约 20 倍）**，而实体和事件保留率几乎不变。这说明很多「记忆能力」结论其实是 prompt 工程的副产品。

---

## 7. 横跨四路调研的一致信号：复杂记忆架构打不过朴素基线

这是本轮最值得写进结论的发现，因为它来自四个互不相关的切片：

| 证据 | 来源 | 结论 |
| --- | --- | --- |
| ChainSWE SEQ vs SEQ+MEM | [2607.02606](https://arxiv.org/abs/2607.02606) | 保留完整会话 transcript：36.5% → **36.9%**，几乎无改善 |
| CL-Bench | [2606.05661](https://arxiv.org/abs/2606.05661) | **朴素 ICL 跑赢了专用记忆管理系统** |
| ReFind | [2608.12888](https://arxiv.org/abs/2608.12888) | 完全不建语义结构、只给词法搜索接口：MemoryAgentBench 上 58.2 > HippoRAG 2 的 53.2（统一 GPT-4o-mini） |
| MemDelta | [2606.29914](https://arxiv.org/abs/2606.29914) | agent self-memory 42% < basic retrieval 47% |
| MemBench | [2506.21605](https://arxiv.org/abs/2506.21605)（ACL 2025 Findings） | RetrievalMemory > MemGPT / GenerativeAgent |
| OpenHands condenser 第三方评测 | [2605.18854](https://arxiv.org/abs/2605.18854) | 480 次运行、配对 Wilcoxon + Bonferroni：**八种 condenser 无一显著改变任务质量**；LLM 类多烧 24–94% token |
| mem0 自己论文的 full-context 基线 | [2504.19413](https://arxiv.org/abs/2504.19413) | full-context 72.90%±0.19 **高于** mem0 最好配置 68.44%±0.17 |
| Memp 随机对照 | [2508.06433](https://arxiv.org/abs/2508.06433) | 随机抽记忆（74.59）超过 query 向量检索（73.38） |
| SUMER | [2511.21726](https://arxiv.org/abs/2511.21726) | RLVR 训练 agent 在**未压缩信息**上做目标导向搜索，LoCoMo 上超过所有压缩方法**以及 full-context 基线** |

**对实验设计的直接含义**：基线必须包含至少三个朴素档——full context（塞得下就塞）、词法/BM25 搜原始记录、上一轮 transcript 原样塞回。上一份笔记的 B 组（full raw history）接近但不等于第三档：B 组塞的是仓库历史，这里塞的是 agent 自己上一轮的轨迹。**任何没有跑赢这三档的记忆系统，都还没证明自己存在的必要。**

那篇 OpenHands 的第三方评测还有一个值得抄的结论：**成本而非质量才是区分维度**。八种策略的质量置信区间互相重叠，但 token 消耗差出几倍；只有 ObservationMasking（净省 8.6%）和 ConversationWindow（+1.2%）真省钱。而且收益强烈依赖任务长度——只有超过 10 个事件的长任务才有正收益，短任务全部倒亏。

---

## 8. 唯一没被填上的缺口：负迁移、陈旧、冲突

上一份笔记 §5.3 提的这条，本轮确认仍然成立，而且比原来写的更彻底。

在核查的十几个经验记忆系统里：**只有 ACE 做了量化的投毒剂量曲线**；只有 ExpeRepair 通过「Only ADD / ADD+EDIT / ADD+REMOVE / 全套」的对比间接触及陈旧记忆（去掉 REMOVE 一致更差，Verified 上差 3.6pp，作者归因于旧洞见撑爆上下文并引入噪声）。**没有任何一篇测试记忆条目之间的语义冲突**（同一情形下两条互相矛盾的经验），**也没有任何一篇测试跨版本陈旧**（针对旧 API 写的经验遇到新版本）。

通用基准侧稍好：BEAM 有 contradiction resolution 和 knowledge update 维度，MemConflict 专攻冲突三分类，MemRiskBench（[arXiv 2609.14976](https://arxiv.org/abs/2609.14976)）定义了陈旧事实、冲突更新、跨用户泄漏、撤销记忆复用、约束衰减五类稀疏高危风险且 pass/fail 不走 LLM judge。**但这些全是对话场景，没有一个在代码仓库上跑。**

跨版本陈旧恰恰是代码仓库场景最现实的失效模式。**这不是文献缺口的抱怨，这是可以占的位置。**

工业界唯一给出对策的是 GitHub Copilot 的**引用锚定 + 即时校验**：每条 memory 存储时附带具体代码位置引用（如 `src/client/sdk/constants.ts:12`），agent 读到时实时回查该位置确认当前分支下是否仍成立，矛盾就改写；未被使用的条目 28 天自动删除。这正是上一份笔记 §9「Git diff 只能触发复核候选」那条想要的落地形态。

---

## 9. 对 RepoMem-Eval 设计的修订

基于以上，上一份笔记 §6 的方案做如下收紧。

### 9.1 环境：不再自建，改为在现成环境上加对照

推荐组合（本份笔记的推断，不是任一论文的结论）：**用 SWE-bench-Live 或 SWE-rebench 提供模型 cutoff 之后的干净任务源，套 ChainSWE 的三档对照框架，参考 SWE-Milestone 的 DAG 门控与 checkpoint 抽取做评测钩子。** 三者都是 MIT 或公开可用。唯一必须自己从头做的是 experience pool 本身。

### 9.2 对照组：从四组扩到七组

| 组别 | 设置 | 回答什么 | 出处 |
| --- | --- | --- | --- |
| A | 无持久记忆 | 基础能力基线 | — |
| A′ | **空记忆 scaffold**（同提示词模板，记忆位填「(empty)」） | 提示词脚手架本身值多少 | Dynamic Cheatsheet DC-∅ |
| B1 | full context（塞得下就塞全量历史） | 记忆系统有没有跑赢「什么都不做」 | mem0 自己论文、SUMER |
| B2 | **词法搜索原始记录**（BM25 + 会话感知融合） | 语义结构值不值 | ReFind |
| B3 | **上一轮 transcript 原样塞回** | transcript ≠ memory | ChainSWE SEQ+MEM |
| C | 检索结构化记忆（待测系统） | 真实 Memory 系统 | — |
| C′ | **等量安慰剂**（同数量、未经优化的经验条目） | 排除「多了一坨字」的效应 | Training-Free GRPO |
| C″ | **随机抽取记忆** | 检索相关性值多少 | Memp |
| D | Oracle memory | 理论上限与使用能力 | — |

C′ 和 C″ 成本极低，建议列为必做。A′ 只需改一行提示词。

### 9.3 必测的边界条件

在上一份笔记四类任务（related-positive / unrelated / hard-negative / stale-conflict）之上补：

1. **投毒剂量曲线**：按频率注入有害记忆条目，扫出崩溃点，而不是报一句「我们很鲁棒」（ACE）。
2. **跨版本陈旧**：针对旧 API 写的经验遇到版本升级。这是文献空白，也是本项目最有区分度的地方。
3. **语义冲突裁决**：同一情形下两条互相矛盾的经验，按版本与证据强度择一。同样是文献空白。
4. **跨模型迁移**：强模型写的记忆喂给弱模型（Memp、CODESKILL）。
5. **restore counterfactual**：把 gold evidence 重新注入 read-time 上下文重跑，区分不可逆损失与可恢复的检索失败（[2609.08279](https://arxiv.org/abs/2609.08279)）。

### 9.4 指标与纪律的补充

- **行为对齐判据**：由 LLM 判定轨迹是否真的命中并遵循了被检索出的记忆，作为「Adoption Rate」的可测量实现（CODESKILL）。
- **成本当一等指标**，不是脚注。报盈亏平衡点，不只报单次 token（[2608.11879](https://arxiv.org/abs/2608.11879)）。
- **配对显著性检验**：同一任务集上配对 Wilcoxon + 多重比较校正。没有它，3pp 的差距不应被叙述为结论（[2605.18854](https://arxiv.org/abs/2605.18854)）。
- **固定 embedding 与 reader**，按模型族分层报告（MemDelta）。呈现格式也要固定——同样的事实换个渲染方式能差几十分（RENDER）。
- **防泄漏三层**：内容层（时间截断 + 直接关联过滤 + 文本重叠过滤）、时间层（任务创建日期 vs 模型 cutoff）、**文件系统层（容器只装 base commit 的 shallow clone）**。

---

## 10. 引用纪律与核实失败清单

### 10.1 厂商数字的引用纪律

1. **凡引厂商数字，必须同时写出 harness 来源与底座模型。** 同一个系统在不同 harness 下能差 38 分：mem0 官网 LongMemEval 写 94.4，在 MemTensor 的统一 harness 下是 56.00。
2. **厂商开源了 harness ≠ 结果中立。** MemTensor 的 [OmniMemEval](https://github.com/MemTensor/OmniMemEval) 与 Supermemory 的 [MemoryBench](https://github.com/supermemoryai/memorybench) 都开源、都可插拔、**都把作者自己排第一**（Supermemory 自称「#1 on every major AI memory benchmark」，在 OmniMemEval 上排第 9）。
3. **mem0 ↔ Zep 的互撕两边都对。** [getzep/zep-papers#5](https://github.com/getzep/zep-papers/issues/5) 里 Mem0 CTO 指出 Zep 的 84% 把 adversarial 类的正确答案算进分子却把该类排除出分母，Zep 承认算错改为 75.14%；Zep 反过来指出 mem0 评测它时把对话双方都标成 user、时间戳拼进正文而非用 `created_at`、串行而非并行执行检索。**结论不是谁作弊，而是这个分数是测试台的属性，不是 memory 系统的属性。**
4. **有两篇看起来像中立横评的论文带 MemOS 厂商作者**：[2606.24775](https://arxiv.org/abs/2606.24775) 与 [2607.12893](https://arxiv.org/abs/2607.12893) 的作者含 Zhiyu Li、Feiyu Xiong。真正无 memory 厂商作者的横向学术评测只有 [2604.01707](https://arxiv.org/abs/2604.01707)（港中深 / 港中大 / 哈工大深圳 / 北理工 / 华为云）。
5. **中立 harness 已存在，缺的是厂商交卷。** [LongMemEval-V2](https://github.com/xiaowu0162/LongMemEval-V2)（[arXiv 2605.12493](https://arxiv.org/abs/2605.12493)，UCLA，Apache-2.0，公开 leaderboard）把 reader 与 embedding 固定住掐死了底座混淆，评分用 LAFS Gain 让「堆检索预算换分数」不再免费。但截至核实时榜上主要是论文自带基线，**没看到 mem0 / Zep / Letta 等商业厂商提交**。缺口的准确表述是「厂商不在中立榜上」，不是「没有中立榜」。
6. **coding agent 产品里只有 GitHub Copilot 有公开量化评测**（[工程博客](https://github.blog/ai-and-ml/github-copilot/building-an-agentic-memory-system-for-github-copilot/)，2026-01-15）：离线 code review precision +3% / recall +4%；真实开发者线上 A/B 中 coding agent PR 合并率 83% → 90%、code review 好评率 75% → 77%，均 p<0.00001。**但未披露样本量、评测集规模与置信区间，harness 未开源。** Cursor、Devin、Windsurf 一律写「无公开量化评测」。

### 10.2 一个值得记的产品侧趋势

Cursor 的 Memories 已于 2.1.x（2025-11）移除——`/docs/context/memories` 现 302 跳转到 Rules，员工在官方论坛确认，但官方 changelog 未明列。Devin Desktop（原 Windsurf）的官方文档自己建议用 Rules 或 `AGENTS.md` 而非 auto-generated memories，且新的 Local agent 不再持久化 memories。**除 Copilot 外，这一轮产品的方向是从「自动提取的隐式记忆」退回到「人工维护的版本化入口文件」。** 这对本项目的 project-memory 设计定位是有利证据；Copilot 是唯一反向加码的，而它恰好也是唯一拿出数据的——**这两件事是否有因果关系，没有证据，属于推测。**

### 10.3 核实失败清单

以下搜到过但**无法用一手来源确认**，正文不引用：

- **Vectorize 的独立评测**（Mem0 LongMemEval 49.0 / Zep 63.8）：多个二手来源反复引用并当作「唯一清晰的独立测量」，**找不到一手页面，不要引用**。
- **EverMemOS issue #73**（第三方复现失败，38.38% vs 声称 92.32%）：URL 实测 404，仓库已重定向且 issue 编号未保留，**无法独立验证**。
- **ChainSWE / SWE-Marathon / DeepSWE 的官方代码仓库**：论文均已核实，但试过的 GitHub 路径全部 404，可用性未核实，复现前需联系作者。
- **MemConflict / CL-Bench / MERIT / MemRiskBench / AgentMemBench 的代码与数据**：都在论文里声称释出，但 arXiv abs 页无链接。
- **Agent Memory Leaderboard 的 `angry` / `enemy` / `friends` / `man_earth` 四个数据集**，以及「20 余所高校联合主办」的说法：只在其自有站点出现，无第三方确认。
- **Repo2Skill-Evo**：在一次搜索结果的综述文字里被提及，**找不到任何 arXiv 页面、GitHub 仓库或官方文档**。
- **Terminal-Bench 3.0**：只核实到 `harbor-framework/terminal-bench` 自述为 continuous benchmark 且有 tagged releases，**「3.0」作为独立发布版本未核实**。
- **Maximem 对 mem0 prompt 的逐行审计**：页面确实存在且内容可读，但 **Maximem 自己做 memory 产品，是竞品复现**，且未逐行复核其对 mem0 仓库 commit 与行号的引用。当作「一家竞品的公开指控 + 可自行核对的线索」。

### 10.4 需要打折看待的预印本

2026 年这个领域单作者、无 venue、无代码的预印本比例异常高，本轮命中的包括 MemDelta、What Eviction Destroys、The Sleeping Agent、AgentMemBench、Wontopos Tablet 2。**建议引用其方法而非其数字**，除非能复现——MemDelta 和 What Eviction Destroys 的方法论确实扎实，本文正是只引了它们的实验设计和单变量结论。

ATANT（[2604.10981](https://arxiv.org/abs/2604.10981)）要额外小心：单作者自定义一套「continuity 7 属性」标准，然后论证现有全部基准都不满足它——**评判尺度与被评判对象出自同一人**，形式上自洽但不可证伪。唯一值得单独引用的是它报告的 LOCOMO empty-gold 计分 bug（23% 语料按构造不可计分），且最好另找佐证。

---

## 调研限制

本轮以论文原文、官方仓库和官方文档核对机制，**没有运行任何实现，也没有复现任何成绩**。所有 arXiv 编号由调研 Agent 实际抓取 abs 页面核对标题、作者与日期，但未逐篇通读正文——摘要未给出的规模数字在表中标为未核实，而非填入猜测值。arXiv 官方 API 在调研期间持续返回限流，改用官方 HTML 检索页，**意味着 2026 年 6–9 月这段的检索召回可能不完整**；若要做到穷尽，建议后续用 API 重跑一次全量扫描。

厂商博客只被用来证明其公开描述，不作为性能已被独立验证的依据。本文没有核验所有项目的开源实现与论文版本是否逐项对应。第 9 节的实验设计建议是本份笔记的推断，不是任何论文已证明的结论。

---

## Sources

按本文引用顺序，全部经 abs 页面核实。

**时间序仓库环境**：[SWE-Milestone 2603.13428](https://arxiv.org/abs/2603.13428)｜[ChainSWE 2607.02606](https://arxiv.org/abs/2607.02606)｜[EvoArena 2606.13681](https://arxiv.org/abs/2606.13681)｜[LoopsBench 2608.00267](https://arxiv.org/abs/2608.00267)｜[SWE-STEPS 2604.03035](https://arxiv.org/abs/2604.03035)｜[SWE-Bench-CL 2507.00014](https://arxiv.org/abs/2507.00014)｜[RoadmapBench 2605.15846](https://arxiv.org/abs/2605.15846)｜[EvoCodeBench 2024 · 2404.00599](https://arxiv.org/abs/2404.00599)｜[EvoCode-Bench 2026 · 2605.24110](https://arxiv.org/abs/2605.24110)｜[Terminal-Bench 2.0 · 2601.11868](https://arxiv.org/abs/2601.11868)

**任务源与污染**：[SWE-bench-Live 2505.23419](https://arxiv.org/abs/2505.23419)｜[SWE-rebench 2505.20411](https://arxiv.org/abs/2505.20411)｜[RepoLaunch 2603.05026](https://arxiv.org/abs/2603.05026)｜[SWE-Bench Illusion 2506.12286](https://arxiv.org/abs/2506.12286)｜[2512.10218](https://arxiv.org/abs/2512.10218)｜[SWE-Bench+ 2410.06992](https://arxiv.org/abs/2410.06992)｜[DeepSWE 2607.07946](https://arxiv.org/abs/2607.07946)｜[OpenAI 停报 SWE-bench Verified](https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/)｜[OpenAI 撤回 SWE-Bench Pro 推荐](https://openai.com/index/separating-signal-from-noise-coding-evaluations/)

**经验记忆系统与评测协议**：[Dynamic Cheatsheet 2504.07952](https://arxiv.org/abs/2504.07952)｜[Training-Free GRPO 2510.08191](https://arxiv.org/abs/2510.08191)｜[Memp 2508.06433](https://arxiv.org/abs/2508.06433)｜[ACE 2510.04618](https://arxiv.org/abs/2510.04618)｜[CODESKILL 2605.25430](https://arxiv.org/abs/2605.25430)｜[SWE-Exp 2507.23361](https://arxiv.org/abs/2507.23361)｜[ExpeRepair 2506.10484](https://arxiv.org/abs/2506.10484)｜[Agent KB 2507.06229](https://arxiv.org/abs/2507.06229)｜[Memento 2508.16153](https://arxiv.org/abs/2508.16153)｜[AWM 2409.07429](https://arxiv.org/abs/2409.07429)｜[EvoSkill 2603.02766](https://arxiv.org/abs/2603.02766)｜[Socratic-SWE 2606.07412](https://arxiv.org/abs/2606.07412)｜[OpenHands condenser 第三方评测 2605.18854](https://arxiv.org/abs/2605.18854)

**通用记忆基准**：[HaluMem 2511.03506](https://arxiv.org/abs/2511.03506)｜[BEAM 2510.27246](https://arxiv.org/abs/2510.27246)｜[MemoryBench 2510.17281](https://arxiv.org/abs/2510.17281)｜[PersonaMem-v2 2512.06688](https://arxiv.org/abs/2512.06688)｜[MemConflict 2605.20926](https://arxiv.org/abs/2605.20926)｜[CL-Bench 2606.05661](https://arxiv.org/abs/2606.05661)｜[MERIT 2609.05441](https://arxiv.org/abs/2609.05441)｜[LOCOMO-CONV 2609.03467](https://arxiv.org/abs/2609.03467)｜[PA-Bench 2609.05767](https://arxiv.org/abs/2609.05767)｜[MemRiskBench 2609.14976](https://arxiv.org/abs/2609.14976)｜[Total Recall at What Cost? 2608.11879](https://arxiv.org/abs/2608.11879)｜[MemBench 2506.21605](https://arxiv.org/abs/2506.21605)｜[LifelongAgentBench 2505.11942](https://arxiv.org/abs/2505.11942)｜[PrefEval 2502.09597](https://arxiv.org/abs/2502.09597)｜[PersonaMem 2504.14225](https://arxiv.org/abs/2504.14225)

**基准批评与方法论**：[snap-research/locomo#27](https://github.com/snap-research/locomo/issues/27)｜[dial481/locomo-audit](https://github.com/dial481/locomo-audit)｜[MemDelta 2606.29914](https://arxiv.org/abs/2606.29914)｜[RENDER 2608.23568](https://arxiv.org/abs/2608.23568)｜[ReFind 2608.12888](https://arxiv.org/abs/2608.12888)｜[The Sleeping Agent 2608.11775](https://arxiv.org/abs/2608.11775)｜[What Eviction Destroys 2609.08279](https://arxiv.org/abs/2609.08279)｜[A-TMA / LTP 2607.01935](https://arxiv.org/abs/2607.01935)｜[SUMER 2511.21726](https://arxiv.org/abs/2511.21726)｜[ATANT 2604.10981](https://arxiv.org/abs/2604.10981)

**工业界与横评**：[mem0 2504.19413](https://arxiv.org/abs/2504.19413)｜[Zep 2501.13956](https://arxiv.org/abs/2501.13956)｜[MemOS 2507.03724](https://arxiv.org/abs/2507.03724)｜[LongMemEval-V2 2605.12493](https://arxiv.org/abs/2605.12493)｜[中立横评 2604.01707](https://arxiv.org/abs/2604.01707)｜[getzep/zep-papers#5](https://github.com/getzep/zep-papers/issues/5)｜[OmniMemEval](https://github.com/MemTensor/OmniMemEval)｜[Copilot Memory 工程博客](https://github.blog/ai-and-ml/github-copilot/building-an-agentic-memory-system-for-github-copilot/)｜[Agent Memory Leaderboard](https://agentmemoryleaderboard.ai/home)
