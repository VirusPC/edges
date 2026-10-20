---
name: feedback_cli_under_extensions
description: 新增或移动面向 agent 的 CLI 时：放仓库根 cli/。2026-10-20 翻案，不再禁止放仓库根。
metadata:
  edges-title: CLI 放仓库根 cli/
  edges-type: feedback
  edges-username: viruspc
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-20T07:09:30+00:00'
  edges-origin-session-id: bc-3219fe95-afee-53c8-9317-6d04fc05bc4f
  edges-agent-client: cursor
---

面向 agent 的 CLI 放仓库根 `cli/`。不要再放进已经删除的 `extensions/`，也不要另建仓库根 `clis/`。

**Why:** 2026-09-08 曾把根目录 `clis/` 收回 `extensions/cli/`，理由是对外接口层要和 mcp-servers、skills 并列，避免被人当成 `bin/`。2026-10-20 平铺时整层 `extensions/` 取消，`cli/`、`skills/`、`mcp-servers/` 一起到仓库根，这条「禁止放仓库根」同时翻案。见 ADR 0040。

**How to apply:** workspace 成员是 `cli`。文档、默认路径、ingest 入口都写 `cli/`（包名仍是 `@viruspc/edges`，`repository.directory` 是 `cli`）。不要在仓库根再留 `clis/`，也不要写 `extensions/cli`。
