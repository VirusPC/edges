---
status: accepted
---

# 递归节点与局部记忆归属

2026-10-04 重新确认递归组织原则，2026-10-05 完成节点模型、入口识别与公开局部记忆归属纠正。按 [README「系统实现」](../../README.md#系统实现)的六个思想组织；[节点领域模型设计](../superpowers/specs/2026-10-04-node-domain-model-design.md)记录接口与资源边界，[纠正计划](../superpowers/plans/2026-10-05-recursive-node-ownership-correction.md)记录验证。此 ADR 只决定逻辑归属与目录职责；私有材料须由每个克隆按[迁移指南](../recursive-layout-migration.md)显式处理。

## 闭环复利（投资视角）

目录服务知识进入行动、反馈再回到知识的闭环。领域任务在 `tasks/`，Edges 维护任务在 `.harness/tasks/`。原 Tasks 节点的 8 条维护记忆归 `.harness/tasks/`，领域板通过引用共用看板约定，不复制这 8 条。

## 任意输入、统一转化、多种输出（ETL 视角）

统一节点模型承接不同内容，但不抹平 Notes、Projects、Teach、Task、Memory 与 Skill 的内容契约。普通 Task、Memory、Note 默认单文件，可显式选择以 `index.md` 为入口的资源目录；Skill 始终是 `SKILL.md` 入口的完整目录。任意外部格式接入、RAG 等仍是未来方向。

## 持续协作与自进化（Agent 视角）

人和 Agent 通过 `AGENTS.md` 发现规则、Memory 与长期任务。递归目录可支持多主体协作，但 Agent Teams 自动编排、自动复盘以及持续 RSI 循环尚非这次实现；是否形成自进化，要看改进能力是否继续用于下一轮改进。

## 递归树结构

有可读 `AGENTS.md` 的真实目录可以作为节点，不再设置“独立目标、决策和验证责任”的额外资格门槛。CLI 的初始选择依次遵守显式 `--scope`、环境与最近入口，找不到时按 Git 回退；识别入口不自动初始化 Memory，类型和模块仍须显式登记。

层入口沿用三部分：**本层硬约束**、**本层记忆**、**下层记忆索引**。Task Project 索引等业务材料在本层登记。入口可跨物理目录层级直达；本层登记代表直属归属，下层索引代表子节点归属，普通 prose 链接仅用于导航，不建立第二个 parent。共享实现可供各层调用，但局部上下文留在各自节点。`NodeService` 根据已登记引用执行读取、索引同步和归属遍历；默认只读本层，显式 `includeDescendants` 才进入下层。

2026-10-05 将此前误晋升根层的 43 条公开记录按现行源字节恢复：`extensions` 16、`extensions/skills/project-memory-init` 17、`shared-extensions` 1、`knowledge/notes` 1、原 Tasks 8（现归 `.harness/tasks`）。25 份类型入口说明与索引恢复后保留人工前缀及未知元数据。根层新增记录仍属根层。当前根共享能力的维护记录不因此一概移到源码子目录；归属按每条材料的实际责任判断。

2026-10-04 的旧阶段曾使用 `utils/node-tree`、纯数据 `NodeModel` 与独立 codec；它们是当时的实施证据，已由 `extensions/cli/src/models/{base-node,internal-node,task-node,memory-node,note-node,skill-node}.ts` 与 `src/services/node-service.ts` 取代。现行 frontmatter 直接使用标准 `gray-matter` 解析与序列化，不承诺保留 YAML 原始样式。模型的逻辑 parent/children 与资源目录生命周期分别处理，`reparent` 不移动物理资源。

## 文件系统

文件系统保持内容可读、可编辑、可迁移；各节点可按需拥有 `.harness/memory/` 与 `.harness/skills/`，不要求每层预建全套目录。`CONTEXT.md`、`docs/adr/`、`docs/superpowers/` 保留各自工具约定的物理路径，通过普通导航引用发现，不作为 AGENTS 所有权条目。评测、观测、教学和领域工作各守自己的职责；目录位置不自动决定逻辑父子关系。

## Git 原生管理

Git 跟踪公开内容，忽略规则保护本地私有记忆。公开纠正不表示其他克隆的 ignored 内容已迁移。旧实例迁移映射已经改为 owner-local；已被旧版本提升到根的私有材料只能凭可信 journal 来源、在该克隆显式 opt-in 纠正。来源缺失、旧 pending journal 或目标冲突时拒绝猜测与覆盖，留给所有者审阅。`knowledge/posts/` 仍由人维护，不属于自动迁移范围。

历史材料：[原设计](../superpowers/specs/2026-10-03-recursive-scope-layout-design.md)、[原实施计划](../superpowers/plans/2026-10-03-recursive-scope-layout.md)、[原归属快照](../superpowers/plans/2026-10-03-recursive-scope-ownership.json)、[当时完成记录](../../.harness/tasks/project-memory/done/2026-09-12--整仓与memory同构递归融合.md)。它们保留各自日期的状态，不是现行恢复操作指令。
