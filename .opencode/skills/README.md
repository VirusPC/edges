# Skills (extensions/skills/)

本目录存放供外部 AI Agent（如 Cursor, Claude Desktop, Gemini CLI）加载的技能定义。

这些技能通常以 Markdown 或配置文件形式存在，定义了 Agent 应该如何处理特定任务（如“如何根据 notes 生成 edge”）。

执行仓库根目录的 `./bin/init-extensions` 可以将这些技能同步到对应的 Agent 配置目录。
