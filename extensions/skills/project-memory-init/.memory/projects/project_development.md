---
name: project_development
title: Project Memory 系列 Skill 开发流程
description: 修改顺序：协议 → 布局 → init → 其他非 doctor skill → doctor。
type: project
username: viruspc
email: cheng.peng.helloworld@gmail.com
updatedAt: "2026-09-06T13:38:38+08:00"
---

# Project Memory 系列 Skill 开发流程

本文件规定 `project-memory-init`、`project-memory-ask`、`project-memory-remember`、`project-memory-reshape`、`project-memory-doctor` 及以后同系列 skill 的修改顺序。

```text
PROTOCOL.md
    ↓
LAYOUT.md
    ↓
project-memory-init
    ↓
其他受影响的非 doctor skill
    ↓
project-memory-doctor
```

箭头表示依赖与检查顺序，不表示每次必须改动全部五层。每一层都要按顺序检查；确认不受影响时可以不改，但不能跳到下游后再反过来定义上游。

## 1. 先定 `PROTOCOL.md`

先判断改动是否触及所有 project-memory skill 共同遵守的协议。涉及节点形状、读写语义或跨 skill 契约时，先更新 [`PROTOCOL.md`](../../references/PROTOCOL.md)；只是实现升级且不破协议时，明确保持协议不变。

完成判据：后续实现可以从协议推导，协议中没有混入具体文件名、区块标记或脚本结构等实现细节。

## 2. 再定 `LAYOUT.md`

把协议落实成目标布局：文件与目录、类型入口、区块标记、模板映射及其他由本实现拥有的约定都在 [`LAYOUT.md`](../../references/LAYOUT.md) 里先定清楚。

完成判据：它描述的是修改完成后的唯一目标态。若改动已发布产物的名字，同时登记 `project-memory-doctor` 需要承担的旧结构识别与迁移义务。

## 3. 修改 `project-memory-init`

按目标布局修改 `project-memory-init` 的 `SKILL.md`、模板、共享脚本和相关说明。系列共用的落盘实现与 CLI 都以这里为家；代码分层与修改入口见 [`scripts/OVERVIEW.md`](../../scripts/OVERVIEW.md)。

完成判据：新建产物符合 `LAYOUT.md`，重复执行保持幂等，对外 CLI 与输出能支撑下游 skill。

## 4. 修改其他受影响的非 doctor skill

依次检查 `project-memory-ask`、`project-memory-remember`、`project-memory-reshape` 及其他非 doctor 的同系列 skill。只修改实际受影响者；优先继续依赖 `PROTOCOL.md`、CLI `--help` 或落盘产物等自描述接口，不复制 `LAYOUT.md` 的实现细节。

完成判据：读、写及其他工作流能正确使用新实现，未受影响的 skill 没有为了表面同步而增加耦合。

## 5. 最后修改 `project-memory-doctor`

最后才修改 `project-memory-doctor`。此时协议、目标布局、生成端和其他消费方都已稳定，doctor 才能以最终状态为准补齐诊断、旧结构迁移和修复逻辑。

完成判据：doctor 能识别需要支持的旧状态，修复后收敛到 `LAYOUT.md`，再次检查没有同类 finding；既有正文与不归本套管理的内容保持不变。

## 收尾检查

- 核对 `PROTOCOL.md`、`LAYOUT.md`、模板、脚本与各 SKILL.md 没有相互矛盾。
- 搜索旧路径、旧名字和旧类型，区分应迁移的兼容代码与应清理的过期引用。
- 在临时目录验证 init、remember、ask 所依赖的产物，以及 doctor 的诊断、修复和二次运行幂等性。
- 如果修改了 skill 目录，按 [`extensions/skills/README.md`](../../../README.md) 的分发说明复核安装后的文件集合。
