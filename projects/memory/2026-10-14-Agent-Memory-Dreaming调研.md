---
name: Agent Memory Dreaming 调研
description: 梳理 Agent Memory「Dreaming」含义（相对热路径写入与 reflection）、Devin / 开源实现 / 闭源产品 / coding agents 对照，以及松相关工作（Generative Agents、LangMem、Zep 等）。
---

# Agent Memory Dreaming 调研

> 整理日期：2026-10-14（Asia/Shanghai）
> 用途：把「Dreaming / Sleep-time / 后台巩固」从产品口号拆成可对照的实现类别，标清有公开实现 vs 仅产品行为，供 edges Project Memory / doctor 等后续设计参考。
> 原则：正文优先写一手来源（官方文档、源码、论文）里出现的事实；标 **【推断】** 的是本笔记归纳；标 **【未证实】** 的是来源未说明或检索未找到公开材料的部分。
> 相关笔记：同目录 `2026-10-13-Devin-Agent-Memory-Repo.md`（Devin / Agent Memory Repo 专项）；仓库外调研稿 `research/2026-10-11--Agent记忆自动沉淀与迭代调研.md`（生命周期对照）。

## 1. Dreaming 是什么（相对热路径写入 / reflection）

| 概念 | 何时发生 | 典型输入 | 典型输出 | 是否阻塞用户对话 |
| --- | --- | --- | --- | --- |
| **热路径写入（hot-path write）** | 会话进行中，agent 边干边记 | 当前轮对话/工具结果 | 立即写入记忆条目 | 通常占用同一 agent 步数与延迟 |
| **Dreaming / Sleep-time / 后台巩固** | 会话空闲后、定时、或步数/压缩触发；独立 job / 子 agent | 多段历史会话 + 已有记忆库 | 合并重复、作废过时、补漏、重建索引；有时产出 skill 候选 | 设计上不打断当前对话 |
| **Reflection（研究文献）** | 累积重要性达阈值，或回合末反思 | 近期 observation / 轨迹 | 高层洞见（常带回指证据的指针） | 多在仿真/训练环内同步触发 |

要点：

1. **Dreaming ≠ 会话摘要。** Devin 博客写明记忆不是 session summary，而是可复用教训；Dreaming 是对已有笔记的跨会话整理，而不是把整段对话压成摘要贴进 prompt。
2. **Dreaming ≠ 热路径 remember。** 热路径负责「学到就写」；Dreaming 负责「事后用全局视角清理与抽象」。Letta / Mem0 / LangMem 都显式区分二者（见 §3、§6）。
3. **Dreaming ≈ 数据库里的 compaction / vacuum。** Mem0 产品文用 LSM compaction、Postgres vacuum、git GC 类比：快写路径之外需要独立维护进程。[已核实] https://mem0.ai/blog/dream-background-memory-consolidation-for-ai-agents
4. **与 reflection 的关系【推断】**：Generative Agents 的 reflection、Reflexion 的口头反思更偏「任务环内的抽象一步」；产品 Dreaming 更偏「离线、可调度、对持久记忆库做重建」。二者都是巩固，但触发与存储目标不同。

## 2. Devin Dreaming：产品行为，无公开实现

### 2.1 产品行为（有文档）

来源：[Devin Docs · Memory](https://docs.devin.ai/product-guides/memory)、[博客 Memory and dreaming](https://devin.ai/blog/memory-and-dreaming)、[Agent Memory Repo 规范页](https://cognition.com/agent-memory-repo)。

- 记忆存在个人 **Memory Drive**（Markdown git 仓库）；会话加载 `MEMORY.md`，其余按需搜读。
- **Dreaming**：约每天一次后台会话（有活跃使用时）；回看近期会话与已有记忆；合并重叠、去掉临时细节、补记原会话漏写的教训、移除**没有任何会话用过**的过时记录；重组笔记与索引；保留 source 链接与明确偏好。
- 首次 dream 会从近期会话播种记忆。
- Customize → Memory 可看每次 dreaming 改了什么。
- 自动化会话不读写 memory；组织关闭 Memory 时 dreaming 不跑。

### 2.2 公开实现检索结论（2026-10-14）

| 有 | 无 |
| --- | --- |
| 上述产品行为与 Docs | 开源仓 / skill **不含**调度 Dreaming |
| 规范描述「周期性专门 agent」两件事：新增跨会话模式、清理重复/过时/矛盾 | 公开的 scheduler、模型、prompt、「unused」判定代码、矛盾消解算法 |

- Agent Memory Repo 仓库：[github.com/AgentMemoryRepo/agentmemoryrepo](https://github.com/AgentMemoryRepo/agentmemoryrepo) —— 格式、skill、示例；README 写明试用版**不含**自动启动与定时 Dreaming。
- [issue #7](https://github.com/AgentMemoryRepo/agentmemoryrepo/issues/7)：维护者欢迎社区把调度实现放进 Community，**未公布**官方实现。
- **结论：Agent Memory Repo ≠ 已实现的 scheduled dreaming。** 它是记忆的 git/Markdown 格式标准；Dreaming 在 Devin 产品里跑，规范只描述意图。
- 第三方（OpenDream、agentconnect 等）自有 dreaming，**不可当作** Cognition 实现。

细节与 edges 对照见同目录 Devin 专项笔记。

## 3. 有公开代码 / 文档可跟的实现

> ChatGPT「Dreaming」是单独闭源产品能力（见 §3.6），不要与 Codex `memories` 管线混为一谈。

### 3.1 Letta：Sleep-time Compute / Dreaming（开源 + 产品）

- 研究：[Sleep-time Compute](https://www.letta.com/blog/sleep-time-compute/)；论文 https://arxiv.org/abs/2504.13171 —— 主 agent 对话时，sleep-time agent 异步改写记忆状态。
- 产品文档：[Memory & dreaming](https://docs.letta.com/configuration/memory/) —— 后台子 agent 回顾近期对话、巩固教训、更新 MemFS；`/sleeptime` 配置触发（步数或上下文压缩）与行为（reminder vs auto-launch）；可选「agent 再审一遍」提议更新。
- SDK：[letta-code-sdk](https://github.com/letta-ai/letta-code-sdk) 的 `dreaming` / `sleeptime` 选项（`trigger`、`behavior`、`stepCount`）。
- Context Repositories / MemFS：git 支持的记忆文件系统；sleep-time 可在 worktree 上并发写再合并。[https://www.letta.com/blog/context-repositories/](https://www.letta.com/blog/context-repositories/)

### 3.2 Mem0：库开源 / Dream 是平台功能

| | Open Source 库 | Platform Dream |
| --- | --- | --- |
| 仓库 | [mem0ai/mem0](https://github.com/mem0ai/mem0) | 托管产品 |
| 能力 | 抽取、检索、智能去重等 | 后台合并重复、标记 superseded、可选 Synthesis 模式记忆 |
| Dream | **不可用**（平台 vs OSS 对照表写明） | Pro/Enterprise；Synthesis 按日程跑（文档：Pro 约每 7 天，Enterprise 每日），且通常要求用户记忆量达阈值 |

来源：https://docs.mem0.ai/platform/platform-vs-oss 、https://docs.mem0.ai/platform/features/dream 、https://mem0.ai/blog/dream-background-memory-consolidation-for-ai-agents

**【推断】** 评价「Mem0 有没有 Dreaming」必须说清是库还是平台；只引 GitHub stars 会误判。

### 3.3 OpenDream（pylit-ai）

- 仓库：[pylit-ai/opendream](https://github.com/pylit-ai/opendream)（Python，local-first，alpha）；PyPI `opendream`。
- 定位：开放、本地、可审查的 agent 记忆；明确写 **"Dreaming" means background memory review and cleanup, not an opaque model behavior**。
- 可与 Codex / Claude Code / Cursor 等并存，不强制替换宿主内置记忆；workspace 本地 store + 可观测 UI（diff、coverage）。
- HN：https://news.ycombinator.com/item?id=48497602

### 3.4 agentconnect Memory Dreaming

- 仓库：[agentconnect-md/agentconnect](https://github.com/agentconnect-md/agentconnect)
- 设计文档：`docs/designs/memory-dreaming.md` —— Dreaming 是 managed memory 的**离线巩固**：读全库 + 近期 transcripts，产出重组后的 store（合并、替换过时/矛盾、相对日期绝对化、挖新洞见）；还可挖 **candidate skills**（**永不自动安装**，需人审）。
- 实现：`packages/daemon/src/agents/dream-runner.ts`、`memory-dreamer.ts`；策略 schema 含 `enabled`、`schedule`（cron）、`sessionWindow`、`autoAdopt`、`mineSkills` 等。
- 与 Devin 对照：同样是「热路径蒸馏 vs 离线重建」二分；agentconnect 把 adopt 做成可逆、可审查的显式步骤（`autoAdopt` 可关）。

### 3.5 Codex Phase 1 / Phase 2（openai/codex memories）

- 源码文档：[codex-rs/memories/README.md](https://github.com/openai/codex/blob/main/codex-rs/memories/README.md)
- 根会话启动时若开启 memory，在后台跑：
  - **Phase 1**：按线程并行，从空闲足够久的 rollout 抽取 `raw_memory` + `rollout_summary`，密钥脱敏，写入 state DB。
  - **Phase 2**：全局锁；按 `max_unused_days` / `usage_count` 选 top-N；同步 `~/.codex/memories`（git baseline）；有变更则启动无网络、仅本地写的 consolidation 子 agent，更新 `MEMORY.md`、`memory_summary.md`、可选 `skills/`。
- 官方定位：AGENTS.md 放必须遵守的团队规则；memories 是辅助回忆层。https://developers.openai.com/codex/memories

**【推断】** Codex Phase 2 在工程形态上最接近「有公开代码的 Dreaming」：后台、跨会话、专门 consolidation agent、按使用情况淘汰输入。

### 3.6 ChatGPT Dreaming（闭源，单独一条）

- https://openai.com/index/chatgpt-memory-dreaming/ —— ChatGPT 产品里用后台过程从多段对话综合记忆状态；与 Codex CLI 的 `codex-rs/memories` **不是同一套实现**。
- 调研时勿把 ChatGPT 文案套到 Codex 源码上。

## 4. 热门闭源 / 托管：Anthropic Dreams、Devin

### 4.1 Anthropic Dreams（Managed Agents，research preview）

- 文档：https://platform.claude.com/docs/en/managed-agents/dreams
- 异步 job：输入已有 memory store + 1–100 个 session；产出**新的** memory store（默认不改输入，便于审查后丢弃）；合并重复、用最新值替换过时/矛盾、挖跨会话洞见。
- Beta header：`dreaming-2026-04-21`（另需 managed-agents header）。
- 不改模型权重；按所选模型的 token 计费；可 `instructions` 引导关注点。
- 【未证实】内部 pipeline 的具体 prompt / 多阶段是否开源 —— 文档只暴露 API 与生命周期（pending → running → completed/failed/canceled）。

### 4.2 Devin

见 §2。闭源产品 + 开源**格式**标准；Dreaming 调度与算法未公开。

## 5. Coding agents 对照表

> 截至 2026-10-14 公开文档/issue 快照。「内置记忆」= 产品文档或源码声明的跨会话持久记忆；「Dreaming」= 文档或源码中的后台巩固/dream 管线（插件不算内置）。状态会变，以仓库为准。

| Agent | 内置记忆 | 内置 Dreaming | OSS | 仓库 / 文档 |
| --- | --- | --- | --- | --- |
| **Kimi Code** | 无完整内置；有 feature request / 第三方插件 | 无 | 是 | [MoonshotAI/kimi-code](https://github.com/MoonshotAI/kimi-code)；issue [#21](https://github.com/MoonshotAI/kimi-code/issues/21)、[#1335](https://github.com/MoonshotAI/kimi-code/issues/1335) |
| **pi** | 会话 JSONL 持久；长期记忆靠扩展（如 openpi-memory / pi-memory-dreaming） | 无内置；扩展提供 dreaming | 是 | [badlogic/pi-mono](https://github.com/badlogic/pi-mono)；扩展例 [yukukotani/pi-memory-dreaming](https://github.com/yukukotani/pi-memory-dreaming) |
| **dsh** | 【未证实】核心是否内置；生态有 `dsh-auto-memory` 等插件 | 插件级 consolidation【未证实是否官方一等公民】 | 部分相关仓开源 | 插件例：[dsh-auto-memory](https://skillsllm.com/skill/dsh-auto-memory)；【推断】产品本体需以你本机安装的 dsh 发行版文档为准 |
| **zcode** | 有会话库；跨会话长期记忆多见插件/MCP | 无官方 dreaming 文档 | 是 | [zai-org/ZCode](https://github.com/zai-org/ZCode)；插件例 agentmemory-zcode-plugin |
| **mcode（MiniMax Code）** | 有：Proactive Memory、Memory summary、`/memory` 会话开关 | 文档未见 Dreaming / 后台巩固管线 | 是 | [MiniMax-AI/minimax-code](https://github.com/MiniMax-AI/minimax-code)；[Memory 文档](https://agent.minimax.io/docs/code/agents/memory) |

对照参考（非上表五行，但同属 coding agent）：

- **Codex**：内置 memories 管线（默认可关）+ Phase1/2 ≈ dreaming；OSS。[openai/codex](https://github.com/openai/codex)
- **Claude Code**：auto memory（热路径自写）+ MEMORY.md 体积约束；**无**与 Anthropic Managed Agents Dreams 同等的公开「dream job」绑在 Claude Code CLI 上。【推断】Claude Code auto memory ≠ API Dreams。
- **Gemini CLI**：Auto Memory 后台扫空闲会话 → inbox 人审；偏「沉淀 + 审批」，命名不叫 Dreaming。

## 6. 松相关：巩固 / 反思谱系（不是产品 Dreaming，但常被并列引用）

| 工作 | 关系 | 来源 |
| --- | --- | --- |
| **Generative Agents reflection** | 重要性累计触发高层洞见树；启发「晋升/抽象」 | https://arxiv.org/abs/2304.03442 |
| **Reflexion** | 回合后语言反思写入情景记忆，改进后续尝试 | https://arxiv.org/abs/2303.11366 |
| **Voyager** | 技能库随探索增长；偏程序性记忆累积，非离线 dream job | https://arxiv.org/abs/2305.16291 |
| **LangMem** | 显式区分热路径（conscious）与后台（subconscious）写入；记忆管理器做抽/改/删/合并 | https://langchain-ai.github.io/langmem/concepts/conceptual_guide/ |
| **Zep / Graphiti** | 双时间轴：冲突时标记旧事实失效而非物理删除；巩固在图更新路径上 | https://arxiv.org/abs/2501.13956 |

**【推断】** 做 edges doctor / 定期整理时，更该对齐的是 §3 的工程 Dreaming（Codex Phase2、Letta sleeptime、Mem0 Dream、OpenDream、agentconnect），而不是把 Reflexion 提示词直接当调度器。

## 7. 对照小结（给 edges）

| 问题 | 调研结论 |
| --- | --- |
| Dreaming 最小定义 | **离线/后台**、以**持久记忆库 + 多段历史**为输入、产出**整理后的记忆**（合并/作废/补漏/重建索引），且尽量不占用户热路径 |
| 唯一「标准」？ | 无。Devin AMR 标准化的是**记忆文件格式**，不是 Dreaming 算法 |
| 想读代码学实现 | 优先：Codex `codex-rs/memories`、Letta sleeptime/MemFS、agentconnect `dream-runner`、OpenDream |
| 想对标产品 UX | Devin Memory 页、Anthropic Dreams API、Mem0 Platform Dream、ChatGPT Dreaming（各自闭源深度不同） |
| coding CLI 现状 | 多数仍是「热路径写 + 可选插件」；Codex / MiniMax 有较强内置记忆，完整 Dreaming 仍少见 |
| edges 现状【推断】 | `remember` ≈ 热路径；`doctor` / `reshape` ≈ 人工巩固；缺 scheduled dreaming 与「unused」信号 |

## 8. 开放问题

- Devin「未被任何会话使用」的计量：公开材料仍无算法。【未证实】
- Anthropic Dreams 与 Claude Code auto memory 是否会打通为同一用户可见的一条产品线。【未证实】
- Mem0 OSS 是否计划移植 Dream 的 supersede/merge。【未证实】
- coding agents（Kimi / pi / dsh / zcode）会否把 dreaming 收成一等公民，还是长期停在插件生态。【未证实】
- edges 若加 Dreaming：收件箱人审（Gemini 路线）vs 自动 adopt（Devin / Mem0 路线）如何与「main 保护 + PR」约束共存。【推断，设计题】

## 9. 主要 URL 索引

- Devin Memory Docs: https://docs.devin.ai/product-guides/memory
- Devin 博客: https://devin.ai/blog/memory-and-dreaming
- Agent Memory Repo: https://cognition.com/agent-memory-repo · https://github.com/AgentMemoryRepo/agentmemoryrepo
- Letta Memory & dreaming: https://docs.letta.com/configuration/memory/
- Letta Sleep-time: https://www.letta.com/blog/sleep-time-compute/ · arXiv:2504.13171
- Mem0 Dream: https://docs.mem0.ai/platform/features/dream · https://docs.mem0.ai/platform/platform-vs-oss
- OpenDream: https://github.com/pylit-ai/opendream
- agentconnect Memory Dreaming 设计: https://github.com/agentconnect-md/agentconnect/blob/main/docs/designs/memory-dreaming.md
- Codex memories README: https://github.com/openai/codex/blob/main/codex-rs/memories/README.md
- ChatGPT Dreaming: https://openai.com/index/chatgpt-memory-dreaming/
- Anthropic Dreams: https://platform.claude.com/docs/en/managed-agents/dreams
- MiniMax Memory: https://agent.minimax.io/docs/code/agents/memory
- Generative Agents: https://arxiv.org/abs/2304.03442
- LangMem 概念: https://langchain-ai.github.io/langmem/concepts/conceptual_guide/
- Zep/Graphiti: https://arxiv.org/abs/2501.13956
