---
name: project_task_doc_json_schema
description: >-
  改 Task Doc、对外数据类型或 Schema 时：普通 TS 为定义源，ts-json-schema-generator 生成，Ajv
  按需校验，Node 22；保留 Model 行为。ADR 0025 修订 0022，接入待实施。
metadata:
  edges-title: TS 数据契约生成 JSON Schema
  edges-type: project
  edges-origin-session-id: bc-0b785d16-25ab-56b2-9ca1-640f22eaeb0d
  edges-agent-client: cursor
  edges-username: cheng
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-06T15:28:05+08:00'
---

2026-10-06 用户确认：Task Doc 等对外数据契约以普通 TypeScript interface/type 为定义源，使用 ts-json-schema-generator 生成 JSON Schema；需要运行时结构校验时使用 Ajv。项目统一 Node 22 基线。选型及原因见 docs/adr/0025-typescript-source-generated-json-schema.md；本次已接受决策，尚未实施接入。

**Why:**
旧方案让 TS 类型、Schema 和消费者独立维护字段/枚举。自动生成保留 TS 开发体验与外部标准契约，同时消除重复定义。用户明确要求回到简单分工：Model 管单节点，operations 管集合遍历，Service 管完整操作；不能为了生成 Schema 重写类继承或移动所有方法。

**How to apply:**
- ADR 0025 修订 ADR 0022 的字段定义源，外部系统仍共用 Task Doc JSON Schema；既有手写文件暂时保留，待生成与兼容性验收后替换。不要把目标状态描述为已经实施。
- 首先迁移 TaskDoc；按对外需要扩展，不为所有节点机械创建 Schema。生成目标是明确的 TS 数据类型，不是包含私有状态、getter、方法的整个节点类。
- ts-json-schema-generator 为构建开发依赖，选型探针版本 2.9.0；schemas/ 保存生成产物，禁止独立手改。Ajv 按需校验，关闭类型转换、默认值填充与字段删除；格式约束使用 ajv-formats。
- 定义仍为 name、description、metadata、body，metadata 允许未知键，body 是 Markdown。TS 现有 Record<string, string> 的窄化与 draft-07/2020-12 方言差异要显式处理；生成后的 $ref 不能破坏前端的枚举读取。
- 不把 rawFrontmatter 或 bodyHtml 写进契约。浏览器不读仓内 .md，不另开看板顶层 schema。
- 状态仍为 backlog、todo、in_progress、in_review、done、blocked、cancelled；优先级为 urgent、high、medium、low、none。edges-task-project 省略表示 default；不写目录名 _default 或状态夹名，保留既有项目 id 约束。
- 看板继续使用 edges.tasks.grouped/v1 的可选 items[].doc；指派保留在 metadata.edges-task-assignee。
- 旧决定于 2026-09-23 将 JSON Schema 作为手工字段真源；新决定改为 TS 源码生成，保留外部契约共享原则。完整候选比较、临时探针证据、Node 22 验收和接入边界以 ADR 0025 为准。
