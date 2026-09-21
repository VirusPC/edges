---
name: project_tasks_persistent_board_site
description: 改 /tasks/ 持久入口、list --group-by、或看板站 vs Artifacts 时打开：不新开 status station；CI 扩展 deploy-teach.yml；分组 schema 松耦合（edges.tasks.grouped/v1）；review-page 仍只渲染；鉴权/写回另卡。决策见 docs/adr/0021-persistent-tasks-board-site.md。
metadata:
  edges-title: 持久 /tasks/ 看板站：复用 review-page，扩展 deploy-teach
  edges-type: project
  edges-origin-session-id: bc-4ba2da31-7293-5b2e-a60b-34cec5ba0813
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-21T07:45:28+00:00"
---

`/tasks/` 是与 teaching 同机的持久看板入口，始终反映 main：扩展 `deploy-teach.yml`，CI 用 `edges tasks list --group-by project` 产出松耦合 `edges.tasks.grouped/v1`，薄映射后喂现有 `review-page`；不新开 status station。本轮公开只读、不写回 git、不新开 workflow。用户所述（2026-09-21 grill 确认）。

**Why:**
临时 Artifacts UUID+TTL 不能当固定入口。另渲状态板会再造产品。把分组 JSON 绑死在 review-page 会让 list 无法给别的消费者用。鉴权、写回、tmp/persistent 统一入口已拆 backlog，本轮并进去会撑破 grill-with-docs。

**How to apply:**
- 改 glossary、部署链或看板入口时按 ADR 0021 与 CONTEXT 术语 `/tasks/` 持久看板站 / 分组列表 schema（edges.tasks.grouped） / Task Project 审阅页 / Artifacts 预览服务。
- review-page 仍只渲染（ADR 0012）。不要把 publish 或 `/tasks/` 托管并进 review-page。
- 不要用 `edges artifacts publish` 当长期入口（ADR 0013 硬边界）。
- 实现轮：扩展 `.github/workflows/deploy-teach.yml`，不要新开 workflow；`list --group-by project` 的 schema 不要命名成 review-page 专属。
- 本轮不做鉴权、git 写回、`--mode`、按 project 拆 URL、tmp+persistent 统一入口。对照三张 backlog：衍生站统一鉴权；Tasks review / review-page 写回仓接口；云端服务统一入口 tmp+persistent。
- 不要改看板状态。对照 `docs/adr/0021-persistent-tasks-board-site.md`。
