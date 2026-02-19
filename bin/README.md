# Edges 基础设施 (bin/)

该目录存放 Edges 系统原生的维护与操作脚本。这些工具主要用于本地开发、系统配置以及自动化的内容管理。

## 核心脚本

- **`new-note`**: 主力笔记入库工具。支持“创建 PR”或“直接提交”模式（由 `EDGES_MODE` 环境变量控制，默认为 `direct`）。
- **`init-extensions`**: 接入初始化脚本。将 `extensions/skills/` 目录下的技能定义同步到各个 AI Agent 的配置目录（如 `.cursor/skills`, `.claude/skills` 等）。

## 开发建议

- 脚本应尽量保持 POSIX 兼容性。
- 严禁硬编码绝对路径，应使用 `$(dirname "$0")` 等方式动态获取仓库根目录。
- 增加新脚本后，请运行 `chmod +x` 并在此 README 中同步更新说明。
