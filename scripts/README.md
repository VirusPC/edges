# scripts/

项目自身的**维护脚本**目录。区别于 `bin/`（用户/Agent 反复调用的命令）。

## 何时放这里

满足以下任一条件：

- **一次性或低频**：setup、release、migration、cleanup、seed data 等
- **只对仓库开发者有意义**：用户不需要直接调
- **不应进 `$PATH`**：污染用户命令空间

## 何时**不**放这里

- 用户/Agent 装好之后**天天会用**的命令 → `bin/`
- 跟外部系统/MCP 协议相关的代码 → `extensions/`
- 纯 Node 包、可被 pnpm 链接的 → `extensions/mcp-servers/<name>/`

## 命名与权限

- 文件无后缀（如 `setup`、`release`），与 `bin/new-note` 保持风格一致
- 顶部必须有 shebang（`#!/usr/bin/env bash` / `node` / `python3` 等）
- 必须 `chmod +x`

## 暴露方式

每个脚本必须在 `package.json` 的 `scripts` 字段中注册一个对应入口，用户/Agent 通过 `pnpm <name>` 调用，而不是直接路径。这样：

- 路径变动不破坏调用方
- `pnpm <name>` 可以在所有工作目录运行（不依赖 cwd）
- 集中可见，便于审计

## 当前清单

| 脚本 | 入口 | 作用 |
|---|---|---|
| `setup` | `pnpm setup` | 首次接入初始化：把 `bin/` 加入 PATH、加载 `.env` |
