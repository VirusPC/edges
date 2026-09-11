# FEEDBACK — 纠正与约束

> 记：用户给出的纠正、明确确认过的做法，以及必须始终生效的禁止模式和它的原因。
> 不记：读代码就能看出来的写法，以及 `AGENTS.md` 已经写过的规则。
> 怎么写：正文先一句结论，再跟 `**Why:**`（为什么，便于以后判断边界情况）和 `**How to apply:**`（具体怎么做）。
> 本文件只是索引，条目区块由脚本重算，正文写在 `feedbacks/feedback_<slug>.md` 里。

<!-- project-memory-entries:start -->
- [Skill 分发：能不要的不要，必须留的软链](feedbacks/feedback_agent_skills_hub_symlink.md) — 整理仓库或本机 .xxx/skills 时：能读 .agents/skills 的不占目录；Claude Code 只留软链，禁止实体拷贝。commands 目录不适用。
- [能力面必须 CLI / Skill / MCP 并列](feedbacks/feedback_capability_surface_three_peers.md) — 写能力面标题、Why、How-to 时：三者并列；禁止「必要时 MCP」、禁止用「一个 CLI + 一份 skill」当本仓简称。
- [知识闭环的反馈回到捕获](feedbacks/feedback_knowledge_loop_returns_to_capture.md) — 绘制或描述知识闭环时：反馈必须重新成为输入并回到捕获，不能绕过捕获直接进入生产或沉淀。
- [不要再给本仓库装 OpenSpec](feedbacks/feedback_no_openspec.md) — 规划与决策写 .memory，禁止 openspec init 以及把 skill/command vendor 进仓库里的 agent 目录。
- [teach 工作区放 knowledge/teaching，不放 .teaching](feedbacks/feedback_teach_workspace_location.md) — 为 teach 技能新建教学工作区时：一律放 knowledge/teaching/<topic>/ 并在 knowledge/teaching/README.md 登记；不要写到 .teaching/。
- [断言仓库事实前先跑能证伪它的命令](feedbacks/feedback_verify_before_asserting.md) — 汇报仓库、git 历史或工具行为的事实时：先跑验证命令，别把推断说成查过的。工具输出的显示形态不等于文件内容。
<!-- project-memory-entries:end -->
