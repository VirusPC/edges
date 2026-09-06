---
name: project_important_block
title: 本层硬约束写在 AGENTS.md 区块里
description: 改 AGENTS.md 记忆形状、或决定一条规则该常驻还是进 .memory 时：不检索就会做错的规则直接写进 project-memory-important，不要另建记忆文件。
type: project
username: viruspc
email: cheng.peng.helloworld@gmail.com
updatedAt: "2026-09-06T20:20:06+08:00"
---

本层硬约束写在 `AGENTS.md` 的 `project-memory-important` 区块里，规则直接列出，不进 `.memory`、不做成索引行。init / doctor 只保证区块存在，不覆盖已有正文。

**Why:** 入口文件会被 harness 加载，硬约束必须不靠检索就生效。放进记忆文件等于多一跳，ask 按说明挑文件时可能打不开，等于没写。这是对协议「索引区块不含记忆内容」的定点例外，不是把任意记忆塞回入口。

**How to apply:** 写规则前先问「不打开 `.memory` 会不会做错」。会，就改该层硬约束区块正文（允许手改这一块）。不会，走 remember。不要在硬约束区块里放链接指向记忆文件。缺失区块交给 doctor 的 `missing-important`，不要整份重渲染入口。
