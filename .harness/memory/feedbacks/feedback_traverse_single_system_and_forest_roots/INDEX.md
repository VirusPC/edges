---
name: feedback_traverse_single_system_and_forest_roots
description: >-
  改 traverse/森林/Super 时：扫盘收根；Super 只挂 README 材料
  path（tasks/memory/skills…，evaluation/observation 仅 README）；清单放 domain
  共享配置；Service TreeNode[][]；review 全部独立+resolve 早停。
metadata:
  edges-title: traverse 单系统；森林根、Super 挂载与 domain 配置
  edges-type: feedback
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T06:57:36+00:00'
---

用户所述规则（森林 / Super 设计约束）：

1. **traverse**：单系统 `children`；森林在外。
2. **收根**：扫盘 `project-harness` 的 `AGENTS.md`。
3. **整仓 = 个人系统二** + Super 虚拟根；traverse Super 当普通 AgentsNode；Super 也是森林一根。
4. **Super 挂载**（相对虚拟 Super scope = 语义 `.harness` 根）：
   - `tasks/README.md`
   - `memory/feedbacks/README.md`、`memory/projects/README.md`、`memory/references/README.md`
   - `skills/managed/README.md`、`skills/referenced/README.md`
   - `evaluation/README.md`、`observation/README.md`（**仅当存在**；不挂 `*/AGENTS.md`）
   - 可选根 `README.md`
   - **禁止**挂仓根或其它系统的 `AGENTS.md`（含 `tasks/AGENTS.md`）。
5. **配置落点（用户所述）**：上述固定相对 path 清单应在 **domain 层单独配置文件**，供 Super 构造、Service、测试等共用，勿多处硬编码。
6. **Service → review**：`TreeNode[][]`；底层完整节点、Service 可裁字段；全部独立；resolve 遇其它根早停可拼接；可并行。嵌套形式：从 B traverse 可达 A 根 ⇒ 只留 A。

**Why:** grill 纠正挂 README 非 AGENTS；用户要求 domain 共享配置。

**How to apply:** 实现时新增 domain 配置模块导出挂载 path 表；调用方只读配置。
