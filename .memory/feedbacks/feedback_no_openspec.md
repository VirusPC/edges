---
name: feedback_no_openspec
title: 不要再给本仓库装 OpenSpec
description: 规划与决策写 .memory，禁止 openspec init 以及把 skill/command vendor 进仓库里的 agent 目录。
type: feedback
username: viruspc
email: cheng.peng.helloworld@gmail.com
updatedAt: "2026-09-06T16:53:25+08:00"
---

本仓库不再使用 OpenSpec。不要重新执行 `openspec init`，也不要把 OpenSpec 的 skill / slash command 再 vendor 进仓库里的 `.claude/`、`.agents/`、`.cursor/` 等目录。

**Why:** OpenSpec 的 artifacts 想当项目长期记忆，但整份 spec/change 对 Agent 不好分层消费。本仓库已改用 `.memory` 的分类型、分目录记忆。重新安装会把约 90 个 skill/command 副本写回各 agent 目录，并让 `npx skills add VirusPC/edges` 扫到那些副本而不是 `extensions/skills/`。

**How to apply:** 规划、决策、未完成工作写进 `.memory`（`project` / `feedback`）。知识库里讨论 OpenSpec 的笔记保留，那是认知材料。本机可以留着全局 `openspec` CLI，但不要再对本仓库跑 `init` / `update`。
