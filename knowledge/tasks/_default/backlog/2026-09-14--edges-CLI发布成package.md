---
name: publish_edges_cli_as_package
description: 把 edges CLI 发布成 package，可安装而不是只在仓里跑
metadata:
  edges-type: task
  edges-title: edges CLI 发布成 package
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-14T14:42:00+08:00"
---

把 edges CLI 发布成 package，让人能安装使用，而不是只能在仓库里跑。

**Why:**
CLI 已经是能力面入口（Commander、tasks 子命令已落地），但还绑在仓内。发成 package 之后，其它机器和 Agent 才能 `npx`/`npm i` 用同一套契约。这和「CLI/MCP 鉴权」「project-memory 脚本迁到 edges CLI」都相关，但本条只做发布/分发。

**How to apply:**
- 细聊包名、scope、registry（npm 公有还是 GitHub Packages）、版本与 CI 发布。
- 对齐能力面：package 暴露的是 `edges` CLI，不是再加仓根 `bin/`。
- 鉴权、脚本迁移不夹进本条。
- 未指派。派发时默认先 grill-with-docs。
