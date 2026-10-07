---
name: feedback_traverse_single_system_and_forest_roots
description: >-
  改 traverse/森林/Super 时：traverse 单系统；扫盘收 project-harness 根；Service 组二维林；Super 挂
  .harness 路径+可选 README；交林两种形式（嵌套只留内层 / 全部独立）。
metadata:
  edges-title: traverse 单系统；森林根、Super 与交林两种形式
  edges-type: feedback
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T06:29:47+00:00'
---

用户所述规则（森林 / Super 设计约束）：

1. **traverse**：只遍历单个系统的 `children`，不跨系统、不拼森林。
2. **收根**：scope 内带 `project-harness` 的 `AGENTS.md`；可用扫盘认标志，不必沿引用链。
3. **整仓 = 个人系统二**：向上建 `SuperAgentsNode`；traverse Super 当普通 `AgentsNode`。
4. **Super 挂载**：对齐 `.harness` 的固定相对路径 + 可选 `README.md` 索引（可缺）。
5. **分层**：operations 薄（收根等）；**Service** 对每根调 `traverse`，交给 review 的是**二维森林**。单根展开：正常 `traverse`，给啥是啥。
6. **交林两种形式**（用户澄清，不是「展开时互不吞根」）：
   - **嵌套只留内层**：若树 A 属于树 B（A 在 B 内），则**只留树 A**，丢掉 B。
   - **全部独立**：每个带 `project-harness` 的根各保留一棵树。

**Why:** grill 中用户纠正「互不吞根」表述；真意是交林时对嵌套根的取舍。

**How to apply:** 勿在 traverse 里做吞根特判。拼林在 Service；选形式时要么嵌套丢外层只留内层，要么全部独立。
