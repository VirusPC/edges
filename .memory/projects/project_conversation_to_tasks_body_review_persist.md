---
name: project_conversation_to_tasks_body_review_persist
description: 改 conversation-to-tasks 或从对话开卡时：正文背景→目标→完成标准（动作可选）；必填不足先问；成文后交人审（对话或 PR）再 CLI 落库；不限制是否新建分支。
metadata:
  edges-title: conversation-to-tasks：正文三栏 + 人审后落库
  edges-type: project
  edges-origin-session-id: 6a84b2e0-9d0a-4e83-9016-0590c24dde8c
  edges-agent-client: cursor
  edges-username: viruspc
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: "2026-09-24T16:27:48+08:00"
---

`conversation-to-tasks` 的任务正文定为 **背景 → 目标 → 完成标准**（必填），**动作**可选；流程是 **成文 → 交人审 → 落库**。必填依据不足先提问，不编造、不用「无」占位。人审可以是对话确认或 PR；落库用 `edges tasks create` / `update`（必要时 `status`），**不限制**是否新建分支。

**Why:**
与笔记/记忆技能对称的「只整理」边界在任务场景不够：看板写入要有人闸，但落库仍应落在同一技能里（确认后再写），避免整理与落盘永久拆成两套。背景写「怎么谈出这张卡」是为了不在场者能恢复语境，而不是出处标签。目标只给方向；完成标准才是循环工程与 `/goal` 的验收核心，所以预期收益默认进背景，可测成功指标才进完成标准。动作常在执行时才清楚，故可选且不能顶替完成标准。PR 适合批量/异步/多人审，默认对话确认更轻；分支策略属于执行环境，技能不应锁死。

**How to apply:**
- 改 `extensions/skills/conversation-to-tasks` 或从对话开卡时，正文用中文栏名：背景、目标、完成标准；动作有把握再写。
- 背景先连贯叙述产生任务的对话过程，再补现状、约束、预期收益、非目标、关联。
- 三栏缺依据 → 先问再出完整草稿；动作缺了不必追问。
- 人审：默认对话确认；需要异步/多人/大批量时可在某分支落库后提 PR。当前分支或新分支均可，技能不规定必须新建分支。
- 对话确认路径：确认前不调用写盘命令。PR 路径：写在审阅分支上再开 PR，回传路径或 PR 链接。
- 三角分工（notes / remember / tasks）写在 CONTEXT，不要在本技能正文展开。
- 权威流程以该 skill 与 CONTEXT「对话三角色」为准；本条记录 2026-09-24 定稿取舍。旧「事实背景 / Why / How」分节若与本模板冲突，从对话开的新卡以本模板为准。
