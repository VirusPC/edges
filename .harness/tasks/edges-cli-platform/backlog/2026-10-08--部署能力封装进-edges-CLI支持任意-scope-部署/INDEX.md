---
metadata:
  edges-type: task
  edges-task-project: edges-cli-platform
  edges-updated-at: '2026-10-08T05:43:14.721Z'
  edges-title: 部署能力封装进 edges CLI，支持任意 scope 部署
  edges-tasks-status: backlog
  edges-task-priority: none
name: edges_cli_scope
description: >-
  现在部署逻辑写死在 GitHub Actions 的 deploy.yml 和服务器脚本里，只能部署本仓固定的几个站点；想把它收进 edges CLI，任意
  scope 下都能部署自己的内容。
---
**背景：**
2026-10-08 修 edges 部署时出了两个问题：一是 Deploy 漏跑 `build:schemas`（#193 修了），二是 nginx 迁移需要免密 sudo（#194 改成只放行 root 拥有的固定入口）。修完后 peng cheng 提出，部署能力后续应该封装进 CLI，不再散在 workflow 和脚本里。
- 现状：`deploy.yml` 通过 SSH 依次跑构建、生成 `/tasks/` 站点、nginx 迁移和 artifacts 服务重启，部署哪些站点、各自挂在哪个 URL 都写死在 workflow 里（目前有 `/teaching/` 和 `/tasks/`）。
- 设想（尚未验证）：从某个 scope 出发遍历节点森林，找出所有可部署的节点逐个部署；URL path 可能直接对应文件系统 path。
- 关联：#193、#194；`agent-clients-ux` backlog「云端服务统一入口（tmp + persistent 部署目录）」与「Tasks 审阅壳 — deploy 分支 + GitHub Actions 预览部署」。

**目标：**
edges CLI 提供部署命令，在任意 scope 下都能把该 scope 里可部署的内容发布出去，`deploy.yml` 只负责调用这个命令。

（完成标准待 grill-with-docs 补：如何判定节点可部署、URL 与路径怎么映射、与 NodeService 的边界。）
