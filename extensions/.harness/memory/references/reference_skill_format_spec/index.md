---
name: reference_skill_format_spec
description: SKILL.md 顶层字段是闭集（六个），但生态普遍不遵守；自定义数据该放 metadata 的真实理由是撞名而非被拒。写或改 skill 前查。
metadata:
  edges-title: Agent Skills 规范与生态实践的落差
  edges-type: reference
  edges-agent-client: claude-code
  edges-username: viruspc
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: "2026-09-07T17:39:46+08:00"
---

规范正文在 <https://agentskills.io/specification>，参考校验器是 [`skills-ref`](https://github.com/agentskills/agentskills/tree/main/skills-ref)（`skills-ref validate ./my-skill`）。客户端名录在 <https://agentskills.io/clients>。

要点（2026-09 核对）：

- **顶层字段闭集，只有六个**：`name`（必需）、`description`（必需）、`license`、`compatibility`、`metadata`、`allowed-tools`。
- `name`：1–64 字符，小写字母数字加连字符，不能首尾或连续连字符，**必须等于父目录名**。
- `metadata`：string → string 的映射。规范原文说这是给 clients 存「spec 未定义的额外属性」的地方，并建议键名加前缀避免冲突。
- 加载分三段：`name` + `description` 启动时全量加载（约 100 token），正文激活时才读，`scripts/` `references/` `assets/` 按需。
- 格式本身被广泛采纳：客户端名录 47 家，含 OpenAI（ChatGPT & Codex）、Google（Gemini CLI）、GitHub Copilot、VS Code、Cursor、JetBrains Junie、Amazon Kiro、Databricks、Snowflake、Mistral、字节 TRAE、Block Goose、Spring AI、Nous Research Hermes。由 Anthropic 开发后开放。

**但字段闭集在实践中不被遵守。** 本机 46 个来自不同作者的 skill 实测：18 个用顶层 `version`（不在六字段内），17 个用 `disable-model-invocation`、4 个用 `argument-hint`（Claude Code 的官方字段，同样不在六字段内），只有 7 个用 `metadata`。Claude Code 自己文档化了约 19 个顶层字段。本仓 `extensions/skills/` 的 11 个 skill 也全部带顶层 `version`。

**所以自定义数据放 `metadata` 的理由不是「顶层会被拒」，是撞名。** 运行时几乎没人拒；硬报错只出现在 Anthropic 的打包 / claude.ai 上传路径。真正的风险是 `version` / `title` / `author` 这类通用词哪天被某个 vendor 赋予语义——那时文件不报错，**行为静默改变**，比报错难查得多。`metadata` 是规范唯一承诺「clients 不解释其内容」的命名空间，代价为零。

`.agents/skills/`（项目级与家目录级）是这批 agent 共读的位置，但 **Claude Code 不在其中**——它读 `.claude/skills/`，桥接靠 per-skill 软链。官方只承诺 `<skill-name>` 条目可以是软链，整个 `skills/` 目录做软链未文档化。
