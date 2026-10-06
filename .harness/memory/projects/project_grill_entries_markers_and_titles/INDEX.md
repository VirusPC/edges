---
name: project_grill_entries_markers_and_titles
description: >-
  改 README entries 或 AGENTS 三章标题时：README 用
  project-entries-local/descendants，标题本层内容/下层内容；AGENTS
  标题为本层硬约束/本层系统维护信息/下层系统维护信息（标记仍 project-harness-*）。
metadata:
  edges-title: README entries 与 AGENTS 章节标题定稿
  edges-type: project
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-06T16:38:20+00:00'
---

节点模型 grill（2026-10-06）Q15 定稿：

**README 组织清单 entries：**
- HTML 标记：`project-entries-local` / `project-entries-descendants`
- Markdown 标题：`本层内容` / `下层内容`

**AGENTS.md 系统入口三章标题同步改写（标记仍为 project-harness-*）：**
- `本层硬约束`（不变）
- `本层系统维护信息`（取代现行 `本层组成`）
- `下层系统维护信息`（取代现行 `下层节点`）

与 README「内容」对仗：AGENTS 两章登记的是系统二材料与下级系统入口，不是系统一内容列表。类型入口的 `project-memory-type` / `project-memory-entries` 本轮仍不改；实现节奏见 Q16=A 的设计 spec。

**Why:** 用户确认标记名；标题经否决「条目/组成/材料」等不直观方案后自定「内容」与「系统维护信息」。

**How to apply:** 写 README entries 与 AGENTS 序列化时用上表。读兼容旧标题 `本层组成` / `下层节点`（及更早别名）。改 codec / 模板 / PROTOCOL 用词时跟新标题；细节以 `docs/superpowers/specs/2026-10-06-recursive-system-two-entries-design.md` 为准（Q16 落盘后）。
