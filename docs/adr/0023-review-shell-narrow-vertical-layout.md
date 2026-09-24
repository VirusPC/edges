# 审阅壳窄屏改为纵向长滚动，双端用「移到项目…」改 project

#126 落地的审阅壳在不窄于 Tailwind `md`（`≥768px`）时是三栏；窄屏（390×844）整页横向溢出，状态板几乎看不见。2026-09-24 grill 确认（peng cheng）：仍是**同一份壳**（classifyTasks、proposeTypes、本地 `edges tasks project review-page`、持久 `/tasks/`）。窄于 `md` 改为纵向长滚动；不窄于 `md` 的三栏保持 #126 的外观与布局，只在每张任务卡上加「移到项目…」（Move to project…）。硬边界不变：只渲染、不写回 git、中栏状态列只读、Copy JSON 仍是落地路径（ADR 0012 / 0021 / 0022）。本轮只定 CONTEXT / 本 ADR，并在进行中的窄屏卡上记下指针；不改 React 应用。**Amends ADR 0022**（窄屏信息架构，以及桌面与窄屏共用的「移到项目…」；`≥768px` 三栏、Task Doc、预构建与 hash 导航不变）。ADR 0012 / 0021 的硬边界本轮只注明、不修订：仍只渲染、无 `--mode`、不写回 git、鉴权仍后做。能力面仍是 ADR 0004 的 CLI + Skill + MCP 三者并列。

**Status:** accepted（ADR 0023；grill 确认于 2026-09-24）

**See also:** ADR 0022（[审阅壳三栏与 Task Doc](0022-review-shell-three-column-task-doc.md)）；ADR 0012（[审阅页仍是 render-only CLI](0012-task-project-review-page-is-render-only-cli.md)）；ADR 0021（[持久 `/tasks/` 看板站](0021-persistent-tasks-board-site.md)）；进行中的窄屏卡 [`knowledge/tasks/agent-clients-ux/in_progress/2026-09-24--Tasks-审阅壳手机-窄屏适配.md`](../../knowledge/tasks/agent-clients-ux/in_progress/2026-09-24--Tasks-审阅壳手机-窄屏适配.md)（本 ADR 不挪这张卡）；不改的兄弟 backlog [`knowledge/tasks/agent-clients-ux/backlog/2026-09-24--Tasks-审阅壳-deploy-分支-GitHub-Actions-预览部署.md`](../../knowledge/tasks/agent-clients-ux/backlog/2026-09-24--Tasks-审阅壳-deploy-分支-GitHub-Actions-预览部署.md)；桌面壳 [PR #126](https://github.com/VirusPC/edges/pull/126)

## Decision

- **一份审阅壳：** classify / review-page / `/tasks/` 继续共用这一份壳。窄屏不是第二份产品。不加 `--mode`。
- **断点：** 只设一档。Tailwind `md`，`<768px` 为窄屏，`≥768px` 为桌面。
- **窄屏信息架构：** 纵向长滚动。顺序是项目筛选区，然后状态板；点卡片后，详情接在状态板下方。同一页滚动。可以放「回到看板」锚点。打开详情时滚到详情。
- **窄屏状态列：** 状态板这一段占满宽。各状态列可以在状态板内部横向滚动。整页（含 390×844，以及任何 `<768px`）不得横向溢出。
- **「移到项目…」：** 每张任务卡的 ⋯ 菜单。选中目标 Task Project 后，只改页内 JSON。写回仍是 Copy JSON，再由 Skill 用现有 `project create` / `update --project` 落地（ADR 0012）。桌面与窄屏都有这份菜单。桌面保留左栏拖放，菜单是加上去的。窄屏以菜单为准；触摸拖放可以做，也可以不做。
- **桌面：** `≥768px` 保持 #126 的三栏、可拖宽度的分隔线、左栏拖放改 project。观感与布局保持 #126，允许多出来的只有这张卡上的菜单。
- **硬边界：** 中栏状态列只读。菜单与拖放都不写回 git。不做鉴权。不与写回仓 backlog 并卡。
- **完成标准（实现轮）：** 390×844 以及任何 `<768px` 整页无横向溢出；能筛项目、用状态板、打开并读完详情；双端「移到项目…」可用；桌面三栏与左栏拖放不回退；桌面观感除新菜单外保持 #126。
- **本轮范围：** glossary、本 ADR、窄屏卡上的指针。不实现 React。不改 `apps/tasks-review-app/`。不改 deploy 预览那张 backlog 的状态或正文。

## Considered Options

- 窄屏用盖住看板的抽屉装详情或项目筛选：否决。窄屏详情接在状态板下方。桌面右栏留在三栏里（外观收口里称它为 Markdown 抽屉）；本 ADR 不把那一栏改成窄屏的盖层。
- 底栏分页（看板 / 详情 / 项目）：否决。
- 左右滑页：否决。
- 把三栏按比例挤进 390px，或只调栏宽：否决。开卡时已确认这不是微调。
- 窄屏把全部状态列无滚动地并排：否决。状态板内部可以横向滚列；整页不横向溢出。
- 窄屏只靠触摸拖放改 project、不提供菜单：否决。窄屏菜单是必须的，触摸拖放可选。
- 桌面去掉左栏拖放、只留菜单：否决。桌面拖放保持 #126，菜单是加上去的。
- 为窄屏另做一壳，或给 review-page 加 `--mode`：否决。仍是 ADR 0022 的同一份壳。
- 本轮让菜单或拖放写回 git，或做鉴权：否决。硬边界仍是 ADR 0012 / 0021。
- 顺手做 deploy 分支的 GitHub Actions 预览：否决。那是另一张 backlog，本轮不动。
- 本轮改 React 应用：否决。先锁决策。

## Out of scope

- 实现 `apps/tasks-review-app/` 的窄屏布局与「移到项目…」
- 改桌面三栏的观感、可拖分隔线，或拿掉左栏拖放
- 窄屏必须做触摸拖放（可以跳过）
- 状态写回与 git 写回、鉴权
- 移动或改写 [`backlog/2026-09-24--Tasks-审阅壳-deploy-分支-GitHub-Actions-预览部署.md`](../../knowledge/tasks/agent-clients-ux/backlog/2026-09-24--Tasks-审阅壳-deploy-分支-GitHub-Actions-预览部署.md)
- `--mode`、review-page MCP、公开 `classify` / `apply-review`
