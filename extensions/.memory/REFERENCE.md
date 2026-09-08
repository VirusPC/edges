# REFERENCE — 外部引用

> 记：项目之外的信息去哪找，例如需求文档、设计稿、接口文档、监控面板、工单系统，以及各自的用途。
> 不记：链接里的内容本身，也不记密钥。
> 本文件只是索引，条目区块由脚本重算，正文写在 `references/reference_<slug>.md` 里。

<!-- project-memory-entries:start -->
- [面向 agent 的 CLI 怎么设计](references/reference_agent_oriented_cli.md) — 设计或评审给 agent 用的 CLI 时查：AXI vs raw CLI vs MCP、--help、非交互、stdout/stderr、退出码、结构化错误码，及 AXI/Scalekit/clig.dev/gh --json/checklist 来源。
- [Agent Skills 规范与生态实践的落差](references/reference_skill_format_spec.md) — SKILL.md 顶层字段是闭集（六个），但生态普遍不遵守；自定义数据该放 metadata 的真实理由是撞名而非被拒。写或改 skill 前查。
<!-- project-memory-entries:end -->
