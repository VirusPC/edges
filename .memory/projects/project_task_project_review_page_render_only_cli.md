---
name: project_task_project_review_page_render_only_cli
description: 改审阅壳或 edges tasks project review-page 时打开：仍只渲染、无 --mode。桌面三栏见 ADR 0022。窄屏看板纵向分段；点卡片后详情是盖住看板的视口面板，回到看板不取消选中。源码在 apps/tasks-review-app/。
metadata:
  edges-title: Task Project 审阅页是 render-only CLI
  edges-type: project
  edges-origin-session-id: bc-4a366c7b-641d-580a-9040-857bf9762aa4
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-24T18:00:02+00:00"
---

Task Project 人确认闸门是 render-only CLI `edges tasks project review-page`：Skill 产出建议 JSON，CLI 只渲通用 groups+items 审阅页，人拖拽后 Copy JSON 贴回，Skill 用现有 `project create` / `update --project` 落地。无 `--mode`，无公开 `classify` / `apply-review`，不自动打开浏览器，不为审阅页新开 MCP。命令与 classifyTasks 第 4 步主路径已落地（PR #85）；proposeTypes Skill 正文仍未入库，应复用同一命令。托管分两条：一次性人闸走 Artifacts 预览（ADR 0013）；固定看板入口走 `/tasks/` 持久站（ADR 0021），都不要把托管并进 review-page。

2026-09-23 ADR 0022 修订同一份审阅壳，不重开 render-only：三栏；拖到左栏只改 project；中栏状态列只读；右栏读页内 Task Doc 的 `body`；顶栏是全文、priority、assignee、status。分组载荷仍是 `edges.tasks.grouped/v1`，条目可带可选 `doc`。壳的实现是 Vite + React + Tailwind + shadcn/ui，拖拽用 @dnd-kit 且只服务左栏，右栏用 react-markdown + remark-gfm。只提交审阅壳源码和构建管线，产物不入库：需要时由 `build:tasks-review-app`、prepack、CI 或 ECS 部署链生成，运行时不在用户机器上 `vite build`。源码仓根 `apps/tasks-review-app/`（包名 `tasks-review-app`），产物 `extensions/clis/src/tasks/project/assets/review-page/`（`index.html`、`review.js`、`review.css`，gitignore），`review-page.ts` 只读产物，把 JS/CSS 内联进单 HTML，数据写成 `#edges-review-payload` 的 JSON script。不默认抄 Playwright 的 zip+base64。导航用 hash 或 hash+query。2026-09-23 实现轮已落地并经测试验证。

2026-09-24 ADR 0023 把窄屏看板改成纵向长滚动，双端「移到项目…」只改页内 JSON。同一天设计验收否掉「详情接在看板下面、用文档流吸顶条」：窄屏点开卡片后，详情是盖住看板的视口面板，铺在 Edges/筛选条下面（`position: fixed`，占满剩余视口）。面板头固定「回到看板」和当前标题（过长省略）；只有正文滚动。回到看板关掉面板，不改 hash、不取消选中。看板本身仍是纵向分段。这一轮按用户要求不改 ADR 正文。

**Why:**
2026-09-17 grill 确认：ad-hoc HTML 与聊天 Markdown 表不够当交互闸门；Grok Bot HTML 预览里拖拽不可靠。CLI 若计算归属会重开 ADR 0010 已否决的 `classify` 动词。`--mode` 会把页绑死在 classify vs propose，而两组工作流只要同一壳。能力面仍是 CLI + Skill + MCP。2026-09-19 ADR 0013 只改打开方式，不改 render-only。2026-09-21 ADR 0021 再加一条持久入口，仍不改 render-only。2026-09-23 若为看板另开顶层 schema，或让浏览器读仓内 `.md`，会把 list 契约和页内文档拆成两套；状态写回与 project 拖拽也不是一件事。安装后现编会把 Vite 工具链变成用户依赖，也让 `review-page` 变成一次构建。只学 prebuild、把 React 源码和 CLI 命令放在同一目录，运行时就会 import 到源码树，和 Playwright reporter 只读 `lib/vite/htmlReport` 的包内布局不一致。2026-09-24 窄屏若另做一壳，或把整页做成底栏分页、左右滑页，会把同一份壳拆开；390×844 上硬挤三栏已经不可用。文档流吸顶留在卡片下面，滚动详情时顶上仍是任务卡，验收因此否掉。视口面板只盖详情，不另做一壳，选中和 hash 都留着。菜单只改页内 JSON，是为了窄屏也能改 project，同时不碰 ADR 0012 的 Copy JSON 落地。

**How to apply:**
- How-to: plan at docs/superpowers/plans/2026-09-17-task-project-review-page.md；壳的三栏与 `doc` 以 ADR 0022 为准。窄屏看板的纵向分段与「移到项目…」仍以 ADR 0023 为准，但详情不要按 ADR 0023 里「接在状态板下方、同一页滚到详情」来做；那句已被 2026-09-24 的视口面板拍板取代，改详情前先看本条，不要把面板改回文档流吸顶。
- 改 glossary、审阅交互或 classifyTasks / proposeTypes 人闸时按 ADR 0012 / 0022 / 0023 与 CONTEXT 术语审阅壳 / Task Doc / doc（看板条目）/ Task stem。
- 窄于 `md`：项目筛选是一个下拉；状态板按中文状态纵向分段，只显示有卡片的状态且全部展开，整页不横向溢出。点卡片进入详情：视口级面板盖住看板，头固定「回到看板」+ 标题，只有正文滚动。回到看板只关面板。不要用文档流 `sticky` 当这条的实现。不要做成底栏分页或左右滑页。每张卡的「移到项目…」是必须的；触摸拖放可以跳过。
- `≥768px`：保持 #126 的三栏、可拖分隔线、左栏拖放。观感只允许多出卡片菜单。桌面右栏留在三栏里，不要套窄屏的视口面板。
- 命令是 `edges tasks project review-page --from <path|-> [--out <path>]`；成功 JSON 的 `command` 为 `project.review-page`，含绝对 `path`。默认写 OS 临时目录，不打开浏览器。
- 导出行用 `stem`（文件名去 `.md`），不是 title，也不等于 frontmatter / 文档 `name`。页上 `action` 只有 `keep` | `move`。拖到左栏或「移到项目…」只改 project；中栏不产生状态变更。
- classifyTasks 第 4 步主路径（已写进 `extensions/skills/project-tasks-classify/SKILL.md`）：写 JSON → review-page → 给人 HTML 路径 → 停止 → 等贴回 JSON → 现有 CLI apply。一次性人闸可 `publish` 再给人可达 URL（ADR 0013）。看 main 整板走 `/tasks/`（ADR 0021），不要 `publish` 当固定入口。Markdown 表只作无 GUI 回退。
- Task Doc 字段真源是 `extensions/clis/schemas/task-doc.v1.json`。页只读页内 `doc`，不读磁盘 `.md`，生成器不写 `bodyHtml`。
- 改审阅壳时，只提交源码和构建管线。由 `build:tasks-review-app`、prepack、CI 或 ECS 部署链生成 `extensions/clis/src/tasks/project/assets/review-page/` 下的 `index.html`、`review.js`、`review.css`，该目录 gitignore。`review-page.ts` 只读这三份文件，把 JS/CSS 内联进单 HTML，把载荷写成 `#edges-review-payload` 的 JSON script。导航用 hash 或 hash+query。不要在用户机器上 `vite build`，不要把产物提交进 git，不要默认 zip+base64，不要 path history 或要服务器 rewrite 的 react-router。源码放仓根 `apps/tasks-review-app/`，不要放进 `extensions/clis/` 或 `src/tasks/`，运行时不要 import Vite 源码树。
- 不要公开 `edges tasks classify`；不要新开 `apply-review`；不要 `--mode`；不要审阅页 MCP；不要自动打开浏览器或靠 Grok Bot 预览当闸门。
- 不要把托管 / publish / `/tasks/` 部署并进 `review-page`。不要与写回仓、语义检索、鉴权、统一 agent 助手、Artifacts→Pages 并卡。
- 不要发明 proposeTypes Skill 正文；它将来复用同一 `project review-page`。不要在 `tools/` 下新放 HTML。
- 对照 ADR `docs/adr/0012-task-project-review-page-is-render-only-cli.md`、`docs/adr/0022-review-shell-three-column-task-doc.md`、`docs/adr/0023-review-shell-narrow-vertical-layout.md`、`docs/adr/0013-artifacts-preview-service.md` 与 `docs/adr/0021-persistent-tasks-board-site.md`。详情面板与 ADR 0023 的「接在下方」不一致时，以本条为准，不要在未获要求时改 ADR。
