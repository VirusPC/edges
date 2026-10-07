---
name: feedback_traverse_single_system_and_forest_roots
description: >-
  改 traverse/森林/Super/harness 材料 IO 时：固定相对 path 在 domain 配置；创建与读取都走 scope+指定
  path；Super 只挂 README 材料不挂其它系统 AGENTS；森林 TreeNode[][]。
metadata:
  edges-title: traverse 单系统；森林根、Super 挂载与 domain 配置
  edges-type: feedback
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T06:58:32+00:00'
---

用户所述规则（森林 / Super 设计约束）：

1. **traverse**：单系统 `children`；森林在外。
2. **收根**：扫盘 `project-harness` 的 `AGENTS.md`。
3. **整仓 = 个人系统二** + Super；Super 也是森林一根；不挂其它系统 `AGENTS.md`。
4. **domain 配置**：固定相对 path 清单（`tasks/README.md`、`memory/*/README.md`、`skills/*/README.md`、可选 `evaluation|observation/README.md`、可选根 `README.md`）放在 **domain 层单独配置**。
5. **IO 约定（用户所述）**：**创建、读取**等都基于 **`scope` + 配置里的指定 path**（拼出绝对路径），各处共用同一配置，勿旁路硬编码。
6. **Service → review**：`TreeNode[][]`；全部独立；resolve 遇其它根早停；底层完整节点。

**Why:** 用户强调配置不仅供 Super 挂载，创建/读取也走 scope+path。

**How to apply:** domain 导出 path 表与 `resolveHarnessMaterial(scope, key)`（或等价）；Super/Service/CLI 只经此解析。
