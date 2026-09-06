---
name: project_new_note_ingest
title: new-note MCP 的 ingest 约束
description: 改 new-note 或新增 MCP ingest 时要遵守的编排、校验、git 失败处理和未完成项。
type: project
username: viruspc
email: cheng.peng.helloworld@gmail.com
updatedAt: "2026-09-06T16:53:25+08:00"
---

`new-note` MCP 的约束是：TypeScript + Node.js 编排，git 操作交给 `bin/new-note`，失败即停，返回机器可解析结果。不要改成 Python server，也不要在 TS 里直接拼 shell 跑 git。

**Why:** 2026-02-19 的 ingest 变更把「外部 AI 写入仓库」做成 MCP 工具 `new_note`。当时排除了 Python server（与后续 Node 生态不一致）和纯 TS git（首期成本高）。脚本适配能复用已有 CLI，参数数组调用避免注入。

**How to apply:**
- 工具入参必填 `title`、`content`、`coAuthor`；缺字段或超长直接校验失败，不启动 git。
- 顺序：校验 → 落盘 → commit/push；任一步失败不得继续。
- spawn/execFile 用参数数组，禁止 shell 字符串拼接。
- commit 必须带 ingest 标题上下文和 co-author trailer。
- push 成功但 PR 依赖不可用时，ingest 仍算成功，PR 状态标不可用。
- 尚未做完：并发分支冲突策略、启动时 git/凭据/gh 预检查、校验与失败路径的单元/集成测试。
