---
name: Letta 与 Devin 的 git 记忆：接入、检索与沉淀
description: 基于源码和官方文档，对比 Letta（MemFS / Context Repositories）与 Devin（Agent Memory Repo）的 git 仓库记忆如何接入项目、如何检索、如何沉淀，并对照 edges。
---

# 基于 git 仓库的 Agent 记忆：Letta 与 Devin/Cognition 实际机制调研

调研日期：2026-10-17（UTC+8）。只用一手来源（源码、官方文档、官方博客）。没能核实的内容标为 **未核实**。

源码版本：
- `letta-ai/letta-code` @ `0d3ad12`（提交于 2026-10-17 11:44 UTC+8）
- `letta-ai/letta` main @ `5bcdd17`：main 分支现在只有 README 等文件。README 写明 "The current source code lives in letta-ai/letta-code"，V1 API server 已退役，放在 `archive` 分支。`letta/services/memory_repo/` 只在 archive 分支 @ `56ba9c2` 里还有。
- `AgentMemoryRepo/agentmemoryrepo` @ `8798cb2`：只有 README.md、SPEC.md、skills/agent-memory-repo/SKILL.md、.devin-plugin/plugin.json、LICENSE，没有代码。

下文路径不带前缀时，均指 letta-code 仓库下的路径。

---

## 一、Letta（Letta Code + MemFS / Context Repositories）

### A. 接入具体项目

1. **记忆仓库属于 agent，不属于项目，也不放在项目目录里。**
   - 本地路径是 `~/.letta/agents/<agentId>/memory`，见 `src/agent/memory-filesystem.ts:46-57`（`getMemoryFilesystemRoot`，由 `.letta`、`agents`、agentId、`memory` 拼成）。
   - local backend 模式下的路径是 `~/.letta/lc-local-backend/.../memfs`，见 `src/utils/local-backend-paths.ts:24-37`。
   - 运行时通过环境变量 `$MEMORY_DIR` / `LETTA_MEMORY_DIR` 暴露给 agent，解析优先级见 `memory-filesystem.ts:91-131`。
   - 系统提示原文："your memory (in MemFS) belongs to you and travels with you wherever you run"；"Skills and files belonging to the environment stay with the environment (e.g. AGENTS.md or .agents)"（`src/agent/prompts/letta_local_memfs.md:137`）。
2. **remote 地址。** Cloud 模式下是 `${base}/v1/git/${agentId}/state.git`（`src/agent/memory-git.ts:228-233`），用 `cloneMemoryRepo`、`pullMemory` 同步（`memory-git.ts:1504`、`1589`）。启动时先 `pull --ff-only`；失败了退到 `pull --rebase`；如果和远端没有共同祖先，就 reset 到远端（`memory-git.ts:1589-1683`）。
3. **项目和 agent 怎么关联。**
   - 关联存在项目的 `.letta/settings.local.json` 里，`LocalProjectSettings` 有 `sessionsByServer` 和已废弃的 `lastAgent` 字段（`src/settings-manager.ts:143-160`）。也就是说，项目目录只记录"上次用的是哪个 agent / 会话"。
   - 关于项目的知识写进这个 agent 自己的 MemFS。`/init` 子代理的提示要求："Use the project's real name in flat root filenames (e.g., letta-code-overview.md)"（`src/agent/subagents/builtin/init-v2.md`）。
   - 也就是说，**不存在独立的项目级记忆仓库**。我的推断：一个 agent 服务多个项目时，按文件名或目录区分项目，源码里没有看到专门的隔离机制。
4. **shared / team 记忆：Shared memory repository。**
   - 这是组织所有的独立 git 仓库，remote 为 `/v1/git/${agentId}/repositories/<name>.git`（`memory-git.ts:235-244`）。
   - 挂载在 `$MEMORY_DIR/../<repo-name>`，与 MemFS 平级，不嵌套在里面（`memory-git.ts:246-251` 的 `getRepositoryMountDir`）。
   - 命令（`src/skills/builtin/managing-shared-memory/SKILL.md`）：
     ```
     letta shared-memory create --name shared-notes
     letta shared-memory attach shared-notes [--agent agent-...]
     letta shared-memory detach | sync | history <repo> --path <file>
     ```
   - 列出挂载仓库时会排除 primary 和 `memory`（`src/agent/attached-repositories.ts:25-28`）。
   - 共享仓库里的 `skills/<name>/SKILL.md` 会被并入可用技能（`src/agent/shared-memory-skills.ts`）。
   - 需要 Cloud。文档原文："Shared memory repositories require cloud-hosted agents"（https://docs.letta.com/concepts/shared-memory/）。
   - **多个仓库怎么组合**：每个仓库是 `$MEMORY_DIR/../` 下一个兄弟 checkout，各有自己的 origin 和权限（`read_write` 或只读，见 `src/agent/attached-repository-git-sync.ts:115-121`）。
5. **两处来源的不一致**：shared-memory 文档说 "The agent's system prompt lists the repository path and its top-level files"，内置 skill 却说 "Shared memory is not part of your system prompt"。我的理解：仓库内容不进系统提示，路径列表可能进。注入路径列表的代码在 letta-code 里没找到，可能在服务端，**未核实**。

### B. 检索机制

1. **每轮常驻（memfs-v2，仓库根目录有 `MEMORY.md` 时启用）。**
   - 判定逻辑在 `src/agent/memory-format.ts:6-19`：根目录的 `*.md`（core memory）**全文**进系统提示。
   - 根 `MEMORY.md` 渲染为 `<memory>` 块。带有自己 `MEMORY.md` 的子目录渲染为 `<deferred-memory><directory path=... index=.../MEMORY.md/>`，只放指针（`src/backend/local/system-prompt-compilation.ts:160-197`）。
   - 内容取自 `git show HEAD:<path>`，**只读已提交的版本**（同文件 `81-140`）。
   - 文档原文："Files at the memory root are loaded into the agent's system prompt on every turn... Directories with their own MEMORY.md index stay out of context until they are needed"（https://docs.letta.com/concepts/memfs）。
2. **旧格式 memfs-v1。** `system/` 下的文件全文进 `<memory>`，其余文件只以 `<external_projection>` 文件树形式出现（`system-prompt-compilation.ts:307-352`）。博客原文："The filetree structure is always in the system prompt... The system/ directory designates which files are always fully loaded"（https://www.letta.com/blog/context-repositories/）。
3. **按需检索。**
   - 主要靠 grep 和文件读取。系统提示原文："Searching through MemFS (running grep or other search operations)"（`letta_local_memfs.md:112-115`）。
   - 文件之间用 `[[path]]` 链接，提示里称之为 "References as synapses"（同文件 `31` 行）。
   - **默认没有向量检索。**文档原文："MemFS does not include a semantic or vector index by default"；可选安装 mod `letta install npm:@letta-ai/memfs-search`，配合 QMD 实现语义或混合检索。
   - 对话历史另有 recall 子代理和 `letta messages search`（Cloud 上支持 vector/hybrid）。
4. **预算与限制。**
   - 文件树：500 行、20000 字符、每个目录 50 个子项，可用环境变量 `LETTA_MEMFS_TREE_MAX_*` 覆盖（`src/utils/directory-limits.ts:6-19`）。
   - `.memfs.config.json` 默认 `maxDepth: 2`、`maxFileCharacters: 20000`、`maxCoreMemoryCharacters: 65536`（`src/memory-constraints.ts:188, 302-308`），由 pre-commit 校验。
   - 估算按 4 字节约 1 token（`src/agent/system-prompt-size.ts:17`）。系统提示过大时，提示 agent 用 `/doctor` 处理。
5. **生效时机。** 系统提示原文："Editing memory does NOT change your behavior in the current turn... applied on a later recompile"（`letta_local_memfs.md:46`）。

### C. 沉淀机制

1. **主代理直接写（inline）。** 系统提示给出的写法（`letta_local_memfs.md:50-67`）：
   ```bash
   cd "$MEMORY_DIR"; git status; git diff; git add <specific files>
   git commit --author="$author_name <$AGENT_ID@letta.com>" -m "<type>: <what changed>" -- <specific files>
   ```
   要求禁止 `git add -A`，只 stage 自己改的文件。
2. **memory 子代理（后台，由主代理委派）。**
   - 定义在 `src/agent/subagents/builtin/memory-v2.md`：在私有 worktree 中编辑，完成后由 harness 合并回主 checkout。
   - 原文要求："Do not push: the harness handles normal sync"，以及 "Reorganize or defragment memory only when explicitly requested"。
3. **reflection（文档称 dreaming / sleep-time，后台）。**
   - 触发方式：`off`、`step-count`、`compaction-event`。**默认是 `compaction-event`**，`stepCount` 默认 25，merge 默认 `auto`（`src/reflection-settings.ts:1`、`src/cli/helpers/memory-reminder.ts:15, 51-56`）。
   - 每轮结束时由 `maybeLaunchPostTurnReflection` 判断是否触发（`src/cli/helpers/post-turn-reflection.ts`）。
   - 也可以手动触发：`/reflect [--recent N | --conversation ID ... | --auto]`，`/dream` 是它的别名；用 `/sleeptime` 配置（`src/cli/commands/registry.ts:86-100, 140-147`）。
   - Windows 默认关闭自动 reflection（`reflection-settings.ts:7-11`）。
   - 子代理定义在 `src/agent/subagents/builtin/reflection-v2.md`：
     - 只有 Bash 和 Edit 两个工具。
     - 读取 `$TRANSCRIPT_PATH`（单个会话，或多会话 manifest，`mode: "replay"` 用于去重）。
     - 分五个阶段：Investigate → Extract（优先记录错误和纠正、偏好、新事实、矛盾、可复用流程）→ Update（矛盾要在源头修正；退役的内容移到 `ARCHIVE.md`）→ Review → Commit。
     - commit 信息模板为 `<type>(reflection): <summary> 🔮`，带 `Agent-ID` / `Parent-Agent-ID` trailer。
   - **worktree 隔离**：分支名 `letta/reflection/<id>`，目录 `memory-worktrees/reflection-<id>`（`src/agent/memory-worktree.ts:125-160`）。
     - 合并冲突时执行 `merge --abort`，清理 worktree，transcript 留待重试（同文件 `591-630`）。
   - **"Agent reviews before applying"（merge=explicit）**：另开一个"Reflection integration"会话，由主代理审阅提案、rebase 到最新 HEAD、自行解决冲突后 merge，但不 push（`src/cli/helpers/reflection-integration.ts`）。文档原文："This uses more model tokens and does not ask you for approval"（https://docs.letta.com/configuration/memory/）。
   - **没有人工审阅环节。**
4. **同步 push。**
   - 每轮结束后由 `syncPendingMemoryCommitsAfterTurn` 处理（`memory-git.ts:1837-1985`）：
     - 工作区有未提交改动 → 不 push，只报告 dirty。
     - 有 ahead 的提交 → 先跑 `invalidPendingMemory` 校验，再 `push origin main`。
     - 遇到 non-fast-forward → `pull --rebase` 后重推一次。
     - 出现冲突 → 状态记为 `conflict`，下一轮通过 reminder 交给 agent 处理。
   - shared 仓库走同样的逻辑，只读仓库不 push（`attached-repository-git-sync.ts`）。
   - 有可选的额外镜像：`/memory-repository set|push <url>`（`registry.ts:384-390`）。
5. **格式校验。**
   - pre-commit hook（`src/agent/memory-git-hooks.ts:30-35, 156-180`）：要求非空 `description` frontmatter；`read_only` 是受保护字段。
   - `validateMemoryTreeConstraints`：v2 必须有根 `MEMORY.md`，每个子目录必须有自己的 `MEMORY.md`，同时检查各项字符预算（`src/memory-constraints.ts:36-80`）。
   - INDEX（`MEMORY.md`）**不会自动生成**，由 agent 或 reflection 手工维护。
6. **初始化与整理。**
   - `/init`（`init-v2.md`，模型 `auto-fast`）：读 AGENTS.md / CLAUDE.md / README / 包清单，生成 5–8 个骨架文件后直接 commit（"No worktree"）。博客说 `/init` 还可以用并行子代理和 worktree 学习 Claude Code / Codex 的历史记录。
   - defrag：博客原文 "backs up the agent's memory filesystem, then launches a subagent that reorganizes files... clean hierarchy of 15–25 focused files"。当前源码里**没找到**名为 defrag 的 skill，只在 memory 子代理的提示里出现 "defragment ... only when explicitly requested"。文档写的是 "ask the agent to reorganize its memory... backs up the current repository before splitting large files, merging duplicates"。对应的独立实现**未核实**。
   - 文档提到 `/remember`，但当前源码的命令注册表里没找到（**未核实**，可能在服务端或已更名）。
7. **服务端实现（旧版）。** archive 分支的 `letta/services/memory_repo/memfs_client_base.py` 把仓库放在 `~/.letta/memfs/`。`path_mapping.py` 规定 `skills/{name}/SKILL.md` 映射为 block label `skills/{name}`，其他 `.md` 文件按 `path[:-3]` 映射为 block label，这就是 "memory block ↔ 文件" 的双向投影。Cloud 版用的 `memfs_client.py` 不在开源仓库里（**未核实**）。

---

## 二、Devin / Cognition Agent Memory Repo（AMR）

### A. 接入具体项目

1. **开源 skill（`skills/agent-memory-repo/SKILL.md`）。**
   - 记忆放在**独立仓库**，原文："never inside the project you're working on"。
   - 默认路径 `~/agent-memory`。如果路径就是当前项目或在项目内部，拒绝使用。
   - 默认只在本地，不配 remote。只有当用户给出自己的私有仓库时，才 `git clone` 或 `pull --ff-only`。
   - 原文："This skill does work only when it is invoked. It doesn't add hooks, scheduled jobs, or startup scripts"。
   - 安装方式：`devin plugins install AgentMemoryRepo/agentmemoryrepo` 或 `npx skills add AgentMemoryRepo/agentmemoryrepo --skill agent-memory-repo`（README）。
2. **多仓库组合（README / cognition.com 的 Composability 一节）。** 多个记忆仓库作为兄弟目录 clone 到同一台机器（`vm/memory-alice/`、`vm/memory-bob/`）。agent 读取每个仓库的 `MEMORY.md`，按"谁说的"写回对应仓库，不确定时询问用户。
3. **Devin 产品（https://docs.devin.ai/product-guides/memory.md）。**
   - 原文："Your memories live in a memory drive: a persistent Git repository of Markdown notes"。
   - 原文："Each session gets its own checkout of the drive and receives MEMORY.md as context"。
   - 作用域：每个用户在每个组织内各一份。原文："Memory is personal to you within each organization. It is not shared with your teammates"。
   - **checkout 在 VM 上的具体路径、相对代码仓库的位置、注入提示的具体文本，均未公开（未核实）。**
   - 由 automation 启动的会话不读也不写记忆。
   - 管理入口：Org / Enterprise 级开关；用户可在 Customize → Memory 关闭自己的记忆。
4. **项目级 / 团队级知识走另外几条通道。**
   - Repo Skills：`.agents/skills/<name>/SKILL.md`，提交在代码仓库里。来源有两个：后端索引，加上会话中 clone 后的磁盘扫描（https://docs.devin.ai/product-guides/skills.md）。
   - `AGENTS.md`：自动注入每个文件前 16 KiB（https://docs.devin.ai/onboard-devin/agents-md.md）。
   - Playbooks：组织级的提示模板。
   - Knowledge：已废弃，正迁移到 Plugins 中的 Skills（https://docs.devin.ai/onboard-devin/knowledge-onboarding.md）。
   - 产品中的 memory **只有个人级**。README 里提到的 "Team memory"、"Agent swarms" 是规范层面的用例，产品是否支持团队级记忆仓库**未核实**（文档明确写的是不共享）。

### B. 检索机制

- **每会话常驻**：只有 `MEMORY.md`。SPEC 原文："Agents load it at the start of every session, so keep it short: include only what every session needs, plus links to everything else"。
- **按需检索**：grep 加 `[[path]]` 链接。skill 原文："Read MEMORY.md → grep -rni "<term>" <path>, or follow [[path]] links"。产品文档原文："Devin searches and reads the other notes only when the task needs them"。
- **向量检索**：规范和文档都没提到（**未核实**，规范层面不存在）。
- **大小预算**：规范只要求 "keep it short"，没有数值。产品中 `MEMORY.md` 的注入上限**未核实**。AGENTS.md 的 16 KiB 是另一个机制，不能挪用过来。
- **条目格式**：一行一个 bullet，加 `[source: <会话链接>; added: YYYY-MM-DD]` 元数据（SPEC.md）。

### C. 沉淀机制

1. **开源 skill：由主代理 inline 写入，且只在调用 skill 时写。**
   - 写之前 `git status --porcelain` 必须为空，否则只读不写。
   - 只 `git add <path>`，禁止 `-A`、force-push、改写历史。
   - 每次编辑都 commit，消息为 `"Remember <short description>"`。只有在用户配置了私有 remote 并要求同步时才 `git push`。
   - 冲突处理：`pull --ff-only` 失败就停下来报告，不自动 merge 或 reset。
   - 原文："Automatic startup and scheduled Dreaming are not included"。
2. **规范层面（README 的 memory loop）**：Clone → Grep → Update（"with no human in the loop"）→ "Push after every edit"。并发冲突的处理：git 拒绝第二次 push，该 agent 读完两边的版本后写一份合并版。
3. **Devin 产品（memory.md 文档）。**
   - **写入时机**：会话中，用户纠正、说明偏好，或 Devin 总结出可复用的东西时，"Devin edits the relevant note"。会话里会出现 "Updated memory" 卡片。
   - **同步**：原文 "Devin commits the edit, merges changes from your other sessions, and saves the result to the drive... a stale write is rejected and retried, and conflicting edits are resolved rather than overwritten"。
   - **生效时机**：新记忆从下一个会话开始生效，写入它的会话本身不受影响。
   - **写什么**：偏好、纠正（附带下次应遵守的规则）、决策及理由、repo 和环境的坑。**不写**会话摘要、任务状态（PR 号等）、容易重新查到的内容、密钥。
   - **Dreaming**：后台会话，在用户近期用过 Devin 时 "about once a day" 运行（release notes 2026-10-09 写作 "Each night"）。职责：合并重叠的笔记；删除临时细节和没有会话用过的过时笔记；补记原会话里漏掉的经验；重组笔记和 `MEMORY.md` 索引。保留来源链接和用户明确说过的偏好。第一次 dream 会从近期会话生成初始记忆。
   - **人工审阅**：没有事前审阅。App 里的记忆文件是只读的，改动要在会话里让 Devin 去做（例如 "forget that I prefer npm"）。用户可以查看每次 dreaming 改了什么。
   - Dreaming 的具体实现（提示词、调度器、是否用 worktree 或分支、合并策略）**未公开（未核实）**。
4. **Repo Skills 的沉淀**是另一条路：Devin 自动建议新建或更新 skill，用户点 "Create PR" 提交到代码仓库，**需要人工通过 PR**（skills.md 的 "Devin Suggests Skills Automatically" 一节）。

---

## 三、与参考设计 "edges" 的对比

"edges" 的参考设计：git 仓库知识库；唯一写入口是一个 CLI，负责校验格式并自动生成 INDEX；所有写入通过人工审阅的 PR 进 main；检索靠路径 / INDEX 加 CLI 的 ask / search。

| 维度 | Letta MemFS | Devin Memory / AMR | edges（参考） |
|---|---|---|---|
| 仓库归属 | 每个 agent 一个，另有 org 共享仓库（Cloud） | 每个用户在每个组织一个（产品）；规范允许任意多个仓库组合 | 团队或项目知识库 |
| 与代码仓库的关系 | 独立，位于 `~/.letta/agents/<id>/memory`；共享仓库在 `$MEMORY_DIR/../<name>` | 独立（skill 明确禁止放在项目内）；产品中的路径未核实 | 独立仓库（假设） |
| 写入口 | 任意文件工具 + git，由 pre-commit hook 校验 frontmatter、索引存在性、预算 | 任意文件工具 + git；无校验器（规范只约定格式） | 唯一 CLI，校验格式 |
| INDEX | `MEMORY.md` 由 agent 手工维护；hook 只检查子目录是否有 `MEMORY.md` | `MEMORY.md` 由 agent 或 Dreaming 维护 | CLI 自动生成 |
| 进 main 的路径 | 直接 commit 到 main，每轮自动 push；后台子代理走 worktree 再 merge；可选"agent 自审"，**无人审** | 直接 commit 并 push / merge，"no human in the loop"；skill 版默认不配 remote | **人工审阅的 PR** |
| 每轮常驻内容 | 根目录 core 文件全文 + `MEMORY.md` + deferred 目录指针（v1 为 `system/` + 文件树） | 只有 `MEMORY.md` | INDEX / 路径（假设） |
| 按需检索 | grep / read、`[[path]]` 链接；可选 memfs-search mod（含语义检索）；recall 子代理检索对话 | grep、`[[path]]` 链接 | CLI ask / search |
| 后台整理 | reflection：按 compaction 或 N 步触发，用 worktree；按需重组 / defrag | Dreaming：约每天一次，去重、清理过时内容、重组索引 | 由人在 PR 中把关 |
| 冲突处理 | 先 rebase 再重试一次；冲突时通过 reminder 交给 agent；reflection 冲突则 abort 后重试 | stale write 被拒后重试，由 agent 解决冲突 | PR review / merge |

**结论要点**：两个系统都把"写入"完全交给 LLM 自主完成，并用后台整理（reflection / Dreaming）兜底质量，都不做人工审阅。edges 把质量门放在 CLI 校验和人工 PR 上，代价是写入延迟和更高的人力成本。Letta 的 pre-commit 约束（frontmatter、子目录必须有 `MEMORY.md`、字符预算），可以直接借鉴到 edges 的 CLI 校验中。Devin 的 `[source:; added:]` 单行条目格式，便于 Dreaming 去重和溯源，也值得借鉴。
