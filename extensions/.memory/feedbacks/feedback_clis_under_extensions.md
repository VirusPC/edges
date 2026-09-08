---
name: feedback_clis_under_extensions
description: 新增或移动面向 agent 的 CLI 时：放 extensions/clis，禁止仓库根 clis/。
metadata:
  edges-title: CLI 项目放 extensions/clis，不放仓库根
  edges-type: feedback
  edges-username: viruspc
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: "2026-09-08T15:28:25+08:00"
---

面向 agent 的 CLI 项目放 `extensions/clis/`，不要放仓库根目录 `clis/`。

**Why:** `extensions/` 才是对外接口层（和 mcp-servers、skills 并列）。2026-09-08 把 `clis/` 放在仓库根，用户纠正为「重新放到 extensions」。根目录会让人以为它和 `bin/` 一样是人用命令，也会让 ask 在 extensions 层找不到它。

**How to apply:** workspace 成员是 `extensions/clis`。文档、默认路径、ingest 入口都写 `extensions/clis`（包名仍是 `edges-cli`）。不要在仓库根再留一份 `clis/`。
