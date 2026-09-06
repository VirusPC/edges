# PROJECT — 项目上下文

> 记：进行中的工作、关键时间点，以及无法从代码或 git 历史推导出来的决策及其原因。
> 不记：架构、目录结构、文件路径、调试过程——这些直接读代码更准。
> 怎么写：正文先一句结论，再跟 `**Why:**`（为什么，便于以后判断边界情况）和 `**How to apply:**`（具体怎么做）。相对日期换成绝对日期。
> 本文件只是索引，条目区块由脚本重算，正文写在 `projects/project_<slug>.md` 里。

<!-- project-memory-entries:start -->
- [放弃的 ChatGPT MCP 接入](projects/project_abandoned_chatgpt_mcp.md) — 2026-02-19 建过两条空的 ChatGPT MCP change，没有设计可恢复；若再做从当前 MCP 布局重开。
- [Changelog 自动化：调研过，暂不生成正文](projects/project_changelog_automation.md) — 考虑给仓库或 skill 自动生成 changelog 时：维持手写 Unreleased；若要自动化只切版本和校验，不要从 git log 生成条目。
- [整仓 MIT，不拆 knowledge 许可证](projects/project_mit_license.md) — 给仓库选许可证、改 LICENSE 或 package.json license 字段时：整仓 MIT，不要给 knowledge/ 另开一份。
- [new-note MCP 的 ingest 约束](projects/project_new_note_ingest.md) — 改 new-note 或新增 MCP ingest 时要遵守的编排、校验、git 失败处理和未完成项。
- [仓库用根 CHANGELOG 和 v 标签发版](projects/project_repo_changelog.md) — 写 Edges 仓库级变更时用根目录 CHANGELOG.md 和 vX.Y.Z tag；不要当成 skill 总账，也不要因 skill 补丁去升仓库版本。
<!-- project-memory-entries:end -->
