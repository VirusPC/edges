# AGENT_SKILLS — 人写或装入的技能

> 索引：本层 `.agents/skills/` 下的标准 Agent Skills，人手写或 `npx skills` 装入。
> **本套工具只索引，不改写。** 不创建目录、不生成内容、不动既有文件——那是人与生态的地盘。要新增就手写或用 `npx skills` 装，别指望 `$project-memory-remember`。
> 为什么要这份索引：`.agents/skills/` 只有仓库根那一层会被各家 harness 扫到，嵌套层没有任何工具读。monorepo 里子仓自己的技能，靠这份索引才能被发现。
> 空清单是正常状态——本层没有 `.agents/skills/` 时就该是空的。
> 条目区块由脚本重算，路径相对 `.memory/`，所以形如 `../.agents/skills/<name>/SKILL.md`。

<!-- project-memory-entries:start -->
- [conversation-to-notes](../.agents/skills/conversation-to-notes/SKILL.md) — 将原始对话记录整理为结构清晰的中文笔记摘要。使用复盘四栏（背景→过程→所学→行动指南），灵感来自 After Action Review，但不是官方 AAR 模板。含补充说明（相关链接写入该栏并附简短说明）。
- [domain-modeling](../.agents/skills/domain-modeling/SKILL.md) — Build and sharpen a project's domain model. Use when discussing codebase terminology, writing or editing a CONTEXT.md, or recording or editing an ADR.
- [grill-me](../.agents/skills/grill-me/SKILL.md) — A relentless interview to sharpen a plan or design.
- [grill-with-docs](../.agents/skills/grill-with-docs/SKILL.md) — A relentless interview to sharpen a plan or design, which also creates docs (ADR's and glossary) as we go.
- [grilling](../.agents/skills/grilling/SKILL.md) — Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
- [horizontal-vertical-research](../.agents/skills/horizontal-vertical-research/SKILL.md) — 当用户想要对某个产品、公司、技术概念或人物做一份完整的深度研究报告时使用此技能。采用「横纵分析法」——纵向还原从诞生到现在的发展史与决策逻辑，横向对比同赛道竞品与生态位，最后交汇出判断。输出为 1-3 万字的叙事型深度报告。在以下短语触发："横纵分析"、"深度研究一下 X"、"做一份 X 的研究报告"、"X 的发展史和竞品对比"。不要为快速事实查询或单一问题的检索触发。
- [learn-repo](../.agents/skills/learn-repo/SKILL.md) — 当用户想长期学习、精读某个外部代码仓库，并把它关联进 knowledge/teaching 教学工作区时使用。以 git submodule 把仓库挂到对应主题的 repos/ 下——主仓库只记一个提交指针，不涨克隆体积——并在 RESOURCES.md 登记来源与 commit。触发短语如「我想学一下 XX 仓库」「把 XX 仓库挂进来学」。只是临时看看、总结一下某个仓库时不触发；往 knowledge/teaching 之外的路径挂载也不归本技能管。
- [paper-10-questions](../.agents/skills/paper-10-questions/SKILL.md) — 当用户想要系统性地阅读、分析、审阅、总结或批判一篇学术论文时——尤其是 AI/ML/CS 领域的论文——使用此技能。应用沈向洋博士（Harry Shum）的"论文十问"（Ten Questions for a Paper）框架来引导结构化分析。在以下短语触发："用十问分析这篇论文"、"论文十问"、"帮我读一下这篇 paper"、"review this paper"、"analyze this paper with the ten questions"、"沈向洋十问"。不要为快速关键词查找、引用格式调整或非学术性阅读材料触发。
- [project-memory-ask](../.agents/skills/project-memory-ask/SKILL.md) — 用户提问或动手改代码前检索本项目 AGENTS.md 索引的项目记忆。不必等用户说搜索；本轮查过不重复。
- [project-memory-doctor](../.agents/skills/project-memory-doctor/SKILL.md) — 体检整棵项目记忆树，修掉索引不一致（死条目、未登记的记忆目录、重复或错位的条目、别人的 AGENTS.md）。用户要求整理、检查或修复项目记忆时使用；init 返回 needs-doctor 时也用。默认只诊断，改文件要显式确认。
- [project-memory-init](../.agents/skills/project-memory-init/SKILL.md) — 在指定目录创建或修复项目记忆（AGENTS.md + .memory）。仅当用户明确要求初始化时使用，禁止自动调用；不覆盖已有正文。
- [project-memory-remember](../.agents/skills/project-memory-remember/SKILL.md) — 把可复用结论写入本项目 .memory 并刷新索引。用户要求记住时必须用；被纠正、用户给出可用想法/约定/约束、或任务产出已验证、以后还用得上的结论时也要主动用。
- [project-memory-reshape](../.agents/skills/project-memory-reshape/SKILL.md) — 把已有 AGENTS.md 按 project-memory-init 的形状重新组织：硬约束写进入口对应区块，区块外只留身份与指针，长规范进 important 或 README，记忆内容抽到 .memory，其余受管区块只留索引。用户要求整理、改造、迁移、重组已有 AGENTS.md 时使用；init/doctor 不改正文，不要用它们代替本 skill。
- [summarize-ai-article-ultra](../.agents/skills/summarize-ai-article-ultra/SKILL.md) — 当用户想把一篇文章 / 页面内容整理成可归档的中文结构化笔记时使用此技能。按 Facts - Insights - Actions 组织，输出文件名为 YYYY-MM-DD--主题简述.md 的完整笔记，含讨论主题、主要内容、认知更新、行动指南、补充说明五段。适合要落盘进知识库的场景。如果只是想快速扫一眼要点、不落盘，改用 summarize-ai-article；如果整理的是对话记录而非文章，改用 conversation-to-notes。
- [summarize-ai-article](../.agents/skills/summarize-ai-article/SKILL.md) — 当用户想要快速理解一篇 AI 技术文章的核心时使用此技能。输出一段简短的要点摘要——在解决什么问题、怎么解决、效果如何——并结合读者（agent infra 工程师 + 业务开发）给出后续行动建议和与最新 AI 进展的关联。适合边读边扫的场景。如果需要的是结构化、可归档、要落盘成 markdown 笔记的完整摘要，改用 summarize-ai-article-ultra。
- [teach](../.agents/skills/teach/SKILL.md) — Teach the user a new skill or concept, within this workspace.
- [weekly-ai-blogs-digest](../.agents/skills/weekly-ai-blogs-digest/SKILL.md) — 当用户想要汇总一段时间内（默认过去一周）AI / AI Coding 领域各大博客的新文章时使用此技能。会逐站收集新发布链接、逐篇做 200 字内摘要、总结整体技术风向，并按固定模版输出为 markdown 文件。在以下短语触发："本周 AI 资讯"、"汇总一下 AI 博客"、"weekly AI digest"、"看看这周 AI Coding 有什么新东西"。不要为单篇文章总结（用 summarize-ai-article）或非博客类信源触发。
<!-- project-memory-entries:end -->
