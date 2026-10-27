---
status: accepted
---

# 材料目录更名为 `.edges`

2026-10-27 用户确认 html-plan 后拍板。CLI、npm 包 `@viruspc/edges` 与仓库名已经是 edges。材料目录此前叫 `.harness`。推广前把目录名收进同一条品牌链路，并就此停住。

**Status:** accepted（ADR 0047）

**See also:** ADR 0035（`.edges/README.md` 是材料索引）、ADR 0041（评测与观测已不在材料目录）

## 名字的三层意思

三层同时成立，不互相替代：

1. **品牌 Edge。** 目录里沉淀的是还能继续用的优势，和产品名 Edges 对齐。每个初始化过的目录都露出这个名字。
2. **项目的边。** 材料挂在项目旁边，不替代项目正文。`.edges/` 是这条边，`.edges/README.md` 是材料索引。
3. **图论的边。** 作用域是节点，作用域之间的连接是边。递归的下层入口，以及 Compose 进来的仓库，都走这条边。

概念词 harness 保留。Project Harness 仍指系统二落在 `AGENTS.md` 上的写法：本层硬约束、本层系统维护信息、下层系统维护信息。改的是路径和标记，不是这套材料的定义。

## Decision

1. **目录硬切断。** 材料目录只叫 `.edges`。运行时不读 `.harness`，不留别名、软链或双读。
2. **标记硬切断。** 层标记从 `project-harness` / `project-harness-*` 改为 `edges` / `edges-*`，去掉 `project-` 前缀。包括外层、`constraints`、`local`、`descendants`、`compose`。不双读旧标记。`project-memory-*` 与 `project-entries-*` 保持原名。这一句后来由 [ADR 0049](0049-edges-skills-markers-rename.md) 取代：这两类标记也改成 `edges-*`，并且不双读。
3. **删除 `edges memory migrate`。** 不保留改指向 `.edges/memory` 的版本。命令、随包技能 `project-memory-migrate` 一并删除。仍停在 `.memory` 的，用 `@viruspc/edges@0.2.7` 的 `edges memory migrate` 完成那次迁移，再按迁移说明改目录名。
4. **布局冻结。** 这次之后不再为改名或同类搬家调整材料目录。不借这次更名改模块结构、命令划分或类型集合。
5. **框架仓直接改。** 本仓用 `git mv` 与文本改写落到新布局。一次性的外部仓库迁移脚本不入库。步骤写在 [迁移说明](../migrations/2026-10-27-rename-harness-to-edges.md)。
6. **内部配置文件改名。** `harness-materials.json` / `harness-materials.ts` 改为 `edges-materials.json` / `edges-materials.ts`。这是实现文件名，不是用户可见目录。

## Considered Options

- **留旧路径别名或双读：** 否决。与命令改名的硬切断一致。两套名字会让下一次布局讨论继续发生。
- **把 `edges memory migrate` 改到新目录：** 否决。那条命令只服务已经结束的 `.memory` 布局。新目录不是它的目标。
- **顺手调整模块结构：** 否决。本次只改名。

## Consequences

- `@viruspc/edges@0.3.0` 起，`edges init` 写出 `.edges/`。旧目录不会被当成材料目录。
- 外部仓库按迁移说明自行改名。本仓不提供可执行迁移脚本。
- 本仓更早的 changelog 与迁移说明已改成现行目录名和标记名。读那些旧条目时，当时的目录名是 `.harness`，层标记前缀是 `project-harness`。
- 随包 skill 按各自 changelog 升版本。已安装的旧副本仍会写出旧路径，需要重新安装。
