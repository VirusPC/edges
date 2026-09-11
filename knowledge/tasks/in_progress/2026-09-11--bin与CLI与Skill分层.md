---
name: bin_cli_skill_layering
description: 对齐经典项目：能力面是 CLI + Skill 两层；仓根 bin/ 不作为给人的第三层
metadata:
  edges-type: task
  edges-title: bin / CLI / Skill 分层
  edges-tasks-status: in_progress
  edges-task-pr: "https://github.com/VirusPC/edges/pull/42"
  edges-task-assignee: Coding Agent 专家
  edges-task-assignee-id: ac913463-5bf6-4c16-adc0-900c61a8692d
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-11T23:44:00+08:00"
---

给 agent 的能力面是 **CLI + Skill 两层**。Unix/npm/AXI 里的 bin 就是 CLI 入口（`package.json` `"bin"`），不是再给人单独做一层仓根 `bin/`。新能力只落 `extensions/clis` + Skill（调用写成 `pnpm --filter edges-cli` 或 `npx`）；不要再加「给人的薄 PATH 封装」。现有 `bin/new-note` 只当 git 实现残留，不当分层样板。

**Why:**
2026-09-11 对照经典项目后，peng cheng 要求对齐。`gh`、AXI/`gh-axi`、Agent Skills 规范、obra/superpowers 都是「一个 CLI（或直接调已有命令）+ 一份 SKILL.md 教何时如何调用」。先前把仓根 `bin/` 写成给人用的薄 PATH、CLI 专给 agent，和业界以及本仓现状（CLI/MCP 都 `execFile bin/new-note`）拧着。

**How to apply:**
- 新子命令 / 新自动化：先做 `extensions/clis` 契约（flag / JSON / exit code），再写 Skill「何时、如何调用该 CLI」。禁止 Skill → 仓根 `bin/`。
- 人要 PATH：装的就是这个 CLI（package `bin` 字段，或 `npx -y`），不要再包一层 bash。
- `bin/new-note`：继续当唯一 git 实现可以，直到有人把 git 收进 CLI；不要往 `bin/` 加新的人用入口。
- 调研原文见 `.memory/references/reference_bin_cli_skill_classic_projects.md`。
