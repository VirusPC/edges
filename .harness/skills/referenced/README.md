<!-- project-memory-type:start -->
name: referenced
module: skills
writable: false
gitignore: false
format: skills
<!-- project-memory-type:end -->

# AGENT_SKILLS — 人写或装入的技能

> 索引：本层 `.agents/skills/` 下的标准 Agent Skills，人手写或 `npx skills` 装入。
> **本套工具只索引，不改写。** 不创建目录、不生成内容、不动既有文件——那是人与生态的地盘。要新增就手写或用 `npx skills` 装，别指望 `$project-memory-remember`。
> 为什么要这份索引：`.agents/skills/` 只有仓库根那一层会被各家 harness 扫到，嵌套层没有任何工具读。monorepo 里子仓自己的技能，靠这份索引才能被发现。
> 空清单是正常状态——本层没有 `.agents/skills/` 时就该是空的。
> 条目区块由脚本重算，路径相对本目录，所以形如 `../../.agents/skills/<name>/SKILL.md`。

<!-- project-entries-local:start -->
## 本层内容

- [brainstorming](../../../.agents/skills/brainstorming/SKILL.md) — You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation.
- [conversation-to-notes](../../../.agents/skills/conversation-to-notes/SKILL.md) — 将原始对话整理为可独立阅读的中文笔记（记录 + 复盘）：背景/主题/过程/结果/所学/行动指南/补充说明。 主题=一段主题+难点列表；凡写做什么须带可选项与不做原因；取舍在过程保留并在所学与行动指南补充。 行动指南分主题层与细节若则。结果有未闭环项时逐点问清再交 conversation-to-tasks；必须保留原始材料引用。用户说整理/总结对话时使用；入库 VirusPC/edges notes/。
- [conversation-to-tasks](../../../.agents/skills/conversation-to-tasks/SKILL.md) — 把对话整理成任务（背景 → 目标 → 动作 → 完成标准；后两栏可选）。必填不足先提问；成文后交人审（对话确认或 PR），再用 CLI 落库。分支是否新建不限。
- [domain-modeling](../../../.agents/skills/domain-modeling/SKILL.md) — Build and sharpen a project's domain model. Use when discussing codebase terminology, writing or editing a CONTEXT.md, or recording or editing an ADR.
- [edges-note](../../../.agents/skills/edges-note/SKILL.md) — 把一条 Note 入库到 Edges 仓库时使用。有 shell 就调用 \`edges note\`；没有 shell 的宿主调用对等能力面入口 new-note MCP。不要自己跑 git，也不要找仓根 bin/new-note。
- [executing-plans](../../../.agents/skills/executing-plans/SKILL.md) — Use when you have a written implementation plan to execute in a separate session with review checkpoints
- [finishing-a-development-branch](../../../.agents/skills/finishing-a-development-branch/SKILL.md) — Use when implementation is complete, all tests pass, and you need to decide how to integrate the work
- [grill-me](../../../.agents/skills/grill-me/SKILL.md) — A relentless interview to sharpen a plan or design.
- [grill-with-docs](../../../.agents/skills/grill-with-docs/SKILL.md) — A relentless interview to sharpen a plan or design, which also creates docs \(ADR's and glossary\) as we go.
- [grilling](../../../.agents/skills/grilling/SKILL.md) — Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
- [handoff](../../../.agents/skills/handoff/SKILL.md) — Compact the current conversation into a handoff document for another agent to pick up.
- [horizontal-vertical-research](../../../.agents/skills/horizontal-vertical-research/SKILL.md) — 当用户想要对某个产品、公司、技术概念或人物做一份完整的深度研究报告时使用此技能。采用「横纵分析法」——纵向还原从诞生到现在的发展史与决策逻辑，横向对比同赛道竞品与生态位，最后交汇出判断。输出为 1-3 万字的叙事型深度报告。在以下短语触发："横纵分析"、"深度研究一下 X"、"做一份 X 的研究报告"、"X 的发展史和竞品对比"。不要为快速事实查询或单一问题的检索触发。
- [learn-repo](../../../.agents/skills/learn-repo/SKILL.md) — 当用户想长期学习、精读某个外部代码仓库，并把它关联进 teaching 教学工作区时使用。以 git submodule 把仓库挂到对应主题的 repos/ 下——主仓库只记一个提交指针，不涨克隆体积——并在 RESOURCES.md 登记来源与 commit。触发短语如「我想学一下 XX 仓库」「把 XX 仓库挂进来学」。只是临时看看、总结一下某个仓库时不触发；往 teaching 之外的路径挂载也不归本技能管。
- [paper-10-questions](../../../.agents/skills/paper-10-questions/SKILL.md) — 当用户想要系统性地阅读、分析、审阅、总结或批判一篇学术论文时——尤其是 AI/ML/CS 领域的论文——使用此技能。应用沈向洋博士（Harry Shum）的"论文十问"（Ten Questions for a Paper）框架来引导结构化分析。在以下短语触发："用十问分析这篇论文"、"论文十问"、"帮我读一下这篇 paper"、"review this paper"、"analyze this paper with the ten questions"、"沈向洋十问"。不要为快速关键词查找、引用格式调整或非学术性阅读材料触发。
- [project-memory-add-type](../../../.agents/skills/project-memory-add-type/SKILL.md) — 在指定记忆目录按 LAYOUT 登记一个 Memory Type（\<plural\>/AGENTS.md + 同目录条目 + 层入口一行）。仅当用户明确要求新增 type 时使用。官方类型按选择采用；不要把示例 type 写进 init 模板。
- [project-memory-ask](../../../.agents/skills/project-memory-ask/SKILL.md) — 用户提问或动手改代码前检索本项目 AGENTS.md 索引的项目记忆。不必等用户说搜索；本轮查过不重复。
- [project-memory-doctor](../../../.agents/skills/project-memory-doctor/SKILL.md) — 诊断并修复已采用的 .harness 项目记忆索引与作用域登记。默认只诊断；明确授权修复时 apply。旧布局只报告迁移需求。
- [project-memory-init](../../../.agents/skills/project-memory-init/SKILL.md) — 在指定作用域按用户选择创建或刷新项目记忆与技能类型（AGENTS.md + .harness）。仅当用户明确要求初始化时使用，不覆盖已有正文。
- [project-memory-migrate](../../../.agents/skills/project-memory-migrate/SKILL.md) — 将明确指定作用域的旧 Project Memory .memory 一次性迁到 .harness/memory 和 .harness/skills；保留私有内容、技能资产、来源权限与稀疏子作用域。用于旧项目升级或 Git 升级后遗留的本机用户记忆，不迁业务目录。
- [project-memory-remember](../../../.agents/skills/project-memory-remember/SKILL.md) — 把可复用结论写入本项目 .harness 并刷新索引。用户要求记住时必须用；被纠正、用户给出可用想法/约定/约束、或任务产出已验证、以后还用得上的结论时也要主动用。
- [project-memory-reshape](../../../.agents/skills/project-memory-reshape/SKILL.md) — 把已有 AGENTS.md 按 project-memory-init 的形状重新组织：硬约束写进入口对应区块，区块外只留身份与指针，长规范进 important 或 README，记忆内容抽到 .harness/memory，其余受管区块只留索引。用户要求整理、改造、迁移、重组已有 AGENTS.md 时使用；init/doctor 不改正文，不要用它们代替本 skill。
- [project-tasks-classify](../../../.agents/skills/project-tasks-classify/SKILL.md) — 对整板 Task 按用户已设的 Task Project（标题 + 描述）做归属建议（LLM / agent 判断，不要求 embedding），经 edges tasks project review-page 审阅页等人贴回导出 JSON 后再用 CLI 落地。无 GUI 时才退回 Markdown 表。不要只用 \_default、不要 embedding、不要手改路径、不要当通用 edges-tasks Skill+MCP CRUD。
- [prototype](../../../.agents/skills/prototype/SKILL.md) — Build a throwaway prototype to answer a design question. Use when the user wants to sanity-check whether a state model or logic feels right, or explore what a UI should look like.
- [requesting-code-review](../../../.agents/skills/requesting-code-review/SKILL.md) — Use when completing tasks, implementing major features, or before merging to verify work meets requirements
- [subagent-driven-development](../../../.agents/skills/subagent-driven-development/SKILL.md) — Use when executing implementation plans with independent tasks in the current session
- [summarize-ai-article](../../../.agents/skills/summarize-ai-article/SKILL.md) — 当用户想要快速理解一篇 AI 技术文章的核心时使用此技能。输出一段简短的要点摘要——在解决什么问题、怎么解决、效果如何——并结合读者（agent infra 工程师 + 业务开发）给出后续行动建议和与最新 AI 进展的关联。适合边读边扫的场景。如果需要的是结构化、可归档、要落盘成 markdown 笔记的完整摘要，改用 summarize-ai-article-ultra。
- [summarize-ai-article-ultra](../../../.agents/skills/summarize-ai-article-ultra/SKILL.md) — 当用户想把一篇文章 / 页面内容整理成可归档的中文结构化笔记时使用此技能。按 Facts - Insights - Actions 组织，输出文件名为 YYYY-MM-DD--主题简述.md 的完整笔记，含讨论主题、主要内容、认知更新、行动指南、补充说明五段。适合要落盘进知识库的场景。如果只是想快速扫一眼要点、不落盘，改用 summarize-ai-article；如果整理的是对话记录而非文章，改用 conversation-to-notes。
- [teach](../../../.agents/skills/teach/SKILL.md) — Teach the user a new skill or concept, within this workspace.
- [test-driven-development](../../../.agents/skills/test-driven-development/SKILL.md) — Use when implementing any feature or bugfix, before writing implementation code
- [to-spec](../../../.agents/skills/to-spec/SKILL.md) — Turn the current conversation into a spec and publish it to the project issue tracker: no interview, just synthesis of what you've already discussed.
- [to-tickets](../../../.agents/skills/to-tickets/SKILL.md) — Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, published to the configured tracker \(edges as text in one file per ticket locally, or native blocking links on a real tracker\).
- [user-memory-backup](../../../.agents/skills/user-memory-backup/SKILL.md) — 将指定作用域 .harness/memory/users 的本机私有记忆（含 AGENTS.md 索引及资产）打成归档。换机、删仓或留逃生副本时用；旧 .memory 先用 project-memory-migrate 转换。
- [user-memory-restore](../../../.agents/skills/user-memory-restore/SKILL.md) — 将新布局 user-memory-backup 归档恢复到指定作用域的 .harness/memory/users。目标已占用时需明确授权 --force 整份替换；旧归档须先在隔离旧项目完成转换。
- [using-git-worktrees](../../../.agents/skills/using-git-worktrees/SKILL.md) — Use when starting feature work that needs isolation from current workspace or before executing implementation plans - ensures an isolated workspace exists via native tools or git worktree fallback
- [using-superpowers](../../../.agents/skills/using-superpowers/SKILL.md) — Use when starting any conversation - establishes how to find and use skills, requiring skill invocation before ANY response including clarifying questions
- [weekly-ai-blogs-digest](../../../.agents/skills/weekly-ai-blogs-digest/SKILL.md) — 当用户想要汇总一段时间内（默认过去一周）AI / AI Coding 领域各大博客的新文章时使用此技能。会逐站收集新发布链接、逐篇做 200 字内摘要、总结整体技术风向，并按固定模版输出为 markdown 文件。在以下短语触发："本周 AI 资讯"、"汇总一下 AI 博客"、"weekly AI digest"、"看看这周 AI Coding 有什么新东西"。不要为单篇文章总结（用 summarize-ai-article）或非博客类信源触发。
- [writing-plans](../../../.agents/skills/writing-plans/SKILL.md) — Use when you have a spec or requirements for a multi-step task, before touching code
<!-- project-entries-local:end -->
