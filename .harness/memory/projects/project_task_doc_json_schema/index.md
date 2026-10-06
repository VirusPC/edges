---
name: project_task_doc_json_schema
description: >-
  Schema 选型与取舍：TS 源、生成器、Node 22、Ajv 生态证据及边界；构建分发、真实消费者与 CLI 获取。ADR 0025，plan
  Task 5 待实施。
metadata:
  edges-title: TS 数据契约生成 JSON Schema
  edges-type: project
  edges-origin-session-id: bc-0b785d16-25ab-56b2-9ca1-640f22eaeb0d
  edges-agent-client: cursor
  edges-username: cheng
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-06T15:46:41+08:00'
---

2026-10-06 用户确认：Task Doc 等对外数据契约以普通 TypeScript interface/type 为定义源，使用 ts-json-schema-generator 生成 JSON Schema；需要运行时结构校验时使用 Ajv。项目统一 Node 22 基线。选型及原因见 docs/adr/0025-typescript-source-generated-json-schema.md；本次已接受决策，尚未实施接入。

**Why:**
旧方案让 TS 类型、Schema 和消费者独立维护字段/枚举。自动生成保留 TS 开发体验与外部标准契约，同时消除重复定义。用户明确要求回到简单分工：Model 管单节点，operations 管集合遍历，Service 管完整操作；不能为了生成 Schema 重写类继承或移动所有方法。

**How to apply:**
- ADR 0025 修订 ADR 0022 的字段定义源，外部系统仍共用 Task Doc JSON Schema；既有手写文件暂时保留，待生成与兼容性验收后替换。不要把目标状态描述为已经实施。
- 首先迁移 TaskDoc；按对外需要扩展，不为所有节点机械创建 Schema。生成目标是明确的 TS 数据类型，不是包含私有状态、getter、方法的整个节点类。
- ts-json-schema-generator 为构建开发依赖，选型探针版本 2.9.0；dist/schemas/ 保存生成产物，随构建/发布包分发，不提交 Git、不独立手改。Ajv 按需校验，关闭类型转换、默认值填充与字段删除；格式约束使用 ajv-formats。
- 定义仍为 name、description、metadata、body，metadata 允许未知键，body 是 Markdown。TS 现有 Record<string, string> 的窄化与 draft-07/2020-12 方言差异要显式处理；生成后的 $ref 不能破坏前端的枚举读取。
- 不把 rawFrontmatter 或 bodyHtml 写进契约。浏览器不读仓内 .md，不另开看板顶层 schema。
- 状态仍为 backlog、todo、in_progress、in_review、done、blocked、cancelled；优先级为 urgent、high、medium、low、none。edges-task-project 省略表示 default；不写目录名 _default 或状态夹名，保留既有项目 id 约束。
- 看板继续使用 edges.tasks.grouped/v1 的可选 items[].doc；指派保留在 metadata.edges-task-assignee。
- 旧决定于 2026-09-23 将 JSON Schema 作为手工字段真源；新决定改为 TS 源码生成，保留外部契约共享原则。完整候选比较、临时探针证据、Node 22 验收和接入边界以 ADR 0025 为准。


## Schema 获取命令与产物分发

2026-10-06 用户纠正生成物分发方案：仓库只保存 TS 定义、生成脚本与测试，Schema 仅作构建产物；CLI 应提供获取命令。ADR 0025 已撤销初稿的“生成物可提交”建议，仍是待实施状态。

**Why:** 避免源码与生成物双重维护，让外部系统获取与当前安装版本匹配的契约，而不必读取仓库路径或运行 TS 生成器。

**How to apply:** 目标命令为 edges schema list 和 edges schema get task-doc/v1；get 直接输出 JSON Schema，错误写 stderr 并非零退出。不依赖 scope、不等待 stdin、不取写锁，只读取包内 dist/schemas/，不现场生成。干净构建须先准备产物再供消费者使用；发布包包含 Schema，源码仓库不提交它。兼容性验收后移除旧手写 JSON 和路径依赖，验证仓库外无源码/开发依赖的安装包也能运行 list/get。

## 选型证据与实施衔接

2026-10-06 用户要求技术选型完整留档，保留候选与未采用理由、实际验证与限制、迁移成本及重新评估条件，而不只记录库名。ADR 0025 为本主题的决策记录；通用能力收敛 plan 的 Task 5 实施生成器、兼容性校验、消费者迁移与 CLI 获取，spec 已同步，均待实施。

**Why:** 以后需要知道当时为什么这样选，避免把生态采用等同于绝对排名、把探针成功等同于生产验收，或重复讨论已明确的取舍。

**How to apply:** Ajv 是 Node JSON Schema 校验的主流选择之一，证据来自 Fastify、webpack schema-utils 及 ESLint 官方资料；ESLint 使用的 6.x 不作为 Ajv 8 的证据。Ajv 8 与 ajv-formats 3 先进入契约测试开发依赖，只有用途匹配的生产边界需要时才接运行时；schema list/get 只读取产物。保留 generator 与其他方案的对照、Node 22 基线、构建产物分发和 Model/operations 边界，详见 ADR 0025。计划与决策记录不代表代码已经接入。


## 契约迁移必须覆盖真实消费者

整体审查已验证：grouped/review-page 的 JSON 输入适配器拒绝旧 Schema 已允许的非字符串扩展 metadata。Task 5 纳入修复及公开入口回归，不能只验证生成物就宣称统一契约完成。

**Why:** 字段真源统一后，实际入口仍可能保留较窄的历史约束。**How to apply:** 对象、数组、数字、布尔、null 扩展值无损通过两个入口；Markdown parser 标量约定保持，运行时全面采用 Ajv 或收紧旧输入另作兼容性变更。详见 ADR 0025 与当前 plan。
