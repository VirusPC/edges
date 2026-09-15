---
name: project_edges_task_priority
description: Task Issue 优先级为 urgent|high|medium|low|none，写在 metadata.edges-task-priority，与 status 正交、不搬状态夹。决策见 docs/adr/0007-edges-task-priority.md；词 vs P0 调研见 knowledge/projects/tasks/2026-09-15--issue-priority-words-vs-p0.md
metadata:
  edges-title: Task Issue 优先级用词档位，与 status 正交
  edges-type: project
  edges-origin-session-id: bc-c50449ce-0249-47c9-a276-42ae395657af
  edges-agent-client: cursor
  edges-username: Coding Agent 专家
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-15T17:55:16+00:00"
---

Task Issue 层优先级用 Multica/Linear 风格词档位 `urgent | high | medium | low | none`，写在 frontmatter `metadata.edges-task-priority`；缺省或旧文件无字段视为 `none`。与 `edges-tasks-status` 正交：改 priority 不搬状态夹、不用文件夹或文件名编码优先级。本轮只定文档（CONTEXT + ADR 0007），不改 CLI；后续 `create --priority` / `update --priority`，`status` 不带 priority，`list` 默认顺序不变、`--sort priority` 为 urgent→…→none。用户所述、grill 确认于 2026-09-15/16。

**Why:**
2026-09-15/16 grill 确认「谁先做」不能用状态夹或 P0 事故等级表达。调研笔记 `knowledge/projects/tasks/2026-09-15--issue-priority-words-vs-p0.md`：主流 tracker 用词档位做 backlog triage；P0 文化来自 SRE / on-call / 云厂商 SLA。Multica 固定该五值但没有「为何不用 P0」的书面说明。叠在 ADR 0005 的 CLI 契约上；能力面仍是 CLI + Skill + MCP。

**How to apply:**
- 实现或改 CLI 时按 ADR 0007 与 CONTEXT 术语；非法值校验失败、不写盘；JSON 的 `list`/`get`/`create`/`update` 始终带 `priority`（缺失按 `none`）。
- 不要用 P0–P3、不要改 priority 时搬 `knowledge/tasks/<status>/`，不要让 `status` 接收 priority。
- 本轮不要写 Skill/MCP wrapper、不要做 epic/需求二层 priority、不要接 GitHub、不要抄 Multica daemon。
- 对照调研笔记 `knowledge/projects/tasks/2026-09-15--issue-priority-words-vs-p0.md` 与 ADR `docs/adr/0007-edges-task-priority.md`。
