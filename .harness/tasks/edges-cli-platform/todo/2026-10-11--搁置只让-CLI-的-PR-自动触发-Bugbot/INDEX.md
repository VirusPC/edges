---
metadata:
  edges-type: task
  edges-task-project: edges-cli-platform
  edges-updated-at: '2026-10-11T11:06:11.467Z'
  edges-title: 搁置：只让 CLI 的 PR 自动触发 Bugbot
  edges-tasks-status: todo
  edges-task-priority: none
name: shelve_cli_pr_bugbot_auto_trigger
description: Bugbot 不能按目录自动跑；Action、PAT、云端 Agent 身份都不通，先记结论，另议方案。
---
**背景：**
2026-10-11 为减少非 CLI PR 被 Cursor Bugbot 审查，peng cheng 把后台改成「只在评论点名时才跑」，并尝试用仓库机制只对 `extensions/cli/**` 的 PR 自动点名。先后试了 GitHub Action（github-actions 发 `bugbot run`）、个人 PAT Secret、云端 Agent 代发评论、仓库记忆 + AGENTS.md 硬约束。实测结论：Bugbot 不认 github-actions 评论；认 VirusPC 本人的评论；云端 Agent 的 gh 是 Cursor App 身份，发评论也不认；用户明确不要引入 token/PAT。兼容链条多，用户要求先搁置。
- 相关现状：#209（Action 方案）已关；#212（记忆方案）本次一并关闭；`extensions/cli/.cursor/BUGBOT.md` 与 CODEOWNERS 仍在。
- 非目标：本卡不实现自动点名，不引入 PAT、Action 或定时任务。
- 关联：PR #200、#209、#212；项目记忆草案曾用 slug `project_bugbot_comment_trigger_for_cli`（勿当已定方案）。

**目标：**
把「只让 CLI PR 触发 Bugbot」的尝试结论与未解兼容点记成可接力的任务，方便以后再选方案。

**动作：**（可选，已谈清怎么记）
- 保留实测结论：github-actions 评论无效；VirusPC 授权身份有效；云端 Cursor App 身份无效；用户不要 PAT。
- 以后若再做，候选方向包括：人手评论、Grok Bot 用已授权 GitHub 插件代评、或其他不引入仓库 Secret 的路径。

完成标准省略（待另议）。
