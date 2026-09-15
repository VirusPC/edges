# Task Issue 优先级用词档位，与 status 正交

看板需要「谁先做」这一维，但不能用状态夹或 P0 事故等级表达。2026-09-15/16 grill 确认：Issue 层优先级照抄 Multica / Linear 风格词档位 `urgent | high | medium | low | none`，写在 frontmatter `metadata.edges-task-priority`；缺省或旧文件无字段视为 `none`。它与 `edges-tasks-status` 正交——改 priority 不搬状态夹、不用文件夹编码优先级。本轮只定 CONTEXT / ADR（及记忆指针），不改 CLI；后续实现叠在 ADR 0005 的 `edges tasks` 命令面上。能力面仍是 ADR 0004 的 CLI + Skill + MCP 三者并列。

词档位而非 P0–P3 的依据见调研笔记 [`knowledge/projects/tasks/2026-09-15--issue-priority-words-vs-p0.md`](../../knowledge/projects/tasks/2026-09-15--issue-priority-words-vs-p0.md)：主流 tracker 用自然语言档位做 backlog triage；P0 文化来自 SRE / on-call / 云厂商 SLA。Multica 代码固定该五值，但仓内没有「为何用词而不是 P0」的书面说明。

**Status:** accepted（grill 确认于 2026-09-15/16）

## Decision

- **枚举：** `urgent | high | medium | low | none`。不用 P0–P3，也不把事故等级直接当看板 priority。
- **落盘：** `metadata.edges-task-priority`。缺省 / 缺失 = `none`。非法值校验失败、不写盘。
- **与 status 正交：** 改 priority 不改 `edges-tasks-status`、不移动 `knowledge/tasks/<status>/`；禁止用文件夹或文件名编码优先级。
- **CLI（后续实现，本轮不定代码）：** `create --priority`、`update --priority`；`status` 不接收 priority。`list` 默认看板顺序不变；`--sort priority` 为 urgent→high→medium→low→none；可重复 `--priority` 为 OR 筛选，可与 `--status` 组合。`list` / `get` / `create` / `update` 的 JSON 始终带 `priority`（缺失按 `none`）。
- **本轮范围：** 只落地 glossary + 本 ADR。Skill / MCP 封装后做同一契约。

## Considered Options

- P0–P3 或混用事故等级：否决；语义是 ops/SLA，不是 backlog triage。
- 用状态夹或文件名编码优先级：否决；与 ADR 0002 状态分夹冲突，改 priority 会误搬文件。
- `list` 默认改按 priority 排序：否决；默认看板顺序不变，opt-in `--sort priority`。
- `status` 一并改 priority：否决；status 只流转状态。
- 本轮同时做 Skill / MCP：否决；同一契约后做。能力面仍是 CLI + Skill + MCP。
- 本轮做 epic / 需求二层 priority：否决。
- 本轮接 GitHub Issue/PR 或抄 Multica daemon：否决（沿用 ADR 0005）。

## Out of scope

- Skill / MCP wrappers（本轮）
- epic / 需求二层 priority
- GitHub linking
- Multica daemon
- CLI 实现（另开实现轮；叠 ADR 0005）
