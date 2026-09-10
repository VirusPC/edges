---
name: feedback_teach_workspace_location
description: 为 teach 技能新建教学工作区时：一律放 knowledge/teach/<topic>/ 并在 knowledge/teach/README.md 登记；不要写到 .teaching/。
metadata:
  edges-title: teach 工作区放 knowledge/teach，不放 .teaching
  edges-type: feedback
  edges-username: viruspc
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: "2026-09-10T17:13:07+08:00"
---

teach 技能的教学工作区放 knowledge/teach/<topic>/，作为知识资产随仓库提交；不要再放 .teaching/。
**Why:** 2026-09-10 用户在教学第一课把工作区建到 .teaching/ 后明确纠正：教学工作区归 knowledge/ 树；根下已有的 .teaching/obsidian-cli 是此前所建，未迁移，不代表现行约定。
**How to apply:** 新主题建 knowledge/teach/<slug>/（MISSION.md、NOTES.md、RESOURCES.md、lessons/、learning-records/、assets/、reference/），并在 knowledge/teach/README.md 的 Topics 列表登记一行；要往主题里挂学习仓库时走 extensions/skills/learn-repo（submodule 挂 repos/）。
