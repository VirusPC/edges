---
name: edges-langfuse-agent-tracing
description: >-
  当用户要把任意编码 Agent 或 Grok Bot 的会话接到 Langfuse 时先加载本 skill：
  它只选表面，真正的安装步骤在四份子 skill 里。不要在本 skill 里装插件、改配置或写密钥。
version: 0.1.0
---

# Langfuse Agent 追踪 · 主入口

选错表面时，子 skill 会指回本入口。本 skill 不装插件、不改配置、不写密钥。

## 何时用

用户要把会话接到 Langfuse，但还没确定是本机桌面 Agent、Codex Cloud、Cursor Cloud，还是 Grok Bot 导出。已经确定表面时，直接加载对应子 skill，不要在这里重复安装步骤。

## 选哪份

| 表面 | 加载 |
|---|---|
| 本机 Codex / Cursor / Claude Code / OpenCode / Pi | [edges-langfuse-local-agent-tracing](../edges-langfuse-local-agent-tracing/SKILL.md) |
| Codex Cloud（chatgpt.com/codex） | [edges-langfuse-codex-cloud-tracing](../edges-langfuse-codex-cloud-tracing/SKILL.md) |
| Cursor Cloud Agents | [edges-langfuse-cursor-cloud-tracing](../edges-langfuse-cursor-cloud-tracing/SKILL.md) |
| Grok Bot 助手会话导出 | [edges-langfuse-grokbot-tracing](../edges-langfuse-grokbot-tracing/SKILL.md) |
