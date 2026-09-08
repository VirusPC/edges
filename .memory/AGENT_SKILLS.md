# AGENT_SKILLS — 人写或装入的技能

> 索引：本层 `.agents/skills/` 下的标准 Agent Skills，人手写或 `npx skills` 装入。
> **本套工具只索引，不改写。** 不创建目录、不生成内容、不动既有文件——那是人与生态的地盘。要新增就手写或用 `npx skills` 装，别指望 `$project-memory-remember`。
> 为什么要这份索引：`.agents/skills/` 只有仓库根那一层会被各家 harness 扫到，嵌套层没有任何工具读。monorepo 里子仓自己的技能，靠这份索引才能被发现。
> 空清单是正常状态——本层没有 `.agents/skills/` 时就该是空的。
> 条目区块由脚本重算，路径相对 `.memory/`，所以形如 `../.agents/skills/<name>/SKILL.md`。

<!-- project-memory-entries:start -->
- [domain-modeling](../.agents/skills/domain-modeling/SKILL.md) — Build and sharpen a project's domain model. Use when discussing codebase terminology, writing or editing a CONTEXT.md, or recording or editing an ADR.
- [grill-me](../.agents/skills/grill-me/SKILL.md) — A relentless interview to sharpen a plan or design.
- [grill-with-docs](../.agents/skills/grill-with-docs/SKILL.md) — A relentless interview to sharpen a plan or design, which also creates docs (ADR's and glossary) as we go.
- [grilling](../.agents/skills/grilling/SKILL.md) — Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
<!-- project-memory-entries:end -->
