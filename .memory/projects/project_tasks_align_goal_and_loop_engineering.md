---
name: project_tasks_align_goal_and_loop_engineering
description: 设计或验收 tasks / conversation-to-tasks 时：目标+完成标准要与 /goal、loop engineering 一起想；沉淀此类结论时同时写清背景上下文。
metadata:
  edges-title: Tasks 核心思想：与 /goal、loop engineering 同构
  edges-type: project
  edges-origin-session-id: 6a84b2e0-9d0a-4e83-9016-0590c24dde8c
  edges-agent-client: cursor
  edges-username: viruspc
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: "2026-09-24T16:32:20+08:00"
---

Tasks（尤其是「目标 + 完成标准」这一截）要和 **`/goal` 命令**、**loop engineering（循环工程）** 放在同一套思路里设计与验收，而不是当成孤立的看板文案模板。

**Why:**
2026-09-24 定 `conversation-to-tasks` 正文时，对照了 Claude Code / Codex 一类 agent 的 `/goal`：强目标 ≈ 可核验的完成契约；循环工程要把「怎样算做完」写成可观察、可证伪的条件。若任务卡只有模糊方向或动作清单，而没有与 `/goal` 同构的完成标准，下游循环无法闭环。用户明确要求：记 tasks 这块核心思想时，要集合 goal 命令和 loop engineering 去思考，并**同时写下得出该结论的背景上下文**（不是另谈「背景栏怎么给人审」）。

**背景上下文（用户所述 / 同日讨论）：**
- 先从对话整理技能拆出「只成文」的 tasks 草稿，再迭代正文栏：曾对齐仓内结论→事实背景→Why→How，后收成 **背景 → 目标 → 完成标准**（动作可选）。
- 调研里把 agent `/goal` 与循环工程的验收核心，对应到任务卡的「完成标准」；「目标」只给方向，「预期收益」默认进背景（可测成功指标才进完成标准）。
- 流程定为成文 → 人审 → CLI 落库；人审可为对话确认或 PR；是否新建分支不限。
- 同日用户补充本条：核心思想必须挂在 goal + loop 上思考，沉淀时要带上上述背景上下文。

**How to apply:**
- 改 tasks 模板、`conversation-to-tasks`、或写 `/goal` 导出时：用「目标 + 完成标准」当契约核心，完成标准优先可被命令/检查/明确观察证伪。
- 讨论或 remember tasks 相关结论时：正文写清与 `/goal`、loop engineering 的关系，并附一段产生该结论的背景上下文，避免只剩口号。
- 开卡时背景仍写「怎么谈出这张卡」（技能原有要求）；与本条「沉淀时记录背景上下文」是两件事，不要混成「专为 review 背景栏」。
- 细节模板与人审落库见仓根 `project_conversation_to_tasks_body_review_persist`。
