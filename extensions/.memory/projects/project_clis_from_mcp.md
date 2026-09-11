---
name: project_clis_from_mcp
description: 改 note ingest、new-note MCP 或 clis 时：本地 agent 走 extensions/clis 的 edges note（无 edges-note shim，根目录不默认 ingest）；git 仍在 bin/new-note，MCP 保留；鉴权 flag 留在 note 上（--token-file / --token-stdin），JSON stdout。不要把 CLI 放仓库根。
metadata:
  edges-title: new_note 收成 extensions/clis/edges，MCP 保留
  edges-type: project
  edges-origin-session-id: bc-93a6c09d-f19d-443a-8076-98a33936e684
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-11T11:51:38+00:00"
---

本地、有 shell 的 agent 用 `extensions/clis/` 的 `edges` CLI；入库子命令是 `edges note …`（不是根目录默认 ingest，也不是 `ingest`）。鉴权 flag（`--token-file` / `--token-stdin`）挂在 `note` 上，和 new-note MCP HTTP 同一道可选门闩。`edges tasks` 只是占位（help + usage error），还没有业务逻辑。二进制只有 `edges`，不要 `edges-note` shim；旧调用方必须改成 `edges note …`。git 仍只在 `bin/new-note`；`extensions/mcp-servers/new-note` 保留给没有 shell 的宿主。两边都 `execFile` 同一条脚本，MCP 不套 CLI。不要把 CLI 项目放在仓库根 `clis/`。

**Why:** 2026-09 把 MCP 当默认入口，但调研（同层 `reference_agent_oriented_cli`）显示 agent-optimized CLI 在有 shell 时更便宜更稳。`bin/new-note` 已经是唯一 git 实现。2026-09-11 用手写 `parseArgs` 换 Commander，是为了命令树可长。同日产品决定（peng cheng）把包收成多命令 `edges`：`note` 承担现有入库，`tasks` 先占位；根目录不再默认 ingest，也不留 `edges-note` 兼容 shim——调用方显式迁移，避免双 bin 和默认命令把命令树锁死。

**How to apply:**

### 今天的表面（转换源）

一个 MCP 服务：工具 `new_note`。必填 `title`（1–120）、`content`（1–50_000）、`coAuthor`（3–200）；缺或超长校验失败，不启动 git。顺序：校验 → `execFile(bin/new-note, [title, content, coAuthor])` → 解析 marker。成功：`status, filePath, branch, prStatus (created|unavailable|direct_commit), prUrl?, stdoutSummary`。失败：`status, errorCode, reason`。push 成功但 PR 不可用仍算成功，`prStatus: "unavailable"`。HTTP 鉴权：`EDGES_AUTH_TOKEN` 未设则跳过；设了则 Bearer。错误码 `AUTH_MISSING` / `AUTH_INVALID_FORMAT` / `AUTH_INVALID_TOKEN`。

### 三层

```
agent
 ├─ extensions/clis/ edges            多命令 CLI（note / tasks / …；Commander + JSON stdout）
 ├─ bin/new-note                      唯一 git 实现（人用 + marker）
 └─ extensions/mcp-servers/new-note   无 shell 的 MCP 宿主
```

不要把「给 `bin/new-note` 加 `--json`」当成整个交付。不要在仓库根再放一份 `clis/`。`conversation-to-notes` 不进 CLI，agent 读 skill。`EDGES_SCRIPT` 与 `EDGES_REPO` 必须拆开，否则隔离仓测不了。

### CLI 契约

包 `edges-cli`，目录 `extensions/clis/`，二进制 **只有** `edges`（`package.json` `bin` 不要第二项）。解析器是 Commander（`src/program.ts` `.name("edges")`），`parseArgv(argv)` 仍吃数组，测试不必起真 process。

```
edges note --title T --content C --co-author "Name <email>" [--json] [--dry-run] [--mode direct|pr] [--token-file PATH]
edges tasks [--help]    # 占位：help 或 usage error，无业务
edges --help / -v
```

- 根目录不带入子命令：help 或 usage error，**不**跑 note ingest。
- 输出始终 JSON；`--json` 仍合法（agent 记熟的开关）。进度在 stderr。
- `note` 缺字段 / 未知 flag：stdout 失败 JSON，exit 2，不调脚本。
- 鉴权：未设 `EDGES_AUTH_TOKEN` 则跳过；已设则必须 `--token-file` 或 `--token-stdin`（非 TTY），比对失败 `AUTH_*`、exit 4、不调脚本。这些 flag 挂在 `note` 上，不要先做成 `edges auth ...`。
- 成功 exit 0；运行时失败（git / 脚本）exit 1。
- `--dry-run` → `EDGES_DRY_RUN=true`，本地 commit，不 push origin。
- `GITHUB_TOKEN` 透传给脚本，不做成 flag。
- `--help` 由 Commander 列出 `note` 与 `tasks`；`edges note --help` 再附 STRUCTURED OUTPUT / AUTH / EXIT / ENV / EXAMPLES。

环境：`EDGES_REPO`、`EDGES_BASE_BRANCH`、`EDGES_MODE`、`EDGES_DRY_RUN`、`EDGES_SCRIPT`、`EDGES_AUTH_TOKEN`。

### 不做

删 MCP；在 TS 里跑 git；把 MCP HTTP/stdio 搬进 CLI；发 npm；AXI TOON/分页/session hook；并发分支策略；保留 `edges-note` 或第二 bin；根目录默认 ingest；把子命令再叫回 `ingest`。
