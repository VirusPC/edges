---
name: memory_module_decoupled_pluggable_interface
description: 框架解耦：Memory 模块接口明确，可接入多种 Memory 实现
metadata:
  edges-type: task
  edges-title: Memory 模块解耦与可插拔接口
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-17T14:09:12.841Z"
  edges-task-project: project-memory
---

从框架角度：各组成部分要**解耦合**。尤其 Memory 系统——模块对外接口必须明确，并提供接入**各种 Memory 实现**的扩展能力（可插拔）。可扩展性是硬要求，不是锦上添花。

**Why:**
peng cheng：怕子系统缠死；Memory 若写死成「只有 filesystem project-memory 一种」，以后换/叠 Mem0、向量库、官方 LoCoMo 式检索、远端服务都要改核心。已 done 的「可扩展 memory type」是**同一套 project-memory 里加 type**；本条是**整块 Memory 后端可换、可并存**的接口层。脚手架/框架封装那条管壳与升级路径；本条管 Memory 能力面的边界与适配器契约。

**How to apply:**
- 细聊接口面：ask / remember / list / doctor（或等价）最小集合；输入输出与错误契约；与 CLI / Skill / MCP 如何共用同一接口。
- 明确「核心」vs「适配器」：filesystem project-memory 作默认实现之一，不是唯一实现。
- 扩展点：注册新后端、配置选用哪个后端（或组合）、迁移/并存策略。
- **交叉但不合并：**
  - done：`project-memory 可扩展 memory type`（type 层）
  - backlog：`edges 封装为脚手架+框架并定义升级路径`（壳与升级）
  - backlog：`明确 .memory 与 docs/ 边界`、`找公开 benchmark 证明 memory 有效性`
- 未指派。派发时默认先 grill-with-docs。
