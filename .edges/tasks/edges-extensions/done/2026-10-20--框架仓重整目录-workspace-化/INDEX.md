---
metadata:
  edges-type: task
  edges-task-project: edges-extensions
  edges-updated-at: '2026-10-20T11:25:33.667Z'
  edges-title: 框架仓重整目录 workspace 化
  edges-tasks-status: done
  edges-task-priority: none
name: 框架仓重整目录 workspace 化
description: 独立开源后仓根目录仍不合理；把代码类目录都做成 pnpm workspace 包并重整位置。
---

**背景：**
VirusPC/edges 拆仓后是独立的开源框架仓。PR #7 已把 `extensions/` 平铺到仓根。peng cheng 看过平铺后的仓根，认为作为独立开源项目，目录结构仍不合理：可发布的包、资产、评测观测代码和看板记忆混在根上和 `.edges/` 里，pnpm workspace 也只收了 `mcp-servers/*`、`cli`、`apps/*`、`services/*`。
- 关联：[平铺卡](../2026-10-20--%E6%A1%86%E6%9E%B6%E4%BB%93%E5%B9%B3%E9%93%BA-extensions-%E5%B9%B6%E6%8A%8A-posts-%E6%90%AC%E5%9B%9E%E4%B8%AA%E4%BA%BA%E4%BB%93/INDEX.md)、[ADR 0040](../../../../../docs/adr/0040-flatten-extensions-posts-to-personal-repo.md)、[平铺迁移说明](../../../../../docs/migrations/2026-10-20-flatten-extensions.md)

**目标：**
仓根按独立开源项目的习惯重整，代码类目录都成为 pnpm workspace 包，构建、测试、发布、部署照常跑通。

**已定前提（peng cheng 已拍板，不再讨论）：**
- A. `skills/` 和 `system-prompt/` 也成为 pnpm workspace 包。
- B. `evaluation` 和 `observation` 从 `.edges/` 移出，并成为 workspace 包。

**Grill R1（2026-10-20 peng cheng 保留全部默认）：**

1. 包装在哪 → 全部放在 `packages/`，目录名沿用现有结构；glob 为 `packages/*`、`packages/apps/*`、`packages/services/*`、`packages/mcp-servers/*` → 一个 workspace 根，只在树本来就嵌套的地方再嵌一层。
2. skills 包 → 私有 `@viruspc/edges-skills`，CLI 用 `workspace:*`，构建解析该包再拷贝（沿用 copy-bundled-skills）→ skill 是 workspace 包，发布的 CLI 仍自带拷好的 `skills/`。
3. system-prompt → 私有 `@viruspc/edges-system-prompt`，只导出 `*.md`，不构建 → markdown 资产，没有编译步骤。
4. evaluation 与 observation → 整棵移到 `packages/evaluation`、`packages/observation`，私有 Python `package.json`（只登记脚本与元数据）；locomo 的 gitmodule path 跟着改 → 它们是代码与资产，不是其余 harness。
5. `.edges/` 其余留下（tasks、memory、notes、projects、skills dogfood）→ 只有评测和观测离开。
6. 一次性迁移脚本（约 14 个）→ `scripts/migrations/`；根 `package.json` 入口保留并改指新路径；`link-agent-skills` 与 `setup` 留在 `scripts/` → 一次性脚本和日常工具分开。
7. 一个原子 PR，`git mv`，硬切，不留兼容软链，CHANGELOG 加 `docs/migrations` 对照表，历史计划里的旧路径也改写；workflow 文件名不变 → main 上不出现搬了一半的目录。

决定见 [ADR 0041](../../../../../docs/adr/0041-packages-workspace-layout.md)。状态保持 todo。

**进展（2026-10-20）：** 已全部完成，本卡关闭。
- VirusPC/edges#9 已合：建卡。
- VirusPC/edges#10 已合：所有包移进 `packages/`，`skills` 和 `system-prompt` 也成为 workspace 包，`evaluation` / `observation` 从 `.edges/` 移到 `packages/`，一次性迁移脚本移到 `scripts/migrations/`；新增 ADR 0041 和迁移对照表；grill 的 7 条决定写进本卡。
- 部署：Deploy 成功；ECS 上 artifacts 服务改从 `packages/services` 运行；`/tasks/`、`/teaching/`、`/health`、`/artifacts` 都返回 200。
