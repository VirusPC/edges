---
name: box_obsidian_preview_artifacts
description: 在 Grok Bot 云端电脑安装 Obsidian，用于预览 artifacts（含 tasks 浏览）
metadata:
  edges-type: task
  edges-title: 云端电脑装 Obsidian 预览 artifacts
  edges-tasks-status: done
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-11T12:54:00+08:00"
---

已在 Grok Bot 云端电脑用官方 AppImage（1.13.7）跑通 Obsidian，并以 `/workspace/edges` 为 vault 打开，可预览 `knowledge/tasks/` 等 artifacts。

**Why:**
任务落在 `knowledge/tasks/` 的 markdown 树上，聊天里逐条确认成本高；云端电脑若有 Obsidian，可把 edges / artifacts 当库打开，按状态夹与链接浏览，补上「写」之外的「看」。

**How to apply:**
- 二进制：`/home/box/apps/` 下 AppImage（或解压后的 squashfs-root），启动加 `--no-sandbox`（容器 Electron 需要）。
- Vault：Open folder → `/workspace/edges`（仓库已有 `.obsidian`）；不要用 Obsidian Sync 绑本机库，内容用 `git pull` 更新。
- 用途：预览 tasks / notes / artifacts；主编辑与任务状态流转仍走 edges 任务流程，避免和本机库、直接推 main 的约定冲突。
- 持久化：文件在 `/home/box`、`/workspace` 跨会话保留；若执行 Update Grok Bot's Computer，系统包会丢，AppImage 放 home 一般还在，必要时重装/重解压。
