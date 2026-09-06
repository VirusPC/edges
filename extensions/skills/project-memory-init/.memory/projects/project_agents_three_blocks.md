---
name: project_agents_three_blocks
title: AGENTS.md 入口只留三类：硬约束、本层索引、下层索引
description: 改 AGENTS.md 记忆形状、增减受管区块、或决定区块外留什么时：只保留 important / local / children；不要独立 auto 区块；硬约束种子是 ask/remember 聚光灯加「写在本区块」；区块外只留身份与指针。
type: project
username: viruspc
email: cheng.peng.helloworld@gmail.com
updatedAt: "2026-09-06T21:51:03+08:00"
---

`AGENTS.md` 作为记忆入口只含三类：本层硬约束、本层记忆索引、下层记忆索引（没有下层则整块不出现）。不要独立的 `project-memory-auto` 区块。硬约束种子只有两句：ask / remember 聚光灯，以及「硬约束写在本区块、不要链到 `.memory`」。各层仓规手写追加。区块外只留标题、身份和指向真理源的指针。

**Why:** 协议写的就是这三类。独立 auto 是第四块，和协议打架。ask / remember 必须常驻点名，否则会淹在海量 skill 里；点名即可，不写用法、不编排 init / doctor / reshape。硬约束写什么见 `project_important_block`。

**How to apply:** 改 LAYOUT / 模板 / 脚本时不要再生成或补上 auto；旧文件交给 doctor 的 `stale-auto` 删除。种子改了只影响新建和 `missing-important`；已有硬约束正文不覆盖，存量入口手改。reshape 一份已有入口时：区块外压到身份与指针，不检索就会做错的进 important，和 README 重复的删掉。翻案过程见 `project_design_decisions`。
