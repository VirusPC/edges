---
metadata:
  edges-type: task
  edges-task-project: edges-extensions
  edges-updated-at: '2026-10-20T09:15:39.804Z'
  edges-title: 框架仓重整目录 workspace 化
  edges-tasks-status: todo
  edges-task-priority: none
name: 框架仓重整目录 workspace 化
description: 独立开源后仓根目录仍不合理；把代码类目录都做成 pnpm workspace 包并重整位置。
---
**背景：**
VirusPC/edges 拆仓后是独立的开源框架仓。PR #7 已把 `extensions/` 平铺到仓根。peng cheng 看过平铺后的仓根，认为作为独立开源项目，目录结构仍不合理：可发布的包、资产、评测观测代码和看板记忆混在根上和 `.harness/` 里，pnpm workspace 也只收了 `mcp-servers/*`、`cli`、`apps/*`、`services/*`。
- 关联：[平铺卡](../../done/2026-10-20--框架仓平铺-extensions-并把-posts-搬回个人仓/INDEX.md)、[ADR 0040](../../../../../docs/adr/0040-flatten-extensions-posts-to-personal-repo.md)、[平铺迁移说明](../../../../../docs/migrations/2026-10-20-flatten-extensions.md)

**目标：**
仓根按独立开源项目的习惯重整，代码类目录都成为 pnpm workspace 包，构建、测试、发布、部署照常跑通。

**已定前提（peng cheng 已拍板，不再讨论）：**
- A. `skills/` 和 `system-prompt/` 也成为 pnpm workspace 包。
- B. `evaluation` 和 `observation` 从 `.harness/` 移到仓根这一级，并成为 workspace 包。

其余细节（包装目录、包名、`.harness` 其余部分、`scripts/`、PR 拆法、完成标准）待 grill 后补。
