---
name: project_clis_from_mcp
title: new_note 收成 extensions/clis/edges-note，MCP 保留
description: 改 ingest、new-note MCP 或 clis 时：本地 agent 走 extensions/clis/edges-note，git 仍在 bin/new-note，MCP 保留；鉴权用 --token-file，JSON stdout。不要把 CLI 放仓库根。
type: project
username: viruspc
email: cheng.peng.helloworld@gmail.com
updatedAt: "2026-09-08T15:28:25+08:00"
---

本地、有 shell 的 agent 用 `extensions/clis/` 的 `edges-note` 做 ingest；git 仍只在 `bin/new-note`；`extensions/mcp-servers/new-note` 保留给没有 shell 的宿主。两边都 `execFile` 同一条脚本，MCP 不套 CLI。不要把 CLI 项目放在仓库根 `clis/`。

**Why:** 2026-09 把 MCP 当默认入口，但调研（同层 `reference_agent_oriented_cli`）显示 agent-optimized CLI 在有 shell 时更便宜更稳。`bin/new-note` 已经是唯一 git 实现（落盘、commit trailer、push/PR、`__EDGES_*` marker），TS 里重写 git 被既有 ingest 约束禁止。MCP HTTP/stdio 对无 shell 客户端仍有用，所以转换不等于删除。鉴权要转：MCP HTTP 的可选 `EDGES_AUTH_TOKEN` Bearer 门闩，CLI 侧改成 `--token-file` / `--token-stdin` 比对，禁止 `--token` 进 argv。CLI 落点在 `extensions/clis/`，因为 extensions 才是对外接口层（2026-09-08 用户纠正根目录落点）。

**How to apply:**

### 今天的表面（转换源）

一个 MCP 服务：工具 `new_note`。必填 `title`（1–120）、`content`（1–50_000）、`coAuthor`（3–200）；缺或超长校验失败，不启动 git。顺序：校验 → `execFile(bin/new-note, [title, content, coAuthor])` → 解析 marker。成功：`status, filePath, branch, prStatus (created|unavailable|direct_commit), prUrl?, stdoutSummary`。失败：`status, errorCode, reason`。push 成功但 PR 不可用仍算成功，`prStatus: "unavailable"`。HTTP 鉴权：`EDGES_AUTH_TOKEN` 未设则跳过；设了则 Bearer。错误码 `AUTH_MISSING` / `AUTH_INVALID_FORMAT` / `AUTH_INVALID_TOKEN`。

### 三层

```
agent
 ├─ extensions/clis/ edges-note          agent-oriented CLI（flags + JSON stdout）
 ├─ bin/new-note                         唯一 git 实现（人用 + marker）
 └─ extensions/mcp-servers/new-note      无 shell 的 MCP 宿主
```

不要把「给 `bin/new-note` 加 `--json`」当成整个交付。不要在仓库根再放一份 `clis/`。`conversation-to-notes` 不进 CLI，agent 读 skill。`EDGES_SCRIPT` 与 `EDGES_REPO` 必须拆开，否则隔离仓测不了。

### CLI 契约

包 `edges-cli`，目录 `extensions/clis/`，二进制 `edges-note`。

```
edges-note --title T --content C --co-author "Name <email>" [--json] [--dry-run] [--mode direct|pr] [--token-file PATH]
```

- 输出始终 JSON；`--json` 仍合法（agent 记熟的开关）。进度在 stderr。
- 缺字段 / 未知 flag：stdout 失败 JSON，exit 2，不调脚本。
- 鉴权：未设 `EDGES_AUTH_TOKEN` 则跳过；已设则必须 `--token-file` 或 `--token-stdin`（非 TTY），比对失败 `AUTH_*`、exit 4、不调脚本。
- 成功 exit 0；运行时失败（git / 脚本）exit 1。
- `--dry-run` → `EDGES_DRY_RUN=true`，本地 commit，不 push origin。
- `GITHUB_TOKEN` 透传给脚本，不做成 flag。
- `--help` 写清 ingest、三条必填、`--json`、鉴权、exit 表、例子。纯写入工具无参不吐 live 数据。

环境：`EDGES_REPO`、`EDGES_BASE_BRANCH`、`EDGES_MODE`、`EDGES_DRY_RUN`、`EDGES_SCRIPT`、`EDGES_AUTH_TOKEN`。

### 不做

删 MCP；在 TS 里跑 git；把 MCP HTTP/stdio 搬进 CLI；发 npm；AXI TOON/分页/session hook；并发分支策略。
