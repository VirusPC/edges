# 外部连接扩展 (extensions/)

`extensions/` 是 Edges 系统与外部世界（AI Agent、IDE 客户端、第三方系统）通信的**接口层**。

这里的代码不是用来开发 Edges 系统本身的，而是作为“连接器”，实现 **“终端捕获，核心沉淀”** 的设计思想：让 ChatGPT、Cursor、Claude Code 等终端生成的思考，能够通过标准协议（如 MCP）无缝流入核心资产库。

## 收录标准

判据是**「换一个 Agent、换一台机器，这东西还带得走吗」**，而不是「它是代码还是文档」。
纯 markdown 一样是 extension——一段能复用的 system prompt、一份开荒新机器的操作手册，与一个 MCP server 在这里地位相同。
反过来，只在当下有用、不可复用的总结属于 `knowledge/notes/`，不进这里。

## 目录结构

**协议与能力**

- **`mcp-servers/`**: [Model Context Protocol](https://modelcontextprotocol.io/) 服务器实现。提供标准化的 Tool 接口供 AI 客户端调用。
- **`skills/`**: 供外部 Agent 加载的技能定义（Prompt 模板、思维链规范）。执行 `./bin/install-skills` 分发到本机各 Agent 的全局配置目录。
- **`subagents/`**: 针对特定复杂任务预配置的子代理。
- **`tools/`**: 暴露给外部系统的独立工具或脚本适配器。

**可复用的操作资产**

- **`system-prompt/`**: 可复用的 system prompt 片段与模板，接入新 Agent 时直接取用。
- **`new-server/`**: 新机器 / 新服务的开荒手册（用户与权限、DNS 配置、第三方模型 key 接入等）。
- **`others/`**: 尚未归类的可复用片段，如存档的检索式。

**文档**

- **`docs/`**: 关于接口协议和接入指南的详细文档。

## 接入准则

1. **标准化**: 优先使用 MCP 协议暴露能力。
2. **文档化**: 每个子目录都应包含独立的 README，说明其调用协议和配置方法。
3. **解耦**: Extension 应当只依赖 `bin/` 脚本或标准的 `knowledge/` 路径，避免复杂的内部依赖。
4. **自包含**: 一个 extension 应当能被单独复制走。避免用 Obsidian wikilink 引用 `knowledge/resources/` 下的附件——链接在 vault 内能解析，但目录被带到别处时附件会丢失。
