---
name: project_list_all_forest
description: >-
  改 tasks 登记、根 AGENTS 或 list 时：层入口挂材料 README（尤其 .harness/tasks/README.md），条目留在
  project-entries；不抄进看板 AGENTS，不另写 walker。--super 仍只接 scope 目录。
metadata:
  edges-title: 层 AGENTS 挂材料 README，list 顺着 children
  edges-type: project
  edges-origin-session-id: ed32d8b9-d356-4eb9-8822-6ad2ddc36d1c
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T12:27:38+00:00'
---

`--scope`、`--super`、`--all` 的组合形成一切。没有第二套范围开关。

走节点树的 list 不传 `--all` 时是当前 scope 的一棵树。层 `AGENTS.md` 的本层系统维护信息挂材料 README（仓库根挂 `.harness/tasks/README.md`），项目和任务留在 README 的 `project-entries`；traverse 顺着已登记的 children 走到任务。传 `--all` 时，第一步是扫当前 scope 下的整个文件系统，范围内的节点入口都算进去，再按类型留下。

仓库根默认 `edges tasks list` 列出 `.harness/tasks` 的维护任务（2026-10-07 验证 104 条，项目为 agent-clients-ux、default、edges-cli-platform、edges-tasks、evaluation、observation、project-memory、site-and-content）。`--super` 把材料路径接到 scope 目录本身，仓库根因此只列出领域 `tasks/`（同日验证 5 条，项目为 agent-clients-ux、project-memory、site-and-content）。不要另写一套 README walker，也不要把项目或类型列表从 README 抄进看板或类型 `AGENTS.md`。同目录 README 不是该 `AGENTS.md` 的 child。

Tasks 不理解用途，也不理解 index-group。它只看主体系统，然后往这个系统的 `.harness/tasks` 里写。一般 `--scope` 就是主体：看板是 `<scope>/.harness/tasks`。主体是仓库之外的虚拟系统一时，用 `--scope <仓库根> --super`；该系统的 harness 就是传入的 scope 目录，看板是 `<仓库根>/tasks`。

**Why:** 用户 2026-10-07 grill 翻案了同日早些时候「任务必须写在 AGENTS children、只写 README 是 CLI 的错」。登记位置本来就在 README 的 `project-entries`；到不了任务叶子，是因为层入口挂了看板 `AGENTS.md` 而不是看板 `README.md`。类型入口同样是 README；目录里已经有的 `AGENTS.md` 留下作系统入口，不删，也不挂同目录 README。

**How to apply:** 改登记或根 `AGENTS.md` 时，材料链到 `harness-materials.json` 里的 README 路径。改 `edges tasks list` 的遍历时，继续走 `NodeService.query` 的已登记 children；无 `--all` 不要加第二套 README 扫描。`--super` 仍是该 scope 上的虚拟系统一。
