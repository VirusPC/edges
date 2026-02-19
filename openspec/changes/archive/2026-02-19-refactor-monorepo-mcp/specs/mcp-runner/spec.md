## ADDED Requirements

### Requirement: 基于根目录的统一服务调度脚本
根目录的 `package.json` MUST 包含面向各服务的脚本指令，允许通过统一入口启动特定的服务端进程。

#### Scenario: 启动指定 MCP Server
- **WHEN** 运行 `pnpm start:note-server`
- **THEN** 系统执行 `pnpm --filter new-note start` 并启动对应的服务端进程

### Requirement: 简化的服务接入配置
每个 MCP server 目录 MUST 包含一个简洁的 `package.json`，定义其启动入口（如 `main` 或 `scripts.start`）。

#### Scenario: 新增服务接入
- **WHEN** 在 `extensions/mcp-servers/` 下新建目录并放置 `package.json`
- **THEN** 根目录无需大规模修改即可通过 pnpm filter 机制感知并调度该服务
