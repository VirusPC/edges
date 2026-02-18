# MCP Servers

该目录用于放置多个 MCP server 实现，每个服务独立维护自己的代码与依赖。

## Servers

- `new-note/`: 接收外部 AI 总结并写入仓库（commit/push）

## Conventions

- 每个服务目录独立包含 `package.json`、`src/`、`test/`、`README.md`
- 在具体服务目录内执行 `npm install`、`npm run build`、`npm test`
- 公共脚本放在仓库根目录 `bin/`
