---
name: project_new_note_ingest
description: >-
  改 new-note MCP 时：title/body 与 project/super 透传 CLI，服务器控制 scope，NodeService
  校验路径；只本地创建，不恢复旧 content/coAuthor/Git ingest。
metadata:
  edges-title: new-note MCP 的本地存储与材料选择
  edges-type: project
  edges-origin-session-id: bc-03ac82e9-5695-53af-997c-26a0853b2428
  edges-agent-client: cursor
  edges-username: VirusPC
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-11-02T13:23:20+08:00'
---

`new-note` MCP 由 TypeScript + Node.js 编排，只通过参数数组启动 Edges CLI 创建本地 Note。材料定位与 Project 校验由 CLI / NodeService 负责，MCP 不另造目录逻辑，不提交、推送或开 PR。

**Why:** CLI、Skill、MCP 是并列能力入口；无 shell 宿主也应保留同样的材料归属和写入边界。早期 ingest 的 content/coAuthor 和自动 Git 流程已退役，不能作为现行参数恢复。

**How to apply:**
- 工具必填 title，可选 body、project、super；scope 由服务器配置或启动目录归属决定，不由工具请求覆盖。
- project 是相对 scope/.edges/projects 的已有 Project 路径，支持 P/projects/Q，并优先于 super；未指定 Project 时默认 scope/.edges/notes，显式 super 使用 scope/notes。all 不用于创建。
- 顺序为输入校验 → execFile 启动 CLI notes create → 解析 JSON。路径、类型与权限校验复用 CLI；失败即返回错误，不另找目录落盘。
- execFile 使用参数数组，禁止 shell 字符串拼接；子进程环境删除 EDGES_AUTH_TOKEN。
- 保留进程边界，不 in-process import CLI、不找已删除的仓根 bin 脚本。
