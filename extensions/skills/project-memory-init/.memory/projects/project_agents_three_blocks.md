---
name: project_agents_three_blocks
title: AGENTS.md 入口只留三类：硬约束、本层索引、下层索引
description: 改 AGENTS.md 记忆形状、增减受管区块、或决定区块外留什么时：只保留 important / local / children；不要独立 auto 区块；时机纪律写进硬约束种子；区块外只留身份与指针。
type: project
username: viruspc
email: cheng.peng.helloworld@gmail.com
updatedAt: "2026-09-06T21:12:00+08:00"
---

`AGENTS.md` 作为记忆入口只含三类：本层硬约束、本层记忆索引、下层记忆索引（没有下层则整块不出现）。不要独立的 `project-memory-auto` 区块。检索与沉淀时机写进硬约束种子。区块外只留标题、身份和指向真理源的指针，长规范进 important 或 README。

**Why:** 协议写的就是这三类。独立 auto 是第四块，和协议打架，又把 skill 纪律抄一份。时机句仍要常驻（根 `AGENTS.md` 无条件加载，否则 agent 想不起 ask/remember），所以并进 important 种子，不另开区块。外层靠 important + local 撑着。根入口曾经把隐私、git、目录说明堆在区块外，和「硬约束写在 important」打架，也和 README 抢真理源。

**How to apply:** 改 LAYOUT / 模板 / 脚本时不要再生成或补上 auto；旧文件交给 doctor 的 `stale-auto` 删除。硬约束写什么见 `project_important_block`。reshape 一份已有入口时：区块外压到身份与指针，不检索就会做错的进 important，和 README 重复的删掉。翻案过程见 `project_design_decisions` 里 2026-09-06「撤销独立 auto」那节，不要把论证再抄进 LAYOUT。
