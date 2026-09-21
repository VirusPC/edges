---
name: github_deployments_show_tasks_entry
description: production Deployments 只显示 /teaching/，看不到 /tasks/；需要改 deploy 工作流的 environment.url（或拆 environment），让 Deployments 也能点到 tasks 站。
metadata:
  edges-type: task
  edges-title: GitHub Deployments 展示 /tasks/ 入口
  edges-tasks-status: backlog
  edges-task-project: agent-clients-ux
  edges-updated-at: "2026-09-21T16:05:50.680Z"
---

结论（idea）：让 GitHub Deployments（production）也能展示 /tasks/ 入口（改 url、加说明、或拆 environment 等）。

**事实背景:**
- 用户 peng cheng 2026-09-22：GitHub production 界面只显示 teaching，不显示 tasks；确认后要求记待办。
- `.github/workflows/deploy-teach.yml` 仍设 `environment.name: production` 且 `url: http://182.92.131.89/teaching/`；同 job 已生成 tasks `_site`，但 GitHub 每个 environment 只展示一个 url。
- /tasks/ 公网已可用；问题是 Deployments UI 登记入口，不是站点没部署。
- 相关勿并：`agent-clients-ux` done「Tasks review 持久站点（始终反映 main）」；`agent-clients-ux` backlog「Artifacts 预览改走专用仓 + GitHub Pages」；`agent-clients-ux` backlog「edges 衍生站点统一鉴权」。另勿并 `_default` done「仓库主页展示teach站点部署状态」（当时只挂了 teaching 入口）与 `site-and-content` backlog「仓库主页增加更多 badge」。

**Why:**
production Deployments 只显示 /teaching/，看不到 /tasks/；需要改 deploy 工作流的 environment.url（或拆 environment），让 Deployments 也能点到 tasks 站。

**How to apply:**
- grill 单 url vs 双 environment vs README badge；改 deploy-teach.yml。
- 派发默认先 grill-with-docs，过关再实现。
- 未指派。
