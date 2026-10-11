---
name: langfuse_offsite_backup
description: v1 先用 docker named volumes + 偶尔打包，缺异地定期备份；需要把备份落到另一台（NAS/云盘等）以防单机丢失。
metadata:
  edges-type: task
  edges-title: Langfuse 定期备份到另一台（NAS/云盘等）
  edges-tasks-status: backlog
  edges-task-project: observation
  edges-updated-at: '2026-10-11T09:28:35.736Z'
---

结论（idea）：建立到另一台（NAS/云盘等）的定期异地备份。

**事实背景:**
- 父卡已完成 v1 验收：`.harness/tasks/observation/done/2026-09-20--自部署-Langfuse/INDEX.md`（自部署 Langfuse）。异地定期备份仍未做。
- minigtr设备助手 2026-09-20 要求拆后续，勿并进父卡当已完成。
- v1：先用 docker named volumes + 偶尔打包，缺异地定期备份。

**Why:**
v1 只在本机 named volume 上偶尔打包，单机丢失会带走观测数据；需要把备份落到另一台（NAS/云盘等）。

**How to apply:**
- grill 目标介质、节奏、加密与恢复演练。
- 勿并进父卡当已完成。
- 未指派；派发默认 grill-with-docs。
