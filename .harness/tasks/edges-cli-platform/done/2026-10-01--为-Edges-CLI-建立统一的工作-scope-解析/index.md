---
name: edges_cli_scope
description: 基于递归记忆模型，先解析本次工作 scope，再确定操作归属、适用上下文和读写位置，使共享 CLI 能力可服务不同作用域。
metadata:
  edges-type: task
  edges-title: 为 Edges CLI 建立统一的工作 scope 解析
  edges-tasks-status: done
  edges-task-project: edges-cli-platform
  edges-updated-at: "2026-10-03T09:02:30.239Z"
---

## 2026-10-03 完成记录

CLI 已在操作前统一解析工作 scope，区分目标作用域、Git 仓根与共享实现位置；Tasks 按 domain/maintenance 选板，聚合站点保留来源身份，Note/MCP 已适配目标选择。

集成构建、相关测试和整体审查通过；审查发现的类型归属与私有权限问题已修复并通过复审。实现与验证依据见[实施计划](../../../../../docs/superpowers/plans/2026-10-03-recursive-scope-layout.md)及[PR #161](https://github.com/VirusPC/edges/pull/161)。下文保留建卡时的背景与目标，其“当前”“尚未实现”等表述属于当时状态。

**背景：**

在讨论 Edges 的递归记忆模型、Tasks 与 harness 的关系时，用户进一步提出：CLI 应先确定本次工作的 scope，再展开具体操作，并要求把这项工作记录为任务。

讨论中的工作 scope 用于明确本次操作的归属、适用上下文及读写位置。同一套 CLI 能力应能服务不同作用域，能力安装位置与本次工作作用域需要分开；scope 可以显式指定或自动推断，不要求用户每次手动切换。具体交互与解析规则尚待细化。

已核查的现状（静态检查）：
- Note 与 Tasks 都通过 `loadConfig` 选仓：优先使用 `EDGES_REPO`，否则按 CLI 模块位置推导仓库根；当前没有从调用者目录逐层发现工作 scope 的统一机制。
- 当前没有全局 `--scope` 或 `--target-dir` 参数，也没有执行前统一解析工作作用域的阶段；不能将讨论中的目标描述为现有能力。
- Project Memory 已有独立的 `root-dir` / `target-dir` 选址方式，可作为相关设计参照；CLI 的最终接口尚未确定。

本任务承接“以递归记忆模型重构 Edges 目录架构”。scope 的表示方式、显式参数与自动推断的优先级、与 `EDGES_REPO` 的兼容、适用命令范围，以及上下文规则的落实方式，留待后续 grill-with-docs 细化；完成标准一并补充。

关联：[递归目录架构任务](../../../project-memory/done/2026-09-12--%E6%95%B4%E4%BB%93%E4%B8%8Ememory%E5%90%8C%E6%9E%84%E9%80%92%E5%BD%92%E8%9E%8D%E5%90%88/index.md)、[CLI 配置选址](../../../../../extensions/cli/src/utils/config.ts)、[Project Memory 选址](../../../../../extensions/skills/project-memory-init/scripts/lib/paths.py)。

**目标：**

为 Edges CLI 建立统一的工作作用域解析机制，在执行需要作用域的操作前，明确工作归属、适用上下文与读写位置，使共享 CLI 能力能够在递归记忆模型中的不同作用域下工作。
