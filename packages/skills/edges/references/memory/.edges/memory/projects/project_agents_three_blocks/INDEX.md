---
name: project_agents_three_blocks
description: >-
  改 AGENTS.md 记忆形状、增减受管区块、或决定区块外留什么时：只保留 constraints / local / descendants；不要独立
  auto 区块；全层硬约束种子是 ask/remember 聚光灯加「写在本区块」；Git 根另有一条 checkout
  隔离种子，不进下层，也不覆盖已有手写约束；区块外只留身份与指针。
metadata:
  edges-title: AGENTS.md 入口只留三类：硬约束、本层组成、下层节点
  edges-type: project
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-11-14T12:03:06+00:00'
  edges-origin-session-id: bc-d3325c66-e723-5aeb-b10f-e4ad1200b100
  edges-agent-client: cursor
---

`AGENTS.md` 作为层入口只含三类：本层硬约束、本层组成、下层节点（没有下层则整块不出现）。表面标记是 `edges` / `edges-constraints` / `edges-local` / `edges-descendants`。运行时不读 `project-memory`、`project-memory-important`、`project-memory-local`、`project-memory-children`。不要独立的 `project-memory-auto` 区块；迁移仍会剥掉这段旧区块，运行时不认它。全层硬约束种子仍是两句：ask / remember 聚光灯，以及「硬约束写在本区块，不要通过记忆正文链接代替」。Git 根系统入口在这两句之外另有一条 checkout 隔离种子，写在模板 `<!-- git-root-constraint -->` 的下一行：只在新建该入口、硬约束区块缺失，或区块仍只是这两句（可含 `edges init --super` 追加的独立仓提示）时写入。下层入口不写。已有手写约束、改过的种子句子和空的硬约束区块不改写。各层其他仓规手写追加。区块外只留标题、身份和指向真理源的指针。

**Why:** 协议写的就是这三类。独立 auto 是第四块，和协议打架。ask / remember 必须常驻点名，否则会淹在海量 skill 里；点名即可，不写用法、不编排 init。硬约束写什么见 `project_important_block`。三章名称服务于 Project Harness，不是 Project Memory 目录。checkout 隔离约束管的是整个 Git 仓库，所以只放在 Git 根那一份系统入口；每层各抄一份会在下层重复，刷新时也不该盖掉手写仓规。

**How to apply:** 改 LAYOUT / 模板 / 脚本时只写 `edges` / `edges-*`。不要生成 auto。已有硬约束正文不覆盖；Git 根上仍只是两句通用种子时，init 可以补上模板里的 checkout 隔离那一行，不要改写其他句子。不要把这一行抄进下层 `AGENTS.md`。区块外压到身份与指针，不检索就会做错的进 constraints 区块，和 README 重复的删掉。`project-memory-doctor` 与 `project-memory-reshape` 已删除，不要再调用。旧层注释用 `scripts/migrations/rewrite-project-harness-markers.mts` 改写后再解析。翻案过程见 `project_design_decisions`。
