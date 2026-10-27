<!-- edges-memory-type:start -->
name: referenced
module: skills
writable: false
gitignore: false
format: skills
<!-- edges-memory-type:end -->

# AGENT_SKILLS — 人写或装入的技能

> 索引：本层 `.agents/skills/` 下的标准 Agent Skills，人手写或 `npx skills` 装入。
> **本套工具只索引，不改写。** 不创建目录、不生成内容、不动既有文件——那是人与生态的地盘。要新增就手写或用 `npx skills` 装，别指望 `$edges-memory-remember`。
> 为什么要这份索引：`.agents/skills/` 只有仓库根那一层会被各家 harness 扫到，嵌套层没有任何工具读。monorepo 里子仓自己的技能，靠这份索引才能被发现。
> 空清单是正常状态——本层没有 `.agents/skills/` 时就该是空的。
> 条目区块由脚本重算，路径相对本目录，所以形如 `../../.agents/skills/<name>/SKILL.md`。

<!-- edges-entries-local:start -->
## 本层内容

- [brainstorming](../../../.agents/skills/brainstorming/SKILL.md) — You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation.
- [edges\-conversation\-to\-notes](<../../../.agents/skills/edges-conversation-to-notes/SKILL.md>) — 将原始对话整理为可独立阅读的中文笔记（记录 \+ 复盘）：背景/主题/过程/结果/所学/行动指南/补充说明。 主题=一段主题\+难点列表；凡写做什么须带可选项与不做原因；取舍在过程保留并在所学与行动指南补充。 行动指南分主题层与细节若则。结果有未闭环项时逐点问清再交 edges\-conversation\-to\-tasks；必须保留原始材料引用。用户说整理/总结对话时使用；入库所选目录的 notes/。
- [edges\-conversation\-to\-tasks](<../../../.agents/skills/edges-conversation-to-tasks/SKILL.md>) — 把对话整理成任务（背景 → 目标 → 动作 → 完成标准；后两栏可选）。必填不足先提问；成文后交人审（对话确认或 PR），再用 CLI 落库。看板文件进受保护的 main 必须开 PR，不要直推。
- [edges\-langfuse\-agent\-tracing](<../../../.agents/skills/edges-langfuse-agent-tracing/SKILL.md>) — 当用户要把编码 Agent 或 Grok Bot 的会话接到 Langfuse 时加载本 skill，再按表面打开 references。 本机 Codex、Cursor、Claude Code、OpenCode、Pi：安装以官方文档为准，补 environment（\*\-local）与设备 tags。 Codex Cloud（chatgpt.com/codex）：云端容器里官方插件、hooks、OTel 都用不了，改本机带外轮询写 OTLP；轮询脚本不在本仓库。 Cursor Cloud Agents：云端只执行仓库里的项目级 hooks，用包装脚本懒加载官方 cursor\-observability\-plugin。 Grok Bot 助手会话导出：步骤与环境变量在 references，导出脚本不随本包发布。 还没确定表面时不要装插件、改配置或写密钥。
- [domain-modeling](../../../.agents/skills/domain-modeling/SKILL.md) — Build and sharpen a project's domain model. Use when discussing codebase terminology, writing or editing a CONTEXT.md, or recording or editing an ADR.
- [executing-plans](../../../.agents/skills/executing-plans/SKILL.md) — Use when you have a written implementation plan to execute in a separate session with review checkpoints
- [finishing-a-development-branch](../../../.agents/skills/finishing-a-development-branch/SKILL.md) — Use when implementation is complete, all tests pass, and you need to decide how to integrate the work
- [grill-me](../../../.agents/skills/grill-me/SKILL.md) — A relentless interview to sharpen a plan or design.
- [grill-with-docs](../../../.agents/skills/grill-with-docs/SKILL.md) — A relentless interview to sharpen a plan or design, which also creates docs \(ADR's and glossary\) as we go.
- [handoff](../../../.agents/skills/handoff/SKILL.md) — Compact the current conversation into a handoff document for another agent to pick up.
- [edges\-memory\-add\-type](<../../../.agents/skills/edges-memory-add-type/SKILL.md>) — 在指定记忆目录按 LAYOUT 登记一个 Memory Type（\<plural\>/README.md \+ 同目录条目 \+ 层入口一行）。仅当用户明确要求新增 type 时使用。官方类型按选择采用；不要把示例 type 写进 init 模板。
- [edges-memory-ask](../../../.agents/skills/edges-memory-ask/SKILL.md) — 用户提问或动手改代码前检索本项目 AGENTS.md 索引的项目记忆。不必等用户说搜索；本轮查过不重复。
- [edges-memory-remember](../../../.agents/skills/edges-memory-remember/SKILL.md) — 把可复用结论写入本项目 .edges 并刷新索引。用户要求记住时必须用；被纠正、用户给出可用想法/约定/约束、或任务产出已验证、以后还用得上的结论时也要主动用。
- [prototype](../../../.agents/skills/prototype/SKILL.md) — Build a throwaway prototype to answer a design question. Use when the user wants to sanity-check whether a state model or logic feels right, or explore what a UI should look like.
- [requesting-code-review](../../../.agents/skills/requesting-code-review/SKILL.md) — Use when completing tasks, implementing major features, or before merging to verify work meets requirements
- [subagent-driven-development](../../../.agents/skills/subagent-driven-development/SKILL.md) — Use when executing implementation plans with independent tasks in the current session
- [teach](../../../.agents/skills/teach/SKILL.md) — Teach the user a new skill or concept, within this workspace.
- [test-driven-development](../../../.agents/skills/test-driven-development/SKILL.md) — Use when implementing any feature or bugfix, before writing implementation code
- [to-spec](../../../.agents/skills/to-spec/SKILL.md) — Turn the current conversation into a spec and publish it to the project issue tracker: no interview, just synthesis of what you've already discussed.
- [to-tickets](../../../.agents/skills/to-tickets/SKILL.md) — Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, published to the configured tracker \(edges as text in one file per ticket locally, or native blocking links on a real tracker\).
- [using-git-worktrees](../../../.agents/skills/using-git-worktrees/SKILL.md) — Use when starting feature work that needs isolation from current workspace or before executing implementation plans - ensures an isolated workspace exists via native tools or git worktree fallback
- [using-superpowers](../../../.agents/skills/using-superpowers/SKILL.md) — Use when starting any conversation - establishes how to find and use skills, requiring skill invocation before ANY response including clarifying questions
- [writing-plans](../../../.agents/skills/writing-plans/SKILL.md) — Use when you have a spec or requirements for a multi-step task, before touching code
- [edges\-onboarding](<../../../.agents/skills/edges-onboarding/SKILL.md>) — 帮用户第一次接入 Edges 时使用：安装 edges CLI（npm 包 @viruspc/edges）、初始化目录、跑一次验证、学会常用命令、排查安装与鉴权报错。用户说「帮我接入 edges」「安装 edges」「edges 怎么用」「edges 报错了」「给我的仓库配一套 edges」时触发。已经装好、只是要写笔记请改用 edges；整理对话改用 edges\-conversation\-to\-notes；项目记忆的检索与沉淀改用 edges\-memory\-ask / edges\-memory\-remember，初始化系统入口改用 edges。本 skill 只做入口与引导，具体操作一律交给 edges CLI 执行。
- [edges](<../../../.agents/skills/edges/SKILL.md>) — Edges 日常模块的总入口。要做这些事时加载本 skill，再打开 references 里对应的一份： 把外部 harness 仓库挂到当前 scope（edges compose add、list、update；add 必须带 \-\-description；不经手 git token）； 把一条 Note 入库（有 shell 用 edges notes，没有 shell 用 new\-note MCP；只写本地叶子，不要自己跑 git）； 用 edges routines 创建、查询、更新或删除例程定义，或让外部平台 Agent 按仓库记录接入（记录日程并引用 Skill，触发和执行由平台负责）； 对用户选定的目录初始化或刷新系统入口 AGENTS.md（仅当用户明确要求 init；标准命令是 edges init；各域 init 只初始化本模块）； 将 .edges/memory/users 的本机私有记忆打成归档，或从归档恢复（换机、删仓；目标已占用时须明确授权 \-\-force 整份替换）。 检索项目记忆用 edges\-memory\-ask，沉淀用 edges\-memory\-remember，新增 Memory Type 用 edges\-memory\-add\-type。 第一次接入用 edges\-onboarding。整理对话用 edges\-conversation\-to\-notes 或 edges\-conversation\-to\-tasks。 整板 Task 按已有 Task Project 归类用 edges\-tasks\-classify。 把会话接到 Langfuse 用 edges\-langfuse\-agent\-tracing。
- [edges\-tasks\-classify](<../../../.agents/skills/edges-tasks-classify/SKILL.md>) — 对整板 Task 按用户已设的 Task Project（标题 \+ 描述）做归属建议（LLM / agent 判断，不要求 embedding），经 edges tasks project review\-page 审阅页等人贴回导出 JSON 后再用 CLI 落地。无 GUI 时才退回 Markdown 表。不要只用 \_default、不要 embedding、不要手改路径、不要当通用 edges\-tasks Skill\+MCP CRUD。
<!-- edges-entries-local:end -->
