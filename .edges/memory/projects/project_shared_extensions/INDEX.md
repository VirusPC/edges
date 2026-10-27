---
name: project_shared_extensions
description: >-
  新增不绑定 Edges 的通用 skill 或个人 harness 时：放使用方自己的内容仓，经 edges compose 挂载，布局由该仓自定。不要新建
  shared-extensions，也不要规定 skills/managed 路径。接入 Edges 的能力仍放本仓 packages/。
metadata:
  edges-title: 不绑定 Edges 的通用 skill 放使用方内容仓
  edges-type: project
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-27T07:58:20+00:00'
  edges-origin-session-id: bc-3219fe95-afee-53c8-9317-6d04fc05bc4f
  edges-agent-client: cursor
---

不绑定 Edges 的通用 skill 与个人 harness 放使用方自己的内容仓。这份仓就是可 Compose 的共享 `.edges`，不另起概念。跨机器用 `edges compose` 挂上。布局由该仓自定；框架不规定 skill 落在 `.edges/skills/managed/` 还是仓根 `skills/managed/`。接入或操作 Edges 的能力仍放本仓 `packages/cli/`、`packages/skills/`、`packages/apps/`、`packages/services/`、`packages/mcp-servers/`、`packages/system-prompt/`。

**Why:** 2026-10-20 曾把不绑定 Edges 的材料放个人仓 `shared-extensions/`（ADR 0040）。2026-10-27 废止该隔间（ADR 0048）：不再维护独立目录、整层 VERSION 或 `shared-extensions@` tag。同日文档曾先后写成使用方 `.edges/skills/managed/` 和仓根 `skills/managed/`。用户随后确认：个人脑仓就是可 Compose 的共享 `.edges`，框架不规定其中一种路径。

**How to apply:** 新的通用 skill 先问「离开 Edges 还要带着它吗」。要，且不是为了接入 Edges → 使用方自己的内容仓，布局照该仓已有约定，不要新建 `shared-extensions/`，也不要在框架文档里指定 `.edges/skills/managed/` 或仓根 `skills/managed/`。是为了让 Agent 接入或操作 Edges → 本仓 `packages/` 下对应目录。跨机不要再装一份到 `~/.agents/skills`，用 `edges compose` 挂使用方自己的内容仓。与 Edges 无关的 MCP 配置、plugin、hook 同样不进本仓，也不收回 `shared-extensions/`。框架文档不要写死某一份个人仓的名字。凭据只用环境变量占位。
