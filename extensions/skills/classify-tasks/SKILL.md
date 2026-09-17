---
name: classify-tasks
description: 对整板 Task 做软聚类归属建议（以带描述的 Task Project 为质心），等人改建议表后再用 edges tasks CLI 落地。不要只用 _default、不要 embedding、不要手改路径、不要当通用 edges-tasks Skill+MCP CRUD。
version: 1.0.0
---

# classifyTasks

独立工作流 Skill，不是通用 edges-tasks Skill+MCP CRUD。能力面是 CLI + Skill + MCP 三者并列：有 shell 的宿主走 `edges` CLI；本文件是工作流入口；无 shell 宿主的 generic tasks MCP 是另卡 backlog，本 Skill **不**发明 classify MCP，也 **不**手改看板路径。

## 什么时候用

- 用户要按主题整理 Task 看板：整板重聚（含已有 named project，不只 `_default`）。
- 已有 Task Project 带标题与描述，要把它们当软聚类质心。
- 不要用它做单条 CRUD（那是后续 generic tasks Skill/MCP）；不要用它跑 embedding K-means；不要调用不存在的 `edges tasks classify`。

## 步骤（必须按序，第 4 步要停）

1. **读质心。** 在仓库根：

```bash
pnpm --filter edges-cli exec tsx src/index.ts tasks project list
```

已 build 时把 `tsx src/index.ts` 换成 `node dist/index.js`。解析 stdout JSON：`command` 为 `project.list`，`projects[].project|title|description` 是质心。若 `_default` 还没有 AGENTS.md，这条命令会 bootstrap 元数据，**不会**搬 Task 文件。

2. **读整板 Task。**

```bash
pnpm --filter edges-cli exec tsx src/index.ts tasks list
```

对需要正文的行再 `tasks get <stem>`。必须包含所有 project，禁止 `list --project default` 当作唯一输入。

3. **软聚类建议。** 用每个 Task 的 title/description 对照每个 project 的 title/description，判断归入已有质心、留 `default`、或建议新 slug。不要 embedding，不要向量距离，不要在本目录写 `scripts/`。

4. **出表并等待人类修改。** 只输出这一张表，然后 **停止**，等人改 `suggested` / `action` / `note` 后再继续：

| stem | current | suggested | action | note |
| --- | --- | --- | --- | --- |
| 2026-09-13--demo | default | cli | move | matches CLI centroid |

`current` / `suggested` 用 CLI id（`default` 或 kebab），不用 `_default`。`action` 只能是 `keep` | `move` | `create-then-move`。人可以改目标、留 `default`、丢掉建议、或补新 project。

5. **经 CLI 应用（禁止手改路径）。** 人改完表之后：
   - 每个还不在 `project list` 里的 `suggested`（且不是 `default`）：先问人要 title 与 description，再

```bash
pnpm --filter edges-cli exec tsx src/index.ts tasks project create <slug> --title "<title>" --description "<description>"
```

     不要自动批量编造 description，不要一次 create 未经人确认的一串 project。
   - 再对 `suggested !== current` 的每一行：

```bash
pnpm --filter edges-cli exec tsx src/index.ts tasks update <stem> --project <suggested>
```

   - `keep` 或 `suggested === current`：不写盘。

## 禁止

- 不要 `edges tasks classify`（没有这个动词）。
- 不要改 `edges-tasks-status` 或 `edges-task-priority`（不要 `status`，不要 `update --priority`）。
- 不要 `mkdir` / `mv` / 手改 Task 文件 / 手改 `AGENTS.md` / 手改根 Task Projects 节。
- 不要只用 `_default` 重聚；不要 embedding；不要把 Task 升成 Memory Type。
- 不要在本 skill 下写 `scripts/`。
- 不要把 npm `bin` 说成能力面的一层。能力面是 CLI + Skill + MCP。

## 能力面

- **CLI：** `edges tasks project list|get|create|update` 与 `edges tasks list` / `update --project`
- **Skill：** 本文件（classifyTasks）
- **MCP：** 对等入口；本轮没有 classify MCP，也没有 generic tasks MCP。缺 shell 时说明 generic tasks Skill/MCP CRUD 仍在 backlog，不要假装 MCP 已能搬 Task

Whole-board recluster; wait for the human-edited table before apply.
