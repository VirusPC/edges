---
name: project_bin_cli_skill_layering
description: 对齐经典项目：能力面是 CLI+Skill 两层；仓根 bin/ 不是给人的第三层；新能力只落 extensions/clis + Skill
metadata:
  edges-title: bin / CLI / Skill 分层
  edges-type: project
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-11T20:28:20+08:00"
---

给 agent 的能力面是 CLI + Skill 两层。Unix/npm/AXI 里的 bin 就是 CLI 入口（`package.json` `"bin"`），不是再给人单独做一层仓根 `bin/`。新能力只落 `extensions/clis` + Skill；不要再加「给人的薄 PATH 封装」。现有 `bin/new-note` 只当 git 实现残留，不当分层样板。

**Why:**
peng cheng 2026-09-11 要求按经典项目调研对齐。先前「仓根 `bin/` 给人、`extensions/clis` 给 agent」与 `gh` / AXI / Agent Skills 规范不一致，也和本仓「CLI 包着 `bin/new-note`」拧着。

**How to apply:**
- 新能力：`extensions/clis` 契约 + Skill 只写何时如何调 CLI。禁止 Skill → 仓根 `bin/`。
- 人要 PATH：用同一 CLI（npm `bin` 或 `npx -y`），不要再包 bash。
- `bin/new-note` 可继续当唯一 git 实现，直到迁进 CLI；不要往 `bin/` 加新人用入口。
- 对照来源见 `reference_bin_cli_skill_classic_projects`。
