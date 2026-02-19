## ADDED Requirements

### Requirement: 使用 pnpm workspace 构建服务工作区
仓库 MUST 使用 `pnpm` 并在根目录配置 `pnpm-workspace.yaml`，包含 `extensions/mcp-servers/*` 和 `bin/` 路径，将其声明为独立的服务单元。

#### Scenario: 服务目录扫描
- **WHEN** 运行 `pnpm recursive list`
- **THEN** 系统能正确识别并列出所有 MCP server 目录作为独立包

### Requirement: 共享的 TypeScript 基础配置
根目录 MUST 提供 `tsconfig.base.json`。所有服务端组件（如 MCP servers）MUST 继承此配置，以确保编译目标和模块解析规则一致。

#### Scenario: 继承配置编译
- **WHEN** 在任一 MCP server 目录下运行 `tsc`
- **THEN** 编译成功并遵循全局定义的 strict 等规则

### Requirement: 统一的依赖锁定机制
所有服务端组件 MUST 共享根目录的 `pnpm-lock.yaml`，以减少磁盘占用并确保开发环境依赖的一致性。

#### Scenario: 添加新依赖
- **WHEN** 在某个 server 目录运行 `pnpm add <pkg>`
- **THEN** 根目录 lockfile 自动更新，且不影响其他服务的依赖版本
