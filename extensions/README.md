# 外部连接扩展 (extensions/)

`extensions/` 是 Edges 系统与外部世界（AI Agent、IDE 客户端、第三方系统）通信的**接口层**。

这里的代码不是用来开发 Edges 系统本身的，而是作为“连接器”，让外部工具能够理解并操作 Edges 知识库。

## 目录结构

- **`mcp-servers/`**: [Model Context Protocol](https://modelcontextprotocol.io/) 服务器实现。提供标准化的 Tool 接口供 AI 客户端调用。
- **`skills/`**: 供外部 Agent 加载的技能定义（Prompt 模板、思维链规范）。
- **`subagents/`**: 针对特定复杂任务预配置的子代理。
- **`tools/`**: 暴露给外部系统的独立工具或脚本适配器。
- **`docs/`**: 关于接口协议和接入指南的详细文档。

## 接入准则

1. **标准化**: 优先使用 MCP 协议暴露能力。
2. **文档化**: 每个子目录都应包含独立的 README，说明其调用协议和配置方法。
3. **解耦**: Extension 应当只依赖 `bin/` 脚本或标准的 `knowledge/` 路径，避免复杂的内部依赖。
