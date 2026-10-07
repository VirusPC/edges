---
name: feedback_traverse_single_system_and_forest_roots
description: >-
  改 traverse、系统森林发现或 SuperAgentsNode 时：traverse 只走单系统 children；scope 内带
  project-harness 的 AGENTS 皆为根；仓库可视为 .harness 并向上建虚拟 Super。
metadata:
  edges-title: traverse 单系统；scope 内 harness 根与仓库级 Super
  edges-type: feedback
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T05:42:57+00:00'
---

用户所述四条规则（森林 / Super 设计约束）：

1. **traverse 保持简单**：只遍历**单个系统**，不跨系统；只走 `children`（系统二组成），不做跨系统森林遍历。
2. **森林根的判定**：整个 scope 内，带 `project-harness` 标识的 `AGENTS.md`，都视为根节点。
3. **仓库即 .harness**：给定任意一个仓库，其本身可以视为一个 `.harness`。
4. **向上建 Super**：以 3 为假设，可以向上建立虚拟 `SuperAgentsNode` 根节点。

**Why:** 用户在讨论「从 Super 发现多系统 harness 森林 / review 切换主体」时明确给出；与「traverse 不膨胀、核心是递归系统二」一致。内容面发现与跨系统拼森林不得塞进 traverse。

**How to apply:** 改 `traverse` / `NodeService.query` 时保持单系统、`children` only（harness 是否跟随仍按现有选项，但不把跨系统逻辑并进 traverse）。需要森林时：在 scope 内按 `project-harness` 的 `AGENTS.md` 收根，再对每根各自 traverse。需要仓级上一层视角时：把整仓当作 `.harness`，向上建 `SuperAgentsNode`，而不是让一次 traverse 跨系统走完。
