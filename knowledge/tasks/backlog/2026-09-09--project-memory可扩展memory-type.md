---
name: project-memory可扩展memory-type
description: project-memory 可扩展 memory type；如无必要勿增实体，可用目录+skill 新增 type，未必需要单独 JSON
metadata:
  edges-type: task
  edges-title: project-memory 可扩展 memory type
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-11T09:50:00+08:00"
---

project-memory 需要支持自由扩展 memory type；示例可含 `docs`、`progress`、`tasks`、`research`、`reminder`、`scheduler` 等，由用户定义 name、description、metadata。约束：**如无必要，勿增实体**——可能不需要单独的 JSON 配置文件；提供某种在指定目录下新增 type 的 skill 即可。

**Why:**
memory type 不应写死在代码里，但也不必先上独立配置平面。目录约定 + skill 在指定路径落 type 定义/脚手架，足够扩展，又少一层配置源真相。

**How to apply:**
- 优先方案：指定目录（如 `.memory/` 下按 type 分夹或登记）+ skill「新增 type」（写入 name/description/metadata 约定文件并刷新索引）。
- 暂缓单独 JSON 总配置，除非 skill+目录证明不够用。
- 用 `tasks` / `docs` / `research` / `progress` / `reminder` / `scheduler` 等做示例验证。
