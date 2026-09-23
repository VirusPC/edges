# 审阅壳改为三栏，并在 grouped item 上嵌入 Task Doc

classifyTasks、proposeTypes、本地 `edges tasks project review-page` 与持久 `/tasks/` 已经共用一份审阅壳，但壳仍是两栏拖拽改组，页上没有 Task 正文，字段形状也散在 CLI frontmatter 里。2026-09-23 grill 确认（peng cheng）：仍是**同一份壳**，改成三栏；Task 文档的字段约定收成一份可复用 JSON Schema，生成时嵌入现有 `edges.tasks.grouped/v1` 的可选 `doc`。壳的实现迁到 Vite + React + Tailwind + shadcn/ui。Task Doc 契约与三栏是同一次取舍（页嵌入的就是这份文档），不另开 ADR。本轮只定 CONTEXT / 本 ADR / Schema 文件，不搭壳、不改 `review-page.html`、不让 CLI 开始消费该 Schema。**Amends ADR 0012**（壳的栏与拖拽范围；仍只渲染、无 `--mode`、Copy JSON 落地）；**Amends ADR 0021**（同一壳、同一 grouped 对象多一个可选 `doc`；仍不写回 git、鉴权仍后做）。叠 ADR 0002 / 0007 / 0009。能力面仍是 ADR 0004 的 CLI + Skill + MCP 三者并列。

**Status:** accepted（ADR 0022；grill 确认于 2026-09-23）

**See also:** ADR 0012（[审阅页仍是 render-only CLI](0012-task-project-review-page-is-render-only-cli.md)）；ADR 0021（[持久 `/tasks/` 看板站](0021-persistent-tasks-board-site.md)）；Task Doc 契约 [`extensions/clis/schemas/task-doc.v1.json`](../../extensions/clis/schemas/task-doc.v1.json)；进行中的壳改造 [`knowledge/tasks/agent-clients-ux/in_progress/2026-09-21--review-page-改造三列布局-顶栏-filter.md`](../../knowledge/tasks/agent-clients-ux/in_progress/2026-09-21--review-page-改造三列布局-顶栏-filter.md)（本 ADR 不挪这张卡）；语义检索 backlog [`knowledge/tasks/agent-clients-ux/backlog/2026-09-23--Tasks审阅页-tasks站点语义检索.md`](../../knowledge/tasks/agent-clients-ux/backlog/2026-09-23--Tasks审阅页-tasks站点语义检索.md)；写回仓 backlog [`knowledge/tasks/agent-clients-ux/backlog/2026-09-21--Tasks-review-review-page-写回仓接口.md`](../../knowledge/tasks/agent-clients-ux/backlog/2026-09-21--Tasks-review-review-page-写回仓接口.md)

## Decision

- **一份审阅壳：** classifyTasks、proposeTypes、本地 `edges tasks project review-page`、持久 `/tasks/` 继续共用这一份壳。不按用途拆页，不加 `--mode`。
- **三栏：** 左栏是 Task Project。点左栏项目 = 筛选，同时是拖放落点（与今天同一语义）。拖到左栏**只改 project**。中栏是按 `edges-tasks-status` 自绘的状态列，**只读**；状态写回仍走写回仓 backlog，不在本轮。右栏渲染当前条目的 `doc.body`。
- **Task Doc 契约：** 字段约定是独立、可复用的 JSON Schema [`extensions/clis/schemas/task-doc.v1.json`](../../extensions/clis/schemas/task-doc.v1.json)（`$id`: `edges.task-doc/v1`），不是自造轻量配置。形状是 `name`、`description`、`metadata`、`body`。`metadata` 允许未知键。`edges-tasks-status` 取 ADR 0002 的七态；`edges-task-priority` 取 ADR 0007 的 `urgent | high | medium | low | none`。键与 `extensions/clis` 现有 frontmatter 对齐（含 `edges-title`、`edges-task-project`、`edges-task-assignee`、`edges-updated-at`、`edges-type`）。CLI 类型与 frontmatter、看板 `doc` 都对齐这份 Schema。以后也可作 LLM 结构化输出的形状。本轮只提交文件；CLI 何时 import / 校验留到实现轮。
- **扩展现有 grouped 对象：** 仍是 `edges.tasks.grouped/v1` 的 `groups[]` + `items[]`，再薄映射进审阅页载荷。条目增加可选字段，尤其是对齐 Schema 的 `doc`。不新开看板专用的顶层 schema。现有薄映射会丢掉未识别字段；实现轮让 `doc` 穿过映射。没有 `doc` 时右栏为空，不回退去读磁盘上的 `.md`。
- **页只读页内 JSON：** 生成侧把 Schema 对齐的 `doc` 放进条目。浏览器不读仓内 markdown。生成器不预编译 `bodyHtml`。右栏用 react-markdown + remark-gfm 渲染 `doc.body`。
- **顶栏筛选（本轮）：** 全文搜索、`edges-task-priority`、指派、`edges-tasks-status`。全文搜的是页内已有文本（条目标题与描述，以及 `doc` 里的 `name` / `description` / `body`）。状态与优先级用条目上已有的 `status` / `priority`，并与 `doc.metadata` 里的同名字段对齐。指派读 `doc.metadata` 的 `edges-task-assignee`；不在条目上再造一条与 `doc` 平行的必填指派字段。语义检索不在本轮，见 2026-09-23 backlog。
- **壳的技术：** 迁到 Vite + React + Tailwind + shadcn/ui。中栏状态列自绘。拖拽用 @dnd-kit，且只用于左栏改 project。Task / project / status 的领域模型留在 Schema 与 grouped JSON 里，不放进 kanban 组件库。
- **硬边界不变：** CLI 仍只渲染；人改 project 后仍是 Copy JSON → Skill 用现有 `project create` / `update --project` 落地（ADR 0012）。`/tasks/` 仍端出同一壳、本轮不写回 git、鉴权仍后做（ADR 0021）。不与写回仓、统一 agent 助手、衍生站鉴权、Artifacts 改走 Pages 并卡。
- **本轮范围：** glossary、本 ADR、Task Doc Schema 文件。不实现 React 应用，不改 `review-page.html` 的行为，不改看板状态，不挪进行中的改造卡。

## Considered Options

- 为 classify、propose、本地审阅页、`/tasks/` 各做一壳：否决；Q1 已是同一壳，拆开会把 `--mode` 从后门请回来。
- 本轮拖中栏改 status：否决；状态写回与 project 拖拽不是一件事，写回仍是 2026-09-21 backlog。
- 左栏点击只筛选、或只作落点：否决；保持今天「筛选 + 落点」同一语义。
- 自造轻量字段配置，不用 JSON Schema：否决；CLI、看板 `doc` 与日后的 LLM 结构化输出需要同一份可复用契约。
- 浏览器直接读仓内 `.md`，或生成器预编译 `bodyHtml`：否决；页只读页内 JSON，正文保持 Markdown，右栏再渲染。
- 另开看板专用顶层 schema：否决；如无必要勿增实体。扩展 `edges.tasks.grouped/v1` 的可选字段即可。
- 本轮做语义检索：否决；已记独立 backlog，与字面筛选分开。
- 继续手写单文件 HTML，或用现成 kanban 组件库承载状态列与领域模型：否决；壳迁到 Vite + React + Tailwind + shadcn/ui，中栏自绘，领域模型留在 Schema / JSON。
- 拖拽库同时拥有状态列模型：否决；@dnd-kit 只服务左栏改 project。
- 本轮搭壳、改 `review-page.html`、或让 CLI 开始消费 Schema：否决；契约先落地，接线另开实现轮。
- 与写回仓、统一 agent 助手、站点鉴权、Artifacts→Pages 并成一张卡：否决；边界保持 ADR 0012 / 0021 与各自 backlog。

## Out of scope

- 实现 Vite / React / Tailwind / shadcn/ui、@dnd-kit、顶栏筛选，或改变 `review-page.html` 的行为
- CLI import 或校验 `task-doc.v1.json`（实现轮）
- 状态写回与 git 写回（[写回仓接口](../../knowledge/tasks/agent-clients-ux/backlog/2026-09-21--Tasks-review-review-page-写回仓接口.md)）
- 语义检索（[2026-09-23 backlog](../../knowledge/tasks/agent-clients-ux/backlog/2026-09-23--Tasks审阅页-tasks站点语义检索.md)）
- `--mode`、review-page MCP、公开 `classify` / `apply-review`
- 衍生站统一鉴权、站点统一 agent 助手、Artifacts 预览改走 Pages
- 改看板状态文件，或移动 `in_progress/2026-09-21--review-page-改造三列布局-顶栏-filter`
