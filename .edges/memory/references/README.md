<!-- project-memory-type:start -->
name: reference
module: memory
writable: true
gitignore: false
format: ordinary
<!-- project-memory-type:end -->

# REFERENCE — 外部引用

> 记：项目之外的信息去哪找，例如需求文档、设计稿、接口文档、监控面板、工单系统，以及各自的用途。
> 不记：链接里的内容本身，也不记密钥。
> 本文件只是索引，条目区块由脚本重算，正文写在 `references/reference_<slug>/index.md` 里。

<!-- project-entries-local:start -->
## 本层内容

- [bin/CLI/Skill 经典项目对照](reference_bin_cli_skill_classic_projects/INDEX.md) — 对照 gh、AXI、Agent Skills 规范、superpowers：何时查「要不要仓根 bin/、Skill 调谁」。经典项目示范 CLI+Skill 形状；Edges 能力面仍是 CLI+Skill+MCP 并列。本仓现状是 CLI 内 TS git + Skill 说明 + MCP spawn edges notes。
- [Multica CLI（Issue/Run）对照链接](reference_multica_cli_tasks_reference/INDEX.md) — 设计 edges tasks CLI 时对照 Multica：https://multica.ai/docs/cli ；指南 https://github.com/multica-ai/multica/blob/main/CLI\_AND\_DAEMON.md ；skill https://github.com/multica-ai/multica-cli ；runs PR https://github.com/multica-ai/multica/pull/314
- [面向 agent 的 CLI 怎么设计](<reference_agent_oriented_cli/INDEX.md>) — 设计或评审给 agent 用的 CLI 时查：AXI vs raw CLI vs MCP、\-\-help、非交互、stdout/stderr、退出码、结构化错误码，及 AXI/Scalekit/clig.dev/gh \-\-json/checklist 来源。
- [Agent Skills 规范与生态实践的落差](<reference_skill_format_spec/INDEX.md>) — SKILL.md 顶层字段是闭集（六个），但生态普遍不遵守；自定义数据该放 metadata 的真实理由是撞名而非被拒。写或改 skill 前查。
<!-- project-entries-local:end -->
