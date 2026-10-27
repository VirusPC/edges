---
name: project_cli_from_mcp
description: >-
  改 note ingest、new-note MCP 或 cli 时：本地 agent 走仓库根 packages/cli/ 的 edges notes；git 在 CLI
  的 TS 模块；MCP 子进程调 edges notes；鉴权 flag 留在 notes create 上；JSON stdout。不要在仓库根另建
  clis/，也不要放回已删除的 extensions/。
metadata:
  edges-title: new_note 收成 packages/cli/edges，MCP 保留
  edges-type: project
  edges-origin-session-id: bc-3219fe95-afee-53c8-9317-6d04fc05bc4f
  edges-agent-client: cursor
  edges-username: viruspc
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-20T07:40:32+00:00'
---

本地、有 shell 的 agent 用 `packages/cli/` 的 `edges` CLI；入库子命令是 `edges notes …`。鉴权 flag（`--token-file` / `--token-stdin`）挂在 `notes create` 上，和 new-note MCP HTTP 同一道可选门闩。`edges tasks` 已落地 Issue 层 list/get/create/update/status 与只读 `runs` / `run-messages`（ADR 0005）。二进制只有 `edges`。git 在 `packages/cli/src/git`（仅 `note` ingest）；tasks 写盘不调 git。`packages/mcp-servers/new-note` 留给没有 shell 的宿主，子进程调用 `edges notes`。不要把 CLI 项目放在仓库根 `clis/`。2026-10-20 起这个 `packages/cli/` 就在仓库根；不要再放回已删除的 `extensions/`。

**Why:** ADR-0004 把能力面定为 CLI + Skill + MCP，并删除仓根 `bin/`。ADR-0005 把本轮 tasks 钉在 CLI 契约。先前「两边都 execFile bin/new-note、MCP 不套 CLI」已被取代。

**How to apply:**

### 表面

一个 MCP 服务：工具 `new_note`。必填 `title`（1–120）、`content`（1–50_000）、`coAuthor`（3–200）。顺序：校验 → `execFile(node, [cliEntry, note flags])` → 解析 CLI JSON。成功：`status, filePath, branch, prStatus (created|unavailable|direct_commit), prUrl?, stdoutSummary`。失败：`status, errorCode, reason`。push 成功但 PR 不可用仍算成功。HTTP 鉴权：`EDGES_AUTH_TOKEN` 未设则跳过；设了则 Bearer。子进程环境删除 `EDGES_AUTH_TOKEN`。

### 三入口

```
agent / human
 ├─ cli  edges            多命令 CLI（notes / skills / tasks / …；Commander + JSON；git 在 src/git）
 ├─ packages/skills/edges-note      何时如何调 CLI 或 MCP（对等能力面入口）
 └─ packages/mcp-servers/new-note   无 shell 的 MCP 宿主（spawn edges notes）
```

不要把 npm `bin` 当成一层。不要恢复仓根 `bin/`。`conversation-to-notes` 不进 CLI。隔离仓测用 `EDGES_REPO`，不要再设 `EDGES_SCRIPT`。

### CLI 契约

包 `edges-cli`，目录 `packages/cli/`，二进制只有 `edges`。

```
edges notes create --title T --content C --co-author "Name <email>" [--json] [--dry-run] [--mode direct|pr] [--token-file PATH]
edges tasks list|get|create|update|status|runs|run-messages
edges --help / -v
```

- 根目录不带入子命令：help 或 usage error，不跑 note ingest。
- 输出始终 JSON（tasks 的 runs/run-messages 默认 table，可 `--output json`）；进度在 stderr。
- 成功 exit 0；运行时失败 exit 1；缺字段 exit 2；鉴权失败 exit 4。
- 环境：`EDGES_REPO`、`EDGES_BASE_BRANCH`、`EDGES_MODE`、`EDGES_DRY_RUN`、`EDGES_AUTH_TOKEN`、`GITHUB_TOKEN`。没有 `EDGES_SCRIPT`。

### 不做

删 MCP；MCP in-process import CLI；把 MCP HTTP/stdio 搬进 CLI；发 npm；AXI TOON/分页/session hook；并发分支策略；恢复 `edges-note` 第二 bin；根目录默认 ingest。
