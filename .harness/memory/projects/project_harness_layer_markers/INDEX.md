---
name: project_harness_layer_markers
description: >-
  改 AGENTS.md 层入口注释或章节标题时：标记为 project-harness / constraints / local /
  descendants；标题为本层硬约束 / 本层系统维护信息 / 下层系统维护信息；type 与 entries 仍用
  project-memory-*。README 的 project-entries-* 见 grill_entries 条。
metadata:
  edges-title: 层入口表面命名改为 project-harness
  edges-type: project
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-06T16:38:27+00:00'
---

AGENTS.md 层入口三章是 Project Harness（Git 项目上的系统二写法）。表面标记为 `project-harness` / `project-harness-constraints` / `project-harness-local` / `project-harness-descendants`。

**现行标题（2026-10-06 Q15c 翻案后）：**
- `本层硬约束`
- `本层系统维护信息`（取代本轮曾落地的 `本层组成`，以及更早的 `本层记忆`）
- `下层系统维护信息`（取代 `下层节点` / `下层记忆索引` / `下层作用域`）

类型入口的 `project-memory-type` / `project-memory-entries` 仍不改。README 组织清单另用 `project-entries-*` 与「本层内容 / 下层内容」，见 `project_grill_entries_markers_and_titles`。

**Why:** 层标记改名那轮用「本层组成 / 下层节点」；节点模型 grill 后与 README「内容」对仗，用户改为「系统维护信息」。

**How to apply:** 序列化 AGENTS 只发新标题；读兼容 `本层组成`、`下层节点` 及更早别名。完整条目标记与 README 分工以 `docs/superpowers/specs/2026-10-06-recursive-system-two-entries-design.md` 为准。旧设计 docs/superpowers/specs/2026-10-06-project-harness-layer-markers-design.md 的标题表已过期于 Q15c，以本条与新 spec 为准。
