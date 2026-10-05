---
name: clarify_memory_vs_docs_boundary
description: 明确 .memory 与 docs/ 的边界：成文给人读 vs 短记忆给维护者/agent
metadata:
  edges-type: task
  edges-title: 明确 .memory 与 docs/ 的边界
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-17T14:09:12.721Z"
  edges-task-project: project-memory
---

明确 `.memory` 与 `docs/` 的边界。brainstorming 中 peng cheng 要求暂时记 todo；边界草案第一节尚未全部确认。

**Why:**
已对齐：ADR / plan / spec 放 `docs/` 符合行业常见做法；`.memory` 不适合当 ADR/计划正文库。也不建议把整个 `.memory` 子类型搬进 `docs/`。没有成文边界时，agent 会把短约定写成第二份 ADR，或把给人读的正文塞进记忆卡片。

**How to apply:**
- 拟议（待确认）：`docs/` = 给人看的成文说明（ADR、计划、规格、对外说明书）；`.memory/` = 给维护者与 agent 的短记忆（纠正、短约定、外链卡片、skills、user 等）。
- 可选 `.memory/docs` type = 只做「先读哪几篇 docs/」的短卡片，不写第二份 ADR。
- 判据：要当正文给人读 → `docs/`；要当便签/索引/纠正 → `.memory/`。
- 相关：可扩展 Memory Type 已合入（ADR 0006 / add-type）；backlog「tasks memory 与看板语义合并」「project-memory 脚本迁 CLI」。
- 未指派。不在本条实现搬迁。派发时默认先 grill-with-docs。
