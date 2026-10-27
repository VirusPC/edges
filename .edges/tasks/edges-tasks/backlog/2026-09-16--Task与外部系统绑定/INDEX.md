---
name: tasks_bind_external_systems
description: Task 可绑定外部需求系统（PingCode、Aone、GitHub Issues 等），需适配与自定义字段
metadata:
  edges-type: task
  edges-title: Task 与外部系统绑定（PingCode / Aone / GitHub 等）
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-17T14:09:12.962Z"
  edges-task-project: edges-tasks
---

edges 的 Task 应能与**外部需求/协作系统**绑定，例如 PingCode、Aone、GitHub Issues。各家需求管理模型不同，需要适配层；还会碰到自定义字段等差异。

**Why:**
peng cheng：仓内 Task 是真源时，外部系统仍是团队既有协作面；只绑 GitHub 不够（已有单独 backlog）。不同系统状态机、字段、层级、权限都不一样，硬同步会碎；要的是可绑定 + 可适配，而不是假定「一家字段全集」。

**How to apply:**
- 先定绑定模型：仓内 Task 真源 vs 外部展示/评审；单向投影还是有限双向；`edges-task-*` 里存外部 id / url / 系统名。
- 适配器按系统拆：PingCode、Aone、GitHub Issues（及以后扩展）；公共能力（建链、读状态、写回有限字段）vs 系统特有字段映射。
- 自定义字段：哪些进 frontmatter、哪些只镜像到外部、冲突时谁赢。
- **交叉但不合并：** backlog `2026-09-12--tasks机制与GitHub关联` 仍是 GitHub 专项；本条是多系统绑定与适配框架，GitHub 可作第一个适配器实例。
- 与「Memory 可插拔接口」同构思路（解耦 + 适配），但对象是 Task 外链，不并卡。
- 未指派。派发时默认先 grill-with-docs。
