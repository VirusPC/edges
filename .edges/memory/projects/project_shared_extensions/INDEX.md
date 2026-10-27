---
name: project_shared_extensions
description: >-
  新增不绑定 Edges 的通用 skill 时：放使用方仓根 skills/managed/。跨机用 edges compose 挂使用方自己的
  harness 仓。接入 Edges 的能力仍放本仓 packages/。
metadata:
  edges-title: 不绑定 Edges 的通用 skill 放使用方仓根 managed
  edges-type: project
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-27T07:42:41+00:00'
  edges-origin-session-id: bc-3219fe95-afee-53c8-9317-6d04fc05bc4f
  edges-agent-client: cursor
---

不绑定 Edges 的通用 skill 放使用方仓根 `skills/managed/<name>/`（与 edges-materials `skills.managed` 在 `--super` 下材料根等于仓根对齐）。跨机器用 `edges compose` 挂使用方自己的 harness 仓。接入或操作 Edges 的能力仍放本仓 `packages/cli/`、`packages/skills/`、`packages/apps/`、`packages/services/`、`packages/mcp-servers/`、`packages/system-prompt/`。

**Why:** 2026-10-20 曾把不绑定 Edges 的材料放个人仓 `shared-extensions/`（ADR 0040）。2026-10-27 废止该隔间（ADR 0048）：不再维护独立目录、整层 VERSION 或 `shared-extensions@` tag。使用方仓在 `--super` 下材料根就是仓根，Compose 挂上即可读到仓根 `skills/managed/`。

**How to apply:** 新的通用 skill 先问「离开 Edges 还要带着它吗」。要，且不是为了接入 Edges → 使用方仓根 `skills/managed/<name>/`，不要新建 `shared-extensions/`。是为了让 Agent 接入或操作 Edges → 本仓 `packages/` 下对应目录。跨机不要再装一份到 `~/.agents/skills`，用 `edges compose` 挂使用方自己的 harness 仓。与 Edges 无关的 MCP 配置、plugin、hook 同样不进本仓，也不收回 `shared-extensions/`。框架文档不要写死某一份个人仓的名字。凭据只用环境变量占位。
