# PROJECT — 项目上下文

> 记：进行中的工作、关键时间点，以及无法从代码或 git 历史推导出来的决策及其原因，还有项目内的规范。
> 不记：架构、目录结构、文件路径、调试过程——这些直接读代码更准。
> 怎么写：正文先一句结论，再跟 `**Why:**`（为什么，便于以后判断边界情况）和 `**How to apply:**`（具体怎么做）。相对日期换成绝对日期。
> 本文件只是索引，条目区块由脚本重算，正文写在 `projects/project_<slug>.md` 里。

<!-- project-memory-entries:start -->
- [new_note 收成 extensions/clis/edges，MCP 保留](projects/project_clis_from_mcp.md) — 改 note ingest、new-note MCP 或 clis 时：本地 agent 走 extensions/clis 的 edges note；git 在 CLI 的 TS 模块；MCP 子进程调 edges note；鉴权 flag 留在 note 上；JSON stdout。不要把 CLI 放仓库根。
- [Skill 独立发版，changelog 按 skill 分](projects/project_skill_independent_versioning.md) — 决定 changelog、tag、semver 粒度时：每个 skill 一份，不要 extensions/skills 总 changelog。
<!-- project-memory-entries:end -->
