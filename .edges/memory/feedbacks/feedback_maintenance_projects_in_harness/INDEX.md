---
name: feedback_maintenance_projects_in_harness
description: >-
  创建框架维护 Project 时归入 .edges/projects；scope 选择维护对象，各模块统一默认与 --super 定位，0.4.1 的
  scope/.edges 仅是临时绕过。
metadata:
  edges-title: 框架维护项目归入 .edges/projects
  edges-type: feedback
  edges-username: VirusPC
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-11-02T06:28:00+08:00'
---

维护 Edges 框架自身的 Project（例如根 README 优化）归入框架的 `.edges/projects/`。scope 应选择被维护的对象，各模块按统一的默认 / --super 规则定位材料，不把 CLI 的历史特例当成归属规则。

**Why:** 2026-11-02，助手为 README 优化建立项目时，因 0.4.1 的 `projects create` 固定写入 `<scope>/projects/`，误放到框架根目录。用户指出应放在 .edges 下，并进一步要求各模块行为一致、共用目录定位辅助函数。

**How to apply:**
- README、文档或框架能力的维护 Project 放在框架的 `.edges/projects/`，由已有 harness 索引发现。
- 统一规则是 scope 选维护对象，默认材料根为 `<scope>/.edges`，显式 `--super` 为 `<scope>`。这次决定取代 notes/projects 固定写根目录的特例，见[scope / super 约定](../feedback_scope_super_all/INDEX.md)。
- 0.4.1 尚不具备统一行为；本次迁移曾临时将 scope 指向独立 worktree 的 .edges。该操作只适用于旧版差异，不作为长期接口约定；升级后使用框架根 scope。
- 业务项目与个人项目仍按维护对象和内容仓约定选择归属；迁移时同步维护组织索引与正文相对链接，保留原有项目登记。
