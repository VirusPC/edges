---
name: feedback_traverse_single_system_and_forest_roots
description: >-
  改 traverse/森林/Super 时：扫盘收根；Service 二维林；review
  默认全部独立且树间无从属（展开不含其它根）；嵌套形式只留内层（可达判定）；Super 挂 .harness 路径+可选 README。
metadata:
  edges-title: traverse 单系统；森林根、Super 与交林两种形式
  edges-type: feedback
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T06:36:22+00:00'
---

用户所述规则（森林 / Super 设计约束）：

1. **traverse**：只走单系统 `children`；不拼森林。
2. **收根**：扫盘找带 `project-harness` 的 `AGENTS.md`。
3. **整仓 = 个人系统二** + `SuperAgentsNode` 虚拟根；traverse Super 当普通 AgentsNode。
4. **Super 挂载**：`.harness` 式固定相对路径 + 可选 `README.md`。
5. **Service** 对每根调 traverse，交给 review **二维森林**。
6. **交林两种形式**：
   - **嵌套只留内层**：A 属于 B（从 B traverse 能走到 A 的根）⇒ 只留 A。
   - **全部独立**：每个根各一棵；**review page 默认用此形式（Q13=B）**。
7. **树间无从属（与 Q12 同一关切）**：交出去的树之间不要有从属关系——任一棵树的展开结果**不应再包含另一棵树的根**。traverse 仍给啥是啥；由 Service 组装时裁掉其它根（或等价处理），不把特判塞进 traverse。

**Why:** 用户确认 review 默认全部独立，并强调树间无从属（12 讨论的部分）。

**How to apply:** review 默认全部独立；组装二维林时保证树间无从属；嵌套形式另用可达判定只留内层。
