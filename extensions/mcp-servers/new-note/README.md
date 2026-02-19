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
- 健康检查端点: `http://localhost:3000/health`

**注意**: HTTP 模式需要配置认证令牌，并在请求中包含 `Authorization: Bearer <token>` 头部。

## Environment Variables

- `EDGES_REPO`: 目标仓库路径，默认当前仓库根目录（自动通过相对路径解析）
- `EDGES_BASE_BRANCH`: 基线分支，默认 `main`
- `EDGES_MODE`: (可选) 提交模式。
  - `direct` (默认): 直接在基线分支上提交并推送。
  - `pr`: 创建新分支并尝试建立 PR。
- `GITHUB_TOKEN`: (可选) GitHub 个人访问令牌。仅用于自动创建 PR；如果使用 `bin/new-note-direct` 或已配置 `gh` CLI，则不需要。

### HTTP 认证 (可选)

- `EDGES_AUTH_TOKEN`: HTTP API 认证令牌（仅用于 HTTP 模式）

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
    "GITHUB_TOKEN": "your_token_here (optional)"
  }
}
```

**提示**：如果 MCP Server 位于仓库的标准 `extensions/mcp-servers/new-note` 路径下，通常不需要设置 `EDGES_REPO`，它会自动识别。

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
  "url": "http://localhost:3000/new-note",
  "headers": {
    "Authorization": "Bearer your_auth_token_here"
  }
}
```

或者使用通用 HTTP 配置：

```json
{
  "type": "http",
  "url": "http://localhost:3000/new-note",
  "headers": {
    "Authorization": "Bearer your_auth_token_here"
  }
}
```

**HTTP 认证错误码：**
- `AUTH_MISSING`: 缺少 Authorization 头部
- `AUTH_INVALID_FORMAT`: Authorization 头部格式错误
- `AUTH_INVALID_TOKEN`: 无效的认证令牌

## Testing

```bash
npm test
```

## Troubleshooting

- 报 `SCRIPT_NOT_FOUND`：检查脚本是否存在于 `bin/new-note` 并具有执行权限。
- 报 `PUSH_AUTH_FAILED`：检查服务器上的 Git 凭据（SSH key / token）。
- 报 `GIT_FAILURE`：检查远程仓库可达性、分支权限和本地工作区状态。
- 无法自动建 PR：确认 `gh auth status` 或 `GITHUB_TOKEN` 可用。注意 `new-note-direct` 脚本不提供 PR 功能。

## Rollback

如果线上出现异常，可通过停止该 MCP server 或从客户端配置中移除 `new_note` 工具，回退到手工执行 `bin/new-note`。
