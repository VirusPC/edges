---
name: project_langfuse_secrets_stay_on_minigtr
description: 写自托管 Langfuse 的 .env、密钥、compose 笔记或想把配置提交进 VirusPC/edges 时打开：密钥只活在 minigtr 磁盘（例如本机 services 目录）；本仓只留脱敏 ADR/说明。决策见 docs/adr/0018-langfuse-secrets-stay-on-minigtr.md。
metadata:
  edges-title: Langfuse 密钥只留 minigtr 磁盘
  edges-type: project
  edges-origin-session-id: bc-8f1d5fb6-9160-5c0a-a840-06865f80e964
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-20T11:22:54+00:00"
---

自托管 Langfuse 的 .env 与密钥只留在 minigtr 本机磁盘（例如本机 services 目录），永远不要提交进 VirusPC/edges。edges 最多留脱敏 compose 说明或 ADR。

**Why:**
2026-09-20 第二轮 grill 确认（peng cheng）：本仓公开，写入即公开发表。根硬约束已禁止凭据入库；这条把真源钉在 minigtr 磁盘，避免「gitignore 了就可以 commit」或把口令写进 CONTEXT。

**How to apply:**
- 不要在本仓提交 `.env`、密钥、可工作 compose。
- 不要把具体绝对路径、口令、token 写进 CONTEXT 或 ADR。
- 脱敏笔记可以写「密钥在机上本地目录」，不要写成仓内真源。
- 对照 ADR `docs/adr/0018-langfuse-secrets-stay-on-minigtr.md`。
