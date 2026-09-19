---
name: project_artifacts_preview_service
description: 改 Artifacts 预览服务、edges artifacts、或审阅页如何给人打开时打开：短生命周期静态托管（上传→URL→TTL）；review-page 仍只渲染；结果回传另卡。决策见 docs/adr/0013-artifacts-preview-service.md。
metadata:
  edges-title: 个人 Artifacts 预览服务：上传→URL→TTL
  edges-type: project
  edges-origin-session-id: bc-481a7f77-a7e0-512d-a69f-68d2def99672
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-19T14:10:27+00:00"
---

个人 Artifacts 预览服务是短生命周期静态托管：上传 → URL → TTL 删除；`edges artifacts` 薄 CLI（init/token + 本地配置，publish/rm）；`review-page` 仍只渲染；Skill 渲染后发布再给人可达 URL。手机审阅必须用 ECS / 可达 URL。写要共享 token，读靠 UUID 路径 + TTL（默认 24h）。本轮只定 CONTEXT / ADR 0013，不实现。

**Why:**
2026-09-19 grill 确认（peng cheng）：聊天 HTML 预览不可靠（手机常打不开，桌面交互坏）。不是长期建站，不是本地 HTML 视图卡，也不是审阅结果回传 Agent 客户端（已拆独立 backlog）。

**How to apply:**
- 改 glossary、托管边界或 `edges artifacts` 时按 ADR 0013 与 CONTEXT 术语 Artifacts 预览服务 / Artifact（edges） / edges artifacts（CLI） / 聊天 HTML 预览 / 本地 HTML 视图。
- `edges tasks project review-page` 仍只渲染（ADR 0012）；不要把 publish 并进 review-page。
- Skill 编排：渲染 → `edges artifacts publish` → 给人可达 URL。不要假定 localhost 给手机。
- 不要本轮做服务端表单结果存储或结果回传 Agent 客户端。
- 不要做成 Astro / site-and-content 长期站点，也不要并进本地 HTML 视图卡。
- 对照 ADR `docs/adr/0013-artifacts-preview-service.md`；交叉 ADR 0012 与 `knowledge/notes/2026-09-17--Grok-Bot-HTML预览拖拽异常.md`。
