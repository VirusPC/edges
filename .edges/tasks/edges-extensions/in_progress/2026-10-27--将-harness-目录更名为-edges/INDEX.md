---
metadata:
  edges-type: task
  edges-task-project: edges-extensions
  edges-updated-at: '2026-10-27T02:24:55.386Z'
  edges-title: 将 .harness 目录更名为 .edges
  edges-tasks-status: in_progress
  edges-task-priority: urgent
name: 将_harness_目录更名为_edges
description: >-
  目录名从通用词 .harness 改为品牌名 .edges，统一
  CLI/npm/仓库/目录的品牌链路，并承载边际优势、项目的边、图论的边三层含义；本次为推广前定稿变更，改完冻结布局。
---

**背景：**
讨论项目推广价值时聊到材料目录命名：通用词 `.harness` 不带品牌，harness 对非母语者还有生僻比喻门槛。用户提出改为 `.edges`，既体现「积累边际优势（Edge）」，也能形象说明它是主项目的一条「边」。讨论中又补出第三层图论含义：作用域为节点、作用域之间的连接为边，递归与 Compose 都能收进这个词。此前已有多轮布局迁移，本次约定为推广前的定稿变更，改完冻结。
- 现状可核对：CLI、npm 包（`@viruspc/edges`）、仓库均为 edges 品牌；目录名从 `.harness` 改为 `.edges` 后与品牌链路一致。
- 约束：概念词 harness 保留——目录改名不改变「围绕目录维护的这套材料叫 harness」的定义。
- 预期收益：每个初始化的目录都成为品牌露出；目录名与内容物（Edge 的积累）同构；命名本身可作发布由头。
- 非目标：不借机调整模块结构或其他布局。一次性用户仓库迁移脚本不入库。
- 关联：同项目卡片「edges-封装为脚手架框架并定义升级路径」（布局迁移纪律）。

**目标：**
材料目录从 `.harness` 更名为 `.edges`，统一品牌链路；此后布局冻结，不再做同类变更。

**动作：**
- 硬切断，不留旧名别名（沿用命令改名先例）。
- 更新 CLI、随包 skills、文档中的路径与 `edges` / `edges-*` 标记；概念词 harness 保留。
- 删除 `edges memory migrate` 与随包技能 `project-memory-migrate`。
- 新增 ADR 0047，记录三层含义、硬切断与布局冻结。
- 迁移步骤写入 `docs/migrations/2026-10-27-rename-harness-to-edges.md`。外部仓库用文中的临时脚本改目录并改写路径与标记；脚本本身不入库。

**完成标准：**
- [x] 迁移说明入库，写明外部仓库用临时脚本（rename 目录 + 改写 `.harness` 路径与 `project-harness` 标记）。脚本不提交。本仓材料目录、标记、skills 与文档已改为 `.edges`。
- [ ] `edges init` 新初始化的目录生成 `.edges` 结构；`edges memory migrate` 已删除；相关测试通过。
- [x] ADR 0047 入库，包含更名三层含义、硬切断与「此后布局冻结」的明确承诺。
