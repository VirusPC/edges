---
name: bin_cli_skill_layering
description: bin / extensions/clis / Skill 分层约定（人用 PATH 入口 vs agent 稳定契约）
metadata:
  edges-type: task
  edges-title: bin / CLI / Skill 分层
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-11T20:10:00+08:00"
---

`bin/` 留在仓库里，作给人用的薄 `$PATH` 入口；agent 侧稳定契约放 `extensions/clis`（稳定 flag / JSON / exit code）；Skill 只写何时、如何调用 CLI——Skill → CLI，不要 Skill → bin。实现可共底层，bin 可以是薄封装。

**Why:**
人和 agent 的调用面不同：人要的是短路径、好记的 shell 入口；agent / Skill 要的是可脚本化的稳定契约。若 Skill 直接调 `bin/`，会把「给人的薄封装」冻成契约，或反过来把 agent 契约绑死在 PATH 入口上。分层后两边可共底层实现，演进互不拖累。

**How to apply:**
- 给人用的入口：继续维护仓库根 `bin/`（薄封装即可）。
- agent / 自动化：只依赖 `extensions/clis` 的稳定 flag、JSON 输出、exit code。
- 写 Skill：只描述何时、如何调用 CLI（`extensions/clis`），禁止 Skill → `bin/`。
- 新能力先落 CLI 契约，再按需加 `bin/` 薄包装。
- 相关：#16 `edges` CLI 多命令架构；后续 tasks CLI skill 等应对齐本约定。
