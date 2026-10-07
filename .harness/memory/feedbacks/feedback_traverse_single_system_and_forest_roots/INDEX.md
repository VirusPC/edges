---
name: feedback_traverse_single_system_and_forest_roots
description: >-
  改 traverse/森林/Super 时：traverse 单系统；扫盘收根；Service 二维林；Super 挂 .harness 路径+可选
  README；交林嵌套只留内层（属判定=从外根 traverse 可达）或全部独立。
metadata:
  edges-title: traverse 单系统；森林根、Super 与交林两种形式
  edges-type: feedback
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T06:33:16+00:00'
---

用户所述规则（森林 / Super 设计约束）：

1. **traverse**：只遍历单个系统的 `children`，不跨系统、不拼森林。
2. **收根**：scope 内带 `project-harness` 的 `AGENTS.md`；扫盘认标志即可。
3. **整仓 = 个人系统二**：向上建 `SuperAgentsNode`；traverse Super 当普通 `AgentsNode`。
4. **Super 挂载**：对齐 `.harness` 固定相对路径 + 可选 `README.md`。
5. **分层**：operations 薄；**Service** 对每根调 `traverse`，交给 review **二维森林**。单根：正常 traverse，给啥是啥。
6. **交林两种形式**：
   - **嵌套只留内层**：若树 A 属于树 B，则只留 A、丢掉 B。
   - **全部独立**：每个 `project-harness` 根各一棵。
7. **「属于」判定（Q12′=B）**：从 B 的根做 `traverse` **能走到** A 的根，则 A 属于 B。不是路径前缀特判。

**Why:** grill 用户确认嵌套取舍与可达判定。

**How to apply:** 拼林在 Service；嵌套形式用 traverse 可达判断内外，勿只靠路径前缀；勿把互不吞根做成 traverse 内特判。
