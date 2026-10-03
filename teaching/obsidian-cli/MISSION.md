# Mission: Obsidian CLI — 让 AI Agent 接入笔记库

## Why
让 ZCode / Claude Code 等命令行 AI Agent 能直接读写我的 Obsidian 知识库（读笔记、搜索、追加任务、改属性），把笔记库变成 Agent 可操作的一等公民，而不是靠手工复制粘贴。

## Success looks like
- 终端里 `obsidian read / search / append / property:set` 全部跑通
- 在一个 ZCode 会话里让 Agent 完成一次「搜笔记 → 读内容 → 追加一条待办」的闭环
- 能判断哪些场景该用 CLI、哪些场景直接改 markdown 文件更合适

## Constraints
- macOS（arm64），Obsidian 当前装的是 1.11.7，需升级到 1.12.4+
- 免费用户（CLI 正式版已免费）
- CLI 依赖 Obsidian 桌面应用保持运行

## Out of scope
- Obsidian 插件开发（dev:* / plugin:* 命令族）
- Sync / Publish 等付费云服务
