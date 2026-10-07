---
name: feedback_traverse_single_system_and_forest_roots
description: >-
  改 traverse/森林/Super/harness 材料 IO 时：固定 path 用 domain 层 JSON/YAML 配置；创建读取走
  scope+path；Super 只挂 README 材料；森林 TreeNode[][]。
metadata:
  edges-title: traverse 单系统；森林根、Super 挂载与 domain 配置
  edges-type: feedback
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T07:01:10+00:00'
---

用户所述规则（森林 / Super 设计约束）：

1. **traverse**：单系统 `children`；森林在外。
2. **收根**：扫盘 `project-harness` 的 `AGENTS.md`。
3. **整仓 = 个人系统二** + Super；不挂其它系统 `AGENTS.md`；Super 也是森林一根。
4. **材料 path 配置（Q19=B）**：domain 层用 **JSON/YAML 资源文件** 列出相对 path（`tasks/README.md`、`memory/*/README.md`、`skills/*/README.md`、可选 `evaluation|observation/README.md`、可选根 `README.md`）；TS 负责加载校验。创建 / 读取 / Super 挂载都走 **`scope` + 配置 path**。
5. **Service → review**：`TreeNode[][]`；全部独立；resolve 遇其它根早停；底层完整节点。

**Why:** 用户选 B，认为资源文件更易扩展。

**How to apply:** 新增 domain 配置资源 + loader；禁止业务里硬编码这些相对 path。
