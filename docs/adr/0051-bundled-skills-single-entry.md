---
status: accepted
---

# 随包技能默认收成总入口 `edges`

2026-10-27 用户确认。`packages/skills/` 对外只留一个日常总入口，加上必须单独发现的少数技能。旧目录硬删除，不留别名，不写迁移说明。

**Status:** accepted（ADR 0051）

## Decision

1. **默认一个总入口。** 新建 `edges`（`0.1.0`）。正文只写各模块共用的 list / get / create / update / delete 形状。模块差异放在 `references/`。并入后删除这些目录：`edges-compose`、`edges-note`、`edges-routines`、`edges-tasks-classify`、`edges-memory-init`、`edges-memory-user-backup`、`edges-memory-user-restore`。

2. **记忆共享资源整棵搬家。** `edges-memory-init` 的 PROTOCOL、LAYOUT、模板、`AGENTS.md` 和维护记忆挪到 `packages/skills/edges/references/memory/`，目录之间的相对位置不变。CLI 读模板的三处路径跟着改。根 `AGENTS.md` 的硬约束仍写 `$edges-memory-ask` 与 `$edges-memory-remember`。

3. **例外才保留独立技能。** 同时满足「不必并进总入口」时才单独留着。判据是下面几条里的一条：

   - **必须单独触发。** 根硬约束每次动手前要点名的检索和沉淀：`edges-memory-ask`、`edges-memory-remember`。新增 Memory Type 也只在用户明确要求时触发，不能塞进 init：`edges-memory-add-type`。
   - **常手动触发。** 第一次接入会按名字打开：`edges-onboarding`。
   - **非常规，需要单独提示。** 不是 Edges 的日常 CRUD：把会话接到 Langfuse（`edges-langfuse-agent-tracing`），以及把对话整理成笔记或任务（`edges-conversation-to-notes`、`edges-conversation-to-tasks`）。
   - **互斥或独立版本节奏。** 上面这几份各自升版本。Langfuse 的四个表面（本机 Agent、Codex Cloud、Cursor Cloud、Grok Bot）收进 `edges-langfuse-agent-tracing/references/`，不再各发一个 skill。

4. **硬切断。** 不读被删的技能名，不留同名软链。旧 tag `skill/<旧名>@*` 留在当时的提交上。新 tag 是 `skill/edges@0.1.0`，被改到正文的保留技能另打补丁 tag。

## Considered Options

- **一模块一个 skill，继续按 compose / notes / routines 拆开：** 否决。发现面太碎，接入时要对着一长串名字选。
- **连 ask / remember 也并进 `edges`：** 否决。根硬约束要单独点名，不能先加载整份日常 CRUD。
- **留旧名软链一个版本：** 否决。与 ADR 0049 的硬切断一致。两套名字会让下一次调用继续写旧名。
- **先写 docs/migrations 再删目录：** 否决。这次没有要用户跑的转换命令。CHANGELOG 记过去向即可。

## Consequences

- 已安装的旧技能副本不会自动消失。需要重新 `edges skills init`。
- 本 ADR 不执行 npm 发布，也不移动或删除已有 tag。
- 使用方内容仓、workspace 与 bot 的 UpdateSkill 不在这次提交里。
