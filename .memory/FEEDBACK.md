# FEEDBACK — 纠正与约束

> 记：用户给出的纠正、明确确认过的做法，以及必须始终生效的禁止模式和它的原因。
> 不记：读代码就能看出来的写法，以及 `AGENTS.md` 已经写过的规则。
> 怎么写：正文先一句结论，再跟 `**Why:**`（为什么，便于以后判断边界情况）和 `**How to apply:**`（具体怎么做）。
> 本文件只是索引，条目区块由脚本重算，正文写在 `feedbacks/feedback_<slug>.md` 里。

<!-- project-memory-entries:start -->
- [Skill 分发：能不要的不要，必须留的软链](feedbacks/feedback_agent_skills_hub_symlink.md) — 整理仓库或本机 .xxx/skills 时：能读 .agents/skills 的不占目录；Claude Code 只留软链，禁止实体拷贝。commands 目录不适用。
- [知识闭环的反馈回到捕获](feedbacks/feedback_knowledge_loop_returns_to_capture.md) — 绘制或描述知识闭环时：反馈必须重新成为输入并回到捕获，不能绕过捕获直接进入生产或沉淀。
- [不要再给本仓库装 OpenSpec](feedbacks/feedback_no_openspec.md) — 规划与决策写 .memory，禁止 openspec init 以及把 skill/command vendor 进仓库里的 agent 目录。
- [笔记里的分工不是用户当前工作流](feedbacks/feedback_notes_are_not_live_user_workflow.md) — 讲用户怎么干活时：只能引笔记/约定并标明来源，不能说成「你的工作流」。
- [断言仓库事实前先跑能证伪它的命令](feedbacks/feedback_verify_before_asserting.md) — 汇报仓库、git 历史或工具行为的事实时：先跑验证命令，别把推断说成查过的。工具输出的显示形态不等于文件内容。
<!-- project-memory-entries:end -->
