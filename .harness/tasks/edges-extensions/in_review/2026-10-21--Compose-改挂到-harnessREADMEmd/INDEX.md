---
metadata:
  edges-type: task
  edges-task-project: edges-extensions
  edges-updated-at: '2026-10-20T18:10:06.088Z'
  edges-title: Compose 改挂到 .harness/README.md
  edges-tasks-status: in_review
  edges-task-priority: none
  edges-task-assignee: 全栈开发专家
name: Compose 改挂到 .harness/README.md
description: 每个模块一份入口 README。Compose 入口是 .harness/compose/README.md，不再是 AGENTS.md 上的特例。
---

**目标：**
保证 `.harness` 下不同模块架构的一致性，方便后续插件化。每个模块都有一份入口 README；Compose 不能再是特例。

**已锁定的决定：**

1. **不要虚拟 ComposeNode。** 去掉虚拟 id `<owner>/.compose/README.md`。Compose 的入口是真实文件 `<scope>/.harness/compose/README.md`。
2. **用继承做专用 README 节点。** 模块入口 README 可以子类化 README 节点来加能力。实现 `ComposeReadmeNode extends ReadmeNode`，负责组合区块标记（`project-harness-compose`）、挂载与只读，以及子节点展开。原先虚拟 ComposeNode 的行为收进这个节点。扩展点是通用的（不是只给 Compose 接的管子），以后别的模块可以同样做；本卡不做插件系统。
3. **索引。** `.harness/README.md` 像链接 memory / skills / notes / projects 一样链接 `compose/README.md`。`AGENTS.md` 只留硬约束和指向 `.harness/README.md` 的指针，不再写 Compose 区块。
4. **展开后的子节点 id** 是 `<composedDir>/README.md`（每个被组合仓库的入口 README），不是 `AGENTS.md`。`compose/README.md` 里的 href 相对于 `.harness/compose/`（例如 `<name>/README.md` 或 `<name>`），路径不能叠成两层。
5. **默认 traverse / 森林。** Compose 默认和其他模块一样展开、一样遍历；系统根 / 森林扫描默认不能跳过 `.harness/compose/`。
6. **根级 `--exclude <modules,...>`**，和 `--scope` 一样挂在程序上。去掉 `--with-composed`。允许的名字：`compose, memory, skills, notes, projects, tasks`；未知名字直接报错。与 `--types` 正交。`--exclude compose` 同时跳过森林扫描和遍历。不做 `--only`。
7. **`compose add` / `list` / `update`** 读写 `compose/README.md`。文件不存在时连同 `.harness/README.md` 上的链接一起建出来。
8. **迁移：** 一次性 `edges compose doctor [--apply]`。把 Compose 区块从 `AGENTS.md` 搬进 `.harness/compose/README.md`，补上索引链接，改写 href，清掉 AGENTS 上的组合标记，并更新提到 `--with-composed` 的文档和测试。默认只预览。日常表面仍是 add / list / update；doctor 只做迁移。
9. 被组合的内容保持只读；不递归 Compose；磁盘上的子模块路径仍是 `.harness/compose/<name>`。
10. 公开的框架仓库不点名个人或私有仓库（示例用通用名字）。
