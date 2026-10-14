# 基于 git repo 与文件系统的 Agent Memory

## 背景

peng cheng 一直把 edges 仓库当作「外部大脑」：Agent 的记忆、笔记、任务都落成仓库里的 Markdown，经 PR 审核后合入 main。最近在仓库根新增了通用 `memory/`，并发现它的目录与 README 是手写的，不是 CLI 生成的。借这个契机，想系统看一下业界怎样用「git 仓库 / 文件系统」承载 Agent 记忆，确认 edges 的路线是不是主流、还有哪些可借鉴的做法。

## 主题

这次调研的是：以文件和目录为载体、以 git 为版本层的 Agent 记忆方案，在业界有哪些一手做法，共性模式是什么，代价在哪里，以及 edges 现有设计与之相比的异同和下一步。

- 难点一：一手材料分散在产品文档、工程博客与开源 README 中，有些候选方向（例如 Anthropic 是否有托管的文件化记忆、Cursor 的 memories）在本次检索中没有找到可核实的官方页面，只能标为未核实，不能凭印象写。
- 难点二：「文件式记忆」和「向量式记忆」并不是二选一，很多系统是文件为真源、索引为加速层，需要区分「存储形态」与「检索方式」两个维度。
- 难点三：git 带来历史、diff、分支和回滚，但多 Agent 并发写同一份记忆时，冲突解决、索引文件的合并冲突，是文件式方案特有的问题。

## 过程

### 2026-10-14 下午 读仓库确认现状

- 读了仓库根 `README.md`、`AGENTS.md`、`CONTEXT.md`、`docs/adr/0003`、`docs/adr/0006`，以及 `extensions/cli/src/commands/memory/`。
- 确认 `memory init` 的命令描述写明 `Does not read --super`，`remember` 中也没有 `--super` 分支；对应任务卡在 `.harness/tasks/project-memory/backlog/`，由 PR #245 合入看板。

### 2026-10-14 下午 联网核实一手材料

逐个打开官方文档、工程博客和开源仓库 README 核对表述，再写进本笔记。未能打开或未找到一手页面的方向，单列在补充说明里。

## 结果

### 业界做法逐条

#### Claude Code：CLAUDE.md 与 auto memory

- 两套机制：人写的 `CLAUDE.md`（指令与规则）与 Claude 自己写的 auto memory（学到的偏好与纠正）。两者每次会话开始都会加载，但官方明确说它们是「上下文，不是强制配置」，要硬拦截用 hook。
- 分层：组织托管策略、用户 `~/.claude/CLAUDE.md`、项目 `./CLAUDE.md`（随版本库共享）、本地 `CLAUDE.local.md`（加入 gitignore）。目录树上方的文件启动即加载，子目录里的按需加载；`.claude/rules/` 可以用 `paths` 限定只在操作匹配文件时加载。
- auto memory 存在 `~/.claude/projects/<project>/memory/`，同一 git 仓库的所有 worktree 共享一个目录，只在本机，不跨机器。结构是一个 `MEMORY.md` 索引（每条一行）加每条一个主题文件；启动只加载 `MEMORY.md` 前 200 行或 25KB，主题文件按需读取。
- 记忆类型分为 `user` / `feedback` / `project` / `reference` 四类，并明确跳过能从代码推导的内容。
- 现在 Claude Code 也可以直接读 `AGENTS.md`（没有 `CLAUDE.md` 时）。

#### Anthropic memory tool（API）

- 一个客户端执行的工具，Claude 发出对 `/memories` 目录的 `view` / `create` / `str_replace` / `insert` / `delete` / `rename` 请求，由应用自己落到文件、数据库或其他存储。
- 官方把它定位成「just-in-time」上下文检索：不预先塞满上下文，按需读回。启用后 API 会自动注入「先看记忆目录、假设随时会被打断」的系统提示。
- 安全上要求应用自己做路径穿越防护、大小上限与过期清理。文档还推荐「多会话软件开发」模式：首个会话建进度日志与功能清单，之后每个会话先读再干，结束前更新。
- Anthropic 工程博客《Effective context engineering for AI agents》把这类做法称为 structured note-taking（agentic memory），并把 Claude Code「CLAUDE.md 预先放进上下文 + glob/grep 按需检索」作为混合策略的例子。

#### Letta：Context Repositories（git 版本化记忆）

- 2026-02-12 发布。Letta Code 把 Agent 的上下文存成本地文件系统里的 git 仓库，每次记忆变更自动提交、带说明性的提交信息。
- 文件树结构始终在系统提示里，目录与文件名就是导航信号；每个文件有带描述的 frontmatter；`system/` 目录下的文件会被完整钉进系统提示，Agent 可以自己把文件挪进挪出 `system/` 来控制渐进式加载。
- 并发：给每个记忆子 Agent 一个独立 worktree，各自写入后通过 git 合并回 main 记忆。内置技能包括初始化（并发子 Agent 读历史）、反思（后台 sleep-time 进程，在 worktree 里写、自动合并）、碎片整理（先备份，再拆分大文件、合并重复，整理成 15–25 个聚焦文件）。
- 早前 Letta 在 2025-08 的博客中报告：只把对话历史存成文件、让 Agent 用文件工具检索，在 LoCoMo 上得到 74.0%，高于 Mem0 自报的图变体 68.5%；他们的解释是 Agent 对训练数据里常见的文件操作更熟练。这是厂商自测，只能当参考。

#### OpenAI Codex：AGENTS.md

- 全局层在 Codex 主目录（默认 `~/.codex`），优先读 `AGENTS.override.md`，否则读 `AGENTS.md`。
- 项目层从项目根（通常是 git 根）一路走到当前工作目录，每层依次查 `AGENTS.override.md`、`AGENTS.md` 和配置的备用文件名，每层最多取一个文件。
- agents.md 站点把 AGENTS.md 定位为跨 Agent 的开放格式，大型 monorepo 建议每个子包放一个，Agent 读离自己最近的那份。

#### Cursor：Project Rules

- 项目规则放在 `.cursor/rules`（`.mdc` 文件），随版本库管理，并按作用范围生效。Cursor 文档也接受 `AGENTS.md` 作为简单替代。
- Cursor「Memories」功能本次在官方 rules 文档中没有找到可核实的说明，未写入结论。

#### basic-memory：Markdown 知识库型 MCP

- 开源项目，知识以 Markdown 文件存在本地磁盘，人和 AI 都能读写；README 写明「只有文件加一个本地 SQLite 索引，不需要服务器」，检索是全文加向量的混合排序；支持 `[[Target]]` 式双链。
- 说明「文件为真源、索引为派生物」是常见组合。

#### Mem0：非文件式对照

- 定位为「AI 的记忆层」：由 LLM 从对话中抽取记忆、做实体链接与嵌入，存入向量库等后端，靠检索取回。README 当前版本写明采用单次 ADD-only 抽取（只新增，不覆盖）。
- 和文件式相比：人不能直接用编辑器打开、diff、审阅；优点是不依赖 Agent 自己整理、规模化检索更省事。

#### Karpathy：LLM Wiki

- Karpathy 在一份公开 gist《LLM Wiki》里提出：与其每次 RAG 从原始文档重新拼答案，不如让 LLM 持续维护一套互相链接的 Markdown wiki，把知识「编译一次、保持最新」，成为不断复利的产物。人负责找材料和提问，LLM 负责总结、交叉引用、归档；他用 Obsidian 浏览，「Obsidian 是 IDE，LLM 是程序员，wiki 是代码库」。
- 这与 edges「你的大脑也是一个目录」的定位高度一致。

### 共性模式

- **路径即索引**：目录层级和文件名本身就是第一层检索信号（Letta 把文件树放进系统提示；Claude Code 按目录层级加载）。
- **Markdown 叶子加索引文件**：一条记忆一个文件，再用一个短索引（`MEMORY.md`、frontmatter 描述）指路；索引有长度上限，正文按需读。
- **分层**：组织/全局、用户、项目、目录（本地私有）几层，越靠近工作目录越后读、越具体。私有层用 gitignore 或放在仓库外。
- **渐进式加载**：只把索引或钉住的文件放进上下文，其余 just-in-time 读取（Claude Code 子目录按需加载、memory tool、Letta `system/`）。
- **git 提供历史与审阅**：版本化、diff、回滚、PR 审阅；Letta 把它做成自动提交，edges 则走人审 PR。
- **并发靠 worktree**：Letta 与 Claude Code 都把 worktree 作为隔离单位（Claude Code 的 auto memory 在同仓 worktree 间共享）。
- **检索方式**：grep / glob 加 Agent 自主浏览是主流默认；向量或全文索引作为可选的派生加速层（basic-memory），而不是真源。

### 权衡与局限

- 文件式记忆依赖 Agent 自己整理，时间长了会碎片化，需要定期整理（Letta 的 defragmentation、Claude Code 的索引长度提醒与 `/doctor` 修剪建议）。
- 指令文件只是上下文，不是强制；必须执行的约束应交给 hook、CI 或权限设置。
- 索引文件是并发写的热点，多分支同时改同一个索引容易冲突；由工具自动生成索引能缓解。
- 规模大时纯 grep 召回有限，语义近似问题需要额外索引。
- 公开仓库里的记忆必须脱敏；私有内容只能放 gitignore 层或私有仓。
- 人审 PR 提高质量，但也增加了写入延迟，不适合高频的细粒度记忆。

### edges 现状（已在仓库核实）

- edges 仓库就是外部大脑：README 写明「harness 就是一组 Markdown 文件加 Git」「你的大脑，也是一个目录」。
- `.harness/memory/` 是仓库自身的维护记忆，按类型分目录（`feedbacks/`、`projects/`、`references/`，以及 gitignore 的 `users/`），由根 `AGENTS.md` 的本层索引登记。ADR 0003 规定用户记忆权威副本在工作树内并 gitignore；ADR 0006 规定新增类型只改布局，不另建注册表。
- 仓库根 `memory/` 放不属于任何主题的通用笔记（例如 `memory/references/`），约定必须由 edges CLI 以 `--super` 初始化和写入、索引由 CLI 自动生成，不手写目录或 README。
- 目前 `memory init` / `remember` 还不读 `--super`（`init` 命令描述写明 `Does not read --super`），任务卡在 `.harness/tasks/project-memory/backlog/`，相关 PR #245 已合并到看板。现有根 `memory/` 下内容仍是手写结构，待 CLI 补齐后重整。
- 变更走 PR，main 受保护；多 Agent 必须各用独立 git worktree 加独立分支；Grok Bot 自己的记忆只做次级索引，真源在仓库。

### edges 与业界的对照

| 维度 | 业界常见做法 | edges |
| --- | --- | --- |
| 载体 | Markdown 文件加目录 | 相同，且整个仓库都是记忆的一部分 |
| 索引 | `MEMORY.md`、frontmatter、文件树 | 各层 `AGENTS.md` 与类型 `README.md`，由 CLI 生成 |
| 分层 | 组织 / 用户 / 项目 / 本地 | 递归作用域（任意目录可 init），`--super` 指向仓库根 |
| 记忆类型 | Claude Code 四类 | 内置六类且可扩展，前四类与 Claude Code 对齐 |
| 写入审阅 | Letta 自动提交；Claude Code 本机直接写 | 人审 PR 合入受保护 main |
| 并发 | Letta 子 Agent 各用 worktree 再合并 | 每个 Agent 一个 worktree 加分支，经 PR 合并 |
| 检索 | grep 为主，可选向量索引 | CLI list/get 加 grep，暂无向量层 |
| 私有内容 | `CLAUDE.local.md`、仓库外目录 | gitignore 的 `users/`，或私有仓 |

## 所学

- edges 的路线（文件为真源、git 为版本层、索引由工具生成、按作用域分层）与 Claude Code、Letta、Codex、Karpathy 的做法方向一致，不是孤例。
- 与业界最大的差异是「人审 PR」：Letta 选择自动提交以换取低延迟，edges 选择审阅以换取质量与公开安全。两者都成立，取决于记忆写入频率与公开程度。
- 「检索靠 grep 还是向量」不必二选一：业界常见做法是文件为真源、索引为可重建的派生物；现阶段 edges 规模下 grep 足够，没有必要引入向量库。
- Mem0 这类抽取式记忆不可直接审阅、不可 diff，与 edges「经你审核合并」的核心诉求不符，所以只作对照，不作替代。

## 行动指南

### 主题行动指南

#### 背景

用 git 仓库承载 Agent 记忆时，需要同时照顾可读、可审、可并发和上下文成本。

#### 核心问题

如何让记忆既能被多个 Agent 安全写入，又不会膨胀成无法加载、无法审阅的一堆文件。

#### 核心解决方案

1. 一条记忆一个 Markdown 文件，索引由工具生成，不手写；索引控制长度，正文按需读。可选项：手写索引（易漂移、并发冲突多，不采用）；向量库为真源（不可审阅，不采用）。
2. 按作用域分层，私有层用 gitignore 或私有仓隔离。
3. 每个 Agent 一个 worktree 加分支，经 PR 合并；索引冲突靠重新生成解决，而不是手工合并。
4. 必须执行的约束放到 hook、CI 或 CLI 校验，不只写在说明文件里。
5. 定期整理：合并重复、拆分大文件、清理过期条目。

#### 验收标准

- [ ] 任一记忆目录的索引都能由工具重建，且重建后无 diff。
- [ ] 并发的两个 Agent 分支合并时，不需要手工解决索引冲突。
- [ ] 每次会话默认加载的记忆内容有明确上限。
- [ ] 公开仓库中没有凭据、账号与未公开地址。

### 细节与其他

#### 若要推进 edges 的下一步

则只作建议，本笔记不改代码：

- 先完成 backlog 中「`memory init` / `remember` 支持 `--super`」，再用 CLI 重整仓库根 `memory/`，删除手写 README。
- 参考 Claude Code 的索引上限，给 CLI 生成的索引加长度检查（例如 `memory doctor` 报告超长索引）。
- 参考 Letta 的 defragmentation，考虑一个整理类 skill：先备份，再合并重复、拆大文件，结果仍走 PR。
- 参考 Letta 的 `system/` 钉住机制与 Claude Code 的 `paths` 规则，评估是否需要「始终加载」与「按路径加载」的元数据。
- 索引冲突：让 CLI 在 rebase 后可一键重建索引，减少多 worktree 合并时的人工处理。
- 向量检索暂不引入；如果将来条目规模让 grep 召回明显不足，再以「可重建的派生索引」方式加入，不改变文件为真源。

#### 若需要更高频的记忆写入

则考虑保留一个本机、gitignore 的草稿层，由人定期挑选晋升为 PR；不要为了高频写入放松 main 保护。

## 补充说明

### 参考来源

- Claude Code 记忆文档（CLAUDE.md、`.claude/rules/`、auto memory、AGENTS.md 读取规则）：https://code.claude.com/docs/en/memory
- Anthropic memory tool 文档（`/memories` 目录、六个命令、安全建议、多会话模式）：https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool
- Anthropic 工程博客《Effective context engineering for AI agents》（just-in-time 检索、structured note-taking）：https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Letta 博客《Introducing Context Repositories: Git-based Memory for Coding Agents》（2026-02-12）：https://www.letta.com/blog/context-repositories/
- Letta 博客《Benchmarking AI Agent Memory: Is a Filesystem All You Need?》（2025-08-12，厂商自测）：https://www.letta.com/blog/benchmarking-ai-agent-memory/
- OpenAI Codex AGENTS.md 指南（全局与项目层查找顺序、override 文件）：https://developers.openai.com/codex/guides/agents-md
- AGENTS.md 开放格式站点（嵌套 AGENTS.md）：https://agents.md/
- Cursor Rules 文档（`.cursor/rules`、`.mdc`）：https://cursor.com/docs/rules
- basic-memory 开源仓库（Markdown 加本地 SQLite 索引、混合检索）：https://github.com/basicmachines-co/basic-memory
- Mem0 开源仓库（记忆层、ADD-only 抽取、实体链接）：https://github.com/mem0ai/mem0
- Mem0 平台文档概览：https://docs.mem0.ai/platform/overview
- Karpathy《LLM Wiki》gist：https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
- git worktree 官方文档：https://git-scm.com/docs/git-worktree

### 未能核实的点

- Anthropic「Managed Agents / Dreams」是否提供文件化记忆：本次未找到一手官方页面，未写入结论。
- Cursor「Memories」功能：官方 rules 文档中未见说明，未写入结论。
- Letta 的 LoCoMo 分数为厂商自测，未独立复现。

### 原始材料引用

- 本笔记由 Grok Bot 于 2026-10-14 按 peng cheng 的调研委托整理。
- 仓库内依据：`README.md`、`AGENTS.md`、`CONTEXT.md`、`docs/adr/0003-user-memory-in-repo-gitignored.md`、`docs/adr/0006-extensible-project-memory-types.md`、`extensions/cli/src/commands/memory/init.ts`、`.harness/tasks/project-memory/backlog/2026-10-14--edges-memory-init-remember-支持-super写入仓库根-memory/`、PR #240、PR #245。