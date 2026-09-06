---
name: project_type_set
title: 项目记忆的类型集合
description: 当前四类是否够用；否掉 docs 与仓库内 user；.memory 类型目录改复数与 skills 对齐。
type: project
username: viruspc
email: cheng.peng.helloworld@gmail.com
updatedAt: "2026-09-06T14:08:14+08:00"
---

当前可写类型仍是 `feedback` / `project` / `reference`；`skills` 只索引、remember 不写。不要加 `docs`，也不要把 `user` 放进仓库树。`.memory/` 下类型目录改成复数，与 `skills/` 对齐。

**Why:**

`type` 是检索意图乘以寿命，不是载体。`docs` 没有独立检索问题，也没有「不记什么」的闸门，会变成文档桶。闸门不能用已经写下的文件去放宽：`project` 引言已收「代码里推不出的决策」，`architecture.md` 撞的是命名不是定义；`reference` 里的 prior-art 全文是成型史料，正确反应是以后别再倒正文，不是改「不记链接内容」。

`skills` 和另外三类机制上不重叠（记忆是证据，skill 是可执行指令）。会打架的是入口那句「操作流程与使用规范」，Ask 会为流程打开空的 `SKILLS.md`。更硬的冲突是 `.memory/skills/` 空槽对不上 `extensions/skills/` 这个仓库 skill 真源。

`.memory/` 里 `skills/` 已经是复数，另外三个目录还是单数，同一层命名不齐。目录改复数、类型标识保持单数：`--type feedbacks` 和 `FEEDBACKS.md` 英文别扭，也避免一次改名把所有索引文件和条目前缀一起带走。

Hermes 看起来把 skills 和 memory 当整体，实际是同一条学习环往两个格子写：`USER.md` / `MEMORY.md` 是有硬上限的便利贴，skills 是按需流程，session search 管「以前聊过」。官方口诀：便利贴进 memory，参考文档进 skill。它的 `user` 在 `~/.hermes/memories/`，跟人走。gitignore 只挡住推送，不改变「跨项目个人信息不属于仓库记忆」；按人拆 `user/*.md` 还要解决读哪份、索引泄密、文件名人名。类型一旦写进 `AGENTS.tmpl.md`，所有消费方仓库都会多一个入口。

**How to apply:**

- 问「该不该加类型」时三件齐才加：独立检索问题、与现有类不同的失效方式、有「不记什么」闸门。
- 文档按为什么再读它归类：决策 → `project`；指针（或无稳定出处时的蒸馏笔记）→ `reference`；可执行流程 → 标准 skill（本仓库在 `extensions/skills/`）；常驻指令 → `AGENTS.md` 正文。
- 不要改 `project` / `reference` 引言去迁就已有文件。
- 不要在 `.memory/user/` 按人建文件，也不要把 `user` 加进共享 LAYOUT。本机覆盖若真需要，单独一份且整份 ignore；跨项目偏好放 agent 家目录。
- `.memory/` 类型目录用复数：`feedbacks/`、`projects/`、`references/`、`skills/`。`--type`、索引文件名、条目前缀保持单数（`feedback` / `FEEDBACK.md` / `feedback_<slug>.md`），目录名不再等于 type 原值，由 LAYOUT 给出单数→复数映射。`skills` 的类型名本来就是复数，目录与类型同名，变成「目录一律复数」这条规则下的自然情况。`.memory/references/` 和 skill 根的 `references/`（PROTOCOL / LAYOUT / 模板）靠路径区分，不是同一个目录。这是 LAYOUT 变更，按开发流程改；doctor 要认旧的单数目录名并迁走。
