---
name: project_task_project_review_page_render_only_cli
description: 改审阅壳、classifyTasks / proposeTypes 人闸或 edges tasks project review-page 时打开：仍只渲染、无 --mode；ADR 0022 同一壳为三栏，且源码 / 预构建产物 / 运行时引用三处分目录（对齐 Playwright reporter），运行时不在用户机器上 vite build。决策见 docs/adr/0012 与 docs/adr/0022。
metadata:
  edges-title: Task Project 审阅页是 render-only CLI
  edges-type: project
  edges-origin-session-id: bc-4a366c7b-641d-580a-9040-857bf9762aa4
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-23T16:02:42+00:00"
---

Task Project 人确认闸门是 render-only CLI `edges tasks project review-page`：Skill 产出建议 JSON，CLI 只渲通用 groups+items 审阅页，人拖拽后 Copy JSON 贴回，Skill 用现有 `project create` / `update --project` 落地。无 `--mode`，无公开 `classify` / `apply-review`，不自动打开浏览器，不为审阅页新开 MCP。命令与 classifyTasks 第 4 步主路径已落地（PR #85）；proposeTypes Skill 正文仍未入库，应复用同一命令。托管分两条：一次性人闸走 Artifacts 预览（ADR 0013）；固定看板入口走 `/tasks/` 持久站（ADR 0021），都不要把托管并进 review-page。

2026-09-23 ADR 0022 修订同一份审阅壳，不重开 render-only：三栏；拖到左栏只改 project；中栏状态列只读；右栏读页内 Task Doc 的 `body`；顶栏是全文、priority、assignee、status。分组载荷仍是 `edges.tasks.grouped/v1`，条目可带可选 `doc`。壳的实现迁到 Vite + React + Tailwind + shadcn/ui，拖拽用 @dnd-kit 且只服务左栏，右栏用 react-markdown + remark-gfm。壳是预构建静态资源，打进 CLI 包：CI 或发布前 build，运行时只注入 payload 并打开本地文件，不在用户机器上 `vite build`。目录也学 Playwright HTML reporter，不只学 prebuild：源码、预构建产物、CLI 运行时引用三处分开。推荐示意是 `extensions/clis/review-shell/`（源码）、`extensions/clis/lib/review-shell/`（产物）、`review-page` 只读产物目录；路径名不冻结。本轮文档与 Schema 已落，React 壳尚未实现。用户所述，peng cheng 确认于 2026-09-23。

**Why:**
2026-09-17 grill 确认：ad-hoc HTML 与聊天 Markdown 表不够当交互闸门；Grok Bot HTML 预览里拖拽不可靠。CLI 若计算归属会重开 ADR 0010 已否决的 `classify` 动词。`--mode` 会把页绑死在 classify vs propose，而两组工作流只要同一壳。能力面仍是 CLI + Skill + MCP。2026-09-19 ADR 0013 只改打开方式，不改 render-only。2026-09-21 ADR 0021 再加一条持久入口，仍不改 render-only。2026-09-23 若为看板另开顶层 schema，或让浏览器读仓内 `.md`，会把 list 契约和页内文档拆成两套；状态写回与 project 拖拽也不是一件事。安装后现编会把 Vite 工具链变成用户依赖，也让 `review-page` 变成一次构建。只学 prebuild、把 React 源码和 CLI 命令放在同一目录，运行时就会 import 到源码树，和 Playwright reporter 只读 `lib/vite/htmlReport` 的包内布局不一致。

**How to apply:**
- How-to: plan at docs/superpowers/plans/2026-09-17-task-project-review-page.md；壳的三栏与 `doc` 以 ADR 0022 为准，不要按旧的两栏拖拽改状态。
- 改 glossary、审阅交互或 classifyTasks / proposeTypes 人闸时按 ADR 0012 / 0022 与 CONTEXT 术语审阅壳 / Task Doc / doc（看板条目）/ Task stem。
- 命令是 `edges tasks project review-page --from <path|-> [--out <path>]`；成功 JSON 的 `command` 为 `project.review-page`，含绝对 `path`。默认写 OS 临时目录，不打开浏览器。
- 导出行用 `stem`（文件名去 `.md`），不是 title，也不等于 frontmatter / 文档 `name`。页上 `action` 只有 `keep` | `move`。拖到左栏只改 project；中栏不产生状态变更。
- classifyTasks 第 4 步主路径（已写进 `extensions/skills/project-tasks-classify/SKILL.md`）：写 JSON → review-page → 给人 HTML 路径 → 停止 → 等贴回 JSON → 现有 CLI apply。一次性人闸可 `publish` 再给人可达 URL（ADR 0013）。看 main 整板走 `/tasks/`（ADR 0021），不要 `publish` 当固定入口。Markdown 表只作无 GUI 回退。
- Task Doc 字段真源是 `extensions/clis/schemas/task-doc.v1.json`。页只读页内 `doc`，不读磁盘 `.md`，生成器不写 `bodyHtml`。
- 实现 React 壳时，预构建产物打进 CLI 包。`review-page` 运行时只读 assets、注入 payload、打开本地文件。不要在用户机器上 `vite build`。源码目录、产物目录、运行时引用三者分开，对齐 Playwright HTML reporter（https://github.com/microsoft/playwright ：`packages/html-reporter` → `playwright-core/lib/vite/htmlReport`，reporter 只读产物）。推荐示意见 ADR 0022；最终路径名由实现 plan 按调研敲定。不要把 React 源码放进 `src/tasks/`，也不要让运行时 import Vite 源码树。
- 不要公开 `edges tasks classify`；不要新开 `apply-review`；不要 `--mode`；不要审阅页 MCP；不要自动打开浏览器或靠 Grok Bot 预览当闸门。
- 不要把托管 / publish / `/tasks/` 部署并进 `review-page`。不要与写回仓、语义检索、鉴权、统一 agent 助手、Artifacts→Pages 并卡。
- 不要发明 proposeTypes Skill 正文；它将来复用同一 `project review-page`。不要在 `tools/` 下新放 HTML。
- 对照 ADR `docs/adr/0012-task-project-review-page-is-render-only-cli.md`、`docs/adr/0022-review-shell-three-column-task-doc.md`、`docs/adr/0013-artifacts-preview-service.md` 与 `docs/adr/0021-persistent-tasks-board-site.md`。
