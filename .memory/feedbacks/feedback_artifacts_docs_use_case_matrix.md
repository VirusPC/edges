---
name: feedback_artifacts_docs_use_case_matrix
description: 改 Artifacts 预览 README / edges artifacts / 根 README 指针时打开：只写用例×能力（CLI、HTTP、review-page、Action）；不要写某台机器当天是否已迁、verified 日期或当前可达状态。
metadata:
  edges-title: Artifacts 文档写用例×能力，不写盒上当天状态
  edges-type: feedback
  edges-origin-session-id: bc-682094e9-06e7-58ce-9691-33c0ca4a536f
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-21T02:45:12+00:00"
---

仓库里的 Artifacts 预览说明只写「能做什么 × 调用哪些能力」，不写某台机器当天的运行状态。
**Why:** 2026-09-21 用户要求根 README、`extensions/clis/README.md` 与 `extensions/services/artifacts-preview/README.md` 补用例 × 能力矩阵，并禁止「ECS already migrated」「today the box is …」「verified-YYYY-MM-DD ops state」这类叙事。机器状态会过期，能力表不会。用户所述。
**How to apply:** 改 artifacts 文档时用用例 × 能力表（CLI 动词、HTTP、review-page、Action / Skill）。可以写条件（例如 env 存在才 `install` 再 `restart`），不要写核实日期、当前盒上是否已迁、或公网入口当天是否可达。本轮没有 artifacts MCP；Skill 路径仍是 render → `publish` → 给 URL。
