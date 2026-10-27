---
name: feedback_verify_before_asserting
description: 汇报仓库、git 历史或工具行为的事实时：先跑验证命令，别把推断说成查过的。工具输出的显示形态不等于文件内容。
metadata:
  edges-title: 断言仓库事实前先跑能证伪它的命令
  edges-type: feedback
  edges-agent-client: claude-code
  edges-username: viruspc
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: "2026-09-07T21:43:47+08:00"
---

说「仓库里有/没有 X」「工具会/不会做 Y」之前，先跑那条能证伪它的命令。推断没查证就标明是推断，别和查过的混在同一个语气里。

**Why:**

2026-09-07 那轮设计讨论里连续三次踩中，每次都是用户顶回来才去查的，而每次验证成本都只有一条命令：

1. grep 输出把 `.agents` 渲染成了 `n`（`~/.agents/skills` 显示成 `~/n/skills`，`from nodes.agents import` 显示成 `from nodesn import`），我据此断言「仓库里没有 `.agents` 引用」。文件里实际有 6 处。
2. 断言嵌套 `.agents/` 会被 `npx skills` **必然**误命中，没读扫描代码。实际 priority 扫描根只在 `searchPath` 一层展开，嵌套层只有零结果兜底才碰得到。
3. 拿 commit message 反推意图，说那条软链「相对路径写错了」。实际建链时目标真实存在，是 13 分钟后另一个 commit 把目录清空了。

第 2 条当时是否掉整个方案的核心论据。如果没被追问，它会直接进设计决策、并被写进项目记忆当成依据——**错误结论一旦沉淀，后面就没人会回头审计它了**。

**How to apply:**

- 汇报仓库或工具的事实前，先跑验证：文件内容用 `grep -c` / `wc` 复核计数，别只看渲染结果；工具行为读它的源码或 `--help`，别从文档措辞外推。
- **grep / 工具输出里字符串莫名变短或变形时，先怀疑渲染层**，用另一种方式复核同一处。
- **commit message 是意图，不是事实。** 要判断当时的状态就查当时的树（`git ls-tree -r <sha> -- <path>`、`git show <sha> --stat`），别从 message 反推。
- 「必然」「一定」「从来没有」这类词出口前，问一句「我跑过哪条命令」。答不上来就改成「我推测」，或者先去跑。
