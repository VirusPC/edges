---
metadata:
  edges-type: task
  edges-task-project: edges-cli-platform
  edges-updated-at: '2026-10-07T18:36:08.320Z'
  edges-title: 补充统一的 edges init 标准命令（根入口），域 init 只调同一 init service
  edges-tasks-status: backlog
  edges-task-priority: none
name: edges-unified-init
description: >-
  init 是与 list/get/create 同级的标准命令族，并拥有根命令 `edges init`。各 `edges <domain> init`（如
  `edges memory init`）是同族域入口，只委托同一 init service 初始化具体模块。NodeService
  提供底层能力；service 薄封装；commands 直接调 service。
---
**背景：**
2026-10-08 在 notes/skills CRUD 收口与 commands node 下沉 service 的叠层工作中，用户要求另开卡：补充 `edges init` 作为统一初始化入口；现有/后续的 `edges memory init` 及其他 `edges xxx init` 不应各自堆逻辑，只调用 init service 去初始化具体模块。分层约束与当前解耦方向一致：NodeService 提供底层能力，service 层薄封装，commands 直接调 service。本卡正交于进行中的「commands node→service」叠层（#186 后续）。用户随后补充：`init` 是标准命令族（与 list/get/create 等同级的标准命令概念），并且拥有根命令 `edges init`；各 `edges <domain> init`（如 `edges memory init`）是同族的域入口，委托同一 init service，不各自堆逻辑。
- 相关现状：已有/规划根 harness 材料与 projects/notes CLI（#184/#186）；memory 等模块可能已有独立 init 语义，需收束到统一入口。
- 非目标：本卡不顺带实现 projects CLI 全套；不改 NodeService 核心合同以外的大重构。
- 关联：全栈开发专家转述用户 2026-10-08；兄弟卡 notes/skills CRUD→NodeService、projects CLI + harness init、commands node 下沉 service

**目标：**
`init` 作为与 list/get/create 同级的标准命令族存在：根命令 `edges init` 可用，各域入口 `edges <domain> init` 仅适配参数并调用同一 init service。初始化底层经 NodeService，commands 不承载业务编排。

**动作：**
- grill-with-docs：划清统一 init 与模块 init 的职责、默认材料集合、与 harness-materials 关系，并钉死根命令与域入口同属 init 标准命令族
- 实现/收敛 init service + commands 薄适配
- 测试与文档；经 PR 合入

**完成标准：**
- [ ] 根命令 `edges init` 可用，能按约定初始化根/模块 harness 材料
- [ ] `edges memory init` 及其他 `edges <domain> init` 与根命令同属 init 标准命令族，只调用同一 init service（无重复业务堆在 commands）
- [ ] NodeService 为底层能力；service 薄封装；commands 直调 service
- [ ] 相关测试通过；经 PR 合入 main
