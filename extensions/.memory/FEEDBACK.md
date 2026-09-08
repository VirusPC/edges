# FEEDBACK — 纠正与约束

> 记：用户给出的纠正、明确确认过的做法，以及必须始终生效的禁止模式和它的原因。
> 不记：读代码就能看出来的写法，以及 `AGENTS.md` 已经写过的规则。
> 怎么写：正文先一句结论，再跟 `**Why:**`（为什么，便于以后判断边界情况）和 `**How to apply:**`（具体怎么做）。
> 本文件只是索引，条目区块由脚本重算，正文写在 `feedbacks/feedback_<slug>.md` 里。

<!-- project-memory-entries:start -->
- [CLI 项目放 extensions/clis，不放仓库根](feedbacks/feedback_clis_under_extensions.md) — 新增或移动面向 agent 的 CLI 时：放 extensions/clis，禁止仓库根 clis/。
- [接口层方案进 .memory，不进 docs](feedbacks/feedback_interface_plans_in_memory.md) — 写 extensions 层调研或技术方案时：进 .memory（reference/project），禁止放 extensions/docs 或 knowledge/projects，否则 ask 检索不到。
- [改 skill 后必须升级 version、写 changelog、打 tag](feedbacks/feedback_skill_bump_version.md) — 更新 extensions/skills 下任何一个 skill 后，升 SKILL.md version，写 CHANGELOG.md，并打 skill/<name>@<version> tag。
<!-- project-memory-entries:end -->
