---
name: self_hosted_langfuse
description: >-
  自建 Langfuse 已在 minigtr 上线（v4.38.0，公网 HTTPS 经 Cloudflare Tunnel）；健康检查 OK，且
  grok-bot 经 OTLP 收到首条 trace。
metadata:
  edges-type: task
  edges-title: 自部署 Langfuse
  edges-tasks-status: done
  edges-task-project: observation
  edges-updated-at: '2026-10-11T09:26:38.844Z'
  edges-task-assignee: minigtr设备助手
  edges-task-assignee-id: 93cef072-a666-4ecc-bb6b-e48130b0817d
---

自建 Langfuse 已在 minigtr 上跑起来，并按 ADR 0020 完成验收：界面健康，且已有一个客户端发出 trace。

**背景：**
2026-09-20 peng cheng 要求记一张自部署 Langfuse 的基础设施卡，不并入「知识库 Observation 系统」。当时看板还没有带 Langfuse 字样的任务。正文曾按「自有云」起意，并写过「未指派」和「全仓 code search langfuse = 0」。这三句已经过时：宿主以 ADR 0014 为准，是物理机 minigtr，不是云 VPS；指派是 minigtr设备助手；仓内已有 ADR 0014–0020、ADR 0033 和相关笔记。
- 2026-10-11（北京时间）实例在线：Langfuse v4.38.0，Docker 跑在 minigtr 上，公网 HTTPS 经 Cloudflare Tunnel。`/api/public/health` 返回 OK。
- 该实例的写模式是 v4 events_only。`POST /api/public/ingestion` 只收 score，trace-create 与 span-create 会被 400 拒绝。发 trace 走 `POST /api/public/otel/v1/traces`，Basic auth 为公钥:私钥。此模式下 `GET /api/public/traces/{id}` 返回 404；回查用 `GET /api/public/v2/observations?traceId=...`。
- 2026-10-11 17:18（北京时间）从 Grok Bot 云电脑用 curl 加 OTLP 发出首条 trace，name 为 `edges-langfuse-smoke`。v2 observations 回查成功。grok-bot 项目不再停在 Waiting for first trace。
- 可复现脚本在 `packages/observation/smoke/langfuse-otlp-smoke.sh`。它只读 `LANGFUSE_HOST`、`LANGFUSE_PUBLIC_KEY`、`LANGFUSE_SECRET_KEY`。仓库不放密钥、项目或组织 ID、实例域名。
- 非目标：定时机外备份仍是 backlog。更广的 Grok / edges 接线仍归 Observation 产品卡。
- 关联：ADR 0014、ADR 0020、ADR 0033。公网 HTTPS 卡已按 Cloudflare Tunnel 完成。

**目标：**
有一套自运维的 Langfuse，作为 LLM/Agent 可观测后端候选。v1 验收到界面健康，再由 1–2 个客户端发出 trace 为止。

**完成标准：**
- [x] Langfuse 健康检查可用：2026-10-11 `/api/public/health` 返回 OK，版本 v4.38.0。
- [x] 1–2 个客户端发出 trace 并能回查：2026-10-11 17:18（北京时间）OTLP 冒烟 `edges-langfuse-smoke`，v2 observations 回查成功。
- [x] 密钥、项目或组织 ID、实例域名不进本仓。
