# MCP Servers

该目录用于放置多个 MCP server 实现，每个服务独立维护自己的代码与依赖。

本地、有 shell 的 agent **优先** [`../clis/`](../clis/) 的 `edges note …`，不必起 MCP 进程。本目录保留给没有 shell 的宿主。关系说明见 [`../.memory/projects/project_clis_from_mcp.md`](../.memory/projects/project_clis_from_mcp.md)。

## Servers

- `new-note/`: 无 shell 宿主的入库入口。子进程调用 `edges note`，与 CLI 同一套契约。

## Conventions

- 每个服务目录独立包含 `package.json`、`src/`、`test/`、`README.md`
- 在具体服务目录内执行 `npm install`、`npm run build`、`npm test`
