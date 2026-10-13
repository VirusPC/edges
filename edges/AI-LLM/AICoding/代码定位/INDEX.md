# 代码定位

现有方案

+ Cline：AST（抽象语法树） + 正则检索
+ Copilot：生成关键词 + TreeSitter AST（抽象语法树）中的关键信息（类、方法名等）搜索
+ Cursor：Ripgrep 文本搜索 + 云端的向量化
+ Continue：基于 SQLite 的文本搜索 + LanceDB 本地向量化



分层架构

1. 第一层：wiki.md（deepwiki）
2. 第二层：codebase indexing（语义搜索）
3. 第三层：AST Treesitter



> 更新: 2025-08-10 12:23:17  
> 原文: <https://www.yuque.com/viruspc/el3mi0/qsy9yd2um9q8zctn>