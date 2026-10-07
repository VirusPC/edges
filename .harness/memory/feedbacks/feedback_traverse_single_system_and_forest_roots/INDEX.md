---
name: feedback_traverse_single_system_and_forest_roots
description: >-
  改 traverse/森林/Super 时：traverse 单系统 children；scope 内 project-harness 的 AGENTS
  皆根；整仓=个人系统二并向上建 Super（当普通 AgentsNode 遍历）；Super 挂载按 .harness 相对路径；任意树不含另一树的根。
metadata:
  edges-title: traverse 单系统；森林根、仓库级 Super 与互不吞根
  edges-type: feedback
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T05:58:28+00:00'
---

用户所述规则（森林 / Super 设计约束）：

1. **traverse 保持简单**：只遍历**单个系统**，不跨系统；只走 `children`（系统二组成），不做跨系统森林遍历。
2. **森林根的判定**：整个 scope 内，带 `project-harness` 标识的 `AGENTS.md`，都视为根节点。
3. **仓库即 .harness**：给定任意一个仓库，其本身可以视为一个 `.harness`。
4. **整仓 = 个人系统二 + Super 虚拟根**（与 3 同一件事）：整个 Edges 仓库视为**个人的系统二**；`SuperAgentsNode` 为这个系统构建虚拟根节点（向上的虚拟系统入口）。
5. **交出森林时**：根可按「全部独立」（每个 `project-harness` AGENTS 各一根）收集；展开时遵守 8.2。
6. **（历史）两种交出说法**收敛为：收根可全部独立；**任意一棵树都不含另一棵树的根节点**（见 8.2）。
7. **Super 当普通 AgentsNode**：对 `SuperAgentsNode` 做 traverse 时，就当作普通 `AgentsNode` 即可（同一套 children 遍历，无特判跨系统逻辑）。
8.1. **Super 挂载内容**：参考 `.harness` 递归规则，使用相对**虚拟 Super scope** 的固定相对路径。`<scope>/README.md` **可以没有**（一般 `.harness/` 里也不会默认有 README；这里仅做读取兼容）。
8.2. **互不吞根**：任意一棵树都不含另一棵树的**根节点**（展开/交出时不得把其它森林根当作本树内部节点留下）。

**Why:** 用户在系统森林与 Super 设计讨论中明确给出；保持 traverse 单系统，森林与 Super 挂载规则外置且可递归类比 `.harness`。

**How to apply:** `traverse` 只跑单系统 `children`；Super 无额外遍历语义。收根：scope 内所有 `project-harness` 的 `AGENTS.md`。整仓视为个人系统二时向上建 Super；挂载按虚拟 scope 下固定相对路径，README 可选。拼树时若走到其它根则截断/排除，保证 8.2。
