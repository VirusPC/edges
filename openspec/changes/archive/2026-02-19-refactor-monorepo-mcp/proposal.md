## 动机 (Why)

目前的系统包含多个独立运行的服务端组件（尤其是 MCP server）。这些服务目前缺乏统一的环境管理和启动机制。为了提升开发和运维效率，需要构建一个“服务端服务工作区”，在不改变现有代码结构的前提下，实现各服务的运行环境隔离，并提供统一的启动和管理入口。

## 变更内容 (What Changes)

- **服务工作区配置 (Services Workspace)**: 在根目录引入 `pnpm workspace`，将 `extensions/mcp-servers/*` 和 `bin/` 识别为独立的服务或工具单元，实现依赖的统一安装与物理隔离。
- **环境与依赖隔离**: 为每个独立服务（如各 MCP server）配置专属的 `package.json`，确保服务间的运行环境和依赖版本互不干扰。
- **统一服务启动管理**: 在根目录配置标准化的启动脚本，利用 pnpm 的过滤功能（`--filter`）实现一键启动特定服务，简化 MCP server 在不同客户端（如 Claude Desktop）中的接入成本。
- **共享配置基础设施**: 建立共享的 TypeScript 配置和环境变量模板，供各服务端组件引用，减少重复配置。

## 核心能力 (Capabilities)

### 新增能力
- `service-workspace`: 基础的 Workspace 架构，包含 `pnpm-workspace.yaml` 和根目录依赖管理配置。
- `mcp-launcher`: 基于根目录 `package.json` 的统一启动命令集，用于调度和管理 extensions 下的服务端进程。

### 修改能力
- `mcp-ingest-endpoint`: (轻量化重构) 为现有的 `new-note` server 补全标准的 package 配置，使其接入工作区管理体系，但不改变其核心业务逻辑。

## 影响面 (Impact)

- **工具链**: 从直接运行路径下的脚本切换为使用 `pnpm` 命令（例如 `pnpm --filter <service> start`）。
- **配置更新**: MCP server 的接入路径将更加标准化（通常指向各服务的 `dist` 或入口文件）。
- **开发流程**: 新增服务只需在相应目录下运行 `npm init` 即可快速接入系统。
