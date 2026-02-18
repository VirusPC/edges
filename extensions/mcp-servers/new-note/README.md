# new-note

TypeScript + Node.js MCP server，用于接收外部 AI 总结并执行仓库 ingest（落盘、commit、push）。

## What It Does

- 暴露 MCP 工具 `new_note`
- 接收结构化输入：`title`、`content`、`coAuthor`
- 调用 `bin/new-note` 执行：
  - 生成 `inbox/YYYY-MM-DD--slug.md`
  - `git checkout -b ingest/...`
  - `git commit` + `git push`
  - 可选创建 PR
- 返回结构化 JSON 结果，便于客户端自动处理

## Requirements

- Node.js 20+
- git
- 可用的仓库凭据（SSH key 或 token）
- 可选：`gh` / `curl` / `python3`（如果需要自动创建 PR 或复用现有脚本能力）

## Install

```bash
cd extensions/mcp-servers/new-note
npm install
npm run build
```

## Run

### STDIO 模式（默认）

适用于本地开发和与 IDE 集成：

```bash
npm start
```

开发模式：

```bash
npm run dev
```

### HTTP 模式

适用于远程访问和 Web 集成：

```bash
# 开发模式 (HTTP)
npm run dev:http

# 生产模式 (HTTP)
npm run start:http

# 自定义端口
npm run dev:http -- --port 8080
```

HTTP 模式将在以下端点启动服务器：
- Streamable HTTP 端点: `http://localhost:3000/new-note`

## Environment Variables

- `EDGES_REPO_PATH`: 目标仓库路径，默认当前仓库根目录
- `EDGES_BASE_BRANCH`: 基线分支，默认 `main`
- `EDGES_NEW_NOTE_SCRIPT`: new-note 脚本路径，默认 `../../../../bin/new-note`（由服务进程自动解析到仓库根 `bin/new-note`）
- `EDGES_INGEST_SCRIPT`: 旧变量名，仍兼容（不建议继续使用）

脚本侧兼容变量：
- `EDGES_REPO`
- `EDGES_BASE_BRANCH`

## MCP Tool

MCP tool 名称：`new_note`

输入字段：
- `title` (string)
- `content` (string)
- `coAuthor` (string)

成功返回（JSON 文本）示例：

```json
{
  "status": "success",
  "filePath": "inbox/2026-02-18--daily-summary.md",
  "branch": "ingest/2026-02-18-daily-summary",
  "prUrl": "https://github.com/org/repo/compare/main...ingest/2026-02-18-daily-summary?expand=1",
  "prStatus": "unavailable",
  "stdoutSummary": "..."
}
```

失败返回（JSON 文本）示例：

```json
{
  "status": "failed",
  "errorCode": "PUSH_AUTH_FAILED",
  "reason": "Permission denied (publickey).",
  "stderrSummary": "..."
}
```

错误码：
- `VALIDATION_ERROR`
- `SCRIPT_NOT_FOUND`
- `GIT_FAILURE`
- `PUSH_AUTH_FAILED`
- `PR_CREATION_UNAVAILABLE`
- `UNKNOWN_ERROR`

## Client Integration

### STDIO 模式配置

以支持 stdio MCP 的客户端为例，可将命令配置为：

```json
{
  "command": "node",
  "args": ["/absolute/path/to/edges/extensions/mcp-servers/new-note/dist/index.js"],
  "env": {
    "EDGES_REPO_PATH": "/absolute/path/to/edges",
    "EDGES_BASE_BRANCH": "main"
  }
}
```

如需源码直跑（开发环境）：

```json
{
  "command": "npx",
  "args": ["tsx", "/absolute/path/to/edges/extensions/mcp-servers/new-note/src/index.ts"]
}
```

### HTTP 模式配置

对于支持 Streamable HTTP 的客户端（推荐）：

```json
{
  "type": "streamable-http",
  "url": "http://localhost:3000/new-note"
}
```

或者使用通用 HTTP 配置：

```json
{
  "type": "http",
  "url": "http://localhost:3000/new-note"
}
```

## Testing

```bash
npm test
```

## Troubleshooting

- 报 `SCRIPT_NOT_FOUND`：检查 `EDGES_NEW_NOTE_SCRIPT` 路径和执行权限。
- 报 `PUSH_AUTH_FAILED`：检查服务器上的 Git 凭据（SSH key / token）。
- 报 `GIT_FAILURE`：检查远程仓库可达性、分支权限和本地工作区状态。
- 无法自动建 PR：确认 `gh auth status` 或 `GITHUB_TOKEN` 可用。

## Rollback

如果线上出现异常，可通过停止该 MCP server 或从客户端配置中移除 `new_note` 工具，回退到手工执行 `bin/new-note`。
