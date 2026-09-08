---
name: feedback_interface_plans_in_memory
title: 接口层方案进 .memory，不进 docs
description: 写 extensions 层调研或技术方案时：进 .memory（reference/project），禁止放 extensions/docs 或 knowledge/projects，否则 ask 检索不到。
type: feedback
username: viruspc
email: cheng.peng.helloworld@gmail.com
updatedAt: "2026-09-08T14:24:29+08:00"
---

接口层的调研、技术方案、设计决策写入 `extensions/.memory`（reference / project），不要放 `extensions/docs` 或 `knowledge/projects`。

**Why:** `extensions/AGENTS.md` 只索引 `.memory` 五份入口。方案放进 `docs/` 后，下次 `$project-memory-ask` 会当这层没有这条记忆，重复调研或再选一遍 MCP vs CLI。`docs/` 是给人看的接入指南（怎么调、环境变量），不是决策的家。2026-09-07 把 clis 调研/技术方案初稿放到 `extensions/docs/` 被纠正。

**How to apply:**

- 写外部实践调研：`remember --type reference --target-dir extensions`。
- 写本层「为什么这样接」的决策：`remember --type project --target-dir extensions`。
- 必须走 `memory.py remember`，禁止手写 `.memory/` 文件。
- `extensions/docs/` 只留用法；最多在 README 指一句「设计见 `.memory`」。
