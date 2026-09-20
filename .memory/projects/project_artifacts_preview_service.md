---
name: project_artifacts_preview_service
description: 改 Artifacts 预览服务、edges artifacts、或审阅页如何给人打开时打开：稳定短生命周期托管 + 真浏览器可开 URL；服务在 extensions/services/artifacts-preview；CLI 是 edges artifacts init|publish|rm；from 可选且 v1 只允许 type=task 的 id+project；review-page 仍只渲染；结果回传另卡。决策见 docs/adr/0013-artifacts-preview-service.md。
metadata:
  edges-title: 个人 Artifacts 预览服务：上传→URL→TTL
  edges-type: project
  edges-origin-session-id: bc-481a7f77-a7e0-512d-a69f-68d2def99672
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-20T16:44:26+00:00"
---

v1 Artifacts 预览服务已落地：`extensions/services/artifacts-preview/` 常驻 HTTP（上传→URL→TTL 删除），`edges artifacts init|publish|rm` 是薄命令面；`review-page` 仍只渲染；Skill 渲染后 `publish` 再给人可达 URL。手机审阅必须用 ECS / 可达地址。本轮没有 artifacts MCP，也不做审阅结果回传。`from` 可选；有任务关联时只写 `{ type: "task", id, project }`（字段顺序 type → id → project；`id` 是 edges task stem），否则整段省略。不要写顶层 `task`、`from.name`、`from.stem`，也不要默认 `{ type: "cli", name: "edges-cli" }`。v1 拒绝其他 `from.type`。CLI：`--from-type task --from-id <stem> --task-project <slug>`（三者同出或全省略）。不要写 `from.kind` 或 `--from-kind` / `--from-name` / `--task-stem`。

**Why:**
2026-09-19 grill（peng cheng）定 ADR 0013。2026-09-20 一度加过顶层 `task`，同日纠正为 `from` 判别；字段名定为 `type` 不是 `kind`。同日最终定 v1：`from` 可选，且只允许 task 指针，字段叫 `id` 不叫 `stem`，`project` 放最后。

**How to apply:**
- 改 glossary、托管边界或 `edges artifacts` 时按 ADR 0013 与 CONTEXT 术语 Artifacts 预览服务 / Artifact（edges） / edges artifacts（CLI） / 聊天 HTML 预览 / 本地 HTML 视图。
- 起服务：`pnpm --filter edges-artifacts-preview dev`（或 `start`）；本机先 `edges artifacts init`，再 `publish` / `rm`。
- 没有看板 Task 关联时，`edges artifacts publish` 不要带 `from`。
- 来源是看板 Task 时用 `--from-type task --from-id <stem> --task-project <slug>`，不要 `--from-name` / `--task-stem`，也不要写顶层 `task`。
- 服务端：缺 `from` 合法；有 `from` 则必须 `type=task` 且带 `id`+`project`；空/`..`/路径分隔符或其他 type 是 400。
- `edges tasks project review-page` 仍只渲染（ADR 0012）；不要把 publish 并进 review-page。
- Skill 编排：渲染 → `edges artifacts publish` → 给人可达 URL。不要假定 localhost 给手机。
- 本地配置（`~/.config/edges/artifacts.env`）写在 ADR / 服务 README，不要塞进 CONTEXT。
- 不要做服务端表单结果存储或结果回传 Agent 客户端。
- 不要做成 Astro / site-and-content 长期站点，也不要并进本地 HTML 视图。
- 本轮不为 artifacts 新开 MCP；能力面仍写 CLI + Skill + MCP。
- 对照 ADR `docs/adr/0013-artifacts-preview-service.md`；交叉 ADR 0012 与 `knowledge/notes/2026-09-17--Grok-Bot-HTML预览拖拽异常.md`。
