---
name: project_propose_types_from_default
description: 改 propose-types 工作流或从 _default 发明新 Task Project 时打开：独立 Skill extensions/skills/project-tasks-propose-types/；经同一 review-page 确认，不自动 project create；方法是 LLM/agent 判断；配对 project-tasks-classify、ADR 0011 与 ADR 0012。本轮不写 skill 正文。
metadata:
  edges-title: proposeTypes 从 _default 提议新 Task Project 类型
  edges-type: project
  edges-origin-session-id: bc-4a366c7b-641d-580a-9040-857bf9762aa4
  edges-agent-client: cursor
  edges-username: Coding Agent 专家
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-17T07:58:06+00:00"
---

proposeTypes 是独立工作流 Skill（`extensions/skills/project-tasks-propose-types/`），从 `_default` Task 加已有 Task Project 质心提议新类型候选（slug、description、supporting stems），不自动 `project create`；人确认走同一 Task Project 审阅页（`edges tasks project review-page`，无 GUI 时候选表回退），再另步 `project create` + `project-tasks-classify`。真 embedding 前用 LLM / agent 判断，不称 Embedding NCC、不用 K-means 命名。默认一批 3–7 个候选。用户所述、grill 确认于 2026-09-17；类型发现文档见 ADR 0011；人闸形态见 ADR 0012。本轮不写 skill 正文。

**Why:**
2026-09-17 grill 确认：类型发现与归属是两段编排。ADR 0010 的 classifyTasks 按已有质心做整板归属，不会从堆积的 `_default` 里发现该建哪些新类型。人闸与 classify 共用通用 groups+items 审阅页，不另开 `--mode`。并进 classify、自动建 project、Embedding NCC、K-means 命名都会名实不符或跳过人确认。能力面仍是 CLI + Skill + MCP。

**How to apply:**
- 改 glossary 或提议新 Task Project 类型时按 ADR 0011、ADR 0012 与 CONTEXT 术语 proposeTypes / Task Project 候选 / Task Project 审阅页。
- 输入只看 `_default` + 已有质心避撞；输出候选 groups+items，经 `project review-page` 等人确认；不要自动 `project create`。
- 人确认后另步 `edges tasks project create`，再跑 `project-tasks-classify`；不要把两步塞进 propose-types。
- 不要称 Embedding NCC 或 K-means；真 embedding 另卡。不要为 proposeTypes 另开 `--mode` 或独立审阅命令。
- 不要本轮实现 skill 正文、迁看板、公开 `edges tasks propose`、`apply-review`、审阅页 MCP、或通用 Skill+MCP CRUD。
- 对照 ADR `docs/adr/0011-propose-task-project-types-from-default.md` 与 `docs/adr/0012-task-project-review-page-is-render-only-cli.md`；叠 ADR 0004 / 0005 / 0009 / 0010。
