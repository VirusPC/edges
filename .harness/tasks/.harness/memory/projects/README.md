<!-- project-memory-type:start -->
name: project
module: memory
writable: true
gitignore: false
format: ordinary
<!-- project-memory-type:end -->

# PROJECT — 项目上下文

> 记：进行中的工作、关键时间点，以及无法从代码或 git 历史推导出来的决策及其原因，还有项目内的规范。
> 不记：架构、目录结构、文件路径、调试过程——这些直接读代码更准。
> 怎么写：正文先一句结论，再跟 `**Why:**`（为什么，便于以后判断边界情况）和 `**How to apply:**`（具体怎么做）。相对日期换成绝对日期。
> 本文件只是索引，条目区块由脚本重算，正文写在 `projects/project_<slug>/index.md` 里。

<!-- project-entries-local:start -->
## 本层内容

- [根维护看板的七个 Task Project 初始分组决策](project_evaluation_observation_placeholder_projects/INDEX.md) — 根 .harness/tasks 看板的局部历史决策：2026-09-17 确认七个初始分组；空壳与暂缓迁移是当时状态，当前分组以看板索引为准，不推广到其他层级。
- [STAR 用来制定任务（尤其给 agent），不是复盘](project_star_for_agent_task_formulation/INDEX.md) — 各层维护与领域任务采用 STAR 的原因和适用范围；具体写作方法引用 conversation-to-tasks，不重复维护正文、不固定版本，不用于复盘。
- [Task 写法：事实与想法分开](project_task_separate_facts_from_idea/INDEX.md) — 适用于各层领域与维护任务；写法统一由 conversation-to-tasks 维护，本条仅保留原因和范围。
<!-- project-entries-local:end -->
