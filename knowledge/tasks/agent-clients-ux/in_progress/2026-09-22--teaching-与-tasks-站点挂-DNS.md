---
name: teaching_tasks_dns
description: 现用裸 IP 访问 /teaching/ 与 /tasks/；先给这两个页面挂 DNS（主机名），方便 Deployments/书签/证书，再谈其它入口展示。
metadata:
  edges-type: task
  edges-title: teaching 与 tasks 站点挂 DNS
  edges-tasks-status: in_progress
  edges-task-project: agent-clients-ux
  edges-updated-at: "2026-09-21T16:05:31.402Z"
  edges-task-assignee: IT资产管理
  edges-task-assignee-id: 5fcd37e7-eacb-4cc8-b9ed-b96a8ef4e344
---

结论（idea）：为 teaching 与 tasks 两个页面配置 DNS（可由 IT资产管理 定主机名方案：同域路径 vs 子域）。

**事实背景:**
- 公网现入口：http://182.92.131.89/teaching/ 、http://182.92.131.89/tasks/（同机 ECS）。
- 用户 peng cheng 2026-09-22：要不先让 IT资产管理 给这两个页面挂 DNS。
- 相关：GitHub Deployments 只显示 teaching url 的 backlog 另卡；本卡只做 DNS。

**Why:**
现用裸 IP 访问 /teaching/ 与 /tasks/；先给这两个页面挂 DNS（主机名），方便 Deployments/书签/证书，再谈其它入口展示。

**How to apply:**
- IT资产管理 出方案并落地 DNS 记录；回任务记录员结果与最终主机名。须与用户确认域名/子域若仓内无既定约定。
- 已出栈指派 IT资产管理。
