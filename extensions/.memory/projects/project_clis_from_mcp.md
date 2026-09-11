---
name: project_clis_from_mcp
description: 改 ingest、new-note MCP 或 clis 时：本地 agent 走 extensions/clis/edges-note（Commander：默认即 ingest，旧扁平 flag 仍可用）；git 仍在 bin/new-note，MCP 保留；鉴权 flag 留在 ingest 上（--token-file / --token-stdin），JSON stdout。不要把 CLI 放仓库根。
metadata:
  edges-title: new_note 收成 extensions/clis/edges-note，MCP 保留
  edges-type: project
  edges-origin-session-id: bc-93a6c09d-f19d-443a-8076-98a33936e684
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-11T11:26:54+00:00"
---

本地、有 shell 的 agent 用 `extensions/clis/` 的 `edges-note` 做 ingest；argv 由 Commander.js 解析；默认命令就是 ingest，旧的扁平调用 `edges-note --title ...` 必须继续可用，`edges-note ingest ...` 是等价别名。鉴权 flag（`--token-file` / `--token-stdin`）留在默认 / ingest 命令上，和 new-note MCP HTTP 同一道可选门闩，先不要拆成独立 `auth` 子命令。git 仍只在 `bin/new-note`；`extensions/mcp-servers/new-note` 保留给没有 shell 的宿主。两边都 `execFile` 同一条脚本，MCP 不套 CLI。不要把 CLI 项目放在仓库根 `clis/`。

**Why:** 2026-09 把 MCP 当默认入口，但调研（同层 `reference_agent_oriented_cli`）显示 agent-optimized CLI 在有 shell 时更便宜更稳。`bin/new-note` 已经是唯一 git 实现（落盘、commit trailer、push/PR、`__EDGES_*` marker），TS 里重写 git 被既有 ingest 约束禁止。MCP HTTP/stdio 对无 shell 客户端仍有用，所以转换不等于删除。鉴权要转：MCP HTTP 的可选 `EDGES_AUTH_TOKEN` Bearer 门闩，CLI 侧改成 `--token-file` / `--token-stdin` 比对，禁止 `--token` 进 argv。CLI 落点在 `extensions/clis/`，因为 extensions 才是对外接口层（2026-09-08 用户纠正根目录落点）。2026-09-11 用手写 `parseArgs` 换 Commander，是为了命令树和 help 可长；调用方已经在用扁平 flag，所以默认命令必须仍是 ingest，鉴权也不另开子命令（和 MCP 同一道门）。

**How to apply:**

### 今天的表面（转换源）

一个 MCP 服务：工具 `new_note`。必填 `title`（1–120）、`content`（1–50_000）、`coAuthor`（3–200）；缺或超长校验失败，不启动 git。顺序：校验 → `execFile(bin/new-note, [title, content, coAuthor])` → 解析 marker。成功：`status, filePath, branch, prStatus (created|unavailable|direct_commit), prUrl?, stdoutSummary`。失败：`status, errorCode, reason`。push 成功但 PR 不可用仍算成功，`prStatus: "unavailable"`。HTTP 鉴权：`EDGES_AUTH_TOKEN` 未设则跳过；设了则 Bearer。错误码 `AUTH_MISSING` / `AUTH_INVALID_FORMAT` / `AUTH_INVALID_TOKEN`。

### 三层

```
agent
 ├─ extensions/clis/ edges-note          agent-oriented CLI（Commander + JSON stdout）
 ├─ bin/new-note                         唯一 git 实现（人用 + marker）
 └─ extensions/mcp-servers/new-note      无 shell 的 MCP 宿主
```

不要把「给 `bin/new-note` 加 `--json`」当成整个交付。不要在仓库根再放一份 `clis/`。`conversation-to-notes` 不进 CLI，agent 读 skill。`EDGES_SCRIPT` 与 `EDGES_REPO` 必须拆开，否则隔离仓测不了。

### CLI 契约

包 `edges-cli`，目录 `extensions/clis/`，二进制 `edges-note`。解析器是 Commander（`src/program.ts`），`parseArgv(argv)` 仍吃数组，测试不必起真 process。

```
edges-note --title T --content C --co-author "Name <email>" [--json] [--dry-run] [--mode direct|pr] [--token-file PATH]
edges-note ingest --title T --content C --co-author "Name <email>" [同上]
```

- 输出始终 JSON；`--json` 仍合法（agent 记熟的开关）。进度在 stderr。
- 缺字段 / 未知 flag：stdout 失败 JSON，exit 2，不调脚本。
- 鉴权：未设 `EDGES_AUTH_TOKEN` 则跳过；已设则必须 `--token-file` 或 `--token-stdin`（非 TTY），比对失败 `AUTH_*`、exit 4、不调脚本。这些 flag 挂在 ingest / 默认命令上，不要先做成 `edges-note auth ...`。
- 成功 exit 0；运行时失败（git / 脚本）exit 1。
- `--dry-run` → `EDGES_DRY_RUN=true`，本地 commit，不 push origin。
- `GITHUB_TOKEN` 透传给脚本，不做成 flag。
- `--help` 由 Commander 生成选项与 `ingest` 子命令，再附 STRUCTURED OUTPUT / AUTH / EXIT / ENV / EXAMPLES。纯写入工具无参不吐 live 数据。

环境：`EDGES_REPO`、`EDGES_BASE_BRANCH`、`EDGES_MODE`、`EDGES_DRY_RUN`、`EDGES_SCRIPT`、`EDGES_AUTH_TOKEN`。

### 不做

删 MCP；在 TS 里跑 git；把 MCP HTTP/stdio 搬进 CLI；发 npm；AXI TOON/分页/session hook；并发分支策略；为了 Commander 强迫调用方改成必须写 `ingest` 子命令。
