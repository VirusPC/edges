---
name: feedback_traverse_single_system_and_forest_roots
description: >-
  改 traverse/森林/Super/harness 材料 IO 时：domain/config/harness-materials.json；Super
  只挂 README；森林 BaseNode[][]；edges forest list。
metadata:
  edges-title: traverse 单系统；森林根、Super 挂载与 domain 配置
  edges-type: feedback
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T07:48:06+00:00'
---

用户所述规则（森林 / Super 设计约束；本轮已落地）：

1. **traverse**：单系统 `children`；森林在外。
2. **收根**：`collectSystemRoots` 扫盘认 `project-harness` 的 `AGENTS.md`。
3. **整仓 = 个人系统二** + Super；不挂其它系统 `AGENTS.md`。
4. **配置**：`extensions/cli/src/domain/config/harness-materials.json`，形状：
   `{ "materials": [ { "id": "tasks", "path": "tasks/README.md", "optional": true }, ... ] }`
   创建 / 读取 / Super 挂载：`scope` + `path`；按 `id` 查找；harness 根 = `<scope>/.harness` 若存在否则 `scope`。
5. **Service → review / CLI**：`SystemForestService` → `BaseNode[][]`；默认 `independent`（resolve 遇其它根早停）；`innermost` 从 B 可达 A 则丢掉外层；CLI：`edges forest list`。

**Why:** grill 确认后整条链路已实现；文档与 CLI 须与此一致。

**How to apply:** loader 校验该 schema；Super 用 `listHarnessMaterialAbsPaths`；森林用 `buildSystemForest` / `edges forest list`，勿在 traverse 内拼林。
