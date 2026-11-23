---
metadata:
  edges-type: task
  edges-updated-at: '2026-11-23T04:40:18.804Z'
  edges-title: 接入时提示客户端优先把记忆写入项目记忆
  edges-tasks-status: backlog
  edges-task-priority: none
name: 接入时提示客户端优先把记忆写入项目记忆
description: edges-onboarding 在接入时明确告诉客户端 agent：约定、偏好和事实优先写入项目记忆，客户端自带记忆只作次要索引。
---
**背景：**
2026-11-23，peng cheng 发现他的助手把一条长期约定先记在了助手自身的记忆里，而不是写进 Edges 仓库。他的规则是：所有 bot 和客户端 agent 要记住的约定、偏好和事实，必须优先写入 Edges 仓库的项目记忆（用 `$edges-memory-remember`）；助手自身记忆只作为次要索引。这次对话因此开出这张卡，只登记待办，不在本轮改 onboarding。
- 相关现状：`edges-onboarding` 负责给已有项目加 harness、创建独立 edges 仓库，以及把已有个人大脑接入当前客户端。接入时会初始化目标目录并生成 `AGENTS.md`。生成用的模板在 `packages/skills/edges/references/memory/references/templates/AGENTS.tmpl.md`。模板硬约束目前只要求提问或动手前用 `$edges-memory-ask`、沉淀用 `$edges-memory-remember`，没有写明优先写入项目记忆、客户端自带记忆只作次要索引。onboarding 的接入说明里也没有这条优先级。
- 预期收益：新接入的客户端 agent 第一次读到接入说明或生成的 `AGENTS.md` 时，就按这条优先级记约定，长期约定留在仓库的项目记忆里，助手自身记忆只保留索引。
- 非目标：不改 `edges-memory-ask`、`edges-memory-remember`、`edges-memory-add-type` 的协议、布局和落库命令。不要求关掉或替换客户端自带记忆。
- 关联：同属 Edges Extensions 的兄弟卡「讲清仓库本身当 edges 作用域场景」也改 onboarding 文案，讲的是整仓当材料根，还是在别人的项目里挂一块 edges。Agent Clients UX 里的「个人大脑跨客户端与工作空间接入指南」讲怎么把已有大脑接到客户端。「系统可跟项目或挂用户目录」讲用户目录与仓内同构，不讲这条优先级。

**目标：**
Edges 框架的 onboarding（`edges-onboarding` skill，以及接入流程和它生成的 `AGENTS.md` 模板）在接入时明确告诉客户端 agent：要记住的约定、偏好和事实优先写入项目记忆，客户端自带记忆只作次要索引。

**完成标准：**
- [ ] onboarding 的产出或接入说明里能读到这条提示：优先把记忆写入项目记忆（`$edges-memory-remember`），客户端自带记忆只作次要索引。
- [ ] 新接入仓库生成的 `AGENTS.md` 硬约束里能看到同一条提示。
- [ ] 这条提示与已有 `edges-memory-ask`、`edges-memory-remember`、`edges-memory-add-type` 的说明不冲突。
