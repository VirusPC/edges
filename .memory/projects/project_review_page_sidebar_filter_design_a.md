---
name: project_review_page_sidebar_filter_design_a
description: 改 edges tasks project review-page 侧栏筛选外观时打开：选中 is-filter 用 accent 染色底+实线边；未选中 group 降 opacity 0.55–0.7（hover 可拉回）；is-over 外扩 outline，须和 is-filter 叠得开。只改 CSS，不改点击/拖放。用户 2026-09-17 选定 design A。
metadata:
  edges-title: 审阅页侧栏筛选用 design A（选中染色 + 未选变淡）
  edges-type: project
  edges-origin-session-id: bc-4b33c90b-71fe-5db6-929a-0c3d10a82a5d
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-18T03:57:57+00:00"
---

审阅页侧栏当前筛选用 design A：选中 `.group.is-filter` 用 accent 染色底 + 实线 accent 边；未选中 `.group` 降到 opacity 0.55–0.7（hover 可拉回 1）；拖放目标 `.group.is-over` 用外扩 outline，和 is-filter 叠在一起仍要分得清。

**Why:**
2026-09-17 用户在 Cloud 任务里选定 design A（相对只改边框或不降未选项）。JS 已给活动筛选（含「全部」）切 `is-filter`，缺的是暗色主题下可读的选中态。后续改审阅页外观时不要重开 A/B。

**How to apply:**
只改 `extensions/clis/src/tasks/project/assets/review-page.html` 的 CSS，不要改点击筛选或 pointer 拖放。暗色 token 是 `--accent #5b9fd4`、`--panel #1a2332`。`is-over` 用 `outline` + `outline-offset`，不要和选中实线边糊成一条。构建脚本 `copy-review-page-asset.mjs` 会把同一文件拷到 dist。
