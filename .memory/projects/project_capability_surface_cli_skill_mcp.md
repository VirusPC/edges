---
name: project_capability_surface_cli_skill_mcp
description: 能力面是 CLI、Skill、MCP 三者并列；删仓根 bin/；Note git 迁进 extensions/clis 的 TS 并保持对等；MCP 子进程调 edges note。禁止「必要时 MCP」或只写 CLI+Skill。新能力不要再加仓根脚本或把 npm bin 当一层。
metadata:
  edges-title: 能力面：CLI / Skill / MCP
  edges-type: project
  edges-origin-session-id: bc-5d1f4bf4-8857-4d1f-bfcd-1737a61fe922
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-11T15:32:44+00:00"
---

能力面定为 CLI、Skill 与 MCP 三者并列。删除整个仓根 `bin/`（含 `new-note`）；Note 入库的 git 迁进 `extensions/clis` 的 TypeScript，并与现脚本全量对等。MCP 用子进程调用 `edges note`，不直连仓根脚本、本轮也不 in-process import。Skill 放在 `extensions/skills/`，说明何时如何调 CLI 或 MCP。npm `package.json` 的 `bin` 只是安装挂钩，不是一层。

**Why:**
能力面始终是三条对等入口：CLI、Skill、MCP。经典项目（gh / AXI / Agent Skills）只示范 CLI 与 Skill 的形状，用来去掉「给人的 PATH 脚本」这层假分层；Edges 另外把 MCP 作为无 shell 宿主的一等入口，不是事后加装。删除仓根 `bin/` 后，MCP 仍通过子进程调用 CLI，而不是退回可选层。2026-09-11 grill 确认（见 ADR 0004）。先前「CLI+Skill 两层、`bin/new-note` 可当 git 残留」和「必要时 MCP」已被本决策取代。

**How to apply:**
- 新能力落 CLI 契约 + Skill 说明 + MCP 暴露（需要机器入口时一并提供；能力面定义里 MCP 不是可选项）。禁止 Skill → 仓根 `bin/`，也禁止把 npm `bin` 定义成一层。
- 实现后续 PR：整目录删除 `bin/`；git 进 `extensions/clis` 且全量对等；MCP 改为 spawn `edges note`。本决策 PR 只改 glossary / ADR / 本条记忆。
- 不要保留仓根 `bin/` 当人用层、只搬 bash、半迁移 git、或本轮 MCP in-process import。
- 对照来源见 `reference_bin_cli_skill_classic_projects`。
