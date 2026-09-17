---
name: project-tasks-classify
description: 对整板 Task 做基于 Embedding 的最近质心分类（NCC）：以用户已设的 Task Project（slug + 描述）为质心，把每条 Task 分到最近质心，等人改建议表后再用 edges tasks CLI 落地。不要发现新簇、不要迭代质心、不要手改路径、不要当通用 edges-tasks Skill+MCP CRUD。
version: 1.1.0
---

# classifyTasks

独立工作流 Skill，不是通用 edges-tasks Skill+MCP CRUD。方法是 **Nearest Centroid Classifier（最近质心分类器，NCC）**，具体为 **Embedding-based Nearest Centroid Classification（基于 Embedding 的最近质心分类）**。质心由人预先设定（已有 Task Project + 描述 / AGENTS.md），本 Skill 只做归类，不发现簇、不迭代更新质心。

能力面是 CLI + Skill + MCP 三者并列：有 shell 的宿主走 `edges` CLI；本文件是工作流入口；无 shell 宿主的 generic tasks MCP 是另卡 backlog，本 Skill **不**发明 classify MCP，也 **不**手改看板路径。

## 什么时候用

- 用户要按主题整理 Task 看板：整板分类（含已有 named project，不只 `_default`）。
- Task Project 与描述 / AGENTS.md **已经设好**，要把它们当 NCC 质心。
- 不要用它做单条 CRUD（那是后续 generic tasks Skill/MCP）；不要调用不存在的 `edges tasks classify`；不要从任务集合里自动长出新质心。

## 步骤（必须按序，第 4 步要停）

1. **读已有质心。** 在仓库根：

```bash
pnpm --filter edges-cli exec tsx src/index.ts tasks project list
```

已 build 时把 `tsx src/index.ts` 换成 `node dist/index.js`。解析 stdout JSON：`command` 为 `project.list`，`projects[].project|title|description` 是用户已设的质心（slug + 描述；描述来自 project AGENTS.md / 根索引）。若 `_default` 还没有 AGENTS.md，这条命令会 bootstrap 元数据，**不会**搬 Task 文件。质心集合以这次 list 为准；缺描述就先停，让人用 `project update` 补描述，不要自己编质心。

2. **读整板 Task。**

```bash
pnpm --filter edges-cli exec tsx src/index.ts tasks list
```

对需要正文的行再 `tasks get <stem>`。必须包含所有 project，禁止 `list --project default` 当作唯一输入。

3. **Embedding-based NCC。** 用宿主 / runtime 已有的 embedding 能力（同一模型）把质心文本与每条 Task 编成向量，再把每条 Task 分到**最近质心**：
   - 质心文本：`project` slug + `title` + `description`（来自步骤 1）。
   - Task 文本：title + description，必要时补 body。
   - 距离：余弦相似度（越大越近）或同一空间下的欧氏距离（越小越近）。同一批次只用一种度量。
   - 每条 Task 只建议一个 `suggested`：已有质心的 CLI id，或 `default`。
   - 离所有 named 质心都远时，建议 `default`，不要发明新 slug。
   - 不要从已分配成员重算质心，不要多轮移动质心，不要在本目录写 `scripts/`，不要新增 embedding 库或服务。
   - 宿主没有 embedding 能力时：说明需要 embedding、停下问人用哪条 runtime 路径；不要改用「读标题瞎分」冒充 NCC，也不要调用不存在的 `edges tasks classify`。

4. **出表并等待人类修改。** 只输出这一张表，然后 **停止**，等人改 `suggested` / `action` / `note` 后再继续：

| stem | current | suggested | action | note |
| --- | --- | --- | --- | --- |
| 2026-09-13--demo | default | cli | move | nearest to CLI centroid |

`current` / `suggested` 用 CLI id（`default` 或 kebab），不用 `_default`。`action` 只能是 `keep` | `move` | `create-then-move`。人可以改目标、留 `default`、丢掉建议。**只有人先明确补一个新质心**（title + description）时，才把该行标成 `create-then-move`；NCC 步骤本身不建议新质心。

5. **经 CLI 应用（禁止手改路径）。** 人改完表之后：
   - 每个还不在 `project list` 里的 `suggested`（且不是 `default`）：必须是人明确新增的质心。先问人要 title 与 description，再

```bash
pnpm --filter edges-cli exec tsx src/index.ts tasks project create <slug> --title "<title>" --description "<description>"
```

     不要自动批量编造 description，不要一次 create 未经人确认的一串 project，不要把「发现新簇」当成默认路径。
   - 再对 `suggested !== current` 的每一行：

```bash
pnpm --filter edges-cli exec tsx src/index.ts tasks update <stem> --project <suggested>
```

   - `keep` 或 `suggested === current`：不写盘。

## 禁止

- 不要 `edges tasks classify`（没有这个动词）。
- 不要改 `edges-tasks-status` 或 `edges-task-priority`（不要 `status`，不要 `update --priority`）。
- 不要 `mkdir` / `mv` / 手改 Task 文件 / 手改 `AGENTS.md` / 手改根 Task Projects 节。
- 不要只用 `_default` 分类；不要自动发现或迭代质心；不要把 Task 升成 Memory Type。
- 不要在本 skill 下写 `scripts/`，不要加仓内 embedding 库或服务。
- 不要把 npm `bin` 说成能力面的一层。能力面是 CLI + Skill + MCP。

## 能力面

- **CLI：** `edges tasks project list|get|create|update` 与 `edges tasks list` / `edges tasks update --project`
- **Skill：** 本文件（classifyTasks）
- **MCP：** 对等入口；本轮没有 classify MCP，也没有 generic tasks MCP。缺 shell 时说明 generic tasks Skill/MCP CRUD 仍在 backlog，不要假装 MCP 已能搬 Task

Whole-board classification onto user-set centroids; wait for the human-edited table before apply.
