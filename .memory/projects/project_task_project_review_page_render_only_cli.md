---
name: project_task_project_review_page_render_only_cli
description: 改审阅壳或 edges tasks project review-page 时打开：仍只渲染、无 --mode。桌面三栏见 ADR 0022。窄屏同一页纵向分段；章节头是过渡色面，状态行贴背景且比章节小一档。筛选入口是 ListFilter 图标。双击章节标题滚到该节，回到看板滚到当前卡片。不要视口面板。源码在 apps/tasks-review-app/。
metadata:
  edges-title: Task Project 审阅页是 render-only CLI
  edges-type: project
  edges-origin-session-id: bc-4a366c7b-641d-580a-9040-857bf9762aa4
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-25T04:14:30+00:00"
---

Task Project 人确认闸门是 render-only CLI `edges tasks project review-page`：Skill 产出建议 JSON，CLI 只渲通用 groups+items 审阅页，人拖拽后 Copy JSON 贴回，Skill 用现有 `project create` / `update --project` 落地。无 `--mode`，无公开 `classify` / `apply-review`，不自动打开浏览器，不为审阅页新开 MCP。命令与 classifyTasks 第 4 步主路径已落地（PR #85）；proposeTypes Skill 正文仍未入库，应复用同一命令。托管分两条：一次性人闸走 Artifacts 预览（ADR 0013）；固定看板入口走 `/tasks/` 持久站（ADR 0021），都不要把托管并进 review-page。

2026-09-23 ADR 0022 修订同一份审阅壳，不重开 render-only：三栏；拖到左栏只改 project；中栏状态列只读；右栏读页内 Task Doc 的 `body`；顶栏是全文、priority、assignee、status。分组载荷仍是 `edges.tasks.grouped/v1`，条目可带可选 `doc`。壳的实现是 Vite + React + Tailwind + shadcn/ui，拖拽用 @dnd-kit 且只服务左栏，右栏用 react-markdown + remark-gfm。只提交审阅壳源码和构建管线，产物不入库：需要时由 `build:tasks-review-app`、prepack、CI 或 ECS 部署链生成，运行时不在用户机器上 `vite build`。源码仓根 `apps/tasks-review-app/`（包名 `tasks-review-app`），产物 `extensions/clis/src/tasks/project/assets/review-page/`（`index.html`、`review.js`、`review.css`，gitignore），`review-page.ts` 只读产物，把 JS/CSS 内联进单 HTML，数据写成 `#edges-review-payload` 的 JSON script。不默认抄 Playwright 的 zip+base64。导航用 hash 或 hash+query。2026-09-23 实现轮已落地并经测试验证。

2026-09-24 ADR 0023 把窄屏看板改成纵向长滚动，双端「移到项目…」只改页内 JSON。2026-09-25 产品改口：窄屏详情不再用盖住看板的视口面板。Projects、Tasks、Details 留在同一页里往下滚。三个分区标题吸在 Edges 下面，同一时间只钉住当前这一节（下一节把上一节顶走，不要三节叠在一起）。标题最右侧是箭头图标（收起 ▸、展开 ▾），不要写成「收起」「展开」文字；只有 Details 在图标左边有文字按钮「回到看板」，点了滚回任务区，不取消选中。状态段标题用英文 Title Case（Backlog、Todo、In Progress、In Review、Done、Blocked、Cancelled；空为 Unspecified，未知为 Other），不要中文。这些标题用同一套 SectionHeader：吸在 Tasks 标题下面，最右也是箭头，可以收起。同一时间最多 Edges、一个大分区、以及在 Tasks 里一个状态标题。点卡片滚到 Details。不要做视口面板，也不要单独的「回到看板 + 标题」顶条。窄屏筛选入口是 Lucide ListFilter 图标，不要可见文字，aria-label 仍是「筛选」，视觉比 Edges 标轻。抽屉标题仍是「筛选」，右上角用 × 图标关掉，不要写成「关闭」。这一轮按用户要求不改 ADR 正文。

**Why:**
2026-09-17 grill 确认：ad-hoc HTML 与聊天 Markdown 表不够当交互闸门；Grok Bot HTML 预览里拖拽不可靠。CLI 若计算归属会重开 ADR 0010 已否决的 `classify` 动词。`--mode` 会把页绑死在 classify vs propose，而两组工作流只要同一壳。能力面仍是 CLI + Skill + MCP。2026-09-19 ADR 0013 只改打开方式，不改 render-only。2026-09-21 ADR 0021 再加一条持久入口，仍不改 render-only。2026-09-23 若为看板另开顶层 schema，或让浏览器读仓内 `.md`，会把 list 契约和页内文档拆成两套；状态写回与 project 拖拽也不是一件事。安装后现编会把 Vite 工具链变成用户依赖，也让 `review-page` 变成一次构建。只学 prebuild、把 React 源码和 CLI 命令放在同一目录，运行时就会 import 到源码树，和 Playwright reporter 只读 `lib/vite/htmlReport` 的包内布局不一致。2026-09-24 窄屏若另做一壳，或把整页做成底栏分页、左右滑页，会把同一份壳拆开；390×844 上硬挤三栏已经不可用。2026-09-25 视口面板被否掉，改回同一页的分区标题吸顶：滚到哪一节，就只钉住那一节的标题。菜单只改页内 JSON，是为了窄屏也能改 project，同时不碰 ADR 0012 的 Copy JSON 落地。

**How to apply:**
- How-to: plan at docs/superpowers/plans/2026-09-17-task-project-review-page.md；壳的三栏与 `doc` 以 ADR 0022 为准。窄屏看板的纵向分段与「移到项目…」以 ADR 0023 为准。2026-09-25 起窄屏详情也在这一页里：不要盖住看板的视口面板。
- 改 glossary、审阅交互或 classifyTasks / proposeTypes 人闸时按 ADR 0012 / 0022 / 0023 与 CONTEXT 术语审阅壳 / Task Doc / doc（看板条目）/ Task stem。
- 窄于 `md`：项目筛选是一个下拉；状态板按英文 Title Case 纵向分段，只显示有卡片的状态且默认全部展开，整页不横向溢出。窄屏上每一个状态段都收起时，标题紧挨成一列，不要段间深色空隙；还有一段展开，或是桌面，间距保持原样。Projects 的下拉和列表不要为这件事改间距。Projects → Tasks → Details 在同一滚动里。三个分区标题 `sticky` 在 Edges 下面，靠各自 section 的边界换班，不要三节同时钉住。每节最右侧是 Chevron 图标，收起后只留标题，不要用「收起」「展开」文字按钮。只有 Details 有「回到看板」，滚到当前卡片 `[data-stem]`，让开 96px（Tasks 标题加状态标题），不改 hash。点卡片 `scrollIntoView` 到 Details。双击章节标题（`[data-section-jump]`）滚到该节容器：Projects 是 `[data-review-projects]`，Tasks 是 `[data-status-board]`，Details 是 `[data-markdown-pane]`。双击 Edges（`[data-review-nav=edges]`）把 `[data-review-columns]` 滚到顶。箭头仍是单击折叠，不要和双击跳转绑在一起。大章节用 SectionHeader variant=chapter（顶栏色和页面背景之间的过渡色面，不要左侧色条，也不要回到抢眼大色块），状态行用 variant=status（底与页面同色，融进背景，扁列表，全部收起时仍紧挨）。强色在顶栏：顶栏是色带，Edges 用 Lucide Layers2 浅色图标块当最强识别。权重是顶栏最强、章节过渡、状态融进背景。状态标题比章节小一档（text-base，章节仍是 text-lg，顶栏仍是 text-xl），不要再拉大字号阶梯。窄屏项目 Select 的菜单用 position=popper 锚在触发器上；缺 SelectValue 的 item-aligned 不会定位，弹出层会停在 overflow:hidden 的视口外面。状态小节窄屏仍是 `sticky top-12`，贴在 Tasks 标题下，箭头可收起。不要视口面板，不要「回到看板 + 卡片标题」那条独立顶栏。每张卡的「移到项目…」是必须的；触摸拖放可以跳过。筛选抽屉的关闭是图标（Lucide X），可见文字里不要出现「关闭」；无障碍名「关闭筛选」可以留。
- `≥768px`：保持 #126 的三栏、可拖分隔线、左栏拖放。观感只允许多出卡片菜单和分区标题上的收起。桌面不要「回到看板」，也不要窄屏那种盖住看板的面板。
- 命令是 `edges tasks project review-page --from <path|-> [--out <path>]`；成功 JSON 的 `command` 为 `project.review-page`，含绝对 `path`。默认写 OS 临时目录，不打开浏览器。
- 导出行用 `stem`（文件名去 `.md`），不是 title，也不等于 frontmatter / 文档 `name`。页上 `action` 只有 `keep` | `move`。拖到左栏或「移到项目…」只改 project；中栏不产生状态变更。
- classifyTasks 第 4 步主路径（已写进 `extensions/skills/project-tasks-classify/SKILL.md`）：写 JSON → review-page → 给人 HTML 路径 → 停止 → 等贴回 JSON → 现有 CLI apply。一次性人闸可 `publish` 再给人可达 URL（ADR 0013）。看 main 整板走 `/tasks/`（ADR 0021），不要 `publish` 当固定入口。Markdown 表只作无 GUI 回退。
- Task Doc 字段真源是 `extensions/clis/schemas/task-doc.v1.json`。页只读页内 `doc`，不读磁盘 `.md`，生成器不写 `bodyHtml`。
- 改审阅壳时，只提交源码和构建管线。由 `build:tasks-review-app`、prepack、CI 或 ECS 部署链生成 `extensions/clis/src/tasks/project/assets/review-page/` 下的 `index.html`、`review.js`、`review.css`，该目录 gitignore。`review-page.ts` 只读这三份文件，把 JS/CSS 内联进单 HTML，把载荷写成 `#edges-review-payload` 的 JSON script。导航用 hash 或 hash+query。不要在用户机器上 `vite build`，不要把产物提交进 git，不要默认 zip+base64，不要 path history 或要服务器 rewrite 的 react-router。源码放仓根 `apps/tasks-review-app/`，不要放进 `extensions/clis/` 或 `src/tasks/`，运行时不要 import Vite 源码树。
- 不要公开 `edges tasks classify`；不要新开 `apply-review`；不要 `--mode`；不要审阅页 MCP；不要自动打开浏览器或靠 Grok Bot 预览当闸门。
- 不要把托管 / publish / `/tasks/` 部署并进 `review-page`。不要与写回仓、语义检索、鉴权、统一 agent 助手、Artifacts→Pages 并卡。
- 不要发明 proposeTypes Skill 正文；它将来复用同一 `project review-page`。不要在 `tools/` 下新放 HTML。
- 对照 ADR `docs/adr/0012-task-project-review-page-is-render-only-cli.md`、`docs/adr/0022-review-shell-three-column-task-doc.md`、`docs/adr/0023-review-shell-narrow-vertical-layout.md`、`docs/adr/0013-artifacts-preview-service.md` 与 `docs/adr/0021-persistent-tasks-board-site.md`。窄屏详情以本条的分区标题吸顶为准，不要改回视口面板；未获要求时不要改 ADR。
