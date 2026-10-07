---
name: feedback_traverse_single_system_and_forest_roots
description: >-
  改 traverse/森林/Super 时：traverse 单系统；收根可扫盘认 project-harness AGENTS；Service
  组二维森林；Super 挂 .harness 式路径+可选 README；展开用 traverse+visited 互不吞根。
metadata:
  edges-title: traverse 单系统；森林根、Super 挂载与互不吞根
  edges-type: feedback
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T06:23:34+00:00'
---

用户所述规则（森林 / Super 设计约束）：

1. **traverse 保持简单**：只遍历**单个系统**，不跨系统；只走 `children`。跨系统 / 森林不进 traverse。
2. **森林根**：scope 内带 `project-harness` 的 `AGENTS.md` 皆为根。收根可用高效方式：**扫文件系统找 AGENTS.md 并判断标志**，不必沿引用链递归。
3. **仓库即 .harness** / **整仓 = 个人系统二**：向上建 `SuperAgentsNode` 虚拟根。
4. **Super 遍历**：当作普通 `AgentsNode`。
5. **Super 挂载**：对齐 `.harness` 递归的固定相对路径（如 tasks/memory/skills/…）；再加**可选** `README.md` 显式索引（可缺）。
6. **分层**：
   - **operations**：薄能力（如收根、visited）；`traverse` 本身不拼森林。
   - **业务 Service**：对每根再调 `traverse`，组装完整森林，交给 review page 的是**二维列表**（每行一棵树）。
7. **展开**：给定一根后，正常调用 `traverse`，traverse 给啥是啥；互不吞根靠组装时常见的 **visited**（勿把其它森林根留在本树内）。

**Why:** grill 中用户确认 Q6/Q8/Q9/Q10/Q11 及分层；保持 domain 精简。

**How to apply:** 不改 traverse 做跨系统。收根扫盘认标志。Service 出二维森林。Super 挂载按 .harness 式路径 + 可选 README。拼林时用 visited 落实互不吞根。
