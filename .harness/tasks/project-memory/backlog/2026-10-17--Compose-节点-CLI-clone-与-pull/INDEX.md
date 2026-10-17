---
metadata:
  edges-type: task
  edges-task-project: project-memory
  edges-updated-at: '2026-10-17T14:20:00.000Z'
  edges-title: Compose 节点 CLI：clone 与 pull
  edges-tasks-status: backlog
  edges-task-priority: none
name: Compose_节点_CLI_clone_与_pull
description: >-
  ADR 0034 第十一轮：Compose 要改 Domain（节点模型）、Service（clone/pull/push/登记/traverse）和
  CLI；traverse 须沿 Compose 边跨仓；CLI 至少 clone 与 pull，并需 push（兼容各仓既有
  git 流程）。本轮确认 clone/pull/push/traverse；完整操作列表其余仍在 grill；字段形态与
  clone 位置另议。
---
**背景：**
ADR 0034 第十一轮修订（2026-10-17）在第十轮基础上补充：traverse 须沿 Compose 边跨仓（不是只走同仓子节点）；CLI / Service 还要对组合仓支持 push，且兼容各仓既有 git 流程。实现不能只加 CLI——Domain、Service、CLI 三层都要动。最小 CLI 面仍是 clone 与 pull；本轮确认的操作是 clone / pull / push / traverse，完整列表其余仍在 grill。
- Decision #10：Compose 需要 Domain、Service、CLI 三层一起改；traverse 须沿 Compose 边跨仓；CLI 至少支持 clone 与 pull，并需 push（兼容现有流程）。
- Domain：Compose 节点模型。
- Service：clone / pull / push / 登记 / traverse（traverse 沿 Compose 边跨仓）。
- CLI：把上述能力暴露出来；已确认最小面是 clone 与 pull；另需 push。
- 仍另议 / 仍在 grill：完整操作列表（本轮只确认 clone / pull / push / traverse）；入口条目的字段形态；clone 放在哪（如 `~/.harness/` 下或用户自选目录）。
- 关联：[ADR 0034](<../../../../../docs/adr/0034-compose-harness-repos-into-workspace.md>)（Decision #3、#10、Consequences）；PR #260。

**目标：**
按 ADR 0034 Decision #10，把 Compose 接到 Domain → Service → CLI：先落地节点模型与 clone/pull/push 服务及沿 Compose 边跨仓的 traverse，再在 CLI 上暴露至少 clone 与 pull，并对组合仓支持 push（兼容各仓既有 git 流程），使登记仓库能拉到本机、保持更新、并按现有流程推回。

**完成标准：**
- [ ] Domain 有 Compose 节点模型，能表示 Compose block 挂上的本地入口。
- [ ] Service 能 clone（登记仓库 → 本机路径）、pull（更新已有 clone）与 push（组合仓，兼容各仓既有 git 流程）；登记 / traverse 与节点模型接通，且 traverse 须沿 Compose 边跨仓（完整操作列表未定时，不把未确认的 op 当完成条件）。
- [ ] CLI 至少暴露 clone 与 pull，并对组合仓支持 push；路径策略可先用临时约定，最终 clone 位置另议。
- [ ] 入口条目字段形态未定时，实现不依赖未定字段的最终形状。
- [ ] 未实现项与用法说明回写 ADR 0034 Consequences / 相关文档，并与任务卡状态一致。
