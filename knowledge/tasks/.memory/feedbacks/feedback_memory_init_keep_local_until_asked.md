---
name: feedback_memory_init_keep_local_until_asked
description: tasks 目录 init/记忆脚手架写完后默认不提交，等用户明确说入库再推。
metadata:
  edges-title: project-memory init 先留本地
  edges-type: feedback
  edges-origin-session-id: e783aa76-4d8c-4296-8080-7ed191474f70
  edges-agent-client: cursor
  edges-username: 通用-辅助-2
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-11T04:59:38+00:00"
---

对 `knowledge/tasks` 做 project-memory-init（或同类记忆脚手架）后，默认先留本地，未经用户明确同意不要提交 / 开 PR。

**Why:**
用户可能要先看生成的 `AGENTS.md` / `.memory` 再决定是否入库；自动推送会打乱本机未定稿的改动。

**How to apply:**
- init / remember 可以先落盘到 `/workspace/edges`。
- 问一句是否入库；用户说「先留本地」就停。
- 用户所述约定（2026-09-11）。
