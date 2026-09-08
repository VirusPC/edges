---
name: project_type_set
description: 当前五类及各自的闸门；skills 从只索引改为可写、新增只读的 agent_skills；否掉 docs 与仓库内 user。
metadata:
  edges-title: 项目记忆的类型集合
  edges-type: project
  edges-agent-client: claude-code
  edges-username: viruspc
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: "2026-09-07T17:38:56+08:00"
---

可写类型是 `feedback` / `project` / `reference` / `skills`；`agent_skills` 只索引不写。不要加 `docs`，也不要把 `user` 放进仓库树。`.memory/` 下类型目录用复数。

**Why:**

`type` 是**检索意图乘以寿命**，不是载体。`docs` 没有独立检索问题，也没有「不记什么」的闸门，会变成文档桶。闸门不能用已经写下的文件去放宽：`project` 引言已收「代码里推不出的决策」，`architecture.md` 撞的是命名不是定义；`reference` 里的 prior-art 全文是成型史料，正确反应是以后别再倒正文，不是改「不记链接内容」。

**这一条推翻了本条自己的旧结论「`skills` 只索引、remember 不写」。** 当时的理由是「`.memory/skills/` 空槽对不上 `extensions/skills/` 这个真源」——现在两个槽各有归属，理由不成立了：`skills` 收自动沉淀的流程，`agent_skills` 索引 `.agents/skills/` 里人写或装入的。分界是**谁有权改写**，不是「是不是可执行指令」。详见 [[project_skill_ownership_split]]。

`user` 仍不落盘：gitignore 只挡推送，不改变「跨项目个人信息不属于仓库记忆」；按人拆 `user/*.md` 还要解决读哪份、索引泄密、文件名人名。Hermes 的 `user` 在 `~/.hermes/memories/`，跟人走。类型一旦写进 `AGENTS.tmpl.md`，所有消费方仓库都会多一个入口。

**How to apply:**

- 问「该不该加类型」时三件齐才加：**独立检索问题、与现有类不同的失效方式、有「不记什么」闸门**。五类各自的失效方式：feedback = 又踩同一个坑；project = 推翻已定决策；reference = 找不到源头；skills = 流程执行不出来；agent_skills = 装的东西发现不了。
- 文档按为什么再读它归类：决策 → `project`；指针（或无稳定出处时的蒸馏笔记）→ `reference`；**自动沉淀的可执行流程 → `skills`**；人写或装入的技能 → 放 `.agents/skills/`，由 `agent_skills` 索引；常驻指令 → `AGENTS.md` 正文。
- 不要改 `project` / `reference` 引言去迁就已有文件。
- 不要在 `.memory/user/` 按人建文件。本机覆盖若真需要，单独一份且整份 ignore；跨项目偏好放 agent 家目录。
- `.memory/` 类型目录用复数（`feedbacks/` `projects/` `references/` `skills/`）；`--type`、索引文件名、条目前缀保持单数。`agent_skills` 没有 `.memory/` 下的目录——它的内容根在 `.agents/skills/`。
