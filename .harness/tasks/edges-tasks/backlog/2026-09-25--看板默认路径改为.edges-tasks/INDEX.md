---
name: tasks_board_default_path_dot_edges_tasks
description: 按作用域分流任务：维护看板迁入 .harness/tasks/，领域任务归 tasks/；保留 Task/Run 契约并同步工具，新版仅新布局、旧内容一次性迁移。
metadata:
  edges-type: task
  edges-title: 维护看板按作用域迁入 .harness/tasks/
  edges-tasks-status: backlog
  edges-task-project: edges-tasks
  edges-task-priority: medium
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-10-02T19:37:34.321Z"
---

维护看板（Issue/Run）的目标路径为所属作用域的 `.harness/tasks/`，领域任务归该作用域的 `tasks/`，保留看板与维护知识各自的内容契约。Edges 本仓当前仍使用 `knowledge/tasks/`，尚未执行迁移。

## 当前决定（2026-10-03）

用户已确认按作用域区分领域任务与维护任务，并将维护空间候选名 `.edges/` 改为 `.harness/`。本卡的目标与完成标准按 [ADR 0024](../../../../../docs/adr/0024-scope-first-content-ownership.md) 和[整体设计](../../../../../docs/superpowers/specs/2026-10-03-recursive-scope-layout-design.md) 更新；下方 2026-09-25 的推理与取舍保留为历史，不作为当前默认路径或兼容策略。

## 事实背景

- 2026-09-25 对话（任务记录员 ↔ peng cheng）从「tasks 是否该进下一级 `.memory`」一路收束到路径契约。
- 已拍板定位：**tasks 是协作看板**，服务「人 + 多 Agent 交活/跟到收口」，不是项目记忆正文。
- 现状路径：`knowledge/tasks/<project-slug>/<status>/`（ADR 0009 directory-first；CLI / review-page / Skill 均绑此树）。
- 相关但未合并的旧卡：`knowledge/tasks/edges-tasks/backlog/2026-09-13--tasks-memory与看板语义合并.md`（讨论 tasks memory type 与看板是否同构；本卡只定**文件树默认路径**，不把看板升格成 Memory Type）。
- 用户明确：tasks 以后会作为**脚手架**打进正常项目，担心与项目自有文件名冲突。

## 2026-09-25 思考过程（历史）

1. **放哪一层 `.memory`？** 曾觉得 tasks 该贴领域项目的 `.memory`，或 Task Project 本地 `.memory`。反方：`.memory` 是稳的结论/索引；看板天天改状态、搬家、sidecar Run——生命周期与读者都不同。
2. **tasks 服务于谁？** 定成协作看板（你 + 被指派 Agent + 出栈流程），不是「打开某项目记忆就看见欠账」的本地待办。
3. **是否离开 `knowledge/`？** 概念上赞成：`knowledge/` 偏沉淀，看板是运转面；根上独立树更干净。但立刻搬家成本高（ADR/CLI/站点/存量卡）。
4. **根上明文 `tasks/`？** 对人显眼，但作脚手架默认名时易撞：许多仓已有 `tasks/`、Taskfile、`task/` 等。
5. **根上 `.tasks/`？** 点前缀可减碰撞、与 `.memory` 对称；但根上点目录会增殖，且「只藏给工具」与「人要扫板」仍有张力。
6. **碰撞前提出现后**：脚手架场景下「不被业务误伤」优先于「根目录显眼」；人看板可靠 CLI / review-page，不靠明文文件夹抢位置。
7. **收束**：默认路径用命名空间 **`.edges/tasks/`**（看板）；记忆仍 `.memory/` 或未来 `.edges/memory/`（另议）；约定写在记忆里，卡文件在看板树里。

## 2026-09-25 取舍（历史）

| 选项 | 优点 | 缺点 | 结论 |
| --- | --- | --- | --- |
| 保持 `knowledge/tasks/` | 零迁移；现有工具可用 | 语义上像「知识」；脚手架进别仓仍占 knowledge 习惯 | **本仓过渡可保留** |
| 根 `tasks/` | 协作面显眼；离开 knowledge | 脚手架高冲突面 | **否决为默认脚手架路径** |
| 根 `.tasks/` | 避开明文 tasks；与 `.memory` 对称 | 点目录增多；扩展其它 edges 元数据时还要再占根名 | **次选** |
| 根 `.edges/tasks/` | 冲突面收成一个 `.edges`；可挂 tasks/其它脚手架资源；职责仍与 `.memory` 分离 | 本仓需一次迁移；人浏览要知点目录；须改 CLI/ADR | **默认契约（拍板）** |
| 塞进 `.memory`（根或下级） | 打开记忆能看见活 | 记忆与看板生命周期/工具链混用；旧卡已警告勿把看板真相源写进 memory type | **否决** |

## 目标（尚未实现）

- 维护看板位于所选作用域的 `.harness/tasks/`，领域看板位于该作用域的 `tasks/`；保留 `<project-slug>/<edges-tasks-status>/`、sidecar Run log 与 frontmatter 双写关系。
- 维护知识归 `.harness/memory/`，Task 状态与 Run 留在任务模块，不注册为同名 Memory Type。
- Edges 本仓在实施目录切换前继续使用现有 `knowledge/tasks/`；切换时按实际归属分流，CLI、review-page、Skill、MCP 与发布链同步适配。
- 新版常规运行仅支持新布局，旧内容一次性迁移；任务归属重分属于 Edges 实例计划，不写死进通用 Project Memory 迁移器。

## 非目标（本卡）

- 本轮不迁文件、不改 CLI、不改 review-page。
- 不把 Task 升格为 Project Memory Type（见 2026-09-13 合并卡）。
- 本卡聚焦任务看板；维护知识和技能的迁移由整体设计衔接。

## 完成标准（将来出栈时）

- 路径契约与 ADR 0024、整体设计一致：维护任务归 `.harness/tasks/`，领域任务归 `tasks/`，均以所选作用域为边界。
- CLI 与相关链路读写各自新真源；旧内容具备一次性迁移和校验步骤，不保留常规旧路径回退或双写。
- 模板与文档区分两种用途，不把全部任务默认归入维护空间；Task/Run 关联和看板分组保持。
- 本卡 validate 通过后再 done。

## How to apply

- 未指派；出栈默认 grill → research → plan → implement → validate。
- 交叉阅读：`2026-09-13--tasks-memory与看板语义合并.md`、ADR 0009、`knowledge/tasks/README.md`。
- 派发时以当前整体设计为准：先明确作用域与任务用途，核对归属映射，同步升级工具后一次性切换目录。
