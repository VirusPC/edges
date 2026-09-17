---
name: project_task_project_review_page_render_only_cli
description: 改 classifyTasks / proposeTypes 人闸或 edges tasks project review-page 时打开：CLI 只渲通用 groups+items HTML；Skill 出建议、现有 create/update 落地；无 --mode、无 classify/apply-review 动词、无审阅页 MCP。决策见 docs/adr/0012-task-project-review-page-is-render-only-cli.md。
metadata:
  edges-title: Task Project 审阅页是 render-only CLI
  edges-type: project
  edges-origin-session-id: bc-4a366c7b-641d-580a-9040-857bf9762aa4
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-17T08:41:56+00:00"
---

Task Project 人确认闸门是 render-only CLI `edges tasks project review-page`：Skill 产出建议 JSON，CLI 只渲通用 groups+items 审阅页，人拖拽后 Copy JSON 贴回，Skill 用现有 `project create` / `update --project` 落地。无 `--mode`，无公开 `classify` / `apply-review`，不自动打开浏览器，不为审阅页新开 MCP。用户所述、grill 确认于 2026-09-17；本轮只落地 CONTEXT + ADR 0012。

**Why:**
2026-09-17 grill 确认：ad-hoc HTML 与聊天 Markdown 表不够当交互闸门；Grok Bot HTML 预览里拖拽不可靠。CLI 若计算归属会重开 ADR 0010 已否决的 `classify` 动词。`--mode` 会把页绑死在 classify vs propose，而两组工作流只要同一壳。能力面仍是 CLI + Skill + MCP。

**How to apply:**
- How-to: plan at docs/superpowers/plans/2026-09-17-task-project-review-page.md
- 改 glossary、审阅交互或 classifyTasks / proposeTypes 人闸时按 ADR 0012 与 CONTEXT 术语 Task Project 审阅页 / 审阅导出行 / Task stem。
- 命令是 `edges tasks project review-page`；输入 JSON 文件或 stdin；默认写 OS 临时目录，可选 `--out`，打印绝对路径。
- 导出行用 `stem`（文件名去 `.md`），不是 title，也不等于 frontmatter / 文档 `name`。
- classifyTasks 第 4 步主路径：写 JSON → review-page → 给人 HTML 路径 → 停止 → 等贴回 JSON → 现有 CLI apply。Markdown 表只作无 GUI 回退。
- 不要公开 `edges tasks classify`；不要新开 `apply-review`；不要 `--mode`；不要审阅页 MCP；不要自动打开浏览器或靠 Grok Bot 预览当闸门。
- 不要本轮实现命令、改写 skill 正文、或在 `tools/` 下新放 HTML。
- 对照 ADR `docs/adr/0012-task-project-review-page-is-render-only-cli.md`；叠 ADR 0010 / 0011 / 0004 / 0005 / 0009。
