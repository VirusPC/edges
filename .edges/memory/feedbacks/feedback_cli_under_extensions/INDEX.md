---
name: feedback_cli_under_extensions
description: 新增或移动面向 agent 的 CLI 时放 packages/cli/。2026-10-20 先翻案到仓库根 cli/，同日 workspace 化后再收进 packages/cli/。
metadata:
  edges-title: CLI 放 packages/cli/
  edges-type: feedback
  edges-username: viruspc
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-20T10:47:00+00:00'
  edges-origin-session-id: bc-3219fe95-afee-53c8-9317-6d04fc05bc4f
  edges-agent-client: cursor
---

面向 agent 的 CLI 放 `packages/cli/`。不要再放进已经删除的 `extensions/`，也不要另建仓库根 `clis/`。

**Why:** 2026-09-08 曾把根目录 `clis/` 收回 `extensions/cli/`，理由是对外接口层要和 mcp-servers、skills 并列，避免被人当成 `bin/`。2026-10-20 平铺取消 `extensions/`，CLI 一度放在仓库根 `cli/`（ADR 0040）。同日 workspace 化把 CLI 收进 `packages/cli/`（ADR 0041）。

**How to apply:** workspace 成员包含 `packages/*`。文档、默认路径、ingest 入口都写 `packages/cli/`（包名仍是 `@viruspc/edges`，`repository.directory` 是 `packages/cli`）。不要在仓库根再留 `clis/` 或 `cli/`，也不要写 `extensions/cli`。
