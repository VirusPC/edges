# classifyTasks 用 Embedding-based NCC 整板分类；Task Project 元数据只做索引/描述层

看板已有 directory-first 的 Task Project（ADR 0009），但缺少「按主题整理」工作流，也缺少 project 级标题与描述。2026-09-17 grill 确认：独立 Skill `classifyTasks`（`extensions/skills/project-tasks-classify/`）对整板做归属建议，人改建议表后再用 CLI 落地；Task Project 管理只在索引/描述层对齐 Project Memory（Q18=A），看板 markdown 仍是 Task 真源。同日 peng cheng 纠正概念模型：质心由用户预先设定，方法是 **Nearest Centroid Classifier（最近质心分类器，NCC）**，具体为 **Embedding-based Nearest Centroid Classification（基于 Embedding 的最近质心分类）**——分类到已有质心，不是迭代发现簇。本轮只定 CONTEXT / ADR（及记忆指针），不实现 CLI / Skill，不迁看板。**Extends ADR 0009**（分组形状不变，补元数据与 classify 工作流）；叠 ADR 0004 / 0005。能力面仍是 ADR 0004 的 CLI + Skill + MCP 三者并列。

**Status:** accepted（ADR 0010；grill 确认于 2026-09-17；概念模型措辞于 2026-09-17 改为 NCC）

## Decision

- **Skill：** `extensions/skills/project-tasks-classify/`，展示名 classifyTasks。独立工作流 Skill，不是通用 edges-tasks Skill+MCP CRUD。
- **分类：** Embedding-based NCC。带描述的 Task Project（slug + 描述 / AGENTS.md）是用户已设的质心；agent 用宿主 / runtime 的 embedding 能力把 Task 与质心编成向量，按最近质心归属。人可先显式补新质心再分类；对整板分类（不只 `_default`）。先出建议表，人可改目标、留 `_default`、丢掉建议，再经 CLI 应用。不自动发现或批量建质心，不从已分配成员重算质心。不把 embedding 做成仓内库或 `edges tasks classify`。
- **正交：** classify 与 `update --project` 不得改 `edges-tasks-status` 或 `edges-task-priority`。
- **元数据（Q18=A）：** Task Project 管理只在索引/描述层像 Project Memory。看板 markdown 仍是真源。不把每条 Task 升成 Memory Type（那是 Q18=B，与 [`tasks-memory与看板语义合并`](../../knowledge/tasks/_default/backlog/2026-09-13--tasks-memory与看板语义合并.md) 重叠，以后再谈）。
- **AGENTS.md：** 根 `knowledge/tasks/AGENTS.md` 保留既有 project-memory 受管区块；在受管标记外增加 **Task Projects** 节，由 CLI 维护、不手改。每个 Task Project 目录（含 `_default`）有轻量 `AGENTS.md`（标题 + 描述，可选指针）。不对每个 project 跑完整 `project-memory-init`。
- **CLI：** `edges tasks project list|get|create|update`（create 写目录 + project AGENTS.md + 刷新根索引；update 改描述；list/get 读元数据）。Task 搬家仍用 `edges tasks update --project`。本轮无公开 `edges tasks classify`。
- **合并意图：** 本工作吸收「交互式主题聚类」backlog 的第一刀（人设主题、人确认归属）；迭代发现簇与 CLI 内 classify 已另卡，本轮不做。
- **能力面：** 始终 CLI + Skill + MCP。本轮文档不实现通用 CRUD 的 Skill/MCP 封装；classifyTasks 是独立工作流 Skill，实现轮再写。
- **本轮范围：** 只落地 glossary + 本 ADR。不实现 CLI、不写 skill、不迁看板。

## Considered Options

- 做成通用 edges-tasks Skill+MCP CRUD：否决；classifyTasks 是独立工作流。
- 只用 `_default` 分类：否决；整板分类。
- 自动批量建 project：否决；人改表后再 apply；新质心必须人先显式补上。
- 仓内 embedding 库 / 迭代更新质心 / 自动发现簇：否决；NCC 用宿主 embedding + 已设质心。
- 公开 `edges tasks classify`：否决；embedding 未沉到 CLI 前公开该动词只会空壳或再调 LLM。
- Q18=B（每条 Task 升 Memory Type，看板变视图）：否决出本轮；见 `tasks-memory与看板语义合并`。
- 每 project 完整 `project-memory-init`：否决；只要轻量 AGENTS.md。
- 手改根 AGENTS.md 的 Task Projects 节：否决；CLI 维护。
- classify / `update --project` 顺便改 status 或 priority：否决；与 ADR 0009 / 0007 三正交。
- 本轮实现 CLI / Skill 或迁看板：否决。
- 本轮做通用 Skill+MCP CRUD 封装：否决。

## Out of scope

- 仓内 embedding 库或服务、迭代更新质心、自动发现新质心
- CLI 公开 `classify` 动词（已另卡，需把 embedding 沉进 CLI）
- 把每条 Task 升成 Memory Type（Q18=B / `tasks-memory与看板语义合并`）
- Multica parent / sub-issue / stage
- 通用 edges-tasks Skill+MCP CRUD 封装
- 本轮 CLI / Skill 实现与看板迁移
