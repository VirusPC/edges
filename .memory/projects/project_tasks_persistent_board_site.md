---
name: project_tasks_persistent_board_site
description: 改 /tasks/ 持久入口、list --group-by、或看板站 vs Artifacts 时打开：不新开 status station；复用同一审阅壳。ADR 0022 起 grouped item 可带可选 doc，壳为三栏且本轮不写回 git。决策见 docs/adr/0021 与 docs/adr/0022。
metadata:
  edges-title: 持久 /tasks/ 看板站：复用 review-page，扩展 Deploy
  edges-type: project
  edges-origin-session-id: bc-4ba2da31-7293-5b2e-a60b-34cec5ba0813
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-23T15:57:45+00:00"
---

`/tasks/` 是与 teaching 同机的持久看板入口，始终反映 main：`edges tasks list --group-by project` 产出松耦合 `edges.tasks.grouped/v1`，薄映射后喂现有 `review-page`；CI 扩展 `deploy.yml`，不新开 status station。已落地（2026-09-21 实现轮）。ADR 0022 起仍是这一份壳：三栏，grouped item 可带可选 Task Doc（`doc`），本轮不写回 git。用户所述，grill 确认于 2026-09-23。

**Why:**
临时 Artifacts UUID+TTL 不能当固定入口。另渲状态板会再造产品。把分组 JSON 绑死在 review-page，或再开一套看板顶层 schema，会让 list 无法给别的消费者用。鉴权、写回、语义检索、tmp/persistent 统一入口已拆 backlog。

**How to apply:**
- 改 glossary、部署链或看板入口时按 ADR 0021 / 0022 与 CONTEXT 术语 `/tasks/` 持久看板站 / 分组列表 schema（edges.tasks.grouped） / 审阅壳 / Task Doc / Artifacts 预览服务。
- 生成：盒上 `pnpm --filter edges-cli exec -- tsx scripts/generate-tasks-site.ts --out "$PWD/knowledge/tasks/_site/index.html"`（默认相对路径 `knowledge/tasks/_site/index.html`，gitignored）。`deploy.yml` 在 `reset --hard origin/main` 之后始终生成；失败则整次 SSH 失败。不要把 generate 绑在 artifacts env 上。
- nginx：一次性 `sudo bash extensions/clis/deploy/setup-nginx-tasks.sh`，snippet 是 `extensions/clis/deploy/nginx-tasks.conf`（装到 `/etc/nginx/snippets/edges-tasks.conf`）。Action 不跑 setup-nginx。只认 `teaching.conf` + `/teaching/`。
- review-page 仍只渲染（ADR 0012）。不要为 `/tasks/` 另做一壳。实现轮把 Task Doc 放进 grouped item 的可选 `doc`，并让薄映射把 `doc` 带进审阅页；页只读页内 JSON。
- 顶栏字面筛选与三栏交互按 ADR 0022。语义检索、写回、鉴权仍是各自 backlog。
- 不要把 publish 或 `/tasks/` 托管并进 review-page。不要用 `edges artifacts publish` 当长期入口（ADR 0013 硬边界）。
- 不要新开 workflow；`list --group-by project` 的 schema 不要命名成 review-page 专属，也不要另开看板顶层 schema。
- 本轮不做鉴权、git 写回、`--mode`、按 project 拆 URL、tmp+persistent 统一入口。不要改看板状态。
