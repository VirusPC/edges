---
name: project_langfuse_ui_then_few_clients
description: 写自部署 Langfuse 的 v1 验收、或想一次接上 Grok/edges Agent 时打开：先证明 UI 健康，再试 1–2 个客户端；更广接线留在 Observation 产品卡。决策见 docs/adr/0020-langfuse-ui-then-few-clients.md。
metadata:
  edges-title: v1 Langfuse 先证明 UI 再试 1–2 个客户端
  edges-type: project
  edges-origin-session-id: bc-8f1d5fb6-9160-5c0a-a840-06865f80e964
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-20T11:26:35+00:00"
---

自部署 Langfuse 的 v1 验收先证明 UI 健康，再试 1–2 个客户端。更广的 Grok / edges Agent 接线仍归「知识库 Observation 系统」产品卡，不在本卡 v1。

**Why:**
2026-09-20 第三轮 grill 确认（peng cheng）：基础设施卡若一次铺全客户端会和 Observation 产品卡搅在一起，也拖死「后端先跑起来」的验收。

**How to apply:**
- 本卡冒烟：UI 能打开且健康 → 再试 1–2 个客户端发 trace。
- 不要把全量 Grok / edges 接线写进本卡或本轮实现。
- 产品语义与多 Agent 接入看 ADR 0015 与 Observation 产品卡；不要改产品卡正文。
- 对照 ADR `docs/adr/0020-langfuse-ui-then-few-clients.md`。
