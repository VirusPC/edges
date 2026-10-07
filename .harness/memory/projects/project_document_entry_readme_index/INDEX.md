---
name: project_document_entry_readme_index
description: >-
  改节点入口文件名、Task/Note/Memory 路径或类型索引形状时：组织清单一律 README.md+entries；内容叶子为
  INDEX.md；Skill 仍 SKILL.md；系统入口仍 AGENTS.md。不要把 Task 正文写成 README。
metadata:
  edges-title: 组织清单 README.md，内容叶子 INDEX.md
  edges-type: project
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-06T16:23:59+00:00'
---

内容叶子（Task / Note / Memory）的入口文件名为 `INDEX.md`（取代现行 `index.md`）。组织清单（有组成登记、用来列孩子的文档节点，如 Task Project、类型索引、根 README）用 `README.md` 承载 entries。Skill 仍为 `SKILL.md`。系统入口仍为 `AGENTS.md`，可另有组成登记（递归系统二）。同一目录可以同时有 `AGENTS.md`（系统二）与 `README.md`（系统一组织清单），根目录即此形状（Q9b）。

**Why:** 用户 2026-10-06 grill Q12。README 列目录符合惯例；叶子正文叫 README 会搞乱说明页；INDEX.md 作为目录单元主文档适合叶子。与「不按文件名区分 Internal/Leaf」不冲突：有无子项仍看 entries，文件名只是入口合同。

**How to apply:** 新叶子写 `INDEX.md`；现有 `index.md` 迁移节奏另问。不要把 Task 正文改成 README。类型索引 / Task Project 若只是组织清单而无独立系统二，用 README+entries，不要仅因「有列表」就叫 AGENTS.md——除非用户对该目录 init 了系统入口。
