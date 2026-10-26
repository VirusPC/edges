---
metadata:
  edges-type: task
  edges-task-project: evaluation
  edges-updated-at: '2026-10-26T16:09:18.226Z'
  edges-title: 评测 Skill：迁移 Langfuse 接入 Agent 的 skills
  edges-tasks-status: done
  edges-task-priority: none
name: 评测_skill收集用户数据并产生_dataset
description: >-
  把 brain 中现成的 Langfuse 接入 skills 迁入框架 packages/skills，整理为主入口 + 四份子 skill，随
  @viruspc/edges 分发。
---

**背景：**
母卡「框架附带可接入评测能力」拆出的第二张子卡。对话约定：Skill 收集用户数据并产生 Dataset；Webhook + 实验程序再用 Dataset 跑实验。两条解耦，本卡只覆盖 Skill → Dataset。
- 非目标：不实现 Webhook、不实现具体实验 runner（见兄弟卡）。
- 关联：母卡 `2026-10-25--框架附带可接入评测能力含-Experiment-Webhook-适配层`；兄弟卡「评测实验程序 + Experiment Webhook」。

**目标：**
把已有的 Langfuse 接入 Agent 的 skills 从 brain 迁入框架，整理成主入口 + 四份子 skill，随 `@viruspc/edges` 分发。接入方装好后，能把自己 Agent / Grok Bot 的会话接进 Langfuse，作为后续 Dataset 与实验的数据来源。从 trace 生成 Dataset 不在本卡。

**动作：**
- 新建 `packages/skills/langfuse-agent-tracing/`（主入口，只做路由）。
- 把 brain `shared-extensions/skills/langfuse-agent-tracing` 迁为 `packages/skills/langfuse-local-agent-tracing/`。
- 把 `codex-cloud-langfuse-tracing` 迁为 `langfuse-codex-cloud-tracing/`；把 `cursor-cloud-langfuse-tracing`（含 `templates/`）迁为 `langfuse-cursor-cloud-tracing/`。
- 新建 `packages/skills/langfuse-grokbot-tracing/`（本卡默认：可触发的大纲；源见 brain `projects/routines/grokbot-langfuse-export/SKILL.md`）。
- 子 skill 互相与主入口用相对链接；选错表面时指回主入口。去掉实例域名、brain 相对路径、box 路径。
- 五份各加 `version: 0.1.0` 与 `CHANGELOG.md`；改 `packages/skills/README.md`；跑 `pnpm skills:link`。
- brain 另开 PR 删除旧三份副本，shared-extensions 升 5.0.0 并记 Removed。

**完成标准：**
- [x] `pnpm skills:link --check` 通过；五条软链存在。
- [x] 临时目录跑 `edges skills init`，五份 skill 与源目录 `diff` 一致。
- [x] `rg 'viruspc\.tech|/workspace/|/home/box/|projects/routines' packages/skills/langfuse-*-tracing` 无结果（GitHub 链接除外）。
- [x] brain `shared-extensions/skills/` 中没有旧三份目录。
- [x] 打 tag `skill/<name>@0.1.0` 五条。
