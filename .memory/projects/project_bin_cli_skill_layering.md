---
name: project_bin_cli_skill_layering
description: 给人用的 bin/ PATH 入口与 agent 用的 extensions/clis 契约分层；Skill 只调 CLI 不调 bin
metadata:
  edges-title: bin / CLI / Skill 分层
  edges-type: project
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-11T20:11:44+08:00"
---

`bin/` 留在仓库里，作给人用的薄 `$PATH` 入口；agent 侧稳定契约放 `extensions/clis`（稳定 flag / JSON / exit code）；Skill 只写何时、如何调用 CLI——Skill → CLI，不要 Skill → bin。实现可共底层，bin 可以是薄封装。

**Why:**
人和 agent 的调用面不同：人要短路径 shell 入口，agent / Skill 要可脚本化的稳定契约。Skill 若直接调 `bin/`，会把给人的薄封装冻成契约，或把 agent 契约绑死在 PATH 入口上。

**How to apply:**
- 给人：维护根目录 `bin/`（薄封装即可）。
- agent / 自动化：只依赖 `extensions/clis` 的稳定 flag、JSON、exit code。
- Skill：只描述何时、如何调用 CLI；禁止 Skill → `bin/`。
- 新能力先落 CLI 契约，再按需加 `bin/` 薄包装。
