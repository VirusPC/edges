---
name: project_artifacts_preview_service
description: 改 Artifacts 预览服务、edges artifacts、或审阅页如何给人打开时打开：稳定短生命周期托管 + 真浏览器可开 URL；聊天内嵌预览是绕开的不可靠路径；review-page 仍只渲染；结果回传另卡。决策见 docs/adr/0013-artifacts-preview-service.md。
metadata:
  edges-title: 个人 Artifacts 预览服务：上传→URL→TTL
  edges-type: project
  edges-origin-session-id: bc-481a7f77-a7e0-512d-a69f-68d2def99672
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-19T14:18:48+00:00"
---

稳定的 artifacts 预览服务（短生命周期托管 + 真浏览器可开 URL）；聊天内嵌预览是绕开的不可靠路径。v1 是上传 → URL → TTL 删除；`edges artifacts` 薄命令面；`review-page` 仍只渲染；Skill 渲染后发布再给人可达 URL。手机审阅必须用 ECS / 可达 URL。本轮只定 CONTEXT / ADR 0013，不实现。

**Why:**
2026-09-19 grill 确认（peng cheng）：Agent HTML 要人在真浏览器里操作；手机往往没有 localhost；Grok Bot 内嵌预览不可靠。不是长期建站，不是本地 HTML 视图，也不是审阅结果回传 Agent 客户端（已拆独立 backlog）。

**How to apply:**
- CONTEXT 术语与 ADR 0013 都先写问题框，再写上传/TTL 细节。
- 改 glossary、托管边界或 `edges artifacts` 时按 ADR 0013 与 CONTEXT 术语 Artifacts 预览服务 / Artifact（edges） / edges artifacts（CLI） / 聊天 HTML 预览 / 本地 HTML 视图。
- `edges tasks project review-page` 仍只渲染（ADR 0012）；不要把 publish 并进 review-page。
- Skill 编排：渲染 → `edges artifacts publish` → 给人可达 URL。不要假定 localhost 给手机。
- 本地配置示例（`~/.config/edges/artifacts.env`）写在 ADR 0013，不要塞进 CONTEXT。
- 不要本轮做服务端表单结果存储或结果回传 Agent 客户端。
- 不要做成 Astro / site-and-content 长期站点，也不要并进本地 HTML 视图。
- 对照 ADR `docs/adr/0013-artifacts-preview-service.md`；交叉 ADR 0012 与 `knowledge/notes/2026-09-17--Grok-Bot-HTML预览拖拽异常.md`。
