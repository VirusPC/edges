---
name: feedback_teach_workspace_location
description: 为 teach 技能新建教学工作区时：一律放 knowledge/teaching/<topic>/ 并在 knowledge/teaching/README.md 登记；不要写到 .teaching/。
metadata:
  edges-title: teach 工作区放 knowledge/teaching，不放 .teaching
  edges-type: feedback
  edges-origin-session-id: bc-b8b579d3-e7c6-4151-8e54-8c889d70c1c2
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-11T10:51:33+00:00"
---

teach 技能的教学工作区放 knowledge/teaching/<topic>/，作为知识资产随仓库提交；不要再放 .teaching/。
**Why:** 2026-09-10 用户在教学第一课把工作区建到 .teaching/ 后明确纠正：教学工作区归 knowledge/ 树。2026-09-11 已将 `.teaching/obsidian-cli` 迁到 `knowledge/teach/obsidian-cli/`；随后目录重命名为 `knowledge/teaching/`。根下 `.teaching/` 不再代表现行约定。
**How to apply:** 新主题建 knowledge/teaching/<slug>/（MISSION.md、NOTES.md、RESOURCES.md、lessons/、learning-records/、assets/、reference/），并在 knowledge/teaching/README.md 的 Topics 列表登记一行；要往主题里挂学习仓库时走 extensions/skills/learn-repo（submodule 挂 repos/）。
