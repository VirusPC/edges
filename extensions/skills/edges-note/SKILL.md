---
name: edges-note
description: 把一条 Note 入库到 Edges 仓库时使用。有 shell 就调用 `edges note`；没有 shell 的宿主调用对等能力面入口 new-note MCP。不要自己跑 git，也不要找仓根 bin/new-note。
version: 1.0.0
---

# edges note

人和有 shell 的 Agent 共用 [`extensions/clis`](../../clis/README.md) 的 `edges note`。本 skill 只说明何时调用、怎么写对命令。Git / 落盘 / PR 在 CLI 里，不在本目录。

## 什么时候用

- 用户或任务要把一条 Note 写进 `knowledge/notes/YYYY-MM-DD--slug.md` 并 commit（可选 push / PR）。
- 不要用它整理对话（改用 `conversation-to-notes`）、不要用它改 tasks 看板、不要自己 `git commit`。

## 有 shell：调用 CLI

在仓库根：

```bash
pnpm --filter edges-cli exec tsx src/index.ts note \
  --title "<1–120 chars>" \
  --content "<1–50000 chars>" \
  --co-author "Name <email@domain>" \
  --json
```

已 build 时把 `tsx src/index.ts` 换成 `node dist/index.js`。`package.json` 的 `"bin": { "edges": "./dist/index.js" }` 只是安装挂钩：装过之后也可以 `npx edges note …`，不要再包一层仓根脚本。

可选 flags：`--dry-run`（本地 commit，不 push）、`--mode direct|pr`、`--token-file PATH`、`--token-stdin`（仅当环境变量 `EDGES_AUTH_TOKEN` 已设置）。

环境变量：`EDGES_REPO`、`EDGES_BASE_BRANCH`（默认 `main`）、`EDGES_MODE`、`EDGES_DRY_RUN`、`EDGES_AUTH_TOKEN`、`GITHUB_TOKEN`（PR）。

### stdout JSON

成功 exit 0：

```json
{"status":"success","filePath":"knowledge/notes/2026-09-11--slug.md","branch":"main","prStatus":"direct_commit"}
```

`prStatus` 为 `created` | `unavailable` | `direct_commit`。失败时 `status` 为 `failed`，带 `errorCode` 与 `reason`。

### exit codes

| code | 含义 |
| --- | --- |
| 0 | 成功 |
| 1 | 运行时失败（git / 未知） |
| 2 | 用法或校验失败（未跑 git） |
| 4 | 鉴权失败（未跑 git） |

进度与诊断在 stderr。只解析 stdout JSON。

## 无 shell：改用 MCP

宿主不能 exec 时，调用 `extensions/mcp-servers/new-note` 的工具 `new_note`，参数 `title`、`content`、`coAuthor`（同一套长度限制）。不要 import CLI 模块，不要找已删除的 `bin/new-note`。

## 禁止

- 不要在本 skill 下写 `scripts/` 去跑 git。
- 不要教 Agent 把仓根 `bin/` 加入 PATH。
- 不要把 npm `bin` 说成能力面的一层。能力面是 CLI + Skill + MCP（见仓库 `CONTEXT.md` 与 `docs/adr/0004-capability-surface-cli-skill-mcp.md`）。
