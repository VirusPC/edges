---
name: project_box_obsidian_vault_for_preview
description: >-
  Edges 仓库部署约定：云端 Obsidian 使用独立 Edges clone，不连接本机 Sync；归根节点部署记忆，具体环境为 2026-09-11
  的验证记录。
metadata:
  edges-title: Edges 云端部署：Obsidian vault 使用仓库 clone
  edges-type: project
  edges-origin-session-id: e783aa76-4d8c-4296-8080-7ed191474f70
  edges-agent-client: cursor
  edges-username: cheng
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-05T18:08:21+08:00'
---

本条属于 Edges 仓库的部署逻辑，归根节点的部署记忆；不是 Tasks 看板规范，也不归预览 Skill 的局部记忆。

云端预览 edges 看板时，用官方 AppImage 打开 `/workspace/edges` 作为独立 vault，不用 Obsidian Sync 绑本机库。

**Why:**
本机 vault 与云端 clone 职责不同；Sync 会混库。edges 已有 `.obsidian` 与 `knowledge/tasks/` 状态夹，git 同步足够「看」最新内容。

**How to apply:**
- 安装路径优先 `/home/box/apps/`；启动加 `--no-sandbox`。
- Vault = `/workspace/edges`；内容更新靠 `git pull`。
- 用途限预览；任务状态 / run log 仍按 tasks 约定改仓。
- 已验证（2026-09-11）：Debian 13 box 上 Obsidian 1.13.7 冒烟通过并打开 vault。


2026-10-05 用户纠正归属：云端 Obsidian vault 与 Edges clone 的配置属于 Edges 仓库部署逻辑。具体环境与验证结果仍是 2026-09-11 的历史记录，本次未重新验证部署状态。当前先修正归属说明，文件待统一迁移至根 .harness/memory/projects/。
