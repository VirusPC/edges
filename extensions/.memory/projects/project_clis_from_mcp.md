---
name: project_clis_from_mcp
description: 改 note ingest、new-note MCP 或 clis 时：本地 agent 走 extensions/clis 的 edges note；git 在 CLI 的 TS 模块；MCP 子进程调 edges note；鉴权 flag 留在 note 上；JSON stdout。不要把 CLI 放仓库根。
metadata:
  edges-title: new_note 收成 extensions/clis/edges，MCP 保留
  edges-type: project
  edges-origin-session-id: bc-93a6c09d-f19d-443a-8076-98a33936e684
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-11T18:02:16+00:00"
---

本地、有 shell 的 agent 用 `extensions/clis/` 的 `edges` CLI；入库子命令是 `edges note …`。鉴权 flag（`--token-file` / `--token-stdin`）挂在 `note` 上，和 new-note MCP HTTP 同一道可选门闩。`edges tasks` 仍是占位。二进制只有 `edges`。git 在 `extensions/clis/src/git`；`extensions/mcp-servers/new-note` 留给没有 shell 的宿主，子进程调用 `edges note`。不要把 CLI 项目放在仓库根 `clis/`。

**Why:** ADR-0004 把能力面定为 CLI + Skill + MCP，并删除仓根 `bin/`。先前「两边都 execFile bin/new-note、MCP 不套 CLI」已被取代。

**How to apply:**

### 表面

一个 MCP 服务：工具 `new_note`。必填 `title`（1–120）、`content`（1–50_000）、`coAuthor`（3–200）。顺序：校验 → `execFile(node, [cliEntry, note flags])` → 解析 CLI JSON。成功：`status, filePath, branch, prStatus (created|unavailable|direct_commit), prUrl?, stdoutSummary`。失败：`status, errorCode, reason`。push 成功但 PR 不可用仍算成功。HTTP 鉴权：`EDGES_AUTH_TOKEN` 未设则跳过；设了则 Bearer。子进程环境删除 `EDGES_AUTH_TOKEN`。

### 三入口

```
agent / human
 ├─ extensions/clis  edges            多命令 CLI（note / tasks / …；Commander + JSON；git 在 src/git）
 ├─ extensions/skills/edges-note      何时如何调 CLI 或 MCP（对等能力面入口）
 └─ extensions/mcp-servers/new-note   无 shell 的 MCP 宿主（spawn edges note）
```

不要把 npm `bin` 当成一层。不要恢复仓根 `bin/`。`conversation-to-notes` 不进 CLI。隔离仓测用 `EDGES_REPO`，不要再设 `EDGES_SCRIPT`。

### CLI 契约

包 `edges-cli`，目录 `extensions/clis/`，二进制只有 `edges`。

```
edges note --title T --content C --co-author "Name <email>" [--json] [--dry-run] [--mode direct|pr] [--token-file PATH]
edges tasks [--help]
edges --help / -v
```

- 根目录不带入子命令：help 或 usage error，不跑 note ingest。
- 输出始终 JSON；进度在 stderr。
- 成功 exit 0；运行时失败 exit 1；缺字段 exit 2；鉴权失败 exit 4。
- 环境：`EDGES_REPO`、`EDGES_BASE_BRANCH`、`EDGES_MODE`、`EDGES_DRY_RUN`、`EDGES_AUTH_TOKEN`、`GITHUB_TOKEN`。没有 `EDGES_SCRIPT`。

### 不做

删 MCP；MCP in-process import CLI；把 MCP HTTP/stdio 搬进 CLI；发 npm；AXI TOON/分页/session hook；并发分支策略；恢复 `edges-note` 第二 bin；根目录默认 ingest。
