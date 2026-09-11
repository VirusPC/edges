---
name: project_box_obsidian_vault_for_preview
description: 预览 tasks/artifacts 时用 /workspace/edges 作 vault、AppImage+--no-sandbox、禁用 Sync；2026-09-11 已验证。
metadata:
  edges-title: 云端 Obsidian vault 选用 edges clone
  edges-type: project
  edges-origin-session-id: e783aa76-4d8c-4296-8080-7ed191474f70
  edges-agent-client: cursor
  edges-username: 通用-辅助-2
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-11T04:59:38+00:00"
---

云端预览 edges 看板时，用官方 AppImage 打开 `/workspace/edges` 作为独立 vault，不用 Obsidian Sync 绑本机库。

**Why:**
本机 vault 与云端 clone 职责不同；Sync 会混库。edges 已有 `.obsidian` 与 `knowledge/tasks/` 状态夹，git 同步足够「看」最新内容。

**How to apply:**
- 安装路径优先 `/home/box/apps/`；启动加 `--no-sandbox`。
- Vault = `/workspace/edges`；内容更新靠 `git pull`。
- 用途限预览；任务状态 / run log 仍按 tasks 约定改仓。
- 已验证（2026-09-11）：Debian 13 box 上 Obsidian 1.13.7 冒烟通过并打开 vault。
