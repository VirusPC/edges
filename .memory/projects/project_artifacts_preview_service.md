---
name: project_artifacts_preview_service
description: 改 Artifacts 预览服务、edges artifacts、或审阅页如何给人打开时打开：稳定短生命周期托管 + 真浏览器可开 URL；服务在 extensions/services/artifacts-preview；CLI 是 edges artifacts init|publish|rm；review-page 仍只渲染；结果回传另卡。决策见 docs/adr/0013-artifacts-preview-service.md。
metadata:
  edges-title: 个人 Artifacts 预览服务：上传→URL→TTL
  edges-type: project
  edges-origin-session-id: bc-481a7f77-a7e0-512d-a69f-68d2def99672
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-19T14:53:07+00:00"
---

v1 Artifacts 预览服务已落地：`extensions/services/artifacts-preview/` 常驻 HTTP（上传→URL→TTL 删除），`edges artifacts init|publish|rm` 是薄命令面；`review-page` 仍只渲染；Skill 渲染后 `publish` 再给人可达 URL。手机审阅必须用 ECS / 可达地址。本轮没有 artifacts MCP，也不做审阅结果回传。

**Why:**
2026-09-19 grill（peng cheng）定 ADR 0013；实现按 `docs/superpowers/plans/2026-09-19-artifacts-preview-service.md`。长驻 HTTP 不是 Commander 节点也不是 MCP，所以服务放 `extensions/services/`，CLI 仍在 `extensions/clis`。

**How to apply:**
- 改 glossary、托管边界或 `edges artifacts` 时按 ADR 0013 与 CONTEXT 术语 Artifacts 预览服务 / Artifact（edges） / edges artifacts（CLI） / 聊天 HTML 预览 / 本地 HTML 视图。
- 起服务：`pnpm --filter edges-artifacts-preview dev`（或 `start`）；本机先 `edges artifacts init`，再 `publish` / `rm`。
- `edges tasks project review-page` 仍只渲染（ADR 0012）；不要把 publish 并进 review-page。
- Skill 编排：渲染 → `edges artifacts publish` → 给人可达 URL。不要假定 localhost 给手机。
- 本地配置（`~/.config/edges/artifacts.env`）写在 ADR / 服务 README，不要塞进 CONTEXT。
- 不要做服务端表单结果存储或结果回传 Agent 客户端。
- 不要做成 Astro / site-and-content 长期站点，也不要并进本地 HTML 视图。
- 本轮不为 artifacts 新开 MCP；能力面仍写 CLI + Skill + MCP。
- 对照 ADR `docs/adr/0013-artifacts-preview-service.md`；交叉 ADR 0012 与 `knowledge/notes/2026-09-17--Grok-Bot-HTML预览拖拽异常.md`。
