## Why

当前外部 AI 可以产出 `notes/skill.md` 风格的总结，但缺少一个标准化入口将内容安全、稳定地写入远程仓库并完成版本流转。现在需要通过 MCP server 把“接收内容 -> 生成文件 -> commit/push”串成可重复流程，减少手工操作与流程断点。

## What Changes

- 新增一个远程 MCP server 能力（落地在 `extensions/mcp-servers/ingest`），用于接收外部 AI 传入的总结内容与元数据。
- 实现技术栈明确为 TypeScript + Node.js，作为 MCP server 的唯一服务端实现语言。
- MCP 工具名统一为 `new_note`，作为外部调用入口。
- 定义 ingest 行为：校验输入、生成目标文件、调用仓库内可复用脚本（优先评估 `bin/new-note`）执行 commit 与 push。
- 约束 Git 提交流程：统一分支命名、提交信息与 co-author 透传，确保自动化输出可审计。
- 明确失败处理与返回结果：对校验失败、git 失败、push 失败返回结构化错误，成功时返回产物路径与分支信息。

## Capabilities

### New Capabilities
- `mcp-ingest-endpoint`: 提供 MCP server 接口，接收外部 AI 生成的总结内容并触发入库流程。
- `git-automation-for-ingest`: 在 TypeScript + Node.js 服务内规范 ingest 的文件落盘、commit/push 执行与结果回传行为（含对现有 `bin/` 脚本的复用策略）。

### Modified Capabilities
- None.

## Impact

- Affected code: `extensions/mcp-servers/ingest` 下的 TypeScript MCP server 实现代码、命令执行与参数校验模块、可能的 `bin/new-note` 兼容性调整。
- Affected systems: 远程 Git 仓库、CI/PR 工作流（若自动创建 PR 则涉及 GitHub API/gh CLI）。
- Dependencies: Node.js 运行时、Git 可执行环境、远程仓库凭据（SSH key 或 token）、可选 `gh`/`curl`/`python3`（仅当复用现有脚本时）。
