---
metadata:
  edges-type: task
  edges-task-project: edges-routines
  edges-updated-at: '2026-10-11T16:20:13.142Z'
  edges-title: Routines 模块：Skill 与调度文件分离
  edges-tasks-status: backlog
  edges-task-priority: none
name: routines_模块skill_与调度文件分离
description: 落地 routines 模块约定与最小示例：调度引用 Skill，也可同目录。
---
**背景：** 日复盘对话对比各家定时形态（产品内一体 / 单文件打包 / 半拆开 / 会话工具态）。决定默认拆开：目录下放最简调度文件，内容来自 Skills；也允许 Skill 与调度文件同目录。TypeScript 只分别描述各家，不合成共享类型。材料审阅 [PR #219](https://github.com/VirusPC/edges/pull/219)。非目标：不实现全平台调度运行时。routines 是模块，不是 projects/ 专项工作区。
**目标：** 落地 routines 模块约定与最小示例（调度引用 Skill / 可同目录）。
**动作：** 收束 PR #219 文稿到合适模块路径（若仍误放 projects/routines，迁到模块约定位置或注明过渡）；补最小示例；更新模块 README。
**完成标准：** 有 README+四形态对照；至少一套 schedule→Skill 示例；文档写明拆分原则且无 shared 合体类型。
