# Task 看板按 Task Project 目录优先分组，并与 frontmatter 双写

看板需要在状态之外再切一组（对齐 Multica Project），但不能把状态夹当成 project，也不能只改标签不改路径。2026-09-16 grill 确认：directory-first，路径为 `knowledge/tasks/<project-slug>/<edges-tasks-status>/`，frontmatter `metadata.edges-task-project` 与目录 slug 双写。未分组用保留目录 `_default`（字段为 `default` 或不写）。本轮只定 CONTEXT / ADR（及记忆指针），不迁看板、不改 CLI；后续实现必须改 `edges tasks` 路径约定。**Amends ADR 0002**（状态夹仍按 `edges-tasks-status`，但嵌在 project-slug 下）；叠 ADR 0005 / 0007 的命令面。能力面仍是 ADR 0004 的 CLI + Skill + MCP 三者并列。

**Status:** accepted（grill 确认于 2026-09-16）

## Decision

- **形状：** directory-first 的 Multica-like Project；目录与 frontmatter 双写。本轮不做完整 parent / sub-issue / stage。
- **路径：** `knowledge/tasks/<project-slug>/<edges-tasks-status>/<stem>.md`，sidecar `.{stem}.log.md` 同目录。
- **未分组：** `knowledge/tasks/_default/<status>/`。一次性迁移后，`knowledge/tasks/` 根下不再直接放 status 夹。
- **字段：** `metadata.edges-task-project`。目录 `_default` 对应字段 `default` 或不写。与 `edges-tasks-status`、`edges-task-priority` 正交。
- **移动（后续实现）：** `status` 只在同一 project 内改状态并搬家（含 sidecar）；跨 project 必须显式 `update --project`（或等价入口），不能靠 `status`。
- **迁移（实现轮，一次性）：** 现有 `knowledge/tasks/<status>/*` → `knowledge/tasks/_default/<status>/*`。
- **本轮范围：** 只落地 glossary + 本 ADR。不迁看板文件、不实现 CLI。Skill / MCP 全量改写本轮不做；实现轮必须先让 CLI 跟上新路径。

## Considered Options

- 只用 frontmatter 标签、不改目录：否决；Obsidian 浏览与 directory-first 对齐 Multica Project。
- 任意深层目录当 project：否决；project 只在 `knowledge/tasks/` 下一层。
- 迁移后仍在 tasks 根下放 status 夹：否决。
- 把 `edges-tasks-status` 当 project：否决；分组、状态、优先级三正交。
- 只改路径不同步 frontmatter，或只改字段不改路径：否决；必须双写。
- 本轮做 parent / sub-issue / stage：否决。
- 本轮改写 Skill / MCP：否决；同一契约后做。能力面仍是 CLI + Skill + MCP。
- 本轮实现 CLI 或迁看板：否决。实现轮必须改 CLI。

## Out of scope

- parent / sub-issue / stage
- Skill / MCP 全量改写（本轮）
- CLI 实现与看板迁移（另开实现轮；CLI 必须跟上）
- GitHub linking
- Multica daemon
