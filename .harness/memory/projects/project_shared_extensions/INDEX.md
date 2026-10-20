---
name: project_shared_extensions
description: >-
  新增不绑定 Edges 的 skill / MCP 配置 / plugin / hook 时：放个人仓 shared-extensions。接入 Edges
  的能力放仓库根 cli/、skills/、apps/、services/、mcp-servers/、system-prompt/。
metadata:
  edges-title: 跨机器跨 Agent 的 harness 放 shared-extensions
  edges-type: project
  edges-username: viruspc
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-20T07:36:16+00:00'
  edges-origin-session-id: bc-3219fe95-afee-53c8-9317-6d04fc05bc4f
  edges-agent-client: cursor
---

跨机器、跨 Agent 共用、且不绑定 Edges 产品的 harness 放个人仓 `shared-extensions/`。接入或操作 Edges 的能力放仓库根 `cli/`、`skills/`、`apps/`、`services/`、`mcp-servers/`、`system-prompt/`。

**Why:** 旧判据「换 Agent、换机器带得走」太宽，个人 MCP 配置、hooks、plugins 会和 Edges 对外接口混在一起。2026-10-20 取消 `extensions/` 这一层后，接入 Edges 的目录直接在仓库根；不绑定 Edges 的仍去个人仓 `shared-extensions/`。见 ADR 0040。

**How to apply:** 新 skill / MCP 配置 / plugin / hook 先问「离开 Edges，换一台机器、换一个 Agent，我还要带着它吗」。要，且不是为了接入 Edges → 个人仓 `shared-extensions/`。是为了让 Agent 接入或操作 Edges → 仓库根对应目录。凭据只用环境变量占位。不要手拷到 `~/.claude/` 等处。
