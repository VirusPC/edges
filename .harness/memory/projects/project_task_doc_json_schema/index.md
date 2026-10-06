---
name: project_task_doc_json_schema
description: Schema 字段真源、生成与分发、运行时输入校验及取舍；Node 22、CLI 获取和真实消费者验收见 ADR 0025。
metadata:
  edges-title: TS 数据契约生成 JSON Schema
  edges-type: project
  edges-origin-session-id: bc-0b785d16-25ab-56b2-9ca1-640f22eaeb0d
  edges-agent-client: cursor
  edges-username: cheng
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-06T17:07:24+08:00'
---

TaskDoc 等对外数据契约以普通 TypeScript interface/type 为唯一字段定义源，由 ts-json-schema-generator 生成 JSON Schema。保留 Model 的单节点行为、operations 的集合操作和 Service 的完整用例职责，不为生成 Schema 改写类继承或给所有节点机械配齐契约。

**Why:** 用户要求消除 TS、手写 Schema、前端类型及输入校验之间的重复定义，同时回到简单的职责分工。选型不能只记库名；候选、未采用理由、生态证据和改变成本集中保留在 [ADR 0025](../../../../docs/adr/0025-typescript-source-generated-json-schema.md)。

**How to apply:**
- 项目采用 Node 22 基线。生成器 2.9.0 是开发依赖；Ajv 8 和 ajv-formats 3 用于适用的完整 TaskDoc JSON 输入边界。用户后续选择 Schema 为准，已替代早期“Ajv 先只用于开发测试”的建议。
- 类型放在对应模型模块。TaskDoc 的纯数据定义与 Markdown 解析适配分文件，使前端真实类型检查不进入 Node 解析模块；旧类型导入入口可重导出。不要增加独立 domain/schemas 定义层或从含方法、私有状态的完整类生成。
- 仅使用生成器支持的 TS/JSDoc 约束，不自写 AST 生成器、formatter 或修补生成结果。先迁 TaskDoc；出现实际消费者时再扩展其他契约。
- dist/schemas 的 Schema 与清单仅为构建产物，不提交 Git，随 CLI 包分发。构建、测试和开发入口先准备产物；运行时缺失产物明确报错，不现场生成、不回退源码。
- `edges schema list` 与 `edges schema get task-doc/v1` 提供与安装版本匹配的契约；get 输出原始 JSON，错误走 stderr。命令不依赖 cwd/scope、不读取节点、不加写锁、不等待 stdin。
- 保留 name、description、metadata、body 四字段及旧 v1 约束；开放 metadata 接受嵌套 JSON 值。七态、优先级、项目 id 和日期约束复用声明。不要加入 rawFrontmatter/bodyHtml，也不另建看板顶层 Schema。
- grouped/review-page 的完整 TaskDoc 输入共享生成契约与缓存的 Ajv 校验器；关闭类型转换、默认填充和字段删除，错误包含字段路径。合法扩展值原样通过；非法状态、日期和未知顶层字段按 Schema 拒绝。这是对旧宽松 JSON 适配器的明确收紧，不套到可省略字段的原始 Markdown 上。
- 手写 2020-12 契约已由生成的 draft-07 替代，迁移验收对照接受/拒绝语义，而非只改方言标签。后续变更继续验证约束、真实消费者、生成确定性和仓库外仅含生产依赖的分发包。不能以探针成功代替接入验收。

选型与迁移已经实施，实际证据及限制见 ADR 0025 和[通用能力收敛计划](../../../../docs/superpowers/plans/2026-10-06-shared-node-capabilities.md)。Ajv 的生态采用是适配证据，不代表所有 Node 校验库的绝对排名；ESLint 6.x 的采用证据也不能当作 Ajv 8 的证据。
