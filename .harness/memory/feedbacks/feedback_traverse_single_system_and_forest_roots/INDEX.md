---
name: feedback_traverse_single_system_and_forest_roots
description: >-
  改 traverse/森林/Super 时：扫盘收根；Service 二维林；review 全部独立；resolve
  跳过其它根落实无从属；嵌套形式只留内层（可达）；Super 挂 .harness 路径+可选 README。
metadata:
  edges-title: traverse 单系统；森林根、Super 与交林两种形式
  edges-type: feedback
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T06:38:45+00:00'
---

用户所述规则（森林 / Super 设计约束）：

1. **traverse**：只走单系统 `children`；不拼森林。
2. **收根**：扫盘找带 `project-harness` 的 `AGENTS.md`。
3. **整仓 = 个人系统二** + Super 虚拟根；traverse Super 当普通 AgentsNode。
4. **Super 挂载**：`.harness` 式固定相对路径 + 可选 `README.md`。
5. **Service** 对每根调 traverse，交给 review **二维森林**；单根 traverse 给啥是啥。
6. **交林**：review 默认**全部独立**；树间无从属。落实（Q14=B）：在 **resolve** 里若目标是其它森林根则返回 `undefined`（跳过边），不改 traverse 内核。嵌套形式：A 属于 B（从 B traverse 可达 A 根）⇒ 只留 A。
7. 森林交给 review 的形状：用户所述「二维列表」（外层=多棵树）；单棵树内是数组还是嵌套对象待定。

**Why:** grill 确认 Q13/Q14。

**How to apply:** 拼林用 resolve 禁入其它根；勿在 traverse 内写死互不吞根。
