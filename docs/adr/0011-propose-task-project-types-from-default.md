# 从 `_default` 提议新 Task Project 类型；人确认后再 create + classify

classifyTasks（ADR 0010）按用户已设的 Task Project 质心做归属建议，但不会从堆积的 `_default` 里发现该建哪些新类型。2026-09-17 grill 确认：另开独立 Skill `proposeTypes`（`extensions/skills/project-tasks-propose-types/`），只读 `_default` tasks 与已有质心、输出候选表，不自动 `project create`。人确认类型后，再在后续步骤用 `project create` + `project-tasks-classify`。真 embedding 就绪前用 LLM / agent 判断；不称 Embedding NCC，也不用 K-means 命名。本轮只定 CONTEXT / ADR（及记忆指针），不写 skill 正文、不迁看板。**Pairs with ADR 0010**（分类工作流与元数据形状不变）；叠 ADR 0004 / 0005 / 0009。能力面仍是 ADR 0004 的 CLI + Skill + MCP 三者并列。

**Status:** accepted（ADR 0011；grill 确认于 2026-09-17）

**See also:** ADR 0010（classifyTasks 整板归属）；ADR 0009（分组形状）

## Decision

- **Skill：** `extensions/skills/project-tasks-propose-types/`，展示名 proposeTypes。独立工作流 Skill，不是 classifyTasks 的子步骤，也不是通用 edges-tasks Skill+MCP CRUD。
- **输入：** `_default` 下的 Task（各 status），加上已有 Task Project 的标题/描述质心，用来避撞（slug 与主题都不要撞上已有 project，含保留名 `_default`）。
- **输出：** 候选表。每行：slug、description、supporting stems（支撑该类型的 `_default` Task 文件 stem）。人确认并 `project create` 之前还不是 Task Project。
- **禁止自动落地：** 本 skill 不调用 `project create`，不改 Task 路径 / `edges-task-project`，不改 `edges-tasks-status` / `edges-task-priority`。
- **编排：** 人确认要建的类型 → 后续步骤 `edges tasks project create` 写入质心 → 再跑 `project-tasks-classify` 做归属。create 与 classify 都是后一步，不塞进本 skill。
- **方法：** 真 embedding 就绪前用 LLM / agent 判断。不称 Embedding NCC（无真向量）；不用 K-means 命名（已有质心是人设类，本 skill 是从 `_default` 提议新类，不是无标签重聚整板）。
- **批量：** 默认一次 3–7 个候选；宁缺勿滥，剩在 `_default` 比硬凑类型好。
- **正交：** 不改 status 或 priority。不把 Task 升成 Memory Type（Q18=A 仍只做索引/描述层）。
- **能力面：** 始终 CLI + Skill + MCP。落地仍走 ADR 0010 约定的 `edges tasks project` 与 `update --project`，不新增 `propose` / `classify` CLI 动词。本轮文档不实现 Skill/MCP 封装。
- **本轮范围：** 只落地 glossary + 本 ADR。不写 `extensions/skills/project-tasks-propose-types/` 正文（路径仅在文档出现），不迁看板。

## Considered Options

- 并进 classifyTasks，让它一边分类一边发明类型：否决；类型发现与归属是两段编排，先确认质心再分类。
- 输出后自动 `project create`：否决；人确认是闸门。
- Embedding NCC：否决出本轮；无真向量。真 embedding 另卡。
- K-means 命名 / 整板重聚发明类型：否决；输入只看 `_default` + 已有质心避撞，不是无标签聚类。
- 只输出 slug、不写 description / supporting stems：否决；质心需要描述，人确认需要证据。
- 做成 `edges tasks propose` CLI 动词：否决；无 embedding 前进 CLI 只会空壳或再调 LLM。能力面仍是 CLI + Skill + MCP，本轮不新开动词。
- 本轮实现 skill 或迁看板：否决。
- 通用 edges-tasks Skill+MCP CRUD：否决；本条是独立工作流。

## Out of scope

- 本轮实现 `extensions/skills/project-tasks-propose-types/` 正文（路径仅登记）
- 看板迁移、自动建 project、批量 `update --project`
- embedding / 真向量 NCC / 真 K-means
- CLI 公开 `propose` 或 `classify` 动词
- 把每条 Task 升成 Memory Type（Q18=B / `tasks-memory与看板语义合并`）
- Multica parent / sub-issue / stage
- 通用 edges-tasks Skill+MCP CRUD 封装
