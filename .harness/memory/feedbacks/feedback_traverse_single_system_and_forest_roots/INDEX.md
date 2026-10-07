---
name: feedback_traverse_single_system_and_forest_roots
description: >-
  改 traverse、系统森林发现或 SuperAgentsNode 时：traverse 只走单系统 children；scope 内带
  project-harness 的 AGENTS 皆为根；仓库可视为 .harness 并向上建虚拟 Super；森林有两种交出形式。
metadata:
  edges-title: traverse 单系统；scope 内 harness 根与仓库级 Super
  edges-type: feedback
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T05:44:53+00:00'
---

用户所述规则（森林 / Super 设计约束）：

1. **traverse 保持简单**：只遍历**单个系统**，不跨系统；只走 `children`（系统二组成），不做跨系统森林遍历。
2. **森林根的判定**：整个 scope 内，带 `project-harness` 标识的 `AGENTS.md`，都视为根节点。
3. **仓库即 .harness**：给定任意一个仓库，其本身可以视为一个 `.harness`。
4. **向上建 Super**：以 3 为假设，可以向上建立虚拟 `SuperAgentsNode` 根节点。
5. **交出森林的两种形式**（用户所述）：
   - **互不包含**：树与树之间互不包含（嵌套的系统入口不重复成林；保留外层/不相交的根）。
   - **全部独立**：凡带 `project-harness` 标志的 `AGENTS.md` 各自独立成一棵树（即使物理上互相嵌套也各算一根）。

**Why:** 用户在讨论系统森林与 review 切换主体时明确给出；traverse 保持单系统，森林拼装与交出形状在 traverse 之外。

**How to apply:** 改 `traverse` / `NodeService.query` 时保持单系统、`children` only。需要森林时：在 scope 内按 `project-harness` 的 `AGENTS.md` 收根，再对每根各自 traverse。交出前选定形式——互不包含，或全部独立成树。需要仓级上一层视角时：把整仓当作 `.harness`，向上建 `SuperAgentsNode`。
