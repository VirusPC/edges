---
metadata:
  edges-type: task
  edges-task-project: edges-routines
  edges-updated-at: '2026-10-11T16:30:14.772Z'
  edges-title: Routines 模块：Skill 与调度文件分离
  edges-tasks-status: backlog
  edges-task-priority: none
name: routines_模块skill_与调度文件分离
description: 落地 routines 模块约定与最小示例：调度引用 Skill，也可同目录。
---
**背景：** 日复盘对话对比各家定时形态（产品内一体 / 单文件打包 / 半拆开 / 会话工具态）。决定默认拆开：目录下放最简调度文件，内容来自 Skills；也允许 Skill 与调度文件同目录。TypeScript 只分别描述各家，不合成共享类型。调研与工作材料已随已合并的 [PR #219](https://github.com/VirusPC/edges/pull/219) 落在 [`projects/routines/`](https://github.com/VirusPC/edges/tree/main/projects/routines)：[README](https://github.com/VirusPC/edges/blob/main/projects/routines/README.md) 与 [`2026-10-11--跨平台定义调研.md`](https://github.com/VirusPC/edges/blob/main/projects/routines/2026-10-11--跨平台定义调研.md)。非目标：不实现全平台调度运行时。routines 是模块；[`projects/routines/`](https://github.com/VirusPC/edges/tree/main/projects/routines) 是相关 Project 的调研与底稿，模块本身不等于这份 projects/ 材料。
**目标：** 落地 routines 模块约定与最小示例（调度引用 Skill / 可同目录）。
**动作：** 以 [`projects/routines/`](https://github.com/VirusPC/edges/tree/main/projects/routines) 为当前调研与底稿。下一步写模块约定，并补最少一套 schedule→Skill 示例。产品模块的落点路径仍待定，本卡不新开顶层目录。
**完成标准：** 有 README+四形态对照；至少一套 schedule→Skill 示例；文档写明拆分原则且无 shared 合体类型。
