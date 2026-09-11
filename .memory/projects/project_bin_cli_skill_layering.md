---
name: project_bin_cli_skill_layering
description: 能力面是 CLI+Skill+MCP 三入口；删仓根 bin/；Note git 迁进 extensions/clis 的 TS 并保持对等；MCP 子进程调 edges note。新能力不要再加仓根脚本或把 npm bin 当一层。
metadata:
  edges-title: bin / CLI / Skill 分层
  edges-type: project
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-11T13:19:01+00:00"
---

能力面定为 CLI、Skill 与 MCP 三者。删除整个仓根 `bin/`（含 `new-note`）；Note 入库的 git 迁进 `extensions/clis` 的 TypeScript，并与现脚本全量对等。MCP 用子进程调用 `edges note`，不直连仓根脚本、本轮也不 in-process import。Skill 放在 `extensions/skills/`，只教何时如何调 CLI（无 shell 则指向 MCP）。npm `package.json` 的 `bin` 只是安装挂钩，不是一层。

**Why:**
对齐 gh / AXI / Agent Skills（一个 CLI + 一份 skill），去掉「给人的 PATH 脚本」这层假分层；无 shell 宿主仍需要 MCP。2026-09-11 grill 确认（见 ADR 0004）。先前「CLI+Skill 两层、`bin/new-note` 可当 git 残留」已被本决策取代。

**How to apply:**
- 新能力只落 CLI 契约 + Skill 说明 + 必要时 MCP 暴露；禁止 Skill → 仓根 `bin/`，也禁止把 npm `bin` 定义成一层。
- 实现后续 PR：整目录删除 `bin/`；git 进 `extensions/clis` 且全量对等；MCP 改为 spawn `edges note`。本决策 PR 只改 glossary / ADR / 本条记忆。
- 不要保留仓根 `bin/` 当人用层、只搬 bash、半迁移 git、或本轮 MCP in-process import。
- 对照来源见 `reference_bin_cli_skill_classic_projects`。
