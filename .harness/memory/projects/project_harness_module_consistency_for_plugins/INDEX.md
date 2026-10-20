---
name: project_harness_module_consistency_for_plugins
description: >-
  新增或改 .harness 模块、或给单个模块加特殊节点时打开：各模块同一套入口 README（可继承定制），不为单个模块发明虚拟节点；Compose 写进
  compose/README.md。目标是架构一致、便于后续插件化。
metadata:
  edges-title: .harness 模块保持同一入口，便于插件化
  edges-type: project
  edges-origin-session-id: bc-2f02ec10-329d-5720-836a-1c8bf7220d41
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-20T17:39:06+00:00'
---

`.harness` 下各模块保持同一套入口与节点形态（入口 README，可继承定制），不为单个模块发明虚拟节点；目标是架构一致、便于后续插件化。

**Why:** 用户在 Compose 改挂讨论中明确；不一致会阻碍统一 `--exclude` / 插件注册。这是用户所述的项目意图，不是已落地的插件实现。

**How to apply:** 新增或改模块时先对齐入口 README；需要特殊能力就特化 README 节点；Compose 能力写进 `compose/README.md` 节点，不恢复虚拟 ComposeNode。后续插件化登记在 backlog `.harness/tasks/edges-extensions/backlog/2026-10-21--harness-模块插件化`（PR #17）；Compose 入口融合是进行中的改挂，本条只记原则。
