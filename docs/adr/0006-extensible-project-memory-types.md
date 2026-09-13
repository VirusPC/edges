# 可扩展项目记忆类型由 LAYOUT 登记，不另开类型注册表

项目记忆需要支持在指定目录新增 Memory Type，但 PROTOCOL 只冻结「按 type 分入口、两跳到正文」的形状，不枚举具体类型。2026-09-13 grill 确认：扩展面只落在 LAYOUT（入口文件 + `<plural>/` + AGENTS 本层索引行），用 skill 在指定记忆目录登记；不另做 JSON/YAML 类型注册表。

**Status:** accepted（grill 确认于 2026-09-13）

## Decision

- **扩展面 = 只改 LAYOUT。** 一个 Memory Type 就是一层入口文件 + 内容目录（及条目前缀约定），并在该层 `AGENTS.md` 本层索引挂一行。PROTOCOL 不出现具体类型闭集；**不做**单独的 JSON/YAML 类型注册表（YAGNI）。
- **动作：** 新增 skill `$project-memory-add-type`（名称可按本仓 `project-memory-*` 系列微调），在指定记忆目录登记一个 type（name / description / 可选特权 metadata）。本轮只定文档，不实现该 skill。
- **官方 init 种子仍是内置六类：** `user` / `feedback` / `project` / `reference` / `skills` / `agent_skills`。用户后加的 type 与种子同构，remember / ask / doctor 必须能从该层 AGENTS / 入口产物发现它们；既有特例仍只跟内置走（`user` 的 gitignore 见 ADR 0003；`agent_skills` 只索引不写；`skills` 为 Agent Skills 目录形态）。
- **允许特权 metadata**（例如 gitignore 如用户记忆、只索引如 `agent_skills`、skills 形态）。实现 add-type 时落在**当前 Python skills / scripts**，精神与用户记忆 / ADR 0003 相同，**不要卡在 edges CLI**。某一 flag 的脚本改动过重时可 stub / 空实现并注明，完整补齐可后做。
- **示例**（`docs` / `progress` / `tasks` / `research` / `reminder` / `scheduler`）只供文档与测试冒烟，**本轮不写进官方 init 种子**。
- **本轮的 `tasks` Memory Type：** 若出现在示例里，只是普通 Memory Type，**不**与 `knowledge/tasks` 看板语义合并（看板仍是 Issue / Run 真源）。
- **发现：** add-type 落盘入口与目录之后，remember / ask / doctor 必须从该层 AGENTS / 入口产物发现新 type；允许对现有脚本做最小改动，但不另造注册表。

能力面仍是 ADR 0004 的 CLI + Skill + MCP 三者并列。本决策的动作是 Skill；project-memory 脚本迁到 `edges` CLI（以及其后的 MCP 对齐）是另一条 backlog，不是本轮范围，也不用来推迟 Python 侧的特权 flag。

## Considered Options

- 单独 JSON/YAML 类型总配置：否决（YAGNI；LAYOUT 产物已能表达类型）。
- 把具体类型写进 PROTOCOL 闭集：否决；PROTOCOL 已写明有哪些 type 属于实现。
- 把示例 type 写进官方 init 种子：本轮否决，避免种子膨胀。
- 本轮把 `tasks` Memory Type 与 `knowledge/tasks` 看板做成同一语义：已撤回，见 backlog。
- 等 edges CLI 再做特权 flag / add-type：否决；先改当前 Python skills / scripts。

## Out of scope

本轮文档落地与后续 add-type 实现都不包含：

- [`knowledge/tasks/backlog/2026-09-13--project-memory脚本迁到edges-CLI.md`](../../knowledge/tasks/backlog/2026-09-13--project-memory脚本迁到edges-CLI.md) — 把 init / remember / ask / doctor 等脚本迁到 `edges` CLI，再与 Skill / MCP 走同一契约。
- [`knowledge/tasks/backlog/2026-09-13--tasks-memory与看板语义合并.md`](../../knowledge/tasks/backlog/2026-09-13--tasks-memory与看板语义合并.md) — 以后再谈 `tasks` Memory Type 与看板是否同一套文件或由 CLI 映射。

## Follow-up

add-type 落地时：按 LAYOUT 写入口与目录、刷新该层 AGENTS 本层索引；remember / ask / doctor 从产物发现新 type。特权 flag 能做的做进现有脚本，过重的 stub 并在实现里注明。不要改 PROTOCOL 来列类型，也不要碰看板状态夹。
