---
name: artifacts_preview_dedicated_repo_pages
description: 现有 Artifacts HTTP+TTL 可考虑换成专用仓 + push 触发 Actions → Pages；publish=推仓出读链接，并用 git 做历史记录管理（尚未拍板，先 backlog）。
metadata:
  edges-type: task
  edges-title: Artifacts 预览改走专用仓 + GitHub Pages
  edges-tasks-status: backlog
  edges-task-project: agent-clients-ux
  edges-updated-at: "2026-09-21T09:08:23.200Z"
---

结论（idea）：将 Artifacts 预览改为专用仓 + GitHub Pages 管线，并具备历史记录管理。

**事实背景:**
- Coding 专家 2026-09-21 转述讨论结论：教学站、`/tasks/` 适合 GitHub Pages；现有 Artifacts HTTP+TTL 服务可考虑换成「专用仓库 + push 触发 Actions → Pages」。
- publish 心智：本地 publish = 推送到 Artifacts 专用仓 → GitHub Actions → GitHub Pages 出读链接。
- 顺带：用 git/仓本身做历史记录管理（版本/过往预览可查，不只 TTL 即焚）。
- 尚未拍板实现；先 backlog，后续 grill-with-docs / ADR。
- 相关勿并：`agent-clients-ux` done「自建云服务器临时托管 artifacts」与「Artifacts预览服务部署到ECS」；`agent-clients-ux` backlog「云端服务统一入口（tmp + persistent 部署目录）」；`agent-clients-ux` backlog「edges 衍生站点统一鉴权」；`agent-clients-ux` done「Tasks review 持久站点（始终反映 main）」。另勿并 `agent-clients-ux` backlog「review-page 改造（三列布局 + 顶栏 filter）」及进行中的 review-page 改造。

**Why:**
现有 Artifacts HTTP+TTL 可考虑换成专用仓 + push 触发 Actions → Pages；publish=推仓出读链接，并用 git 做历史记录管理（尚未拍板，先 backlog）。

**How to apply:**
- grill 与现 ECS TTL 服务迁移/并存、仓结构、Pages URL 稳定策略。
- 派发默认先 grill-with-docs，过关再实现。
- 未指派。
