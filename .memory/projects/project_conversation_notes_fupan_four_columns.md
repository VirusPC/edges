---
name: project_conversation_notes_fupan_four_columns
description: 改 conversation-to-notes 或对话 Note 结构时：用复盘四栏；不要复活已关闭的 FIA 中文换皮（事实/洞察/行动）；不要批量改写旧笔记；不要把升 Edge 写进该 skill。
metadata:
  edges-title: 对话整理采用复盘四栏
  edges-type: project
  edges-origin-session-id: bc-4e08419f-9caa-44af-aeab-a76a5f60fe9a
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-10T03:13:17+00:00"
---

对话整理 Note 使用复盘四栏（背景→过程→所学→行动指南），灵感来自 After Action Review，但不是官方 AAR 模板；已关闭的 FIA 中文换皮（事实/洞察/行动，PR #18 / tag skill/conversation-to-notes@1.1.0）不要当成已落地，也不要再写成 feedback。

**Why:** Facts–Insights–Actions 及其换皮会把过程与所学塌成一栏、把行动写成裸 todo。grilling 已定四栏结构。1.1.0 是未合并的提前 PR。升 Edge 属于 notes→edges，不是 conversation-to-notes 的职责。旧笔记批量改写成本高且无必要。

**How to apply:** 改 conversation-to-notes 或新写对话 Note 时用【背景】【过程】【所学】【行动指南】，遵守过程≠所学、行动指南=触发+做法。不要把「升 Edge」写进该 skill。不要批量改写 knowledge/notes 里的旧三分法笔记。不要新增「FIA 标题用事实/洞察/行动」这类 feedback。决策正文看 CONTEXT「复盘四栏」和 docs/adr/0001-conversation-notes-fupan-four-columns.md。
