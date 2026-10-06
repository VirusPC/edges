---
metadata:
  edges-type: task
  edges-task-project: project-memory
  edges-updated-at: '2026-10-06T16:28:41.083Z'
  edges-title: 脚本：index.md 迁 INDEX.md（含 posts）
  edges-tasks-status: backlog
  edges-task-priority: medium
name: index_md_index_md_posts
description: 可预览迁移脚本，套 CLI 树遍历，将内容叶子 index.md 改为 INDEX.md 并改引用；含 posts 仅改名。
---
## 背景

grill Q14：内容叶子入口从 index.md 迁到 INDEX.md，含 posts/（用户对本轮改名明确授权）。

## 目标

可预览、可重跑脚本完成全仓（含 posts）index.md → INDEX.md，并更新组成登记与正文中的入口引用。

## 动作

- 复用 extensions/cli 的 operations 树遍历，不要另写扫盘发现
- dry-run 列计划与冲突；--apply 写入；幂等
- 校验 posts 仅改名/改链，不改正文内容

## 完成标准

- dry-run / apply / 再跑 apply 无新变更
- 树遍历仍能解析到叶子
- 测试覆盖引用改写
