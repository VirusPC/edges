---
name: preview-tasks-with-box-obsidian
description: 在 Grok Bot 云端电脑用 Obsidian 打开 /workspace/edges，浏览 knowledge/tasks 状态夹与 artifacts；适合看板预览，不适合当主编辑入口。
metadata:
  edges-title: 用云端 Obsidian 预览 tasks 看板
  edges-origin-session-id: e783aa76-4d8c-4296-8080-7ed191474f70
  edges-agent-client: cursor
  edges-username: 通用-辅助-2
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-11T04:59:38+00:00"
---

# Preview edges tasks board with Obsidian on the Grok Bot box

## When to use
Need to browse `knowledge/tasks/` (or other edges markdown) visually on the cloud PC instead of opening files one by one in chat.

## Steps
1. Ensure AppImage (or extracted `squashfs-root`) exists under `/home/box/apps/` (official Obsidian Linux AppImage). If missing, download and `chmod +x`; prefer extract once for faster relaunch.
2. `git -C /workspace/edges pull --ff-only` so the vault matches remote (or refresh the clone first).
3. Launch with desktop display, e.g. `DISPLAY=:32 /home/box/apps/squashfs-root/obsidian --no-sandbox --disable-gpu` (container needs `--no-sandbox`).
4. Open folder as vault: `/workspace/edges` only. Do **not** sign into Obsidian Sync to the user's personal vault.
5. On first open, choose **Trust author and enable plugins** for this repo's `.obsidian` (or Restricted Mode if only reading).
6. Browse `knowledge/tasks/<status>/…` in the file tree. Treat Obsidian as preview, not the primary editor for task status.

## Outputs
- Readable tasks board / notes / artifacts on the box desktop.
- Optional screenshots for the user.

## Boundaries
- Do not commit Obsidian-local noise (`workspace.json`, etc.) unless the user asks.
- After **Update Grok Bot's Computer**, reinstall/re-extract if the binary is gone; vault data under `/workspace/edges` usually remains.
- Status changes and run logs still go through the edges tasks workflow (status folders + sidecar log), not by casually editing in Obsidian.
