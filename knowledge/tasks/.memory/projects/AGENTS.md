# PROJECT — 项目上下文

> 记：进行中的工作、关键时间点，以及无法从代码或 git 历史推导出来的决策及其原因，还有项目内的规范。
> 不记：架构、目录结构、文件路径、调试过程——这些直接读代码更准。
> 怎么写：正文先一句结论，再跟 `**Why:**`（为什么，便于以后判断边界情况）和 `**How to apply:**`（具体怎么做）。相对日期换成绝对日期。
> 本文件只是索引，条目区块由脚本重算，正文写在 `projects/project_<slug>.md` 里。

<!-- project-memory-entries:start -->
- [派发默认先 grill-with-docs](project_assign_grill_with_docs_first.md) — 指派 tasks 工作项时默认要求执行方先 grill-with-docs，过关再实现；除非用户当次跳过
- [云端 Obsidian vault 选用 edges clone](project_box_obsidian_vault_for_preview.md) — 预览 tasks/artifacts 时用 /workspace/edges 作 vault、AppImage+--no-sandbox、禁用 Sync；2026-09-11 已验证。
- [七个 Task Project 占位已确认](project_evaluation_observation_placeholder_projects.md) — 改看板 Task Project 分组或往 knowledge/tasks/<slug> 落卡时打开：用户已确认七个空壳质心（project-memory、edges-tasks、edges-cli-platform、evaluation、observation、site-and-content、agent-clients-ux）；现有卡仍留 _default，等 classify/#78 再迁。仓根 evaluation/ 不是看板 project。
- [Task 正文分节事实/idea，并一句话讲清问题与结果](project_task_separate_facts_from_idea.md) — 写/改 Task 时：分节事实/idea + 一句话讲清问题与预期结果；从对话经 conversation-to-tasks 开的新卡改走背景→目标→完成标准。
- [Task 看板变更优先走 edges tasks CLI](project_tasks_board_mutations_via_cli.md) — 任务记录员等 agent 改 knowledge/tasks 时优先走 edges tasks CLI 与已有 tasks Skill（如 project-tasks-classify）；缺口上报用户。本条是根 prefer_repo_skills_and_cli 的看板特化。
<!-- project-memory-entries:end -->
