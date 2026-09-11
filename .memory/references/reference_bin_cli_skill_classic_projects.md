---
name: reference_bin_cli_skill_classic_projects
description: 对照 gh、AXI、Agent Skills 规范、superpowers：何时查「要不要仓根 bin/、Skill 调谁」。经典项目示范 CLI+Skill 形状；Edges 能力面仍是 CLI+Skill+MCP 并列。
metadata:
  edges-title: bin/CLI/Skill 经典项目对照
  edges-type: reference
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-11T15:32:36+00:00"
---

设计 edges 的能力面时，对照这些一手来源：经典项目是「一个 CLI + 一份 SKILL.md」；Edges 在此之上把 MCP 作为无 shell 宿主的一等入口，三者并列。npm/AXI 的 bin 等于 CLI 安装入口，不是仓根再摆人用 shell。

**Why:**
2026-09-11 为对齐「要不要单独养仓根 `bin/`」做的短调研。结论写入 `project_capability_surface_cli_skill_mcp` 与 ADR 0004。对照来源只用来定 CLI 与 Skill 的形状，不要据此把 MCP 写成可选项。

**How to apply:**
- `gh`（cli/cli）：人和 agent 共用一个 `gh`。Skill 只教 agent 痛点（`--json`、分页、`-R`、非 TTY）。https://github.com/cli/cli/blob/trunk/skills/gh/SKILL.md
- AXI / `gh-axi`：CLI 是主界面；Skill 是次要发现路径，从 CLI help 生成，例子写成 `npx -y gh-axi …`，不依赖全局 PATH。他们的 `bin/*.ts` 是 npm 入口（`--version` fast-path），不是第三层。https://github.com/kunchenguid/axi/blob/main/.agents/skills/axi/SKILL.md
- Agent Skills 规范：已有包就 `npx`/`uvx`；命令难一次写对才把脚本放进 **skill 自己的 `scripts/`**，不是仓根 `bin/`。https://agentskills.io/skill-creation/using-scripts
- obra/superpowers：Skill 是流程，落地调 `git`/`gh`/测试；没有自家产品 bin。https://github.com/obra/superpowers
- 本仓能力面：CLI + Skill + MCP。现状实现上 `extensions/clis` 的 `edges note` 与 MCP 都还 `execFile bin/new-note`（git 故意留在 bash），这是实现拆分，不要推广成「人用 bin / agent 用 CLI」，也不要把 MCP 降成加装层。
