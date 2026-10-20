---
status: accepted
---

# Compose 入口改为真实的 `.harness/compose/README.md`

2026-10-20 在 ADR 0042 的子模块底座之上改入口。问题：memory / skills / notes / projects 的入口都是 `.harness/<module>/README.md`，并由 `.harness/README.md` 链进来；Compose 仍是 `AGENTS.md` 上的区块，Domain 再用虚拟 id `<所属目录>/.compose/README.md` 挂一条边。模块形状不一致，后面要按模块加能力时 Compose 是特例。

**Status:** accepted（ADR 0043）

**See also:** ADR 0042（子模块底座；入口、虚拟节点、`--with-composed` 由本 ADR 取代）、ADR 0035（材料索引；「Compose 仍写在 AGENTS」由本 ADR 取代）

## Decision

1. **没有虚拟 ComposeNode。** 删掉运行时 id `<owner>/.compose/README.md`。Compose 的入口是磁盘上的 `<scope>/.harness/compose/README.md`。
2. **入口 README 用子类加能力。** `ComposeReadmeNode extends ReadmeNode`（`type` 仍是 `readme`）。它持有 `project-harness-compose` 区块、检出目录与只读挂载，并展开子节点。`models/readme/specialize.ts` 按路径选择子类。这是给别的模块入口留的扩展点，不是插件加载器；本 ADR 不引入插件系统。
3. **索引。** `.harness/README.md` 像链接 memory / skills / notes / projects 一样链接 `compose/README.md`。`AGENTS.md` 只留硬约束和指向 `.harness/README.md` 的指针，不再写 Compose 区块。
4. **子节点 id** 是被组合仓库的 `<checkout>/README.md`，不是 `AGENTS.md`。`compose/README.md` 里的 href 相对于 `.harness/compose/`（例如 `<name>/README.md`）。`--path` 仍是相对于 scope 目录的检出目录；写进区块的是该检出的 README，相对 `.harness/compose/`，避免路径叠成 `.harness/compose/.harness/compose/<name>`。
5. **默认展开。** Compose 与其他模块一样参与 traverse。系统根扫描默认进入 scope 自己的 `.harness/compose/`。被组合仓库自己的 `.harness/compose/` 一律不进入（不递归）。
6. **根级 `--exclude <modules>`。** 与 `--scope` 一样挂在程序上，逗号分隔，可重复。允许的名字：`compose`、`memory`、`skills`、`notes`、`projects`、`tasks`。未知名字直接报错。与 `--types` 正交。`--exclude compose` 同时跳过森林扫描和遍历。不提供 `--only`。删除 `--with-composed`。
7. **`compose add` / `list` / `update`** 读写 `compose/README.md`。文件或材料索引上的链接缺失时，由这三条命令建出来。日常只使用这三条。
8. **`edges compose doctor [--apply]`** 只做一次性迁移：把 `AGENTS.md` 的 Compose 区块搬进 `.harness/compose/README.md`，补上索引链接，改写 href，清掉 AGENTS 上的标记。默认只预览，`--apply` 才写。其它文档和测试里的 `--with-composed` 只报告、不改写；`.agents/skills/`、CHANGELOG 和 ADR 不列入。
9. **被组合的内容只读。** 不递归展开被组合仓库自己的 Compose。磁盘上的子模块路径仍是 `.harness/compose/<name>`。

## Considered Options

- **继续用虚拟节点，只把区块挪到 `.harness/README.md`：** 否决。材料 README 会同时当索引和 Compose 宿主，Compose 仍是特例。
- **保留 `--with-composed`：** 否决。默认就该展开；要关掉用 `--exclude compose`，和其他模块同一套开关。
- **再做一个 `--only`：** 否决。先有排除即可。
- **子节点 id 仍用 `AGENTS.md`：** 否决。每个模块的入口是 README；AGENTS 是系统入口，不是组合出来的那一面对外入口。
- **在本 ADR 里做插件加载器：** 否决。子类表够用，插件系统另说。

## Consequences

- 已有工作空间在升级后跑一次 `edges compose doctor --apply`。未迁移时，`add` / `list` / `update` 看不到还写在 `AGENTS.md` 上的旧区块。
- 公开的框架仓库不在 `compose/README.md` 里登记具体的个人仓库；示例用通用名字。
- ADR 0042 的子模块命令、相对 `--path`、逐条失败、不递归 `git submodule update` 仍然有效。
