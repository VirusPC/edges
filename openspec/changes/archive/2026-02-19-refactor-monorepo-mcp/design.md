## Context

目前项目中有多个独立运行的服务端组件（如 `new-note` MCP server）和脚本工具（`bin/`）。这些组件目前是孤立的，缺乏统一的依赖管理、配置共享和启动调度机制。本设计旨在建立一个“服务端服务工作区”（Server-side Services Workspace），在保持现有目录结构不变的前提下，利用 `pnpm workspace` 实现环境隔离与统一管理。

## Goals / Non-Goals

**Goals:**
- 实现各服务端组件的依赖物理隔离。
- 提供统一的根目录入口来启动和管理所有服务。
- 建立共享的基础配置（如 TypeScript 基础配置）。
- 保持现有目录结构（`bin/`, `extensions/mcp-servers/`）不动。

**Non-Goals:**
- 不进行大规模的代码重构或迁移。
- 不修改现有的业务逻辑代码。
- 不强制将非 Node.js 脚本转化为包（除非需要依赖管理）。

## Decisions

### 1. 使用 pnpm workspace 作为基础设施
- **Rationale**: pnpm 拥有出色的 workspace 支持，能够高效处理多包依赖，且通过软链接机制实现完美的物理隔离。
- **Alternatives**: 
  - *npm workspaces*: 依赖处理效率较低，且隔离性不如 pnpm。
  - *Lerna*: 功能过于繁重，本项目目前不需要复杂的版本发布管理。

### 2. 原位初始化 (In-place Workspace)
- **Rationale**: 直接在根目录配置 `pnpm-workspace.yaml`，将 `bin/` 和 `extensions/mcp-servers/*` 加入工作区。
- **Benefit**: 无需移动文件，保留 Git 历史。

### 3. 根目录统一调度脚本
- **Rationale**: 在根目录 `package.json` 中使用 `pnpm --filter` 定义快捷启动命令。
- **Example**: `"start:note-server": "pnpm --filter new-note start"`。

### 4. 共享 tsconfig 继承体系
- **Rationale**: 根目录提供 `tsconfig.base.json`，各子服务通过 `extends` 继承。
- **Benefit**: 确保整个项目编译选项的一致性。

## Risks / Trade-offs

- **[Risk] 环境变量冲突** → **Mitigation**: 各服务仍保留各自的 `.env` 文件，并在启动脚本中明确切换工作目录或使用 `dotenv` 指定路径。
- **[Risk] 依赖膨胀** → **Mitigation**: 充分利用 pnpm 的内容可寻址存储，减少磁盘占用，并通过 `pnpm recursive install` 统一管理。
