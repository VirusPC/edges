---
metadata:
  edges-type: task
  edges-task-project: edges-cli-platform
  edges-updated-at: '2026-10-07T18:56:23.795Z'
  edges-title: 解耦 CLI commands 与 Service
  edges-tasks-status: done
  edges-task-priority: none
name: commands-service-decoupling
description: 明确命令适配与完整业务用例的边界，移除 Service 对 CLI 上下文的依赖，整理审阅页与 Artifacts 编排。
---

**背景：**

在完成统一节点、共享 Service 和模型目录整理后，我们检查了“commands 是否已经只调用 Service”。实际情况是：部分 Task/Memory 命令已较薄，但命令适配、业务流程和基础工具仍有错位。用户提出应做好解耦，随后决定先整理 Model；Model 重构和三层架构 README 已完成，现在把 commands 与 Service 的后续重构单独记录，避免把它误报为已实现。

已核对的现状：
- `services/tasks/result.ts` 依赖 CliContext/CliResult，既构造命令运行环境，也写命令结果和退出码。
- `commands/tasks/project/review-page.ts` 仍串联读取输入、校验、加载模板、渲染、选输出路径和写 HTML 的完整流程。
- `commands/artifacts/server/ops.ts` 等文件承载服务安装、构建和部署逻辑；Artifacts 的 HTTP、文件收集及配置职责也需按实际边界复核。
- `utils/exit.ts` 依赖业务错误类型，说明通用工具与命令适配尚未完全区分。

本任务是职责解耦，不是要求所有 command 变成一行调用，也不为每个 helper 新增一层 Service。Model 单节点行为、operations 集合操作与现有节点持久化机制保持原边界。

关联：[Domain 架构](../../../../../extensions/cli/src/domain/README.md)、[模型整理验收](../../../../../docs/superpowers/plans/2026-10-06-model-module-organization.md)。

**目标：**

让 commands 专注命令协议适配，Service 对外提供可脱离 Commander/CliContext 调用的完整用例；明确 Service 之间及其与 domain、utils 的依赖方向，在保持 CLI 行为的前提下减少错位职责和重复编排。

**动作：**

- 以已核对的 Tasks 结果适配、review-page 流程、Artifacts 业务/部署流程及退出码映射为起点，盘点命令与 Service 的真实依赖；先明确请求、结果、错误与配置输入的边界，再实施。
- 将 CliContext、stdout/stderr、退出码与命令运行环境适配放回命令边界；业务错误保持为业务可表达的结果或异常，不把 CLI 输出对象传入领域层。
- 让业务 Service 承担完整用例编排，保留 commands 必要的参数与 stdin 适配；继续复用 NodeService、现有 domain 与基础原语。
- Artifacts 的业务与部署逻辑按职责归位，不机械地为每个辅助函数套 Service。只读 Schema 命令也不因“统一形式”增加无行为包装。
- 批量搬迁及导入更新使用可预览、检查冲突、可安全重复执行的 TS 脚本；同步架构 README 与相关验证。

**完成标准：**

- [x] Service 不依赖 Commander、CliContext/CliResult 或命令输出格式；命令协议适配与业务用例职责有明确入口和文档。
- [x] 已列出的错位点均已处理，或者有经审阅认可的保留理由；不以只搬文件或增加转发层充当解耦。
- [x] 关键用例可直接通过 Service 输入调用并验证，不需要构造 CLI 上下文；Service 依赖方向清晰，没有新增运行时循环或 domain 反向依赖。
- [x] 既有 CLI 参数、help、stdout/stderr、退出码、scope、锁、Schema 与目录操作行为保持兼容；有针对命令合同和 Service 行为的回归证据。
- [x] Node 22 下类型检查、相关测试、全量 CLI 测试和构建通过；文档明确最终边界及尚未解决的问题。

补记：合入 PR #165 https://github.com/VirusPC/edges/pull/165 · `ac7b5a8a4c9230e2aaba7b97804dc8aaeede93b7`

**2026-10-08 进展（#187）：**

各领域 commands 只从 `services/<module>/service.ts` 进入。notes 与 projects 的主文件固定叶子规格并委托 `services/node/dated-leaf.ts`。skills、memory、tasks、artifacts、forest 的主文件 re-export 已有实现，以及该命令已经在用的跨领域符号。`services/node/*`、`scope.ts`、`list-query.ts`、`metadata.ts`、`config.ts`、`import-entry.ts` 仍是跨领域工具，不另造 `service.ts`。

tasks list、审阅页和 artifacts server 的动作仍按原来的顺序调用这些函数，没有改写流程。`services/tasks/result.ts` 仍组装地点、读写和时钟。进程入口的写锁仍直接用 `node-lock`。规则写在 CLI README 分层和 ADR 0030。
