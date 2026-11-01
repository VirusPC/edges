---
name: feedback_maintenance_projects_in_harness
description: 创建 Edges 框架自身的维护 Project 时：归入 .edges/projects，先判定维护对象再选 scope，不把 CLI 默认落点当归属。
metadata:
  edges-title: 框架维护项目归入 .edges/projects
  edges-type: feedback
  edges-username: VirusPC
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-11-02T06:14:27+08:00'
---

维护 Edges 框架自身的 Project（例如根 README 优化）归入框架的 `.edges/projects/`。先判断项目服务于哪个维护对象，再选择 CLI scope；不能把命令默认写出的目录当成内容归属规则。

**Why:** 2026-11-02，助手为 README 优化建立项目时，因 `projects create` 写入 `<scope>/projects/` 而选了框架仓根，误放到根 `projects/`。用户追问「为啥不放到 .edges 下」，指出这项工作是在维护框架自身，应归入其 harness。CLI 的路径机制不能代替归属判断。

**How to apply:**
- 创建框架自身的 README、文档或能力维护项目时，使用框架的 `.edges/projects/`，由已有 harness 项目索引发现。
- 对当前 `projects create` 接口，显式将 `--scope` 指向框架独立 worktree 的 `.edges` 目录；不要仅因示例以仓根为 scope 就照搬。
- 业务项目与个人项目仍按其维护对象和内容仓约定选择归属，不因名称包含 Project 就一律放到根 `projects/` 或一律放到 `.edges/`。
- 迁移时同时维护组织索引与正文相对链接，保留原有项目登记。
