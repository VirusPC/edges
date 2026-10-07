---
name: feedback_traverse_single_system_and_forest_roots
description: >-
  改 traverse/森林/Super/harness 材料 IO 时：domain/config/harness-materials.json 为
  materials[{id,path,optional}]；创建读取走 scope+path；Super 只挂 README；森林
  TreeNode[][]。
metadata:
  edges-title: traverse 单系统；森林根、Super 挂载与 domain 配置
  edges-type: feedback
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T07:05:40+00:00'
---

用户所述规则（森林 / Super 设计约束）：

1. **traverse**：单系统 `children`；森林在外。
2. **收根**：扫盘 `project-harness` 的 `AGENTS.md`。
3. **整仓 = 个人系统二** + Super；不挂其它系统 `AGENTS.md`。
4. **配置**：`extensions/cli/src/domain/config/harness-materials.json`，形状（Q21=A）：
   `{ "materials": [ { "id": "tasks", "path": "tasks/README.md", "optional": true }, ... ] }`
   创建 / 读取 / Super 挂载：`scope` + `path`；按 `id` 查找。
5. **Service → review**：`TreeNode[][]`；全部独立；resolve 遇其它根早停；底层完整节点。

**Why:** grill 确认 JSON 形状。

**How to apply:** loader 校验该 schema；业务用 id 解析 path。
