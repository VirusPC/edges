---
name: feedback_memory_init_keep_local_until_asked
description: tasks 目录 init/记忆脚手架写完后默认不提交，等用户明确说入库再推。
metadata:
  edges-title: project-memory init 先留本地
  edges-type: feedback
  edges-origin-session-id: e783aa76-4d8c-4296-8080-7ed191474f70
  edges-agent-client: codex
  edges-username: cheng
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-05T05:40:36+08:00'
---

2026-09-11 用户要求对当时的 `knowledge/tasks` 做 project-memory-init（或同类记忆脚手架）后，先在本地审阅，未经明确同意不要提交 / 开 PR。现行板位于 `tasks/` 与 `.harness/tasks/`；可读 AGENTS.md 可成为节点，发现节点本身不自动 Init。此条保留当时草稿的审阅约定，不把它扩展为已授权的自动初始化。

**Why:**
用户可能要先看生成的 `AGENTS.md` / `.memory` 再决定是否入库；自动推送会打乱本机未定稿的改动。

**How to apply:**
- init / remember 可以先落盘到 `/workspace/edges`。
- 问一句是否入库；用户说「先留本地」就停。
- 用户所述约定（2026-09-11）。
