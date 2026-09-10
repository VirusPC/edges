# PROJECT — 项目上下文

> 记：进行中的工作、关键时间点，以及无法从代码或 git 历史推导出来的决策及其原因。
> 不记：架构、目录结构、文件路径、调试过程——这些直接读代码更准。
> 怎么写：正文先一句结论，再跟 `**Why:**`（为什么，便于以后判断边界情况）和 `**How to apply:**`（具体怎么做）。相对日期换成绝对日期。
> 本文件只是索引，条目区块由脚本重算，正文写在 `projects/project_<slug>.md` 里。

<!-- project-memory-entries:start -->
- [放弃的 ChatGPT MCP 接入](projects/project_abandoned_chatgpt_mcp.md) — 2026-02-19 建过两条空的 ChatGPT MCP change，没有设计可恢复；若再做从当前 MCP 布局重开。
- [Changelog 自动化：调研过，暂不生成正文](projects/project_changelog_automation.md) — 考虑给仓库或 skill 自动生成 changelog 时：维持手写 Unreleased；若要自动化只切版本和校验，不要从 git log 生成条目。
- [对话整理采用复盘四栏](projects/project_conversation_notes_fupan_four_columns.md) — 改 conversation-to-notes 或对话 Note 结构时：用复盘四栏；相关链接写入【补充说明】并附说明；不要复活已关闭的 FIA 中文换皮；不要批量改写旧笔记；不要把升 Edge 写进该 skill。
- [idea→todo→专家→Cloud Agent→改状态](projects/project_idea_todo_expert_cloud_loop.md) — 工作流：idea 记到 knowledge/todos（Todo 记录员）→ 有空时专家 Agent 细聊 → Cursor Cloud Agent 开发 → 开发完改 TODO 状态
- [整仓 MIT，不拆 knowledge 许可证](projects/project_mit_license.md) — 给仓库选许可证、改 LICENSE 或 package.json license 字段时：整仓 MIT，不要给 knowledge/ 另开一份。
- [new-note MCP 的 ingest 约束](projects/project_new_note_ingest.md) — 改 new-note 或新增 MCP ingest 时要遵守的编排、校验、git 失败处理和未完成项。
- [posts 对外展示，Astro 博客 + Actions CI](projects/project_posts_public_astro_blog.md) — posts 面向对外展示；后续以 posts 为数据用 Astro 搭博客，并用 GitHub Actions 在服务器做 CI
- [订阅管理盘点进展](projects/project_progress.md) — 订阅/用量盘点进展：双 Gmail + QQ IMAP、国内 Kimi 无邮箱、CodexBar Linux CLI 已装待鉴权；后续 Apple/微信侧核对。
- [仓库用根 CHANGELOG 和 v 标签发版](projects/project_repo_changelog.md) — 写 Edges 仓库级变更时用根目录 CHANGELOG.md 和 vX.Y.Z tag；不要当成 skill 或 shared-extensions 总账，也不要因它们的补丁去升仓库版本。
- [根硬约束只留聚光灯、脱敏与 git](projects/project_root_important_scope.md) — 改根 AGENTS.md 硬约束时：只留 ask/remember 聚光灯、硬约束写在本区块、公开仓脱敏、git 纪律；bin/scripts 路径约定和交互口吻不进硬约束，也不进 .memory。
- [根 README 以知识闭环为唯一主线](projects/project_root_readme_direction.md) — 设计或修改根 README 时：从投资视角解释知识管理、分层 Agent Memory 与知识闭环，用一张图串联认知资本、Edge、收益、风险、流动性和反馈再投资。
- [跨机器跨 Agent 的 harness 放 shared-extensions](projects/project_shared_extensions.md) — 新增不绑定 Edges 的 skill / MCP 配置 / plugin / hook 时：放 shared-extensions；接入 Edges 的能力仍走 extensions。不要用「换机器带得走」当进 extensions 的充分条件。
- [todos 只追加直接推 main](projects/project_todos_direct_main.md) — 往 knowledge/todos/ 写只追加速记时，直接提交 main、不提 PR
<!-- project-memory-entries:end -->
