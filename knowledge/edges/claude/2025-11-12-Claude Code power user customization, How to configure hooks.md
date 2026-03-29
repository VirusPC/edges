这篇文章介绍了在 Claude Code 里使用 “hooks” 来自动化重复操作、实施项目规则和动态注入上下文，从而将 Claude 打造成高度定制的开发助手。[1]

## Hooks 是什么

- Hook 是在特定事件（如写文件、提交提示词、工具调用前后等）发生时自动执行的自定义 shell 命令，可以拦截、修改或阻止 Claude 的操作。[1]
- Hook 通过 JSON 配置在本地环境中运行，接收事件信息（如工具名、输入参数）并用退出码和标准输出/错误来决定允许、阻止或修改操作。[1]

## 使用 Hooks 的三个主要目的

- 自动化重复步骤：例如在文件写入后自动运行 Prettier，在频繁运行 npm test 时自动批准权限请求。[1]
- 自动执行项目规则：如在执行前拦截危险命令、校验文件路径、防止覆盖敏感配置等。[1]
- 自动注入上下文：如在会话开始或每次发送提示词时自动注入 git 状态、TODO 列表或当前迭代信息，让 Claude 始终了解项目背景。[1]

## 八种 Hook 类型及场景

- PreToolUse：工具真正执行前触发，可审查、阻止或修改即将执行的操作（如校验写文件路径、拦截危险 Bash）。[1]
- PermissionRequest：本应弹出权限对话框时触发，用于自动批准/拒绝特定命令（如自动批准 npm test）。[1]
- PostToolUse：工具成功执行后触发，可自动执行格式化、lint、审计日志或通知等操作。[1]
- PreCompact：对话上下文压缩前触发，用于备份完整日志、提取重要代码片段或记录里程碑。[1]
- SessionStart：会话开始或恢复时触发，将脚本输出直接注入上下文（如 git status 与 TODO 列表）。[1]
- Stop：Claude 回答结束准备等待下一条输入时触发，可检查任务是否完成并决定是否自动继续。[1]
- SubagentStop：子代理（Task 工具创建的子任务）结束时触发，用于校验子任务质量或触发后续动作。[1]
- UserPromptSubmit：用户提交提示词但 Claude 尚未处理时触发，用于在每次请求中动态追加 sprint 信息、日志或做提示词校验与过滤。[1]

## 配置位置与优先级

- Hook 配置保存在 JSON 设置文件：项目级 `.claude/settings.json`、用户级 `~/.claude/settings.json`、本地项目级 `.claude/settings.local.json`。[1]
- 项目级优先于用户级，企业还可以通过策略文件集中管理；同一位置也可同时配置权限规则和 hooks。[1]

## Matcher 语法

- matcher 用于筛选哪些工具会触发 PreToolUse、PostToolUse、PermissionRequest，支持精确匹配（如 "Write"）、管道多选（"Write|Edit"）、通配符（"*"）、以及带参数模式（如 "Bash(npm test*)"）。[1]  
- 匹配大小写敏感，MCP 工具可用类似 "mcp__memory__.*" 的模式。[1]

## Hook 输入输出与结构化决策

- 所有 hooks 都通过 stdin 接收 JSON，包括 session_id、transcript_path、cwd、hook_event_name 等，工具相关 hook 还会收到 tool_name、tool_input。[1]
- 通过退出码（0 成功、2 阻断错误）和可选的结构化 JSON（decision、reason、continue、updatedInput 等字段）来控制允许、阻止、修改或继续执行。[1]

## 执行环境与安全性

- Hooks 可以访问环境变量（如 CLAUDE_PROJECT_DIR、CLAUDE_CODE_REMOTE、CLAUDE_ENV_FILE 等）以及标准 shell 环境，默认超时 60 秒，可配置；多个匹配 hook 会并行执行且相同命令自动去重。[1]
- 因为 hooks 以用户权限执行任意命令，因此修改 hook 配置文件需要在 /hooks 菜单中显式审核，建议遵循输入校验、变量引用加引号、使用绝对路径、避免处理敏感文件等安全实践。[1]

## 调试与最佳实践

- Claude Code 会将会话与 hook 行为记录到 transcript 文件，每个 hook 都会收到 transcript_path，可用 SessionStart hook 记录日志路径并配合 tail 与 jq 实时查看。[1]
- 可以通过封装脚本（如 log-wrapper.sh）记录 hook 输入、事件类型、工具名和退出码，以便定位为什么某次操作被批准或阻止。[1]

## 如何开始构建自己的 Hooks

- 建议从一个解决真实摩擦点的简单 hook 入手，例如 PostToolUse 自动格式化文件，因为反馈最直观易调试。[1]
- 在此基础上逐步扩展更多规则与自动化，并参考官方 hooks 文档获取字段与高级模式，实现让 Claude Code 适应你的工作流，而不是你去适应工具。[1]

来源
[1] Claude Code power user customization: How to configure hooks | Claude https://claude.com/blog/how-to-configure-hooks
