# Task Project 审阅页是只渲染的 CLI（通用 groups+items）

ADR 0010 / 0011 的人确认闸门原先靠聊天里的 Markdown 建议表，以及临时 ad-hoc HTML。2026-09-17 grill 确认：交互审阅改成 **render-only** CLI `edges tasks project review-page`——Skill 仍产出建议（LLM / agent）；CLI 只把 JSON 渲成 Task Project 审阅页；人拖拽改组后 Copy JSON 贴回聊天，Skill 用现有 `project create` / `update --project` 落地。页是通用 groups+items，无 `--mode`。**Extends ADR 0010 / 0011**（人闸形态；不重开 embedding / CLI classify）；**Amended by ADR 0013**（人如何打开页：Skill 可经 Artifacts 预览服务发布后给可达 URL；`review-page` 仍只渲染、仍打印本地路径）；**Amended by ADR 0021**（持久 `/tasks/` 端出同一份 HTML 当固定看板入口；页仍只渲染；本轮不写回、不加 `--mode`）；**Amended by ADR 0022**（同一审阅壳改为三栏：拖到左栏只改 project，中栏状态只读，右栏读页内 Task Doc；壳是发布前预构建、打进 CLI 包的静态资源，源码 / 产物 / 运行时引用分开；仍只渲染、无 `--mode`、不写回 git）。叠 ADR 0004 / 0005 / 0009。能力面仍是 ADR 0004 的 CLI + Skill + MCP 三者并列。命令已落地（PR #85）；本 ADR 原轮只定 CONTEXT / 决策，不改写 skill 正文。

**Status:** accepted（ADR 0012；grill 确认于 2026-09-17；2026-09-19 由 ADR 0013 修订打开方式；2026-09-21 由 ADR 0021 修订持久入口；2026-09-23 由 ADR 0022 修订壳的三栏、文档载荷、预构建静态资源与包内布局）

**See also:** ADR 0010（classifyTasks 整板归属 + 人确认闸门）；ADR 0011（proposeTypes 类型发现 + 人确认闸门）；ADR 0013（[Artifacts 预览服务](0013-artifacts-preview-service.md)）；ADR 0021（[持久 `/tasks/` 看板站](0021-persistent-tasks-board-site.md)）；ADR 0022（[审阅壳三栏与 Task Doc](0022-review-shell-three-column-task-doc.md)）；[`knowledge/notes/2026-09-17--Grok-Bot-HTML预览拖拽异常.md`](../../knowledge/notes/2026-09-17--Grok-Bot-HTML预览拖拽异常.md)（聊天 HTML 预览不能当拖拽闸门）

## Decision

- **CLI 只渲染：** `edges tasks project review-page` 挂在已有 `project` 子树下。不计算归属、不搬 Task、不建 project。不要公开 `edges tasks classify`（仍等真 embedding，见 ADR 0010）。
- **输入：** 建议 JSON，文件路径或 stdin（`-`）。形状是通用 `groups[]`（id / title / description…）+ `items[]`（stem + 展示字段…）。组是已有 Task Project 还是 proposeTypes 候选，由调用方 Skill 解释，页与 CLI 不解释。
- **输出：** 默认写到操作系统临时目录；可选 `--out <path>`；打印绝对路径。不自动打开浏览器。
- **往返：** 页上 Copy JSON → 人贴回聊天 → Skill 用现有 `edges tasks project create` / `edges tasks update --project` 落地。本轮不新开 `apply-review` 动词。
- **资源：** HTML/JS 壳作为 CLI 包内静态资源，不长期依赖 `tools/` 原型。
- **Skill 编排（classifyTasks 第 4 步主路径）：** 写建议 JSON → 跑 `review-page` → 把 HTML 路径交给人 → **停止** → 等贴回的导出 JSON → apply。无 GUI 时 Markdown 建议表可作回退。proposeTypes 复用同一命令与同一 UI 壳。打开方式见 ADR 0013：有可达托管时 Skill 在渲染后 `publish`，给人 URL；CLI 本身仍只写本地文件、不打开浏览器。
- **审阅导出行：** `stem`、`current`、`suggested`、`action`，可选 `note`。`stem` 是文件名去 `.md` 的 CLI 查找键，不是 title，也不等于 frontmatter / 文档 `name`。
- **无 `--mode`：** 不做 classify / propose 两种模式页。
- **能力面：** 始终 CLI + Skill + MCP。本轮不为 review-page 新开 MCP 入口。
- **本轮范围：** 只落地 glossary + 本 ADR。不实现命令、不改写 skill 正文、不在 `tools/` 下新放 HTML。

## Considered Options

- 公开 `edges tasks classify`：否决；无 embedding 前进 CLI 只会空壳或再调 LLM（ADR 0010）。
- CLI 计算归属或直接落地：否决；命令只渲染。
- 新开 `apply-review` 动词：否决本轮；落地走现有 `project create` / `update --project`。
- 为 review-page 新开 MCP：否决本轮。
- 自动打开浏览器，或靠 Grok Bot HTML 预览当闸门：否决；预览里拖拽不可靠。桌面可用系统浏览器打开打印出的本地路径；手机必须用 ADR 0013 的可达 URL。
- `--mode` 区分 classify / propose：否决；通用 groups+items，语义由 Skill 解释。
- 长期依赖 `tools/` HTML 原型：否决；壳进 CLI 包。
- Markdown 建议表当唯一人闸：否决；审阅页是主路径，表只作无 GUI 回退。
- 本轮实现命令或改写 skill：否决。

## Out of scope

- 公开 `edges tasks classify` / embedding 分类（ADR 0010 已另卡）
- 新开 `apply-review` 动词
- review-page MCP 入口
- 自动打开浏览器 / 依赖 Grok Bot HTML 预览
- 托管 / 发布（ADR 0013）
- 本轮实现 `project review-page` 或改写 classifyTasks / proposeTypes 正文
- 在 `tools/` 下新放 HTML
