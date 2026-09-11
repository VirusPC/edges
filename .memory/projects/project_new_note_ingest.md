---
name: project_new_note_ingest
description: 改 new-note 或新增 MCP ingest 时：TS+Node 编排，子进程调用 edges note，失败即停，返回机器可解析 JSON。不要 Python server，不要 in-process import CLI，不要再找仓根 bin/。
metadata:
  edges-title: new-note MCP 的 ingest 约束
  edges-type: project
  edges-origin-session-id: bc-03ac82e9-5695-53af-997c-26a0853b2428
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-11T18:02:16+00:00"
---

`new-note` MCP 的约束是：TypeScript + Node.js 编排，git 由 `edges note` 在 CLI 进程里跑，MCP 只 `execFile` 该 CLI。失败即停，返回机器可解析结果。不要改成 Python server，不要 in-process import `extensions/clis`，不要再 `execFile` 仓根脚本。

**Why:** 2026-02-19 的 ingest 把外部写入做成 MCP 工具 `new_note`。ADR-0004 把 git 收进 CLI，并规定 MCP 子进程调 CLI。参数数组调用避免注入。

**How to apply:**
- 工具入参必填 `title`、`content`、`coAuthor`；缺字段或超长校验失败，不启动 CLI。
- 顺序：校验 → spawn `edges note --json` → 解析 JSON。任一步失败不得继续。
- spawn/execFile 用参数数组，禁止 shell 字符串拼接。子进程环境删除 `EDGES_AUTH_TOKEN`（MCP 已鉴权）。
- commit 必须带 ingest 标题上下文和 co-author trailer（由 CLI git 模块保证）。
- push 成功但 PR 依赖不可用时，ingest 仍算成功，`prStatus: "unavailable"`。
- 尚未做完：并发分支冲突策略、启动时 git/凭据/gh 预检查。
