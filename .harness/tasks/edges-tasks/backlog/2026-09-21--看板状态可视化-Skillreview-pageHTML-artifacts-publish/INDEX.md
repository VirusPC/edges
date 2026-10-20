---
name: board_status_visualization_skill
description: 展示 tasks 状态总览时缺少可加载 Skill；需要把「渲状态板 HTML → edges artifacts publish → 公网 URL」封成 Skill，避免 agent 扫目录拼文字列表。
metadata:
  edges-type: task
  edges-title: 看板状态可视化 Skill（review-page/HTML + artifacts publish）
  edges-tasks-status: backlog
  edges-task-project: edges-tasks
  edges-updated-at: "2026-09-21T03:17:24.365Z"
---

结论（idea）：新增可加载 Skill（`extensions/skills`），约定何时展示 tasks 状态总览、如何用 `edges tasks list` / JSON 渲状态板（或复用/扩展 `edges tasks project review-page`），再 `edges artifacts publish` 拿公网 URL；禁止把聊天内嵌 HTML 当主预览。

**事实背景:**
- 用户 peng cheng 2026-09-21：可视化 tasks 状态时应走 review-page / artifacts publish；问流程有无 Skill → 答没有独立 Skill；`project-tasks-classify` 只覆盖 Project 归属审阅里的 publish 步骤；用户说「记录」。
- 可加载层（`extensions/skills`）尚无 artifacts 专用 Skill，也无「状态总览」Skill；`project-tasks-classify` 只覆盖归属审阅。
- 记忆技能 `preview-tasks-with-box-obsidian` 是云端 Obsidian 预览，不自动加载（项目记忆 `skills` 类型不是自动加载层）。
- 相关 backlog：`edges-tasks`「edges tasks 的 Skill + MCP 封装」（CRUD 大一统）；勿并卡。
- 另有 backlog「Task 复杂可视化（状态、主题、调度）」是更广 UI/视图面；本条只封「状态总览 → publish URL」Skill，勿并卡。
- CLI 已有：`edges tasks project review-page`、`edges artifacts publish`（ADR-0013 / ECS 已上线）。review-page 是 render-only，publish 不并进 review-page（ADR-0012 / ADR-0013）。

**Why:**
展示 tasks 状态总览时缺少可加载 Skill；agent 会扫目录拼文字列表。做成后应走「渲状态板 HTML → `edges artifacts publish` → 公网 URL」。

**How to apply:**
- grill：是否扩展 `project-tasks-classify` vs 新 Skill；状态维 vs project 维；是否复用/扩展 review-page 或另渲状态板。
- 落 `extensions/skills` + 相关 `AGENTS.md` 指引（理想链路 AGENTS.md → Skill → CLI）。
- Skill 约定：list/JSON 渲状态板 → `edges artifacts publish` 拿公网 URL；禁止聊天内嵌 HTML 当主预览。
- 未指派。派发默认先 grill-with-docs，过关再实现。
