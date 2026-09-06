---
name: project-memory-reshape
description: 把已有 AGENTS.md 按 project-memory-init 的形状重新组织：硬约束写进入口对应区块，区块外只留身份与指针，长规范进 important 或 README，记忆内容抽到 .memory，其余受管区块只留索引。用户要求整理、改造、迁移、重组已有 AGENTS.md 时使用；init/doctor 不改正文，不要用它们代替本 skill。
version: 1.3.0
---

# Project Memory Reshape

把一份**已经存在**的 `AGENTS.md` 收成 init 要求的形状：硬约束写在入口的对应区块里，其它受管区块是索引，区块外只留身份与指向真理源的指针，长规范进 important 或 README，记忆正文在 `.memory/` 条目里。

只在用户明确要求重组这份文件时运行。形状见 [`PROTOCOL.md`](../project-memory-init/references/PROTOCOL.md)；落盘细节认 `$project-memory-init` 的 CLI 与产物，不要手写记忆文件、也不要手改受管区块。

下文的 `<init-dir>` 指同级的 `project-memory-init` skill 目录。

## 什么时候用

- 用户要把已有 `AGENTS.md` 改成这套记忆入口的形状。
- 文件里混着常驻指令、决策、纠正、外部链接，需要拆开。

## 什么时候不用

- 目录还没有 `AGENTS.md`，只是要启用记忆 → `$project-memory-init`。
- 正文已经分好，只是索引/区块不一致 → `$project-memory-doctor`。
- 沉淀一条新结论 → `$project-memory-remember`。
- 检索 → `$project-memory-ask`。

## 正文怎么拆

可检索的记忆内容不要塞进索引区块。不检索就会做错事的规则写进本层硬约束区块，直接列出，不要链到 `.memory`。每一段只进一处：

| 去哪 | 收什么 |
| --- | --- |
| 写进本层硬约束区块 | ask / remember 聚光灯（点名即可，不写用法）+ 该目录不检索就会做错的仓规。不要写 init / doctor / reshape，不要把 README 长规范搬进来 |
| 留在 `AGENTS.md` 区块外 | 标题、一两句身份、指向唯一真理源的指针（例如「目录约定看 README」）。不要把长规范留在这里 |
| 抽到 `.memory` | 按 `$project-memory-remember` 的闸门：纠正与禁止 → `feedback`；代码/git 推不出的决策 → `project`；外部资料去哪找 → `reference` |
| 删掉 | 与 README 或其他真理源重复的结构说明、能从代码推出来的架构与路径、过期进度、一次性流程。可执行流程该是 skill，不要在这里新造一份 |

同一条事实不要既留在正文又写成记忆。常驻需要的留正文、不 remember；按需才看的抽走、从正文删掉。拿不准就留正文、不抽——错误的记忆条目以后会被检索出来当真。

一次只处理用户点名的那一份 `AGENTS.md`（单目录，和 init 一样）。不要顺着下层链接整棵树改。

## 步骤

1. 确认目标目录存在且已有 `AGENTS.md`。没有这份文件就停，改走 `$project-memory-init`。
2. **结构先就位。** 用户要求 reshape 这份文件，视为同时同意对该目录 Init。没有 `.memory/` 就跑 `$project-memory-init`；它返回 `needs-doctor` 时先跑 `$project-memory-doctor --apply`（只补挂区块），再 init。Ask / Remember / Doctor 仍然不得代为 Init。
3. 只读受管区块**之外**的正文，按上一节分类，列出计划：留 / 抽（`type` + `slug` + 一句 description）/ 删。已有同主题记忆就复用 slug 走更新。
4. 把计划讲给用户。得到同意后再改。用户已经把「重组这份 AGENTS.md」连同范围说清楚了，仍要先列出拆分再动手。
5. 抽取走 `$project-memory-remember`，参数见 `python3 <init-dir>/scripts/memory.py remember --help`。
6. 改 `AGENTS.md` 时：硬约束写进对应区块正文；**其它受管区块不要手写索引行**，交给 init / remember / doctor 刷新。别的工具的受管块（标记名不是 `project-memory`）原样保留。
7. 跑一次 doctor（先诊断）。有结构 finding 再请用户确认后 `--apply`。汇报：留下了哪些常驻段落、新建/更新了哪些记忆、删了什么。

## 规则

- 默认先计划后改，和 doctor 一样。这会改人写的正文、并往 git 里写记忆。
- 不发明布局，不绕开脚本往 `.memory/feedbacks/` 等目录丢文件。
- 不要把 README 抄进 `AGENTS.md`。目录与业务约定指向仓库里已有的真理源。
- 不要为了「整齐」把硬约束抽进 `.memory`——抽走后必须靠检索才能看见，等于没写。
