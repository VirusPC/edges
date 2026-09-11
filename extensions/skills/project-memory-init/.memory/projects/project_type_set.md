---
name: project_type_set
description: 当前类型及闸门；否掉 docs。入口顺序 user → feedback → project（兜底）→ reference。user 进仓且 gitignore；skill 接线已做。v1 不做晋升，不做 private 字段。
metadata:
  edges-title: 项目记忆的类型集合
  edges-type: project
  edges-origin-session-id: bc-76b9e05c-a544-4dad-adb8-bcc3ea821615
  edges-agent-client: cursor
  edges-username: Coding 专家
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-11T12:07:27+00:00"
---

可写类型是 `user` / `feedback` / `project` / `reference` / `skills`；`agent_skills` 只索引不写。不要加 `docs`。用户记忆是项目记忆类型，权威副本在仓库工作树内且 gitignore，按仓库路径绑定，布局与其他类型相同（`.memory/users/`、`USER.md`、`user_<slug>.md`）。本层入口清单顺序是 `user` → `feedback` → `project` → `reference`（`project` 兜底），然后才是 `skills` / `agent_skills`。skill 接线（init / remember `--type user`、备份/恢复）已做。`.memory/` 下类型目录用复数。

**Why:**

`type` 是**检索意图乘以寿命**，不是载体。`docs` 没有独立检索问题，也没有「不记什么」的闸门，会变成文档桶。闸门不能用已经写下的文件去放宽：`project` 引言已收「代码里推不出的决策」，`architecture.md` 撞的是命名不是定义；`reference` 里的 prior-art 全文是成型史料，正确反应是以后别再倒正文，不是改「不记链接内容」。

**这一条推翻了本条自己的旧结论「`skills` 只索引、remember 不写」。** 当时的理由是「`.memory/skills/` 空槽对不上 `extensions/skills/` 这个真源」——现在两个槽各有归属，理由不成立了：`skills` 收自动沉淀的流程，`agent_skills` 索引 `.agents/skills/` 里人写或装入的。分界是**谁有权改写**，不是「是不是可执行指令」。详见 [[project_skill_ownership_split]]。

**「不要把 `user` 放进仓库树」已被仓库根 `docs/adr/0003-user-memory-in-repo-gitignored.md`（ADR-0003）推翻。** 现行结论是仓内权威副本 + gitignore + 按仓绑定 + 与其他类型相同的复数目录布局。内容闸门从简（个人偏好、凭据与不得公开的材料）；gitignore 是凭据可以放这里的前提。v1 不做脱敏晋升到可提交类型。家目录当真源已被用户否决。其余（否掉 docs、既有闸门、skills 可写 / agent_skills 只索引）仍成立。`private` 条目元数据是另案，不在这次接线里做。

本层清单顺序是用户纠正：先更具体的 `user` / `feedback`，`project` 当兜底，再 `reference`。详见 [[feedback_agents_local_type_order]]。

**How to apply:**

- 问「该不该加类型」时三件齐才加：**独立检索问题、与现有类不同的失效方式、有「不记什么」的闸门**。既有类型的失效方式：user = 换机或删仓后本机个人材料丢了、或误把密钥写进可提交类型；feedback = 又踩同一个坑；project = 推翻已定决策；reference = 找不到源头；skills = 流程执行不出来；agent_skills = 装的东西发现不了。
- 文档按为什么再读它归类，并按清单顺序先排除更具体的：本仓不宜公开 → `user`；纠正与禁区 → `feedback`；外部指针 → `reference`；对不上再 → `project`（兜底）；**自动沉淀的可执行流程 → `skills`**；人写或装入的技能 → 放 `.agents/skills/`，由 `agent_skills` 索引；常驻指令 → `AGENTS.md` 正文。
- 不要改 `project` / `reference` 引言去迁就已有文件。
- 用户记忆的现行结论见 ADR-0003：仓内 `.memory/users/` + `USER.md` + `user_<slug>.md`，gitignore，不把家目录或 edges-private 当真源。Agent 读本机 `USER.md`。换机用 `$user-memory-backup` / `$user-memory-restore`。不要在 v1 设计晋升到可提交类型，也不要加 `private` 字段。
- `.memory/` 类型目录用复数（`users/` `feedbacks/` `projects/` `references/` `skills/`）；`--type`、索引文件名、条目前缀保持单数。`agent_skills` 没有 `.memory/` 下的目录——它的内容根在 `.agents/skills/`。
