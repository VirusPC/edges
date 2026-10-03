---
name: project_review_page_sidebar_filter_design_a
description: 改审阅页左栏项目筛选外观时打开：选中用 accent 实线边加面板底；未选中 opacity 0.6（hover 拉回）；拖过时外扩 outline，须和选中边叠得开。类写在 ProjectColumn，不改点击或拖放。用户 2026-09-17 选定 design A。
metadata:
  edges-title: 审阅页侧栏筛选用 design A（选中染色 + 未选变淡）
  edges-type: project
  edges-origin-session-id: bc-4b33c90b-71fe-5db6-929a-0c3d10a82a5d
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-23T17:47:00+00:00"
---

审阅页左栏项目筛选用 design A：选中是 accent 实线边加面板底；未选中 opacity 0.6，hover 拉回 1；拖放悬停用外扩 outline，和选中边叠在一起仍要分得清。

**Why:**
2026-09-17 用户选定 design A。2026-09-23 壳改成 React 后外观仍是这套，不要重开 A/B，也不要再改已删除的 `review-page.html`。

**How to apply:**
改 `apps/tasks-review-app/src/components/ProjectColumn.tsx` 的 class。选中含 `border-solid border-[#5b9fd4] bg-[#1a2332] opacity-100`；未选中含 `opacity-60 hover:opacity-100`。悬停拖放目标加 `outline outline-2 outline-offset-[3px] outline-[#5b9fd4]`。不要改点击筛选或只改 project 的拖放。空状态列可以不渲染，那不是侧栏筛选。
