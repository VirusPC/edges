## 1. 基础架构配置 (Infrastructure)

- [x] 1.1 在根目录创建 `pnpm-workspace.yaml`，包含 `extensions/mcp-servers/*` 和 `bin/`
- [x] 1.2 在根目录初始化 `package.json`，声明为 private 模式
- [x] 1.3 在根目录创建 `tsconfig.base.json`，定义通用的编译器选项
- [x] 1.4 配置根目录的 `.gitignore` 以包含 workspace 相关的产物（如 `node_modules`）

## 2. 服务端组件接入 (Service Integration)

- [x] 2.1 为 `extensions/mcp-servers/new-note` 补全或更新 `package.json`
- [x] 2.2 使 `new-note` 的 `tsconfig.json` 继承自根目录的 `tsconfig.base.json`
- [x] 2.3 确保 `bin/` 目录下的相关工具脚本具有基础的 `package.json`（如适用）
- [x] 2.4 运行 `pnpm install` 验证依赖锁定和 workspace 链接是否正确

## 3. 统一调度脚本 (Orchestration)

- [x] 3.1 在根目录 `package.json` 中添加针对 `new-note` 的启动脚本（使用 `--filter`）
- [x] 3.2 实现通用的 `mcp-run` 或类似的快速启动命令
- [x] 3.3 验证从根目录一键启动 `new-note` MCP server 的功能

## 4. 文档与验证 (Validation)

- [x] 4.1 更新项目根目录的 `README.md`，说明新的 Monorepo 结构及启动方式
- [x] 4.2 验证各服务的独立依赖安装和物理隔离效果
